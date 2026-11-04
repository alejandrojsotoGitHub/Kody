package app.kody.assistant;

import android.Manifest;
import android.app.AlarmManager;
import android.app.AppOpsManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Process;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Puente entre Kody (web) y el teléfono: No Molestar, uso de apps, bloqueo de apps,
 * abrir apps y dictado por voz. Cada función exige que el usuario conceda el permiso
 * correspondiente en los ajustes de Android.
 */
@CapacitorPlugin(
    name = "KodyDevice",
    permissions = { @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }) }
)
public class KodyDevicePlugin extends Plugin {

    static final String PREFS_DND = "kody_dnd";
    static final String PREFS_BLOCK = "kody_block";
    private SpeechRecognizer recognizer;

    // ───────────────────────── Estado de permisos ─────────────────────────

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context c = getContext();
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        JSObject r = new JSObject();
        r.put("dnd", nm != null && nm.isNotificationPolicyAccessGranted());
        r.put("usage", hasUsageAccess(c));
        r.put("accessibility", KodyAccessibilityService.isEnabled(c));
        r.put("microphone", getPermissionState("microphone") == PermissionState.GRANTED);
        r.put("speech", SpeechRecognizer.isRecognitionAvailable(c));
        call.resolve(r);
    }

    @SuppressWarnings("deprecation")
    static boolean hasUsageAccess(Context c) {
        AppOpsManager ops = (AppOpsManager) c.getSystemService(Context.APP_OPS_SERVICE);
        if (ops == null) return false;
        int mode;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            mode = ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
        } else {
            mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
        }
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        String type = call.getString("type", "");
        String pkg = getContext().getPackageName();
        Intent i;
        switch (type) {
            case "dnd":
                i = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                break;
            case "usage":
                i = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                break;
            case "accessibility":
                i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
                break;
            case "notifications":
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
                break;
            case "alarms":
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + pkg));
                } else {
                    i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
                }
                break;
            case "app":
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
                break;
            default:
                call.reject("Tipo de ajustes desconocido");
                return;
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("No se pudieron abrir los ajustes: " + e.getMessage());
        }
    }

    // ───────────────────────── No Molestar ─────────────────────────

    @PluginMethod
    public void setDnd(PluginCall call) {
        Context c = getContext();
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || !nm.isNotificationPolicyAccessGranted()) {
            call.reject("NO_PERMISSION");
            return;
        }
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        SharedPreferences sp = c.getSharedPreferences(PREFS_DND, Context.MODE_PRIVATE);
        if (enabled) {
            String mode = call.getString("mode", "priority");
            int filter = "none".equals(mode)
                ? NotificationManager.INTERRUPTION_FILTER_NONE
                : "alarms".equals(mode) ? NotificationManager.INTERRUPTION_FILTER_ALARMS : NotificationManager.INTERRUPTION_FILTER_PRIORITY;
            // Guardamos cómo estaba antes para devolverlo tal cual al terminar
            if (!sp.contains("prev")) sp.edit().putInt("prev", nm.getCurrentInterruptionFilter()).apply();
            nm.setInterruptionFilter(filter);
            Long until = call.getLong("untilMs");
            if (until != null && until > System.currentTimeMillis()) scheduleRestore(c, until);
        } else {
            cancelRestore(c);
            restoreDnd(c);
        }
        call.resolve();
    }

    static void restoreDnd(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || !nm.isNotificationPolicyAccessGranted()) return;
        SharedPreferences sp = c.getSharedPreferences(PREFS_DND, Context.MODE_PRIVATE);
        int prev = sp.getInt("prev", NotificationManager.INTERRUPTION_FILTER_ALL);
        if (prev == NotificationManager.INTERRUPTION_FILTER_UNKNOWN) prev = NotificationManager.INTERRUPTION_FILTER_ALL;
        nm.setInterruptionFilter(prev);
        sp.edit().remove("prev").apply();
    }

    private static PendingIntent restoreIntent(Context c) {
        Intent i = new Intent(c, DndRestoreReceiver.class);
        return PendingIntent.getBroadcast(c, 4242, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void scheduleRestore(Context c, long atMs) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = restoreIntent(c);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pi);
        }
    }

    private static void cancelRestore(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(restoreIntent(c));
    }

    // ───────────────────────── Apps: uso, lista, abrir, bloquear ─────────────────────────

    @PluginMethod
    public void getUsage(PluginCall call) {
        Context c = getContext();
        if (!hasUsageAccess(c)) {
            call.reject("NO_PERMISSION");
            return;
        }
        int days = call.getInt("days", 1);
        long end = System.currentTimeMillis();
        long start;
        if (days <= 1) {
            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            start = cal.getTimeInMillis();
        } else {
            start = end - days * 86400000L;
        }
        UsageStatsManager usm = (UsageStatsManager) c.getSystemService(Context.USAGE_STATS_SERVICE);
        Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(start, end);
        PackageManager pm = c.getPackageManager();
        List<JSObject> apps = new ArrayList<>();
        long total = 0;
        for (Map.Entry<String, UsageStats> e : stats.entrySet()) {
            long ms = e.getValue().getTotalTimeInForeground();
            String pkg = e.getKey();
            if (ms < 30000 || pkg.equals(c.getPackageName())) continue;
            if (pm.getLaunchIntentForPackage(pkg) == null) continue; // solo apps con ícono (sin servicios del sistema)
            String label = pkg;
            try {
                label = pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString();
            } catch (Exception ignored) { }
            JSObject o = new JSObject();
            o.put("pkg", pkg);
            o.put("label", label);
            o.put("ms", ms);
            apps.add(o);
            total += ms;
        }
        Collections.sort(apps, (a, b) -> Long.compare(b.optLong("ms"), a.optLong("ms")));
        JSArray arr = new JSArray();
        for (int i = 0; i < Math.min(apps.size(), 20); i++) arr.put(apps.get(i));
        JSObject r = new JSObject();
        r.put("totalMs", total);
        r.put("apps", arr);
        call.resolve(r);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        Context c = getContext();
        PackageManager pm = c.getPackageManager();
        Intent main = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> list = pm.queryIntentActivities(main, 0);
        List<JSObject> apps = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ResolveInfo ri : list) {
            String pkg = ri.activityInfo.packageName;
            if (pkg.equals(c.getPackageName()) || !seen.add(pkg)) continue;
            JSObject o = new JSObject();
            o.put("pkg", pkg);
            o.put("label", ri.loadLabel(pm).toString());
            apps.add(o);
        }
        Collections.sort(apps, (a, b) -> a.optString("label").compareToIgnoreCase(b.optString("label")));
        JSArray arr = new JSArray();
        for (JSObject o : apps) arr.put(o);
        JSObject r = new JSObject();
        r.put("apps", arr);
        call.resolve(r);
    }

    @PluginMethod
    public void openApp(PluginCall call) {
        String pkg = call.getString("pkg");
        if (pkg == null) {
            call.reject("Falta el paquete");
            return;
        }
        Intent i = getContext().getPackageManager().getLaunchIntentForPackage(pkg);
        if (i == null) {
            call.reject("No se encontró la app");
            return;
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void setBlocking(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        Set<String> pkgs = new HashSet<>();
        try {
            JSArray arr = call.getArray("packages");
            if (arr != null) {
                JSONArray ja = arr;
                for (int i = 0; i < ja.length(); i++) pkgs.add(ja.getString(i));
            }
        } catch (Exception ignored) { }
        Long until = call.getLong("untilMs");
        getContext().getSharedPreferences(PREFS_BLOCK, Context.MODE_PRIVATE).edit()
            .putBoolean("enabled", enabled)
            .putStringSet("packages", pkgs)
            .putLong("until", until == null ? 0L : until)
            .apply();
        call.resolve();
    }

    // ───────────────────────── Dictado por voz ─────────────────────────

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "micPermissionCallback");
            return;
        }
        beginListening(call);
    }

    @PermissionCallback
    private void micPermissionCallback(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) beginListening(call);
        else call.reject("NO_PERMISSION");
    }

    private void beginListening(PluginCall call) {
        final String lang = call.getString("language", "es-MX");
        getActivity().runOnUiThread(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("NO_RECOGNIZER");
                return;
            }
            if (recognizer != null) recognizer.destroy();
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float rmsdB) { }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onEvent(int eventType, Bundle params) { }

                @Override
                public void onPartialResults(Bundle partial) {
                    String t = firstResult(partial);
                    if (t != null) {
                        JSObject o = new JSObject();
                        o.put("text", t);
                        notifyListeners("speechPartial", o);
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    JSObject o = new JSObject();
                    String t = firstResult(results);
                    o.put("text", t == null ? "" : t);
                    notifyListeners("speechResult", o);
                }

                @Override
                public void onError(int error) {
                    JSObject o = new JSObject();
                    o.put("error", errorName(error));
                    notifyListeners("speechError", o);
                }
            });
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getContext().getPackageName());
            recognizer.startListening(i);
            call.resolve();
        });
    }

    private static String firstResult(Bundle b) {
        ArrayList<String> list = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return (list == null || list.isEmpty()) ? null : list.get(0);
    }

    private static String errorName(int code) {
        switch (code) {
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                return "no-speech";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
                return "network";
            case SpeechRecognizer.ERROR_AUDIO:
                return "audio-capture";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                return "not-allowed";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY:
                return "busy";
            default:
                return "error-" + code;
        }
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) recognizer.stopListening();
            call.resolve();
        });
    }

    @PluginMethod
    public void cancelListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) {
                recognizer.cancel();
                recognizer.destroy();
                recognizer = null;
            }
            call.resolve();
        });
    }

    @Override
    protected void handleOnDestroy() {
        if (recognizer != null) recognizer.destroy();
        super.handleOnDestroy();
    }
}

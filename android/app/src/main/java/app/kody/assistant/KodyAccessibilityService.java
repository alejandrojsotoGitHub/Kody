package app.kody.assistant;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Toast;

import java.util.Collections;
import java.util.Set;

/**
 * Bloquea apps distractoras durante un enfoque: si abres una app de la lista,
 * te devuelve a la pantalla de inicio. No lee el contenido de la pantalla.
 */
public class KodyAccessibilityService extends AccessibilityService {

    private long lastAction = 0;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;
        CharSequence cs = event.getPackageName();
        if (cs == null) return;
        String pkg = cs.toString();
        if (pkg.equals(getPackageName())) return;

        SharedPreferences sp = getSharedPreferences(KodyDevicePlugin.PREFS_BLOCK, Context.MODE_PRIVATE);
        if (!sp.getBoolean("enabled", false)) return;
        long until = sp.getLong("until", 0);
        if (until > 0 && System.currentTimeMillis() > until) {
            sp.edit().putBoolean("enabled", false).apply();
            return;
        }
        Set<String> blocked = sp.getStringSet("packages", Collections.<String>emptySet());
        if (blocked == null || !blocked.contains(pkg)) return;

        long now = SystemClock.elapsedRealtime();
        if (now - lastAction < 1500) return; // evita repetir la acción en ráfaga
        lastAction = now;
        performGlobalAction(GLOBAL_ACTION_HOME);
        Toast.makeText(this, "Kody: estás en modo enfoque", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onInterrupt() { }

    /** ¿El usuario ya activó el servicio en Ajustes → Accesibilidad? */
    public static boolean isEnabled(Context c) {
        String enabled = Settings.Secure.getString(c.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (enabled == null) return false;
        String me = new ComponentName(c, KodyAccessibilityService.class).flattenToString();
        for (String s : enabled.split(":")) {
            if (s.equalsIgnoreCase(me)) return true;
        }
        return false;
    }
}

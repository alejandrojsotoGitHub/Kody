package app.kody.assistant;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Devuelve No Molestar a su estado anterior cuando termina un enfoque (aunque la app esté cerrada). */
public class DndRestoreReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        KodyDevicePlugin.restoreDnd(context);
    }
}

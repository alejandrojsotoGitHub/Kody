package app.kody.assistant;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KodyDevicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}

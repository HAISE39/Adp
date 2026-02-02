package com.mod.menu;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.widget.Toast;

/**
 * Injection Entry Point.
 * Call Main.start(this) from any Activity's onCreate or a button trigger.
 */
public class Main {
    public static void start(Context context) {
        // Check for overlay permission
        if (!Settings.canDrawOverlays(context)) {
            Toast.makeText(context, "Please allow overlay permission", Toast.LENGTH_LONG).show();
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName()));
            context.startActivity(intent);
        } else {
            Intent intent = new Intent(context, FloatingService.class);
            context.startService(intent);
        }
    }
}

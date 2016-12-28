package com.vxg.cloud.cm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.vxg.cloud.cm.activities.LoginActivity;

public class MyBroadcastReceiver extends BroadcastReceiver {
    private final String TAG = "MyBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "onReceive " + intent.getAction());
        if ( Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Intent i = new Intent(context, LoginActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            //context.startActivity(i);
        }
        else if ( "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction())) {
            Intent i = new Intent(context, LoginActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            //context.startActivity(i);
        }
    }
}
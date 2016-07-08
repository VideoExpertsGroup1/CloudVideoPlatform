package com.vxg.cnvrclient2.gcm;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.NotificationCompat;
import android.util.Log;

import com.google.android.gms.gcm.GcmListenerService;
import com.vxg.cnvrclient2.activities.CloudClientActivity;
import com.vxg.cnvrclient2.R;

/* https://github.com/googlesamples/google-services/tree/master/android/gcm/app/src/main */
public class VXGCCGcmListenerService  extends GcmListenerService {
    private static final String TAG = "VXGCCGcmListenerService";

    /**
     * Called when message is received.
     *
     * @param from SenderID of the sender.
     * @param data Data bundle containing message data as key/value pairs.
     *             For Set of keys use data.keySet().
     */
    // [START receive_message]
    @Override
    public void onMessageReceived(String from, Bundle data) {
        String message = data.getString("message");
        VXGCloudGcmMessage gcmMsg = new VXGCloudGcmMessage(data);

        Log.i(TAG, "GCM: From: " + from);
        Log.i(TAG, "GCM: Message: " + message);
        Log.i(TAG, "GCM: Data: " + data.toString());

        if (from.startsWith("/topics/")) {
            // message received from some topic.
        } else {
            // normal downstream message.
        }

        // [START_EXCLUDE]
        /**
         * Production applications would usually process the message here.
         * Eg: - Syncing with server.
         *     - Store message in local database.
         *     - Update UI.
         */

        /**
         * In some cases it may be useful to show a notification indicating to the user
         * that a message was received.
         */
        sendNotification(gcmMsg);
        // [END_EXCLUDE]
    }
    // [END receive_message]

    private void sendNotification(VXGCloudGcmMessage gcmMsg) {
    	Log.i(TAG, "GCM: sendNotification");

        Intent intent = new Intent(this, CloudClientActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("gcmmessage", gcmMsg.toJsonString());

        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0 /* Request code */, intent,
                PendingIntent.FLAG_ONE_SHOT);

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this);
        notificationBuilder.setSmallIcon(R.drawable.ic_stat_notification);

        Bitmap bm = BitmapFactory.decodeResource(getResources(), R.drawable.ic_launcher);
        notificationBuilder.setLargeIcon(bm);

        if(gcmMsg.isEvent()){
            notificationBuilder.setContentTitle(getString(R.string.app_name) + " / " + gcmMsg.getCameraName());
            if(gcmMsg.isMotionEvent())
                notificationBuilder.setContentText("Motion at " + gcmMsg.getTime());
            else if(gcmMsg.isSoundEvent())
                notificationBuilder.setContentText("Sound at " + gcmMsg.getTime());
        }else{
            notificationBuilder.setContentTitle(getString(R.string.app_name));
            notificationBuilder.setContentText(gcmMsg.getMessage());
        }



        notificationBuilder.setAutoCancel(true);
        // notificationBuilder.setSound(defaultSoundUri); // move to config
        notificationBuilder.setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // notificationManager.notify(0 /* ID of notification */, notification);
        notificationManager.notify(0 /* ID of notification */, notificationBuilder.build());
    }
}

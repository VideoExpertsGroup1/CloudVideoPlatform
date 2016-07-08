package com.vxg.cnvrclient2;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.vxg.cnvrclient2.activities.CloudClientActivity;
import com.vxg.cnvrclient2.gcm.VXGCCQuickstartPreferences;

public class ApplicationController {
    private static final int PLAY_SERVICES_RESOLUTION_REQUEST = 9000;
    private BroadcastReceiver mRegistrationBroadcastReceiver;
    private boolean isReceiverRegistered;
    private final String TAG = "ApplicationController";
    private static ApplicationController self = null;
    private String m_sGCMToken;
    private String m_gcmLastMessage = null;

    public static ApplicationController getInstance(){
        if (self == null){
            self = new ApplicationController();
        }
        return self;
    }

    public void initGCM(CloudClientActivity ma) {

        Log.i(TAG, "GCM: start");
        final CloudClientActivity ma1 = ma;
        // mRegistrationProgressBar = (ProgressBar) findViewById(R.id.registrationProgressBar);
        mRegistrationBroadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Log.i(TAG, "GCM: onRecieve");
                SharedPreferences sharedPreferences =
                        PreferenceManager.getDefaultSharedPreferences(context);
                boolean sentToken = sharedPreferences
                        .getBoolean(VXGCCQuickstartPreferences.SENT_TOKEN_TO_SERVER, false);
                if (sentToken) {
                    Log.i(TAG, "GCM: " + ma1.getString(R.string.gcm_send_message));
                } else {
                    Log.e(TAG, "GCM: " + ma1.getString(R.string.token_error_message));
                }
            }
        };
        // mInformationTextView = (TextView) findViewById(R.id.informationTextView);

        // Registering BroadcastReceiver
        registerReceiver(ma);

        if (checkPlayServices(ma)) {
            // Start IntentService to register this application with GCM.
            Intent intent = new Intent(ma, com.vxg.cnvrclient2.gcm.RegistrationIntentService.class);
            Log.i(TAG, "GCM: startService");
            ma.startService(intent);
        }
    }

    public void registerReceiver(CloudClientActivity ma){
        if(!isReceiverRegistered) {
            Log.i(TAG, "GCM: registerReciever 1 ");
            LocalBroadcastManager.getInstance(ma).registerReceiver(mRegistrationBroadcastReceiver,
                    new IntentFilter(VXGCCQuickstartPreferences.REGISTRATION_COMPLETE));
            isReceiverRegistered = true;
            Log.i(TAG, "GCM: registerReciever 2 ");
        }
    }

    public void unregisterReceiver(CloudClientActivity ma){
        LocalBroadcastManager.getInstance(ma).unregisterReceiver(mRegistrationBroadcastReceiver);
        isReceiverRegistered = false;
    }

    public void setGCMToken(String sGCMToken){
        m_sGCMToken = sGCMToken;
    }

    public String getGCMToken(){
        return m_sGCMToken;
    }

    /**
     * Check the device to make sure it has the Google Play Services APK. If
     * it doesn't, display a dialog that allows users to download the APK from
     * the Google Play Store or enable it in the device's system settings.
     */
    private boolean checkPlayServices(CloudClientActivity ma) {
        GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
        int resultCode = apiAvailability.isGooglePlayServicesAvailable(ma);
        if (resultCode != ConnectionResult.SUCCESS) {
            if (apiAvailability.isUserResolvableError(resultCode)) {
                apiAvailability.getErrorDialog(ma, resultCode, PLAY_SERVICES_RESOLUTION_REQUEST)
                        .show();
            } else {
                Log.i(TAG, "This device is not supported.");
                ma.finish();
            }
            return false;
        }
        return true;
    }

    public void setGcmLastMessage(String gcmLastMessage){
        m_gcmLastMessage = gcmLastMessage;
    }

    public void resetGcmLastMessage(){
        m_gcmLastMessage = null;
    }

    public String getGcmLastMessage(){
        return m_gcmLastMessage;
    }
}

package com.vxg.cnvrclient2.gcm;

import android.content.Intent;
import android.util.Log;
import com.google.android.gms.iid.InstanceIDListenerService;

/* https://github.com/googlesamples/google-services/tree/master/android/gcm/app/src/main */

public class VXGCCInstanceIDListenerService extends InstanceIDListenerService{
	private static final String TAG = "InstanceIDListenerSrvc";

    /**
     * Called if InstanceID token is updated. This may occur if the security of
     * the previous token had been compromised. This call is initiated by the
     * InstanceID provider.
     */
    // [START refresh_token]
    @Override
    public void onTokenRefresh() {
    	Log.i(TAG, "GCM: onTokenRefresh");

        // TODO: update token
    	// Fetch updated Instance ID token and notify our app's server of any changes (if applicable).
        Intent intent = new Intent(this, RegistrationIntentService.class);
        startService(intent);
        
    }
    // [END refresh_token]
}

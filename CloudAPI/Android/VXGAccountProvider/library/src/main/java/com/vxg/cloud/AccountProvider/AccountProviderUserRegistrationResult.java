package com.vxg.cloud.AccountProvider;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class AccountProviderUserRegistrationResult {
    private static final String TAG = AccountProviderUserRegistrationResult.class.getSimpleName();
    private boolean mHasError = true;
    private int mErrorCode = 0;
    private String mErrorDetail = "";

    public AccountProviderUserRegistrationResult(int errorCode, String errorMessage) {
        mErrorCode = errorCode;
        mErrorDetail = errorMessage;
    }

    public AccountProviderUserRegistrationResult(boolean success) {
        mHasError = !success;
    }

    public AccountProviderUserRegistrationResult(JSONObject obj) {
        try {
            Log.i(TAG, obj.toString(1));
            if (obj.has("errorDetail")) {
                mErrorCode = obj.getInt("status");
                mErrorDetail = obj.getString("errorDetail");
            }else{
                mHasError = false;
            }
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
    }


    public int getErrorCode(){
        return mErrorCode;
    }

    public String getErrorDetail(){
        return mErrorDetail;
    }

    public boolean hasError(){
        return mHasError;
    }
}

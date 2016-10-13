package com.vxg.ServiceProvider;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.TimeZone;

public class ServiceProviderToken {
    private final String TAG = "ServiceProviderToken";
    private String mToken = null;
    private String mExpire = null;
    private String mType = null;

    public ServiceProviderToken(JSONObject data){
        try {
            mToken = data.has("token") ? data.getString("token") : null;
            mExpire = data.has("expire") ? data.getString("expire") : null;
            mType = data.has("type") ? data.getString("type") : null;
        } catch (JSONException e) {
            Log.e(TAG, "Invalid json");
            e.printStackTrace();
        }
    }

    public ServiceProviderToken(){
        // nothing
    }

    public void reset(){
        mToken = null;
        mExpire = null;
        mType = null;
    }

    public boolean isEmpty(){
        return (mToken == null || mExpire == null || mType == null);
    }

    public String getToken(){
        return mToken;
    }

    public void setToken(String token){
        mToken = token;
    }

    public String getExpire(){
        return mExpire;
    }

    public void setExpire(String expire){
        mExpire = expire;
    }

    public String getType(){
        return mType;
    }

    public void setType(String type){
        mType = type;
    }

    public long calcExpireTime() {
        if (mExpire == null)
            return 1000; // TODO incorrect ??

        long millis;
        String serverTime = null; // getServerTime();
        if (serverTime != null)
            millis = ServiceProviderHelper.parseTime(mExpire) - ServiceProviderHelper.parseTime(serverTime);
        else {
            millis = ServiceProviderHelper.parseTime(mExpire) - ServiceProviderHelper.currentTimestampUTC();
            Log.v(TAG, "calcExpireTime(), need correct timeZone on your device !!! " + mExpire);
            if ( millis > 0) {
                Log.v(TAG, "millis = " + millis);
                return millis;
            } else {
                Log.v(TAG, "millis = " + 60000);
                return 1000 * 60;
            }
        }

        return millis;
    }

    public int minTimeForRefresh(){
        return 1000 * 60;
    }
}

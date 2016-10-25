//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

package com.vxg.cloud.ServiceProvider;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

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

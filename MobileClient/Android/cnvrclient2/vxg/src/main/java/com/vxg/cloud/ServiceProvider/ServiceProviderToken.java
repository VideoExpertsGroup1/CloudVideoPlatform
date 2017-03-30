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

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.TimeZone;

public class ServiceProviderToken {
    private final String TAG = ServiceProviderToken.class.getSimpleName();
    private String mToken = null;
    private String mExpire = null;
    private String mType = null;
    private boolean mHasError = true;
    private String mErrorDetail = "";
    private int mErrorStatus = 0;

    public ServiceProviderToken(JSONObject data){
        try {
            if (data.has("errorType") && data.has("errorDetail")) {
                mHasError = true;
                mErrorDetail = data.getString("errorDetail");
                if(data.has("status")){
                    mErrorStatus = data.getInt("status");
                }
            }else{
                mHasError = false;
                if(data.has("token") && !data.isNull("token")){
                    mToken = data.getString("token");
                }

                if(data.has("expire") && !data.isNull("expire")){
                    mExpire = data.getString("expire");
                }

                if(data.has("type") && !data.isNull("type")){
                    mType = data.getString("type");
                }
            }
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
            return 1000;
        return ServiceProviderHelper.parseTime(mExpire) - ServiceProviderHelper.currentTimestampUTC();
    }

    public int minTimeForRefresh(){
        return 1000 * 60;
    }

    public boolean hasError(){
        return mHasError;
    }

    public String getErrorDetail(){
        return mErrorDetail;
    }

    public int getErrorStatus(){
        return mErrorStatus;
    }
}

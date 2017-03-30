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

public class ServiceProviderCamsessChatMessage {
    private static final String TAG = ServiceProviderCamsessChatMessage.class.getSimpleName();

    private boolean mHasError = true;
    private String mErrorDetail = "";
    private int mErrorStatus = 0;
    private int mTimestamp = 0;
    private String mUsername = null;
    private String mMessage = null;

    public ServiceProviderCamsessChatMessage(){
        mHasError = true;
    }

    public ServiceProviderCamsessChatMessage(JSONObject details){
        try {
            if (details.has("errorType") && details.has("errorDetail")) {
                mHasError = true;
                mErrorDetail = details.getString("errorDetail");
                if(details.has("status")){
                    mErrorStatus = details.getInt("status");
                }
            } else {
                mHasError = false;
                if(details.has("msg") && !details.isNull("msg")){
                    mMessage = details.getString("msg");
                }
                if(details.has("uname") && !details.isNull("uname")){
                    mUsername = details.getString("uname");
                }
                if(details.has("ts") && !details.isNull("ts")){
                    mTimestamp = details.getInt("ts");
                }


            }
        } catch(JSONException e) {
            Log.e(TAG, "Constructor ServiceProviderCamsessChatMessage error: ", e);
            mHasError = true;
            e.printStackTrace();
        }
    }

    public String getMessage(){
        return mMessage;
    }
    public int getTimestamp(){
        return mTimestamp;
    }
    public String getUsername(){
        return mUsername;
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

    public boolean equals(ServiceProviderCamsessChatMessage message){
        return  message.getMessage().equals(mMessage) &&
                message.getTimestamp() == mTimestamp &&
                message.getUsername().equals(mUsername);
    }

}

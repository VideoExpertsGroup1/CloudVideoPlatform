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

public class ServiceProviderCamsessLiveStats {
    private static final String TAG = ServiceProviderCamsessLiveStats.class.getSimpleName();

    private boolean mHasError = true;
    private String mErrorDetail = "";
    private int mErrorStatus = 0;
    private int mCountViewers = 0;
    private String mDetails = "";


    public ServiceProviderCamsessLiveStats(){
        mHasError = true;
    }

    public ServiceProviderCamsessLiveStats(JSONObject details){
        try {
            mDetails = details.toString(1);
            // Log.i(TAG, "mDetails = " + mDetails);

            if (details.has("errorType") && details.has("errorDetail")) {
                mHasError = true;
                mErrorDetail = details.getString("errorDetail");
                if(details.has("status")){
                    mErrorStatus = details.getInt("status");
                }
            } else {
                mHasError = false;
                if(details.has("viewers") && !details.isNull("viewers")){
                    mCountViewers = details.getInt("viewers");
                }
            }
        } catch(JSONException e) {
            Log.e(TAG, "Constructor ServiceProviderCamsessLiveStats error: ", e);
            mHasError = true;
            e.printStackTrace();
        }
    }

    public int getCountViewers(){
        return mCountViewers;
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

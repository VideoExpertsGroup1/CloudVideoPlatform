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

public class ServiceProviderCameraDetail {
    private static final String TAG = ServiceProviderCameraDetail.class.getSimpleName();
    private boolean mHasError = true;
    private int mErrorStatus = 0;
    private String mErrorDetail = null;
    private long mID = 0;
    private long mCmngrID = 0;

    public ServiceProviderCameraDetail(){
        mHasError = true;
    }

    public ServiceProviderCameraDetail(JSONObject details){
        Log.i(TAG, "ServiceProviderCameraDetail = " + details.toString());
        try {
            if (details.has("errorType") && details.has("errorDetail")) {
                mHasError = true;
                mErrorDetail = details.getString("errorDetail");
                if(details.has("status")){
                    mErrorStatus = details.getInt("status");
                }
            }else{
                mHasError = false;
                if (details.has("id") && !details.isNull("id")){
                    mID = details.getInt("id");
                }

                if (details.has("cmngrid") && !details.isNull("cmngrid")){
                    mCmngrID = details.getLong("cmngrid");
                }
            }
        }catch(JSONException e){

        }
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

    public long getID(){
        return mID;
    }

    public long getCmngrID(){
        return mCmngrID;
    }
}

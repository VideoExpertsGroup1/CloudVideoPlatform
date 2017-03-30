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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ServiceProviderResponseWithMeta {
    private static final String TAG = ServiceProviderResponseWithMeta.class.getSimpleName();
    private int mTotalCount = 0;
    private int mLimit = 0;
    private int mOffset = 0;
    private String mPrevious = null;
    private String mNext = null;
    private String mExpire = null;
    private JSONArray objects = new JSONArray();

    public ServiceProviderResponseWithMeta(JSONObject response){
        try {
            if (response.has("objects") && !response.isNull("objects")) {
                objects = response.getJSONArray("objects");
            }

            if (response.has("meta") && !response.isNull("meta")) {
                JSONObject meta = response.getJSONObject("meta");

                if(meta.has("total_count") && !meta.isNull("total_count")){
                    mTotalCount = meta.getInt("total_count");
                }

                if(meta.has("limit") && !meta.isNull("limit")){
                    mLimit = meta.getInt("limit");
                }

                if(meta.has("offset") && !meta.isNull("offset")){
                    mOffset = meta.getInt("offset");
                }

                if(meta.has("expire") && !meta.isNull("expire")){
                    mExpire = meta.getString("expire");
                }

                if(meta.has("previous") && !meta.isNull("previous")){
                    mPrevious = meta.getString("previous");
                }

                if(meta.has("next") && !meta.isNull("next")){
                    mNext = meta.getString("next");
                }

            }else{
                Log.e(TAG, "getCamsessRecords: meta not found");
            }

        }catch(JSONException e){
            Log.e(TAG, "Invalid parse json");
            e.printStackTrace();
        }
    }

    public JSONArray getObjects(){
        return objects;
    }

    public int getTotalCount(){
        return mTotalCount;
    }

    public int getOffset(){
        return mOffset;
    }

    public int getLimit(){
        return mLimit;
    }

}

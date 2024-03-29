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

public class ServiceProviderRegToken {
    private final String TAG = ServiceProviderRegToken.class.getSimpleName();
    private String mToken = null;
    private String mExpire = null;
    private String mType = null;
    private String mStatus = null;
    private long mCmngrID = 0;

    public ServiceProviderRegToken(JSONObject data){
        try {
            if(data.has("token") && !data.isNull("token")){
                mToken = data.getString("token");
            }

            if(data.has("expire") && !data.isNull("expire")){
                mExpire = data.getString("expire");
            }

            if(data.has("status") && !data.isNull("status")){
                mStatus = data.getString("status");
            }

            if(data.has("cmngr_id") && !data.isNull("cmngr_id")){
                mCmngrID = data.getLong("cmngr_id");
            }
        } catch (JSONException e) {
            Log.e(TAG, "Invalid json");
            e.printStackTrace();
        }
    }

    public ServiceProviderRegToken(){
        // nothing
    }

    public boolean isEmpty(){
        return (mToken == null || mExpire == null || mType == null);
    }

    public String getToken(){
        return mToken;
    }

    public String getExpire(){
        return mExpire;
    }

    public String getType(){
        return mType;
    }

    public String getStatus(){
        return mStatus;
    }

}

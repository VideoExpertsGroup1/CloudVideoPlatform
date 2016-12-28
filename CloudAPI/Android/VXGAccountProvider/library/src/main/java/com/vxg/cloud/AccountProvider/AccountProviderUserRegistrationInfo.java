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

package com.vxg.cloud.AccountProvider;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

public class AccountProviderUserRegistrationInfo {
    private static final String TAG = AccountProviderUserRegistrationInfo.class.getSimpleName();
    private String mUsername = "";
    private String mFirstname = "";
    private String mLastname = "";
    private String mEmail = "";
    private String mPassword = "";

    public AccountProviderUserRegistrationInfo(){

    }

    public void setUsername(String val){
        mUsername = val;
    }
    public void setFirstname(String val){
        mFirstname = val;
    }
    public void setLastname(String val){
        mLastname = val;
    }

    public void setEmail(String val){
        mEmail = val;
    }

    public void setPassword(String val){
        mPassword = val;
    }

    public JSONObject toJSONObject(){
        JSONObject data = new JSONObject();
        try {
            data.put("username", mUsername);
            data.put("first_name", mFirstname);
            data.put("last_name", mLastname);
            data.put("email", mEmail);
            data.put("password", mPassword);
        }catch(JSONException e){
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
        }
        return data;
    }
}

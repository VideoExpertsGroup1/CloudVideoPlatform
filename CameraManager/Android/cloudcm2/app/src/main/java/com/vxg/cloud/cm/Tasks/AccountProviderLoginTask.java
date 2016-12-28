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

package com.vxg.cloud.cm.Tasks;

import android.os.AsyncTask;
import android.util.Log;

import com.vxg.cloud.AccountProvider.AccountProviderAPI;
import com.vxg.cloud.AccountProvider.AccountProviderLoginResult;
import com.vxg.cloud.ServiceProvider.ServiceProviderRegToken;
import com.vxg.cloud.cm.Interfaces.LoginActivityListener;

import java.util.UUID;

public class AccountProviderLoginTask extends AsyncTask<Void, Void, String> {
    private static String TAG = AccountProviderLoginTask.class.getSimpleName();
    private String mUsername = null;
    private String mPassword = null;
    private LoginActivityListener mLoginActivityListener = null;
    private String mLastErrorMessage = "";

    public AccountProviderLoginTask(String username, String password, LoginActivityListener loginActivityListener){
        mUsername = username;
        mPassword = password;
        mLoginActivityListener = loginActivityListener;
    }

    @Override
    protected String doInBackground(Void... params) {
        AccountProviderAPI accountProviderAPI = AccountProviderAPI.getInstance();
        AccountProviderLoginResult result = accountProviderAPI.login(mUsername, mPassword);
        if(result.hasError()){
            Log.e(TAG, "Login failed: [Error code " + result.getErrorCode() + "] " + result.getErrorDetail() );
            if(result.getErrorCode() == 401){
                mLastErrorMessage = "Invalid user or password";
            }else{
                mLastErrorMessage = "Error " + result.getErrorCode() + ": " + result.getErrorDetail();
            }
            return null;
        }
        String cmuuid = "cloudcm2-" + UUID.randomUUID().toString();
        ServiceProviderRegToken regToken = accountProviderAPI.createRegToken(cmuuid);
        if(regToken.getToken() == null){
            mLastErrorMessage = "Sorry, could not got RegToken. Try later...";
           return null;
        }
        return regToken.getToken();
    }

    @Override
    protected void onPostExecute(final String result) {
        if(mLoginActivityListener != null){
            if(result != null){
                mLoginActivityListener.onGotRegTokenAfterLogin(result);
            }else{
                mLoginActivityListener.onShowError(mLastErrorMessage);
            }
        }
    }

    @Override
    protected void onCancelled() {
    }
}

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

package com.vxg.cnvrclient2.controllers;

import android.util.Log;

import com.vxg.cloud.AccountProvider.AccountProviderAPI;
import com.vxg.cloud.AccountProvider.AccountProviderLoginResult;
import com.vxg.cloud.ServiceProvider.ServiceProviderAPI;
import com.vxg.cloud.ServiceProvider.ServiceProviderToken;
import com.vxg.cnvrclient2.activities.LoginActivity;

public class LoginController {
    private static String TAG = LoginController.class.getSimpleName();
    public static int LOGIN_START = 0;
    public static int LOGIN_OK = 1;
    public static int LOGIN_FAIL = 2;
    public static int LOGIN_PROGRESS = 3;
    public boolean m_bDemo = false;
    private static LoginController self = null;
    private LoginActivity m_LoginActivity = null;
    private int m_State = LoginController.LOGIN_START;
    private String m_sError = "";
    private AccountProviderAPI accountProviderAPI = AccountProviderAPI.getInstance();
    private ServiceProviderAPI serviceProviderAPI = ServiceProviderAPI.getInstance();
    public static LoginController inst(){
        if (null == self){
            self = new LoginController();
        }
        return self;
    }

    public void setActivity(LoginActivity la){
        m_LoginActivity = la;
    }

    public void resetActivity(){
        m_LoginActivity = null;
    }

    public void updateActivityState(int s){
        m_State = s;
        refreshActivityState();
    }

    public void refreshActivityState(){
        if(m_LoginActivity != null){
            m_LoginActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    m_LoginActivity.onUpdateState(m_State);
                }
            });
        }
    }

    public String getLoginError(){
        return m_sError;
    }

    public boolean isDemo(){
        return m_bDemo;
    }

    public void tryLogin(String login, String password){
        final String sLogin = login;
        final String sPassword = password;
        m_bDemo = false;
        updateActivityState(LoginController.LOGIN_PROGRESS);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                m_sError = "";
                AccountProviderLoginResult result = accountProviderAPI.login(sLogin,sPassword);
                if(!result.hasError()){
                    ServiceProviderToken token = accountProviderAPI.getServiceProviderToken();
                    serviceProviderAPI.setToken(token);
                    updateActivityState(LoginController.LOGIN_OK);
                }else{
                    m_sError = result.getErrorDetail();
                    Log.e(TAG, "Login fail: " + m_sError);
                    updateActivityState(LoginController.LOGIN_FAIL);
                }
            }
        });
        t.start();
    }

    public void tryLoginDemo(){
        updateActivityState(LoginController.LOGIN_PROGRESS);
        m_bDemo = true;
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                m_sError = "";

                AccountProviderLoginResult result = accountProviderAPI.demo_login();
                if(!result.hasError()){
                    ServiceProviderToken token = accountProviderAPI.getServiceProviderToken();
                    serviceProviderAPI.setToken(token);
                    updateActivityState(LoginController.LOGIN_OK);
                }else{
                    m_sError = result.getErrorDetail();
                    Log.e(TAG, "Login fail: " + m_sError);
                    updateActivityState(LoginController.LOGIN_FAIL);
                }
            }
        });
        t.start();
    }
}

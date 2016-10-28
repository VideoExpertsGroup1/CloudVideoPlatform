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

import com.vxg.cloud.AccoutProvider.AccountProviderAPI;
import com.vxg.cloud.ServiceProvider.ServiceProviderToken;
import com.vxg.cloud.ServiceProvider.ServiceProviderAPI;
import com.vxg.cnvrclient2.activities.LoginActivity;

public class LoginController {
    public static int LOGIN_START = 0;
    public static int LOGIN_OK = 1;
    public static int LOGIN_FAIL = 2;
    public static int LOGIN_PROGRESS = 3;

    private static LoginController self = null;
    private LoginActivity m_LoginActivity = null;
    private int m_State = LoginController.LOGIN_START;
    private String m_Error = "";
    private AccountProviderAPI api = AccountProviderAPI.getInstance();

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
        return m_Error;
    }

    public void tryLogin(String login, String password){
        final String sLogin = login;
        final String sPassword = password;
        updateActivityState(LoginController.LOGIN_PROGRESS);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                if(api.login(sLogin,sPassword) == true){
                    ServiceProviderToken token = api.getServiceProviderToken();
                    ServiceProviderAPI.inst().setServiceProviderToken(token);
                    updateActivityState(LoginController.LOGIN_OK);
                }else{
                    m_Error = api.getLastError();
                    updateActivityState(LoginController.LOGIN_FAIL);
                }
            }
        });
        t.start();
    }
}

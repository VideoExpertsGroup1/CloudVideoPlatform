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

import com.vxg.cnvrclient2.activities.RegistrationActivity;
import com.vxg.cloud.AccoutProvider.AccountProviderAPI;

public class RegistrationController {
    public static int REGISTRATION_START = 0;
    public static int REGISTRATION_OK = 1;
    public static int REGISTRATION_FAIL = 2;
    public static int REGISTRATION_PROGRESS = 3;

    private static RegistrationController self = null;
    private RegistrationActivity m_RegistrationActivity = null;
    private int m_State = RegistrationController.REGISTRATION_START;
    private String m_Error = "";
    private AccountProviderAPI api = AccountProviderAPI.getInstance();
    public static RegistrationController inst(){
        if (null == self){
            self = new RegistrationController();
        }
        return self;
    }

    public void setActivity(RegistrationActivity la) {
        m_RegistrationActivity = la;
    }

    public void resetActivity() {
        m_RegistrationActivity = null;
    }

    public void updateActivityState(int s){
        m_State = s;
        refreshActivityState();
    }

    public void refreshActivityState(){
        if(m_RegistrationActivity != null){
            m_RegistrationActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if(m_RegistrationActivity != null) {
                        m_RegistrationActivity.onUpdateState(m_State);
                    }
                }
            });
        }
    }

    public void tryRegistration(String username, String email, String password){
        final String local_username = username;
        final String local_email = email;
        final String local_password = password;

        updateActivityState(RegistrationController.REGISTRATION_PROGRESS);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                Boolean bResult = api.registration(local_username, local_email, local_password);
                if(bResult){
                    updateActivityState(RegistrationController.REGISTRATION_OK);
                }else{
                    updateActivityState(RegistrationController.REGISTRATION_FAIL);
                }
            }
        });
        t.start();
    }

}

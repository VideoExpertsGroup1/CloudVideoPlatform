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
import com.vxg.cnvrclient2.activities.UserProfileActivity;
import com.vxg.cloud.AccoutProvider.AccountProviderUserProfile;

import org.json.JSONObject;

public class UserProfileController {
    public static int USERPROFILE_NODATA = 0;
    public static int USERPROFILE_PROCESSING = 1;
    public static int USERPROFILE_DONE = 2;
    public static int USERPROFILE_UPDATEDONE = 3;

    private static UserProfileController self = null;
    private UserProfileActivity m_Activity = null;
    private int m_State = UserProfileController.USERPROFILE_NODATA;
    private String m_Error = "";
    private AccountProviderAPI api = AccountProviderAPI.getInstance();

    private AccountProviderUserProfile m_userProfile = null;

    public AccountProviderUserProfile getUserProfile() { return m_userProfile; }

    public static UserProfileController inst(){
        if (null == self){
            self = new UserProfileController();
        }
        return self;
    }

    public void setActivity(UserProfileActivity la) {
        m_Activity = la;
    }

    public void resetActivity() {
        m_Activity = null;
    }

    public void updateActivityState(int s){
        m_State = s;
        refreshActivityState();
    }

    public void refreshActivityState(){
        if(m_Activity != null){
            m_Activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if(m_Activity != null) {
                        m_Activity.onUpdateState(m_State);
                    }
                }
            });
        }
    }

    public void tryLoadUserProfileData(){
        updateActivityState(UserProfileController.USERPROFILE_PROCESSING);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                JSONObject obj = api.userProfile();
                m_userProfile = new AccountProviderUserProfile(obj);
                updateActivityState(UserProfileController.USERPROFILE_DONE);
            }
        });
        t.start();
    }

    public void tryUpdateUserProfileData(AccountProviderUserProfile up){
        final AccountProviderUserProfile localup = up;
        updateActivityState(UserProfileController.USERPROFILE_PROCESSING);
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                api.updateUserProfile(localup);
                updateActivityState(UserProfileController.USERPROFILE_UPDATEDONE);
            }
        });
        t.start();
    }
}

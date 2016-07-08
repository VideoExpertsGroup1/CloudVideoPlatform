/*
 *
 * Copyright (c) 2016 VIDEO EXPERTS GROUP
 *
 */

package com.vxg.cnvrclient2.controllers;

import com.vxg.cnvrclient2.activities.UserProfileActivity;
import com.vxg.cnvrclient2.api.CnvrClient2;
import com.vxg.cnvrclient2.api.objects.UserProfile;

import org.json.JSONException;
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
    private CnvrClient2 api = CnvrClient2.getInstance();

    private UserProfile m_userProfile = null;

    public UserProfile getUserProfile() { return m_userProfile; }

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
                m_userProfile = new UserProfile(obj);
                updateActivityState(UserProfileController.USERPROFILE_DONE);
            }
        });
        t.start();
    }

    public void tryUpdateUserProfileData(UserProfile up){
        final UserProfile localup = up;
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

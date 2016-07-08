package com.vxg.cnvrclient2.controllers;

import android.os.StrictMode;

import com.vxg.cnvrclient2.api.CnvrClient2;
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
    private CnvrClient2 api = CnvrClient2.getInstance();

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

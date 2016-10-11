package com.vxg.cloud.cm;

import android.os.AsyncTask;
import android.util.Log;

import com.vxg.cloud.cm.Interfaces.UserLoginTaskListener;

import java.io.IOException;

public class UserLoginTask extends AsyncTask<Void, Void, String> {
    private final String TAG = "UserLoginTask";

    private final String LOG_IN = "LOG_IN";
    private final String INCORRECT_PASS = "INCORRECT_PASS";
    private final String HTTP_ERRORS = "HTTP_ERRORS";


    private final String mEmail;
    private final String mPassword;
    private final UserLoginTaskListener userLoginTaskListener;

    private WebAPI webAPI;

    public UserLoginTask(UserLoginTaskListener listener, WebAPI webAPI, String email, String password) {
        userLoginTaskListener = listener;
        this.webAPI = webAPI;
        mEmail = email;
        mPassword = password;
    }



    @Override
    protected String doInBackground(Void... params) {
        Log.d(TAG, "doInBackground()    start Logging.... ");

        try {
            if (webAPI.login(mEmail, mPassword)) {

                return LOG_IN;
            }
            else
                return INCORRECT_PASS;
        } catch (IOException e) {
            Log.e(TAG, "doInBackground() " + e.getMessage());
            return HTTP_ERRORS;
        }
    }

    @Override
    protected void onPostExecute(final String result) {
        switch (result) {
            case LOG_IN :
                userLoginTaskListener.onSuccessfulLogin();
                break;
            case INCORRECT_PASS :
                userLoginTaskListener.onIncorrectPassword();
                break;
            case HTTP_ERRORS :
                userLoginTaskListener.onHttpErrors();
                break;
            default:
                break;
        }
    }

    @Override
    protected void onCancelled() {
        userLoginTaskListener.onCancelled();
    }
}
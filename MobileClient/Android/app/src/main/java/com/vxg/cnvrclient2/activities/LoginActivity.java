/*
 *
 * Copyright (c) 2016 VIDEO EXPERTS GROUP
 *
 */

package com.vxg.cnvrclient2.activities;

import android.app.Activity;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.vxg.cnvrclient2.R;
import com.vxg.cnvrclient2.controllers.LoginController;

public class LoginActivity extends Activity {
    private String TAG = "LoginActivity";
    private LoginController controller = LoginController.inst();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.login_activity);

        Button btn_login_signIn = (Button) findViewById(R.id.btn_login_signIn);
        btn_login_signIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText edt_login_email = (EditText) findViewById(R.id.edt_login_email);
                EditText edt_login_password = (EditText) findViewById(R.id.edt_login_password);
                controller.tryLogin(edt_login_email.getText().toString(), edt_login_password.getText().toString());
            }
        });

        Button btnSignUp = (Button) findViewById(R.id.btnSignUp);
        btnSignUp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(LoginActivity.this, RegistrationActivity.class);
                startActivity(intent);
            }
        });
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        // Checks the orientation of the screen
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            ImageView iv = (ImageView) findViewById(R.id.imgLogo);
            iv.setVisibility(View.GONE);
        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
            ImageView iv = (ImageView) findViewById(R.id.imgLogo);
            iv.setVisibility(View.VISIBLE);
        }
    }

    @Override
    protected void onResume(){
        super.onResume();
        controller.setActivity(this);
        controller.refreshActivityState();
    }

    @Override
    protected void onPause(){
        super.onPause();
        controller.resetActivity();
    }

    public void onUpdateState(int s){
        TextView login_processing = (TextView) findViewById(R.id.login_processing);
        if(s == LoginController.LOGIN_START){
            Log.i(TAG, "LOGIN_START");
            login_processing.setVisibility(View.GONE);
        }else if(s == LoginController.LOGIN_PROGRESS){
            Log.i(TAG, "LOGIN_PROGRESS");
            login_processing.setVisibility(View.VISIBLE);
        }else if(s == LoginController.LOGIN_FAIL){
            Log.i(TAG, "LOGIN_FAIL");
            login_processing.setVisibility(View.GONE);
        }else if(s == LoginController.LOGIN_OK){
            Log.i(TAG, "LOGIN_OK");
            login_processing.setVisibility(View.GONE);
            Intent intent = new Intent(LoginActivity.this, CloudClientActivity.class);
            startActivity(intent);
        }
    }
}

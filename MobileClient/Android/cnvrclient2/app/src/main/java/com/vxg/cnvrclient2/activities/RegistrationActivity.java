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

package com.vxg.cnvrclient2.activities;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.vxg.cnvrclient2.R;
import com.vxg.cloud.AccoutProvider.AccountProviderAPI;
import com.vxg.cnvrclient2.controllers.RegistrationController;

public class RegistrationActivity extends Activity {

    private String TAG = "RegistrationActivity";
    private RegistrationController controller = RegistrationController.inst();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.registration_activity);

        Button btn_registration_signup = (Button) findViewById(R.id.btn_registration_signup);
        btn_registration_signup.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String username = ((EditText) findViewById(R.id.edt_registration_username)).getText().toString();
                String email = ((EditText) findViewById(R.id.edt_registration_email)).getText().toString();
                String password = ((EditText) findViewById(R.id.edt_registration_password)).getText().toString();
                controller.tryRegistration(username, email, password);
            }
        });

        Button btn_registration_signin = (Button) findViewById(R.id.btn_registration_signin);
        btn_registration_signin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });
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
        if(s == RegistrationController.REGISTRATION_START){
            Log.i(TAG, "REGISTRATION_START");
        }else if(s == RegistrationController.REGISTRATION_PROGRESS){
            Log.i(TAG, "REGISTRATION_PROGRESS");
        }else if(s == RegistrationController.REGISTRATION_OK){
            Log.i(TAG, "REGISTRATION_OK");
            Toast.makeText(this, "Registration successfull", Toast.LENGTH_SHORT).show();
        }else if(s == RegistrationController.REGISTRATION_FAIL){
            Log.i(TAG, "REGISTRATION_FAIL");
            String errorDetail = AccountProviderAPI.getInstance().getLastError();
            Toast.makeText(this, "Registration failed\n" + errorDetail, Toast.LENGTH_SHORT).show();
        }
    }
}

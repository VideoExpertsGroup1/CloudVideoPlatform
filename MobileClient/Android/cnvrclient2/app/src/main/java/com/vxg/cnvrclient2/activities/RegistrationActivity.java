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
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.res.Configuration;
import android.graphics.Rect;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ScrollView;
import android.widget.Toast;

import com.vxg.cnvrclient2.R;
import com.vxg.cnvrclient2.controllers.RegistrationController;

public class RegistrationActivity extends Activity {

    private String TAG = "RegistrationActivity";
    private RegistrationController controller = RegistrationController.inst();
    private View mViewRegistrationForm = null;
    private ScrollView mBackgroundScrollView = null;
    private ScrollView mBackgroundScrollView_progress = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.registration_activity);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);

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

        mViewRegistrationForm = findViewById(R.id.registrationForm);
        mBackgroundScrollView = (ScrollView) findViewById(R.id.backgroundRegistry);
        mBackgroundScrollView_progress = (ScrollView) findViewById(R.id.backgroundRegistry_progress);


        // hide log if keyboard is opened
        final View activityRootView = findViewById(R.id.registrationActivityRoot);
        activityRootView.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                Rect r = new Rect();
                activityRootView.getWindowVisibleDisplayFrame(r);
                int screenHeight = activityRootView.getRootView().getHeight();

                // r.bottom is the position above soft keypad or device button.
                // if keypad is shown, the r.bottom is smaller than that before.
                int keypadHeight = screenHeight - r.bottom;
                if (keypadHeight > screenHeight * 0.15) { // 0.15 ratio is perhaps enough to determine keypad height.
                    // keyboard is opened
                    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                    params.gravity = Gravity.TOP;
                    mViewRegistrationForm.setLayoutParams(params);
                } else {
                    // keyboard is closed
                    // only if not portrait
                    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                    params.gravity = Gravity.CENTER;
                    mViewRegistrationForm.setLayoutParams(params);
                }
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

    private void showErrorBox(String sTitle, String sError){
        AlertDialog.Builder builder = new AlertDialog.Builder(RegistrationActivity.this);
        builder.setTitle(sTitle)
                .setMessage(sError)
                .setIcon(R.drawable.ic_launcher)
                .setCancelable(false)
                .setNegativeButton("OK",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int id) {
                                dialog.cancel();
                            }
                        });
        AlertDialog alert = builder.create();
        alert.show();
    }

    public void onUpdateState(int s){
        if(s == RegistrationController.REGISTRATION_START){
            Log.i(TAG, "REGISTRATION_START");
            mBackgroundScrollView_progress.setVisibility(View.GONE);
            mBackgroundScrollView.setVisibility(View.VISIBLE);
        }else if(s == RegistrationController.REGISTRATION_PROGRESS){
            Log.i(TAG, "REGISTRATION_PROGRESS");
            mBackgroundScrollView.setVisibility(View.GONE);
            mBackgroundScrollView_progress.setVisibility(View.VISIBLE);
        }else if(s == RegistrationController.REGISTRATION_OK){
            Log.i(TAG, "REGISTRATION_OK");
            mBackgroundScrollView_progress.setVisibility(View.GONE);
            mBackgroundScrollView.setVisibility(View.VISIBLE);
            Toast.makeText(this, "Registration successfully", Toast.LENGTH_SHORT).show();
        }else if(s == RegistrationController.REGISTRATION_FAIL){
            Log.i(TAG, "REGISTRATION_FAIL");
            String errorDetail = RegistrationController.getLastError();
            showErrorBox("Registration failed", errorDetail);
            controller.updateActivityState(RegistrationController.REGISTRATION_START);
        }
    }
}

/*
 *
 * Copyright (c) 2016 VIDEO EXPERTS GROUP
 *
 */

package com.vxg.cnvrclient2.activities;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.vxg.cnvrclient2.R;
import com.vxg.AccoutProvider.AccountProviderUserProfile;
import com.vxg.cnvrclient2.controllers.UserProfileController;

public class UserProfileActivity extends Activity {
    private String TAG = "UserProfileActivity";
    private UserProfileController controller = UserProfileController.inst();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.userprofile_activity);

        Button btn_userprofile_update = (Button) findViewById(R.id.btn_userprofile_update);
        btn_userprofile_update.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                AccountProviderUserProfile up = new AccountProviderUserProfile();
                up.setEmail(((TextView) findViewById(R.id.edt_userprofile_email)).getText().toString());
                up.setFirstName(((TextView) findViewById(R.id.edt_userprofile_firstname)).getText().toString());
                up.setLastName(((TextView) findViewById(R.id.edt_userprofile_lastname)).getText().toString());
                up.setCountry(((TextView) findViewById(R.id.edt_userprofile_country)).getText().toString());
                up.setRegion(((TextView) findViewById(R.id.edt_userprofile_region)).getText().toString());
                up.setCity(((TextView) findViewById(R.id.edt_userprofile_city)).getText().toString());
                up.setAddress(((TextView) findViewById(R.id.edt_userprofile_address)).getText().toString());
                up.setPostcode(((TextView) findViewById(R.id.edt_userprofile_postcode)).getText().toString());
                up.setPhone(((TextView) findViewById(R.id.edt_userprofile_phone)).getText().toString());
                up.setContactWay(((TextView) findViewById(R.id.edt_userprofile_contactway)).getText().toString());
                controller.tryUpdateUserProfileData(up);
            }
        });

        Button btn_userprofile_cancel = (Button) findViewById(R.id.btn_userprofile_cancel);
        btn_userprofile_cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                finish();
            }
        });

        UserProfileController.inst().tryLoadUserProfileData();
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

        if(s == UserProfileController.USERPROFILE_NODATA){
            Log.i(TAG, "USERPROFILE_NODATA");
            //login_processing.setVisibility(View.GONE);
        }else if(s == UserProfileController.USERPROFILE_PROCESSING){
            Log.i(TAG, "USERPROFILE_PROCESSING");
        }else if(s == UserProfileController.USERPROFILE_UPDATEDONE){
            Log.i(TAG, "USERPROFILE_UPDATEDONE");
            Toast.makeText(this, "Updated profile", Toast.LENGTH_SHORT).show();
        }else if(s == UserProfileController.USERPROFILE_DONE){
            Log.i(TAG, "USERPROFILE_DONE");
            AccountProviderUserProfile up = controller.getUserProfile();
            ((TextView) findViewById(R.id.edt_userprofile_email)).setText(up.getEmail());
            ((TextView) findViewById(R.id.edt_userprofile_firstname)).setText(up.getFirstName());
            ((TextView) findViewById(R.id.edt_userprofile_lastname)).setText(up.getLastName());
            ((TextView) findViewById(R.id.edt_userprofile_country)).setText(up.getCountry());
            ((TextView) findViewById(R.id.edt_userprofile_region)).setText(up.getRegion());
            ((TextView) findViewById(R.id.edt_userprofile_city)).setText(up.getCity());
            ((TextView) findViewById(R.id.edt_userprofile_address)).setText(up.getAddress());
            ((TextView) findViewById(R.id.edt_userprofile_postcode)).setText(up.getPostcode());
            ((TextView) findViewById(R.id.edt_userprofile_phone)).setText(up.getPhone());
            ((TextView) findViewById(R.id.edt_userprofile_contactway)).setText(up.getContactWay());
        }
    }
}

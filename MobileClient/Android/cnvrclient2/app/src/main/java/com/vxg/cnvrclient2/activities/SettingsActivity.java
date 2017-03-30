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

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;
import android.preference.SwitchPreference;
import android.text.InputType;
import android.util.Log;
import android.view.WindowManager;
import android.widget.EditText;

import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;
import com.vxg.cnvrclient2.R;
import com.vxg.cnvrclient2.Tasks.LoadConfigTask;
import com.vxg.cnvrclient2.objects.Helper;

public class SettingsActivity extends PreferenceActivity implements SharedPreferences.OnSharedPreferenceChangeListener{
    private final static String TAG = SettingsActivity.class.getSimpleName();
    private SwitchPreference pref_customer_code_switch;
    private SwitchPreference pref_minimal_latency_enabled;

    public static String PREF_CUSTOMER_CODE = "pref_customer_code";
    public static String PREF_CUSTOMER_CODE_SWITCH = "pref_customer_code_switch";
    public static String PREF_MINIMAL_LATENCY_ENABLED = "pref_minimal_latency_enabled";

    public static String PREF_VENDOR_GOOGLE_AUTH = "pref_vendor_google_auth";
    public static String PREF_PROVIDER_GOOGLE_AUTH = "pref_provider_google_auth";

    public static String DEFAULT_VENDOR_GOOGLE_AUTH = "PKG_COMMON";
    public static String DEFAULT_PROVIDER_GOOGLE_AUTH = "PKG_COMMON_GGL";

    public static String mLastValidCode;

    public SettingsActivity() {
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.i(TAG, "onCreate");
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        addPreferencesFromResource(R.xml.preferences);

        pref_customer_code_switch = (SwitchPreference) findPreference(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH);
        pref_minimal_latency_enabled = (SwitchPreference) findPreference(SettingsActivity.PREF_MINIMAL_LATENCY_ENABLED);

        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        prefs.registerOnSharedPreferenceChangeListener(this);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.i(TAG, "onDestroy");
        SharedPreferences prefs =
                PreferenceManager.getDefaultSharedPreferences( getApplicationContext());
        prefs.unregisterOnSharedPreferenceChangeListener(this);

    }

    @Override
    protected void onPostCreate(Bundle savedInstanceState) {
        super.onPostCreate(savedInstanceState);
        Log.i(TAG, "onPostCreate");
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        mLastValidCode = sharedPref.getString(SettingsActivity.PREF_CUSTOMER_CODE, "");
        updateSummaryOnCustomSwitcher();

        // SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        // Boolean use_custom = sharedPreferences.getBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, false);
    }

    private void showInputCodeOnSwitch(){
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Configuration code");

        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString(SettingsActivity.PREF_CUSTOMER_CODE, "");
        editor.apply();

        // Set up the input
        final EditText input = new EditText(this);
        // Specify the type of input expected; this, for example, sets the input as a password, and will mask the text
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        input.setText(mLastValidCode);
        builder.setView(input);

         // Set up the buttons
        builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String new_code = input.getText().toString();
                ServiceProviderHelper.executeAsyncTask(new LoadConfigTask(getApplicationContext(), new_code));
            }
        });
        builder.setOnCancelListener(new DialogInterface.OnCancelListener() {
            @Override
            public void onCancel(DialogInterface dialog) {
                pref_customer_code_switch.setChecked(false);
                Helper.setCustomerCodeSwitcher(getApplicationContext(), false);
            }
        });
        builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                pref_customer_code_switch.setChecked(false);
                Helper.setCustomerCodeSwitcher(getApplicationContext(), false);
                dialog.cancel();
            }
        });
        builder.show();
    }

    private void updateSummaryOnCustomSwitcher(){
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        Boolean use_custom = sharedPreferences.getBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, false);
        if (use_custom) {
            String code = sharedPreferences.getString(SettingsActivity.PREF_CUSTOMER_CODE, "");
            if(!code.isEmpty())
                pref_customer_code_switch.setSummary("Configuration code: " + code);
            else
                pref_customer_code_switch.setSummary("");
        }else{
            pref_customer_code_switch.setSummary("");
        }
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        Log.i(TAG, "onSharedPreferenceChanged, key=" + key);

        if (key.equals(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH)) {
            Boolean use_custom = sharedPreferences.getBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, false);
            if(use_custom){
                pref_customer_code_switch.setChecked(true);
                showInputCodeOnSwitch();
            }else{
                pref_customer_code_switch.setChecked(false);
                pref_customer_code_switch.setSummary("");
                SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putString(SettingsActivity.PREF_VENDOR_GOOGLE_AUTH, SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH);
                editor.putString(SettingsActivity.PREF_PROVIDER_GOOGLE_AUTH, SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH);
                editor.apply();
                return;
            }
        }

        if (key.equals(SettingsActivity.PREF_CUSTOMER_CODE)) {
            updateSummaryOnCustomSwitcher();
        }

        if (key.equals(SettingsActivity.PREF_MINIMAL_LATENCY_ENABLED)) {
            // TODO
        }
    }
}

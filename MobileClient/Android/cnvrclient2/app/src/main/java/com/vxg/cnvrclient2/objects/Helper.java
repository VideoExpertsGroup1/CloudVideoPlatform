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

package com.vxg.cnvrclient2.objects;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

import com.vxg.cnvrclient2.activities.SettingsActivity;

import org.json.JSONException;
import org.json.JSONObject;

public class Helper {
    private final static String TAG = Helper.class.getSimpleName();



    public static void resetConfig(Context context){
        Log.i(TAG, "resetConfig");
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString(SettingsActivity.PREF_VENDOR_GOOGLE_AUTH, SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH);
        editor.putString(SettingsActivity.PREF_PROVIDER_GOOGLE_AUTH, SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH);
        // will be not reset code, because it filled by user
        // editor.putString(SettingsActivity.PREF_CUSTOMER_CODE, "");
        editor.apply();
    }

    public static void setCustomerCode(Context context, String code){
        Log.i(TAG, "setConfigurationCode");
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putString(SettingsActivity.PREF_CUSTOMER_CODE, code);
        editor.apply();
    }

    public static void setCustomerCodeSwitcher(Context context, boolean state){
        Log.i(TAG, "setCustomerCodeSwitcher");
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPref.edit();
        editor.putBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, state);
        editor.apply();
    }

    public static boolean applyCustomConfig(Context context, JSONObject conf){
        Log.i(TAG, "applyCustomConfig");
        try {
            if(conf.has("google_login")) {
                JSONObject google_login = conf.getJSONObject("google_login");
                String vendor = SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH;
                if(google_login.has("vendor")){
                    vendor = google_login.getString("vendor");
                }

                String provider = SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH;
                if(google_login.has("provider")){
                    provider = google_login.getString("provider");
                }

                SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putString(SettingsActivity.PREF_VENDOR_GOOGLE_AUTH, vendor);
                editor.putString(SettingsActivity.PREF_PROVIDER_GOOGLE_AUTH, provider);
                editor.apply();
            }else{
                // reset parameters
                SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(context);
                SharedPreferences.Editor editor = sharedPref.edit();
                editor.putString(SettingsActivity.PREF_VENDOR_GOOGLE_AUTH, SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH);
                editor.putString(SettingsActivity.PREF_PROVIDER_GOOGLE_AUTH, SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH);
                editor.apply();
            }
        } catch (JSONException exception) {
            return false;
        }
        return true;
    }

}

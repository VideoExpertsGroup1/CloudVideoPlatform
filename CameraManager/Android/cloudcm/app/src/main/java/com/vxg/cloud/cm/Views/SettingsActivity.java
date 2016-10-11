package com.vxg.cloud.cm.Views;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;
import android.util.Log;

import com.vxg.cloud.cm.R;

public class SettingsActivity extends PreferenceActivity {
    static final public String TAG = "SettingsActivity";

    SharedPreferences settings=null;

    @Override
    protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);

        //addPreferencesFromResource(R.xml.preferences);

        settings = PreferenceManager.getDefaultSharedPreferences(this);
    }

    @Override
    public void onPause() {
        Log.i(TAG, "=onPause");
        super.onPause();
    }

    @Override
    public void onResume() {
        Log.i(TAG, "=onResume");
        super.onResume();
    }
}
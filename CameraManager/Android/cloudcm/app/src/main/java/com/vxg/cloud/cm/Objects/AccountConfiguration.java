package com.vxg.cloud.cm.Objects;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

public class AccountConfiguration {
    public final static String LAST_LOGIN = "LAST_LOGIN";
    public final static String LAST_PASS = "LAST_PASS";
    public final static String REGISTERED = "REGISTERED";
    public final static String WAS_LOGOUT = "WAS_LOGOUT";
    public final static String REG_TOKEN = "REG_TOKEN";
    public final static String UUID = "UUID";
    public final static String PWD = "PWD";
    public final static String SID = "SID";
    public final static String CA = "CA";
    public final static String CONNID = "CONNID";

    private SharedPreferences sharedPreferences;
    private static AccountConfiguration instance;

    public static AccountConfiguration getInstance(Context context) {
        if (instance == null)
            instance = new AccountConfiguration(context);

        return instance;
    }
    private AccountConfiguration(Context context) {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
    }

    public boolean hasValue(String key) {
        return sharedPreferences.contains(key);
    }

    public void initConfig(String login, String pass, String reg_token) {
        clearSettings();
        putString(LAST_LOGIN, login);
        putString(LAST_PASS, pass);
        putBool(REGISTERED, false);
        putBool(WAS_LOGOUT, false);
        putString(REG_TOKEN, reg_token);
    }

    public boolean isRegistered() {
        return getBool(REGISTERED, false) && getString(UUID, null) != null;
    }

    public boolean isNewUser(String user) {
        return !getString(LAST_LOGIN, null).equals(user);
    }

    public String getString(String name, String def) {
        return sharedPreferences.getString(name, def);
    }
    public void putString(String key, String value) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(key, value);
        editor.apply();
    }

    public void putBool(String key, boolean value) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean(key, value);
        editor.apply();
    }
    public boolean getBool(String key, boolean def) {
        return sharedPreferences.getBoolean(key, def);
    }

    public void clearValue(String key) {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.remove(key);
        editor.apply();
    }
    public void clearSettings() {
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.clear();
        editor.apply();
    }
}
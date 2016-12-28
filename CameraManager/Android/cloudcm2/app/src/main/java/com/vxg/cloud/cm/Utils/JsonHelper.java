package com.vxg.cloud.cm.Utils;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonHelper {
    private static final String TAG = "JsonHelper";
    public JSONObject jsonObject;

    @Deprecated
    public JsonHelper(String strJSON) {
        try {
            jsonObject = new JSONObject(strJSON);
        } catch (JSONException e) {
            Log.e(TAG, "JsonHelper(String strJSON): ", e);
            jsonObject = new JSONObject();
        }
    }

    public String getString(String name) {
        try {
            return jsonObject.getString(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ");
            return null;
        }
    }
    public int getInt(String name) {
        try {
            return jsonObject.getInt(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ", e);
            return -1;
        }
    }
    public boolean getBoolean(String name) {
        try {
            return jsonObject.getBoolean(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ", e);
            return false;
        }
    }

    @Override
    public String toString() {
        return jsonObject.toString();
    }

}
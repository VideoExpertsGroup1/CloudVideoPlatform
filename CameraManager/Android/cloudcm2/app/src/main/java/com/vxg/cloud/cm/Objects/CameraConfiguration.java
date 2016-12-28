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

package com.vxg.cloud.cm.Objects;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.Enums.CameraManagerParameterNames;

public class CameraConfiguration {
    public final static String TAG = CameraConfiguration.class.getSimpleName();

    public static void saveCameraManagerConfig(Context context, CameraManagerConfig config){
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(CameraManagerParameterNames.UUID, config.getUUID());
        editor.putString(CameraManagerParameterNames.SID, config.getSID());
        editor.putString(CameraManagerParameterNames.PWD, config.getPwd());
        editor.putString(CameraManagerParameterNames.CONNID, config.getConnID());
        editor.putString(CameraManagerParameterNames.UPLOAD_URL, config.getUploadURL());
        editor.putString(CameraManagerParameterNames.MEDIA_SERVER, config.getMediaServer());

        /*if(config.getRegToken() != null){
            editor.putString(CameraManagerParameterNames.REG_TOKEN, config.getRegToken().getToken());
        }*/
        // TODO
        editor.apply();
    }
    public static CameraManagerConfig loadCameraManagerConfig(Context context){
        Log.i(TAG, "loadCameraManagerConfig begin");

        CameraManagerConfig config = new CameraManagerConfig();
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(context);
        config.setUUID(sharedPreferences.getString(CameraManagerParameterNames.UUID, ""));
        config.setSID(sharedPreferences.getString(CameraManagerParameterNames.SID, ""));
        config.setPwd(sharedPreferences.getString(CameraManagerParameterNames.PWD, ""));
        config.setConnID(sharedPreferences.getString(CameraManagerParameterNames.CONNID, ""));
        config.setUploadURL(sharedPreferences.getString(CameraManagerParameterNames.UPLOAD_URL, ""));
        config.setMediaServer(sharedPreferences.getString(CameraManagerParameterNames.MEDIA_SERVER, ""));

        /*try{
            String token = sharedPreferences.getString(CameraManagerParameterNames.REG_TOKEN, "");
            if(!token.equals("")) {
                Log.i(TAG, "token: " + token);
                JSONObject jsonToken = new JSONObject();
                jsonToken.put("token", token);
                jsonToken.put("expire", "");
                jsonToken.put("status", "ready");
                ServiceProviderRegToken serviceProviderRegToken = new ServiceProviderRegToken(jsonToken);
                config.setRegToken(serviceProviderRegToken);
            }
        }catch(JSONException e) {
            Log.e(TAG, e.getMessage());
        }*/

        Log.i(TAG, " loadCameraManagerConfig, config.getConnID(): " + config.getConnID());


        return config;
    }
}
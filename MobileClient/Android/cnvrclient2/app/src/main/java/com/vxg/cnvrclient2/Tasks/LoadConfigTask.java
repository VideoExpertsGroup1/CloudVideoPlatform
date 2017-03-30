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

package com.vxg.cnvrclient2.Tasks;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import com.vxg.cnvrclient2.activities.SettingsActivity;
import com.vxg.cnvrclient2.objects.Helper;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;

public class LoadConfigTask extends AsyncTask<Void, Void, JSONObject> {
    private final static String TAG = LoadConfigTask.class.getSimpleName();
    private String mCustomerCode = "";
    private boolean mResetToDefaultOnFail = true;
    private Context mContext = null;

    public LoadConfigTask(Context context, String customerCode) {
        mContext = context;
        mCustomerCode = customerCode;
        mResetToDefaultOnFail = true;
        Log.i(TAG,"LoadConfigTask");
    }

    public LoadConfigTask(Context context, String customerCode, boolean resetToDefaultOnFail) {
        Log.i(TAG,"LoadConfigTask");
        mContext = context;
        mCustomerCode = customerCode;
        mResetToDefaultOnFail = resetToDefaultOnFail;
    }

    @Override
    protected JSONObject doInBackground(Void... params) {
        Log.i(TAG,"doInBackground");
        try {
            URL url = new URL("http://s3.amazonaws.com/skyvr.av/mappcfg/" + mCustomerCode);
            Log.i(TAG,"url = " + url);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setRequestMethod("GET");
            urlConnection.setReadTimeout(10000);
            urlConnection.setConnectTimeout(15000);
            urlConnection.setUseCaches(false);

            StringBuffer buffer = new StringBuffer();
            int code_response = urlConnection.getResponseCode();
            Log.i(TAG, "code_response = " + code_response);
            boolean isError = code_response >= 400;
            InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            String line;
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }
            Log.i(TAG, buffer.toString());
            JSONObject response = new JSONObject(buffer.toString());
            return response;
        }catch(MalformedURLException e){
            Log.e(TAG, "File not found ");
            e.printStackTrace();
        }catch(ProtocolException e){
            Log.e(TAG, "Wrong protocol ");
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "Something wrong");
            e.printStackTrace();
        } catch (JSONException e) {
            Log.e(TAG, "Json wrong");
            e.printStackTrace();
        }
        return null;
    }

    @Override
    protected void onPostExecute(final JSONObject result) {
        Log.i(TAG,"onPostExecute");
        if(result == null){
            Log.i(TAG,"onPostExecute invalid code");
            if(mResetToDefaultOnFail) {
                Helper.setCustomerCodeSwitcher(mContext, false);
                Helper.setCustomerCode(mContext, SettingsActivity.mLastValidCode);
                Toast.makeText(mContext, "Invalid configuration code", Toast.LENGTH_SHORT).show();
            }
        }else{
            Log.i(TAG, "applyCustomConfig");
            if(Helper.applyCustomConfig(mContext, result)) {
                SettingsActivity.mLastValidCode = mCustomerCode;
                Helper.setCustomerCode(mContext, mCustomerCode);
            }else{
                Helper.setCustomerCodeSwitcher(mContext, false);
                Helper.setCustomerCode(mContext, SettingsActivity.mLastValidCode);
                Toast.makeText(mContext, "Invalid configuration file format", Toast.LENGTH_SHORT).show();
            }
        }
    }
}

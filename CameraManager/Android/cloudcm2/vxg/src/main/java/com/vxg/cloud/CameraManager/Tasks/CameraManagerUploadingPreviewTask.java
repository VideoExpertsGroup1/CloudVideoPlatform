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

package com.vxg.cloud.CameraManager.Tasks;

import android.content.Context;
import android.os.AsyncTask;
import android.util.Log;

import com.vxg.cloud.CameraManager.CameraManagerHelper;
import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;

import java.io.BufferedInputStream;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.ProtocolException;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class CameraManagerUploadingPreviewTask extends AsyncTask<Void, Void, String> {
    private final String TAG = CameraManagerUploadingPreviewTask.class.getSimpleName();
    private URL mUploadPreviewURL = null;
    private File mPreview = null;
    private File mCropPreview = null;
    private static final int readTimeout = 10000;
    private static final int connectTimeout = 15000;
    private Context mContext = null;

    public CameraManagerUploadingPreviewTask(URL uploadPreviewURL, File preview, Context context) {
        mUploadPreviewURL = uploadPreviewURL;
        mPreview = preview;
        mContext = context;
        File cacheDir = mContext.getExternalCacheDir();
        mCropPreview = new File(cacheDir, "preview_crop.jpg");
    }

    @Override
    protected String doInBackground(Void... params) {
        Log.i(TAG, "doInBackground() start upload file to server");
        Log.i(TAG, "mUploadPreviewURL: " + mUploadPreviewURL );
        Log.i(TAG, "mPreviewFilename " + mCropPreview.getAbsolutePath());

        if(!CameraManagerHelper.cropPreview(mPreview, mCropPreview, 320, 240)){
            Log.e(TAG, "could not cropped preview");
            return null;
        }

        try {
            HttpURLConnection urlConnection = (HttpURLConnection) mUploadPreviewURL.openConnection();
            urlConnection.setRequestMethod("POST");
            urlConnection.setReadTimeout(readTimeout);
            urlConnection.setConnectTimeout(connectTimeout);
            Log.i(TAG, "readTimeout " + readTimeout);
            urlConnection.setDoInput(true);
            urlConnection.setUseCaches(false);

            int size = (int) mCropPreview.length();
            byte[] body = new byte[size];
            BufferedInputStream buf = new BufferedInputStream(new FileInputStream(mCropPreview));
            buf.read(body, 0, body.length);
            buf.close();
            // urlConnection.setRequestProperty("Content-Length",  Integer.toString(body1.length));
            DataOutputStream request = new DataOutputStream(urlConnection.getOutputStream());
            request.write(body);
            request.flush();
            request.close();

            int codeResponse = urlConnection.getResponseCode();
            Log.i(TAG, "codeResponse " + codeResponse);

        }catch(FileNotFoundException e){
            Log.e(TAG, "File not found ");
            e.printStackTrace();
        }catch(ProtocolException e){
            Log.e(TAG, "Wrong protocol ");
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "Something wrong");
            e.printStackTrace();
        }
        return null;
    }

    @Override
    protected void onPostExecute(final String result) {

    }

    @Override
    protected void onCancelled() {
    }
}
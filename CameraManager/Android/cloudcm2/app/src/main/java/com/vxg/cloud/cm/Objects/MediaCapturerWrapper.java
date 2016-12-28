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

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.util.Log;

import com.vxg.cloud.CameraManager.CameraManagerHelper;
import com.vxg.cloud.cm.Interfaces.StreamActivityListener;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;

import veg.mediacapture.sdk.MediaCapture;
import veg.mediacapture.sdk.MediaCaptureCallback;
import veg.mediacapture.sdk.MediaCaptureConfig;

public class MediaCapturerWrapper implements MediaCaptureCallback {
    private final String TAG = MediaCapturerWrapper.class.getSimpleName();
    private int mPreviewWidth = 0;
    private int mPreviewHeight = 0;

    private MediaCapture mMediaCapture;
    private Handler mHandler;
    private boolean mSurfaceCreated = false;
    private boolean mChangedOrient = false;
    private boolean mStartRecordingAfterSurfaceCreate = false;
    private Context mContext = null;
    private boolean mMakingUrlPreview = false;
    private StreamActivityListener mStreamActivityListener = null;
    private int mRtmpStatusPrev = -1;

    public MediaCapturerWrapper(MediaCapture mediaCapture, Context context, StreamActivityListener streamActivityListener) {
        mMediaCapture = mediaCapture;
        mStreamActivityListener = streamActivityListener;
        mContext = context;
        configureMediaCapture(mMediaCapture);
        mHandler = createHandler();
        mMediaCapture.Open(null, this);
    }

    @Override
    public int OnCaptureStatus(int i) {
        MediaCapture.CaptureNotifyCodes status = MediaCapture.CaptureNotifyCodes.forValue(i);
        if (mHandler == null || status == null)
            return 0;

        // Log.v(TAG, "=OnCaptureStatus status=" + i);
        switch (MediaCapture.CaptureNotifyCodes.forValue(i)) {
            default:
                Message msg = new Message();
                msg.obj = status;
                //mHandler.removeMessages(mOldMsg);
                mHandler.sendMessage(msg);
        }
        return 0;
    }

    private void StopTranscoding(){
        // Stop transcoding in UI thread
        Log.e(TAG, "StopTranscoding begin 1");
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            public void run() {
                Log.e(TAG, "StopTranscoding point 2");
                Log.i(TAG, "=OnCaptureReceiveData StopTranscoding");
                if(mMediaCapture.getConfig().isTranscoding()) {
                    Log.e(TAG, "StopTranscoding point 3");
                    mMediaCapture.getConfig().setTranscoding(false);
                    Log.e(TAG, "StopTranscoding point 4");
                    mMediaCapture.StopTranscoding();
                    Log.e(TAG, "StopTranscoding end");
                }
            }
        });
    }

    @Override
    public int OnCaptureReceiveData(ByteBuffer byteBuffer, int type, int size, long pts) {
        if (mMakingUrlPreview == true) {
            Log.e(TAG, "=OnCaptureReceiveData, mMakingUrlPreview is true");
            StopTranscoding();
            return 0;
        }

        if (byteBuffer == null){
            Log.e(TAG, "=OnCaptureReceiveData, byteBuffer is null");
            return 0;
        }

        if(type != 0){ // not video frame
            Log.e(TAG, "=OnCaptureReceiveData, it's not video frame");
            return 0;
        }
        File cacheDir = mContext.getExternalCacheDir();

        if(cacheDir != null) {
            Log.v(TAG, "=OnCaptureReceiveData, cacheDir="+cacheDir.getAbsolutePath());
        }
        Log.v(TAG, "=OnCaptureReceiveData, buffer="+byteBuffer+" type="+type+" size="+size+" pts="+pts);
        Log.i(TAG, "=OnCaptureReceiveData, Send image byteBuffer.capacity() " + byteBuffer.capacity() );
        Log.i(TAG, "=OnCaptureReceiveData, Send image byteBuffer.capacity() expected " + (mPreviewWidth* mPreviewHeight*4) );
        Log.i(TAG, "=OnCaptureReceiveData, Image width " + mPreviewWidth);
        Log.i(TAG, "=OnCaptureReceiveData, Image height " + mPreviewHeight);

        // Prepare image
        try {
            Bitmap bm = Bitmap.createBitmap(
                    mPreviewWidth,
                    mPreviewHeight,
                    Bitmap.Config.ARGB_8888
            );
            byteBuffer.rewind();
            bm.copyPixelsFromBuffer(byteBuffer);

            ByteArrayOutputStream fOut = new ByteArrayOutputStream();
            bm.compress(Bitmap.CompressFormat.JPEG, 100, fOut);
            File filePreview = new File(cacheDir, "preview.jpg");
            FileOutputStream filePreviewOutputStream = new FileOutputStream(filePreview);
            filePreviewOutputStream.write(fOut.toByteArray());
            filePreviewOutputStream.flush();
            filePreviewOutputStream.close();
            fOut.flush();
            fOut.close();

            Log.i(TAG, "=OnCaptureReceiveData cachedir = " + cacheDir.getAbsolutePath());
            mStreamActivityListener.takedCaptureCroppedPreview(filePreview);
            mMakingUrlPreview = false;
        } catch (IOException e) {
            Log.e(TAG, "=OnCaptureReceiveData " + e.getMessage());
            StopTranscoding();
        }

        Log.i(TAG, "=OnCaptureReceiveData end ");
        StopTranscoding();
        return 0;
    }

    private Handler createHandler() {
        return new Handler() {
            @Override
            public void handleMessage(Message msg) {
                MediaCapture.CaptureNotifyCodes status = (MediaCapture.CaptureNotifyCodes) msg.obj;

                String strText = null;
                switch (status) {
                    case CAP_OPENED:
                        strText = "Opened";
                        break;
                    case CAP_SURFACE_CREATED:
                        strText = "Camera surface created";
                        mSurfaceCreated = true;
                        if(mChangedOrient){
                            mChangedOrient = false;
                            mMediaCapture.Start();
                            printStates();
                        }

                        if(mStartRecordingAfterSurfaceCreate){
                            mStartRecordingAfterSurfaceCreate = false;
                            mMediaCapture.StartRecording();
                        }
                        break;
                    case CAP_SURFACE_DESTROYED:
                        strText = "Camera surface destroyed";
                        mSurfaceCreated = false;
                        break;
                    case CAP_STARTED:
                        strText = "Started";
                        break;
                    case CAP_STOPPED:
                        strText = "Stopped";
                        break;
                    case CAP_CLOSED:
                        strText = "Closed";
                        break;
                    case CAP_ERROR:
                        Log.e(TAG, "CAP_ERROR");
                        break;
                    case CAP_TIME:
                        int rtmp_status = mMediaCapture.getRTMPStatus();
                        // int rec_status = mMediaCapture.getRECStatus();
                        Log.i(TAG, "CAP_TIME, rtmp_status = " + rtmp_status + ", isStreaming = " + mMediaCapture.getConfig().isStreaming());
                        if(mRtmpStatusPrev != rtmp_status){
                            // for debugging
                            /*int v_cnt = mMediaCapture.getVideoPackets();
                            int a_cnt = mMediaCapture.getAudioPackets();
                            long v_pts = mMediaCapture.getLastVideoPTS();
                            long a_pts = mMediaCapture.getLastAudioPTS();
                            int nreconnects = mMediaCapture.getStatReconnectCount();
                            int battery = mMediaCapture.getBattery_Status();
                            int ir = mMediaCapture.getIR_Status();
                            Log.v("StreamStat", "v:" + v_cnt + "  a:" + a_cnt + " getStatReconnectCount:" + nreconnects +" battery="+battery+" ir="+ir);*/

                            if(rtmp_status == 0) {
                                // online
                                Log.i(TAG, "CAP_TIME, Started");
                                if(mRtmpStatusPrev != 0){
                                    mStreamActivityListener.streamStarted();
                                }
                            }else{
                                // offline
                                if(mRtmpStatusPrev == 0){
                                    mStreamActivityListener.streamStopped();
                                }
                                if(rtmp_status == -1){
                                    Log.e(TAG, "CAP_TIME, Connecting...");
                                } else if(rtmp_status == -5){
                                    Log.e(TAG, "CAP_TIME, Server not conneted");
                                } else if(rtmp_status == -12){
                                    Log.e(TAG, "CAP_TIME, Out of memory");
                                } else if(rtmp_status == -999){
                                    Log.e(TAG, "CAP_TIME, Streaming stopped. DEMO VERSION limitation");
                                }
                            }
                            mRtmpStatusPrev = rtmp_status;
                        }
                        break;
                    case CAP_RECORD_STARTED:
                        break;
                    case CAP_RECORD_STOPPED:
                        break;
                    default:
                        break;
                }
                if (strText != null) {
                    Log.i(TAG, "=Status handleMessage str=" + strText);
                }
            }
        };
    }

    public void Close() {
        if (mMediaCapture != null)
            mMediaCapture.Close();
    }

    public void configureMediaCapture(MediaCapture capture) {
        int ncm = capture.getConfig().getCaptureMode();

        // unmute state
        ncm |= MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val();
        // mute state
        //ncm &= ~(MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val());

        //captureConfig.setUseAVSync(false); //av sync off
        capture.getConfig().setCaptureMode(ncm);
        capture.getConfig().setAudioFormat(MediaCaptureConfig.TYPE_AUDIO_AAC);
        capture.getConfig().setAudioBitrate(128);
        capture.getConfig().setAudioSamplingRate(44100);
        capture.getConfig().setAudioChannels(2);
        capture.getConfig().setvideoOrientation(0);
        capture.getConfig().setVideoFramerate(30);
        capture.getConfig().setStreaming(false);
        capture.getConfig().setTranscoding(false);
        capture.getConfig().setRecording(false);

        int resX = 640;
        //int resX = 1280;
        switch (resX) {
            case 1920:
                capture.getConfig().setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_1920x1080); // 16 : 9
                break;
            case 1280:
                capture.getConfig().setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_1280x720); // 16 : 9
                break;
            case 640:
                capture.getConfig().setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_640x360); // 16 : 9
                break;
            case 320:
                capture.getConfig().setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_320x240); // 4 : 3
                break;
        }

        // Transcoding configuration
        capture.getConfig().setTransFps(1);
        mPreviewWidth = capture.getConfig().getVideoWidth();
        mPreviewHeight = capture.getConfig().getVideoHeight();
        capture.getConfig().setTransWidth(mPreviewWidth);
        capture.getConfig().setTransHeight(mPreviewHeight);
        capture.getConfig().setTransFormat(MediaCaptureConfig.TYPE_VIDEO_RAW);
    }

    public boolean isSurfaceCreated() {
        return mSurfaceCreated;
    }

    public boolean isStarted() {
        if (mMediaCapture != null) {
            return (mMediaCapture.getConfig().isRecording() || mMediaCapture.getConfig().isStreaming());
        }else{
            Log.e(TAG, "Capturer id null");
        }
        return false;
    }

    public boolean isRecording() {
        if (mMediaCapture != null) {
            return mMediaCapture.getConfig().isRecording();
        }
        Log.e(TAG, "Capturer id null");
        return false;
    }

    public boolean isStreaming() {
        if (mMediaCapture != null) {
            return mMediaCapture.getConfig().isStreaming();
        }
        Log.e(TAG, "Capturer id null");
        return false;
    }

    public void takeCapturePreview() {
        Log.e(TAG, "StartTranscoding begin ");
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            public void run() {
                Log.e(TAG, "StartTranscoding point 1");
                if (!mMakingUrlPreview) {
                    Log.e(TAG, "StartTranscoding point 2");
                    mPreviewWidth = mMediaCapture.getConfig().getVideoWidth();//mMediaCapture.getMeasuredWidth();
                    mPreviewHeight = mMediaCapture.getConfig().getVideoHeight();//mMediaCapture.getMeasuredHeight();
                    mMediaCapture.getConfig().setTransWidth(mPreviewWidth);
                    mMediaCapture.getConfig().setTransHeight(mPreviewHeight);
                    Log.e(TAG, "StartTranscoding point 3 commented");
                    mMediaCapture.StartTranscoding();
                    Log.e(TAG, "StartTranscoding point 4 (end)");
                } else {
                    Log.e(TAG, "StartTranscoding failed");
                }
            }
        });
    }

    public void onStop() {
        if (mMediaCapture != null){
            mMediaCapture.onStop();
        }else{
            Log.e(TAG, "Capturer id null");
        }
        mChangedOrient = false;

    }

    public void onResume() {
        if (mMediaCapture != null) {
            mMediaCapture.onResume();
        }else{
            Log.e(TAG, "Capturer id null");
        }
    }

    public void onPause() {
        if (mMediaCapture != null) {
            mMediaCapture.onPause();
        }else{
            Log.e(TAG, "Capturer id null");
        }
    }

    public void onStart() {
        if (mMediaCapture != null) {
            mMediaCapture.onStart();
        }else{
            Log.e(TAG, "mMediaCapture id null");
        }
    }

    public void onDestroy() {
        if (mMediaCapture != null) {
            mMediaCapture.onDestroy();
        }else{
            Log.e(TAG, "mMediaCapture id null");
        }
    }

    public void onWindowFocusChanged(boolean hasFocus) {
        if (mMediaCapture != null) {
            mMediaCapture.onWindowFocusChanged(hasFocus);
        }else{
            Log.e(TAG, "onWindowFocusChanged: MediaCapture id null");
        }
    }

    public void StartStreaming() {
        if (mMediaCapture != null) {
            Log.i(TAG, "StartStreaming: " + mMediaCapture.getConfig().getUrl());
            mMediaCapture.StartStreaming();
        }else{
            Log.e(TAG, "StartStreaming: MediaCapture id null");
        }

    }

    public void StopStreaming() {
        if (mMediaCapture != null) {
            Log.i(TAG, "StopStreaming");
            mMediaCapture.StopStreaming();
        }else{
            Log.e(TAG, "StopStreaming: MediaCapture id null");
        }

    }

    public void setUrl(String mediaServerURL) {
        if (mMediaCapture != null) {
            Log.i(TAG, "Set new URL " + mediaServerURL);
            mMediaCapture.getConfig().setStreaming(false); // adhoc for fix change url
            mMediaCapture.getConfig().setUrl(mediaServerURL);
        }else{
            Log.e(TAG, "setUrl: MediaCapture id null");
        }
    }

    public String getRecordStatFileName() {
        if (mMediaCapture != null){
            // MediaCapture.PlayerRecordStat.PP_RECORD_STAT_FILE_NAME
            return mMediaCapture.getPropString(5);
        }else{
            Log.e(TAG, "getRecordStatFileName: MediaCapture id null");
        }
        return null;
    }

    public void printStates(){
        if (mMediaCapture != null) {
            Log.i(TAG, "mMediaCapture.getConfig().isTranscoding(): " + mMediaCapture.getConfig().isTranscoding());
            Log.i(TAG, "mMediaCapture.getConfig().isStreaming(): " + mMediaCapture.getConfig().isStreaming());
            Log.i(TAG, "mMediaCapture.getConfig().isRecording(): " + mMediaCapture.getConfig().isRecording());
        }else{
            Log.e(TAG, "printStates: MediaCapture id null");
        }
    }

    public void changeToPortrait(Activity activity){
        Log.e(TAG, " changeToPortrait ");
        if(mMediaCapture != null){
            printStates();
            mMediaCapture.Stop();
            mMediaCapture.Close();
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT);
            mMediaCapture.getConfig().setvideoOrientation(90);
            mChangedOrient = true;
            mMediaCapture.Open(null, this);
            //mMediaCapture.Start();
            printStates();
        }else{
            Log.e(TAG, "changeToPortrait: MediaCapture id null");
        }
    }

    public void changeToLandscape(Activity activity){
        Log.e(TAG, " changeToLandscape ");
        if(mMediaCapture != null){
            printStates();
            mMediaCapture.Stop();
            mMediaCapture.Close();
            activity.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            mMediaCapture.getConfig().setvideoOrientation(0);
            mChangedOrient = true;
            mMediaCapture.Open(null, this);
            //mMediaCapture.Start();
            printStates();
        }else{
            Log.e(TAG, "printStates: MediaCapture id null");
        }
    }

    public void microphoneEnable(){
        Log.e(TAG, " microphoneEnable ");
        if(mMediaCapture != null){

            mMediaCapture.getConfig().setAudioMute(false);

            mMediaCapture.Stop();
            mMediaCapture.Close();
            int ncm = mMediaCapture.getConfig().getCaptureMode();
            ncm |= MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val();
            mMediaCapture.getConfig().setCaptureMode(ncm);
            mMediaCapture.Open(null, this);
            mMediaCapture.Start();
        }
    }

    public void microphoneDisable(){
        Log.e(TAG, " microphoneDisable ");

        if(mMediaCapture != null){

            mMediaCapture.getConfig().setAudioMute(true);

            mMediaCapture.Stop();
            mMediaCapture.Close();
            int ncm = mMediaCapture.getConfig().getCaptureMode();
            ncm &= ~(MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val());
            mMediaCapture.getConfig().setCaptureMode(ncm);
            mMediaCapture.Open(null, this);
            mMediaCapture.Start();
        }
    }

    public boolean isMicrophoneEnabled(){
        if(mMediaCapture != null){
            int n = mMediaCapture.getConfig().getCaptureMode() & MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val();
            Log.i(TAG, "isMicrophoneEnabled " + n);
            Log.i(TAG, "mMediaCapture.getConfig().isCaptureAudio() " + mMediaCapture.getConfig().isCaptureAudio());
            return n > 0;
        }
        return false;
    }
}


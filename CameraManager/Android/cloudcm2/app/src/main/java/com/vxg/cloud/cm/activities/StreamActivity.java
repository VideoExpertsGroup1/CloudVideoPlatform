package com.vxg.cloud.cm.activities;

import android.annotation.SuppressLint;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;
import com.vxg.cloud.CameraManager.Tasks.CameraManagerUploadingPreviewTask;
import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;
import com.vxg.cloud.cm.Control.StreamController;
import com.vxg.cloud.cm.Interfaces.StreamActivityListener;
import com.vxg.cloud.cm.Objects.MediaCapturerWrapper;
import com.vxg.cloud.cm.R;
import com.vxg.cloud.cm.Utils.Util;

import java.io.File;
import java.net.URL;

import veg.mediacapture.sdk.MediaCapture;

public class StreamActivity extends AppCompatActivity implements StreamActivityListener {
    private final String TAG = StreamActivity.class.getSimpleName();

    private StreamController mStreamController;

    private SharedPreferences settings;
    private Handler handler;
    private WifiManager.MulticastLock multicastLock;
    private PowerManager.WakeLock mWakeLock;

    private boolean stoppedByUser = false;
    private boolean restarting = false;
    private MediaCapturerWrapper mMediaCaptureWrapper;
    private String mPreviewURL = null;

    private ImageButton buttonClose;
    private ImageView recordLedStatus;
    private TextView recordTextStatus;
    private AlertDialog.Builder errorDialogBuilder;
    private AlertDialog errorDialog;
    private boolean mIgnorePauseResume;

    //***** StreamActivityListener
    @Override
    public void logout() {
        closeStream();
        recordTextStatus.setText(getString(R.string.stream_status_stopped_by_user));
        recordLedStatus.setImageResource(R.drawable.led_black);
    }
    @Override
    public void availableStream(final String mediaServerURL) {
        Log.i(TAG, " availableStream(" + mediaServerURL + ") willRestarting = restarting = " + restarting);
        mMediaCaptureWrapper.setUrl(mediaServerURL);
    }

    @Override
    public void streamStarted() {
        Log.i(TAG, "streamStarted");
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                recordLedStatus.setImageResource(R.drawable.led_red);
                recordTextStatus.setText(getString(R.string.stream_status_connected));
            }
        });
    }

    @Override
    public void streamStopped() {
        Log.i(TAG, "streamStopped");
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                recordLedStatus.setImageResource(R.drawable.led_black);
                recordTextStatus.setText(getString(R.string.stream_status_not_connected));
            }
        });
    }

    @Override
    public void takePreview(String url){
        Log.i(TAG, "takePreview " + url);
        mPreviewURL = url;
        mMediaCaptureWrapper.takeCapturePreview();
    }

    @Override
    public void takedCaptureCroppedPreview(File cropPreview){
        Log.i(TAG, "takedCaptureCroppedPreview");
        try {
            ServiceProviderHelper.executeAsyncTask(new CameraManagerUploadingPreviewTask(new URL(mPreviewURL), cropPreview, this));
        } catch (Exception e) {
            Log.e(TAG, "CameraManagerUploadingPreviewTask failed " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public void startStream() {
        mMediaCaptureWrapper.StartStreaming();
    }

    @Override
    public void stopStream(){
        mMediaCaptureWrapper.StopStreaming();
    }

    /*@Override
    public void failStartStream() {
        StreamActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                recordLedStatus.setImageResource(R.drawable.led_black);
                recordTextStatus.setText(getString(R.string.stream_status_fail));
            }
        });
    }*/

    @Override
    public void serverConnClose(CameraManagerErrors error) {
        Log.i(TAG, "serverConnClose, " + error.toString());
        String errorMessage = "Unknown";
        if(error == CameraManagerErrors.REASON_AUTH_FAILURE){
            errorMessage = getString(R.string.error_dialog_AUTH_FAILURE);
            mStreamController.unsetStreamActivityListener();
        }else if(error == CameraManagerErrors.REASON_CONN_CONFLICT){
            errorMessage = getString(R.string.error_dialog_CONN_CONFLICT);
        }else if(error == CameraManagerErrors.REASON_ERROR){
            errorMessage = getString(R.string.error_dialog_ERROR);
        }else if(error == CameraManagerErrors.REASON_SYSTEM_ERROR){
            errorMessage = getString(R.string.error_dialog_SYSTEM_ERROR);
        }else if(error == CameraManagerErrors.REASON_DELETED){
            errorMessage = getString(R.string.error_dialog_DELETED);
            mStreamController.unsetStreamActivityListener();
        }else if(error == CameraManagerErrors.CONNECTION_TIMEOUT) {
            errorMessage = getString(R.string.error_dialog_ws_port_blocked);
        }else if(error == CameraManagerErrors.LOST_SERVER_CONNECTION){
            // ignore this error
            return;
        }else{
            Log.e(TAG, "serverConnClose, Unhandled error " + error.toString());
        }

        final String fErrorDesc = errorMessage;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "DEBUG close reason() " + fErrorDesc);
                mMediaCaptureWrapper.StopStreaming();
            }
        });

        new AsyncTask<Void,Void,Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                Log.v(TAG, "Ping 8.8.8.8 (has internet 0 true, 1-2 bad) = " + Util.pingHost("8.8.8.8"));
                return null;
            }
        }.execute();  // TODO temp: for debug
    }
    //********!!

    @Override
    @SuppressLint("HandlerLeak")
    protected void onCreate(Bundle savedInstanceState) {
        /*getWindow().requestFeature(Window.FEATURE_PROGRESS);
        getWindow().setFeatureInt(Window.FEATURE_PROGRESS, Window.PROGRESS_VISIBILITY_ON);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );*/
        Log.d(TAG, "onCreate()");
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_stream);
        mMediaCaptureWrapper = new MediaCapturerWrapper((MediaCapture)findViewById(R.id.capture_view), this.getApplicationContext(), this);

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        mWakeLock = pm.newWakeLock(PowerManager.FULL_WAKE_LOCK, "com.vxg.cloud.cm");

        WifiManager wifi = (WifiManager) getSystemService(WIFI_SERVICE);
        multicastLock = wifi.createMulticastLock("multicastLock");
        multicastLock.setReferenceCounted(true);
        multicastLock.acquire();

        initViews();
        settings = PreferenceManager.getDefaultSharedPreferences(this);

        errorDialogBuilder = new AlertDialog.Builder(this);

        Log.i(TAG, "Start try VXGCloudCamera...");
        mStreamController = StreamController.getInstance(getApplicationContext());
        mStreamController.setStreamActivityListener(this);
    }

    private void initViews() {
        buttonClose = (ImageButton) findViewById(R.id.button_close);
        buttonClose.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                closeStreamDialog();
            }
        });
        recordLedStatus = (ImageView) findViewById(R.id.recordLedStatus);
        recordLedStatus.setImageResource(R.drawable.led_green);
        recordTextStatus = (TextView) findViewById(R.id.recordTextStatus);
        recordTextStatus.setText(getString(R.string.stream_status_connecting));
    }

    @Override
    protected void onStart() {
        Log.d(TAG, "onStart()");
        super.onStart();
        mWakeLock.acquire();
        mMediaCaptureWrapper.onStart();
    }

    @Override
    protected void onResume() {
        Log.d(TAG, "onResume()");
        super.onResume();
        if(!mIgnorePauseResume)
            mMediaCaptureWrapper.onResume();
    }

    @Override
    protected void onPause() {
        Log.d(TAG, "onPause()");
        super.onPause();

        if(!mIgnorePauseResume)
            mMediaCaptureWrapper.onPause();
    }

    @Override
    protected void onStop() {
        Log.v(TAG, "onStop()");

        stoppedByUser = true;

        mStreamController.unsetStreamActivityListener();
        super.onStop();

        if (mMediaCaptureWrapper.isStarted()) {
            mMediaCaptureWrapper.onStop();

            mStreamController.unsetStreamActivityListener();

            if (mWakeLock.isHeld()) // A WakeLock should only be released when isHeld() is true !
                mWakeLock.release();
            mMediaCaptureWrapper.Close();
        }
        // IS_BROADCASTING = false;
    }

    @Override
    protected void onDestroy() {
        Log.v(TAG, "onDestroy()");
        mStreamController.unsetStreamActivityListener();
        mMediaCaptureWrapper.onDestroy();

        if (multicastLock != null) {
            multicastLock.release();
            multicastLock = null;
        }
        mStreamController.logout();
        mStreamController.release();
        super.onDestroy();
    }


    @Override
    public void onBackPressed() {
        closeStreamDialog();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        Log.e(TAG, "onWindowFocusChanged(): " + hasFocus);
        super.onWindowFocusChanged(hasFocus);
        /*if (capturer != null)
            capturer.onWindowFocusChanged(hasFocus);*/
    }

    private void closeStream() {
        if (errorDialog != null && errorDialog.isShowing())
            errorDialog.dismiss();
        mMediaCaptureWrapper.StopStreaming();
        mStreamController.resetConfig();
        finish();
    }

    private void closeStreamDialog() {
        if (mMediaCaptureWrapper.isStreaming()) {
            AlertDialog.Builder alertDialog = new AlertDialog.Builder(this);
            alertDialog.setMessage(getResources().getString(R.string.exit_dialog_title));

            alertDialog.setPositiveButton(
                    getResources().getString(R.string.exit_dialog_positive),
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            recordLedStatus.setImageResource(R.drawable.led_black);
                            recordTextStatus.setText(getString(R.string.stream_status_stopped_by_user));
                            closeStream();
                        }
                    }
            );

            alertDialog.setNegativeButton(
                    getResources().getString(R.string.exit_dialog_negative),
                    new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            dialog.cancel();
                        }
                    }
            );
            alertDialog.show();
        }
        else {
            recordLedStatus.setImageResource(R.drawable.led_black);
            recordTextStatus.setText(getString(R.string.stream_status_stopped_by_user));
            closeStream();
        }
    }

    private void onErrorDialog(String title, String description) {
        if (errorDialog != null && errorDialog.isShowing())
            errorDialog.dismiss();

        errorDialogBuilder.setTitle(title);
        errorDialogBuilder.setMessage(description);

        recordLedStatus.setVisibility(View.GONE);
        recordTextStatus.setVisibility(View.GONE);

        errorDialogBuilder.setNegativeButton(
                getResources().getString(R.string.error_dialog_positive),
                new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        closeStream();
                        errorDialog.dismiss();
                    }
                }
        );
        errorDialogBuilder.setCancelable(false);
        errorDialog = errorDialogBuilder.show();
    }
}
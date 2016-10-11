package com.vxg.cloud.cm.Views;

import android.annotation.SuppressLint;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.net.wifi.WifiManager;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import com.vxg.cloud.cm.Control.CaptureStreamingController;
import com.vxg.cloud.cm.Interfaces.StreamActivityListener;
import com.vxg.cloud.cm.R;
import com.vxg.cloud.cm.Utils.Util;
import com.vxg.cloud.cm.WebSocketAPI;

import java.nio.ByteBuffer;

import veg.mediacapture.sdk.MediaCapture;
import veg.mediacapture.sdk.MediaCaptureCallback;
import veg.mediacapture.sdk.MediaCaptureConfig;

public class StreamActivity extends AppCompatActivity implements MediaCaptureCallback, StreamActivityListener {
    private final String TAG = StreamActivity.class.getSimpleName();

    private CaptureStreamingController controller;

    private SharedPreferences settings;
    private MediaCapture capturer;
    private MediaCaptureConfig captureConfig;
    private Handler handler;
    private WifiManager.MulticastLock multicastLock;
    private PowerManager.WakeLock mWakeLock;
    private int mOldMsg = 0;
    private boolean	misSurfaceCreated = false;

    private boolean stoppedByUser = false;
    private boolean restarting = false;

    private final int restartTime = 6_000;

    private ImageButton buttonClose;
    private ImageView recordLedStatus;
    private TextView recordTextStatus;
    private AlertDialog.Builder errorDialogBuilder;
    private AlertDialog errorDialog;

    //****  MediaCaptureCallback
    @Override
    public int OnCaptureStatus(int arg) {
        MediaCapture.CaptureNotifyCodes status = MediaCapture.CaptureNotifyCodes.forValue(arg);
        if (handler == null || status == null)
            return 0;

        //Log.v(TAG, "=OnCaptureStatus status=" + arg);
        switch (MediaCapture.CaptureNotifyCodes.forValue(arg))
        {
            default:
                Message msg = new Message();
                msg.obj = status;
                handler.removeMessages(mOldMsg);
                mOldMsg = msg.what;
                handler.sendMessage(msg);
        }

        return 0;
    }
    @Override
    public int OnCaptureReceiveData(ByteBuffer byteBuffer, int i, int i1, long l) {
        return 0;
    }
    //********!!

    //***** StreamActivityListener
    @Override
    public void logout() {
        closeStream();
        recordTextStatus.setText(getString(R.string.stream_status_stopped_by_user));
        recordLedStatus.setImageResource(R.drawable.led_black);
    }
    @Override
    public void availableStream(final String mediaServerURL) {
        StreamActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                captureConfig.setUrl(mediaServerURL);

                recordLedStatus.setVisibility(View.VISIBLE);
                recordTextStatus.setVisibility(View.VISIBLE);

                if (!restarting) {
                    if (!isRec())
                        startStream();
                }
                else {
                    errorDialog.dismiss();
                    capturer.StartStreaming();
                }
            }
        });
    }
    @Override
    public void failStartStream() {
        StreamActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                recordLedStatus.setImageResource(R.drawable.led_black);
                recordTextStatus.setText(getString(R.string.stream_status_fail));
            }
        });
    }
    @Override
    public void serverConnClose(String error) {
        boolean willRestarting = true;
        switch (error) {
            case WebSocketAPI.REASON_AUTH_FAILURE :
                error = getString(R.string.error_dialog_AUTH_FAILURE);
                break;
            case WebSocketAPI.REASON_CONN_CONFLICT :
                error = getString(R.string.error_dialog_CONN_CONFLICT);
                break;
            case WebSocketAPI.REASON_ERROR :
                error = getString(R.string.error_dialog_ERROR);
                break;
            case WebSocketAPI.REASON_SYSTEM_ERROR :
                error = getString(R.string.error_dialog_SYSTEM_ERROR);
                break;
            case WebSocketAPI.REASON_DELETED :
                error = getString(R.string.error_dialog_DELETED);
                willRestarting = false;
                break;
        }

        final boolean fWillRestarting = willRestarting;
        final String fErrorDesc = error;

        StreamActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Log.d(TAG, "serverConnClose() ");
                onErrorDialog(
                        getString(R.string.error_dialog_title_conn_error),
                        fErrorDesc
                );
                new AsyncTask<Void,Void,Void>() {
                    @Override
                    protected Void doInBackground(Void... params) {
                        Log.v(TAG, "Ping 8.8.8.8 (has internet) = " + Util.pingHost("8.8.8.8"));
                        return null;
                    }
                }.execute();  // TODO temp: for debug

                if (fWillRestarting) {
                    restarting = true;
                    capturer.StopStreaming();
                    handler.postDelayed(
                            new Runnable() {
                                @Override
                                public void run() {
                                    controller.restartCM();
                                }
                            },
                            restartTime
                    );
                    for (int i = restartTime, j = 0; i > 0; i -= 1_000, j += 1) {
                        final int cur = j;
                        handler.postDelayed(
                                new Runnable() {
                                    @Override
                                    public void run() {
                                        if (errorDialog != null && errorDialog.isShowing()) {
                                            TextView textViewMessage = (TextView)errorDialog.findViewById(android.R.id.message);
                                            String lastMessage = (String) textViewMessage.getText();
                                            String sss = getString(R.string.error_dialog_timer_null);
                                            if (lastMessage.contains(sss)) {
                                                lastMessage = lastMessage.substring(0, lastMessage.indexOf(sss));
                                                lastMessage += getString(R.string.error_dialog_timer, cur);
                                            }
                                            else
                                                lastMessage += " \n\n" + getString(R.string.error_dialog_timer, cur);

                                            errorDialog.setMessage(lastMessage);
                                        }
                                    }
                                },
                                i
                        );
                    }
                }

            }
        });
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

        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        mWakeLock = pm.newWakeLock(PowerManager.FULL_WAKE_LOCK, "com.vxg.cloud.cm");

        WifiManager wifi = (WifiManager) getSystemService(WIFI_SERVICE);
        multicastLock = wifi.createMulticastLock("multicastLock");
        multicastLock.setReferenceCounted(true);
        multicastLock.acquire();


        handler = new Handler()
        {
            @Override
            public void handleMessage(Message msg)
            {
                MediaCapture.CaptureNotifyCodes status = (MediaCapture.CaptureNotifyCodes) msg.obj;

                String strText = null;

                switch (status)
                {
                    case CAP_OPENED:
                        strText = "Opened";
                        break;
                    case CAP_SURFACE_CREATED:
                        strText = "Camera surface created";
                        misSurfaceCreated = true;
                        break;
                    case CAP_SURFACE_DESTROYED:
                        strText = "Camera surface destroyed";
                        misSurfaceCreated = false;
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
                        strText = "Error";
                        //break;
                    case CAP_TIME:
                        if(isRec()){
                            int rtmp_status = capturer.getRTMPStatus();
                            int dur = (int)capturer.getDuration()/1000;

                            int v_cnt = capturer.getVideoPackets();
                            int a_cnt = capturer.getAudioPackets();
                            long v_pts = capturer.getLastVideoPTS();
                            long a_pts = capturer.getLastAudioPTS();
                            int nreconnects = capturer.getStatReconnectCount();

                            String sss;
                            String sss2 = "";
                            if ( dur >= 60 * 60 )
                                sss = String.format("%02d:%02d:%02d", dur / 3600, dur /  60 % 60, dur  % 60) + "  ";
                            else
                                sss = String.format("%02d:%02d",  dur  / 60 % 60, dur  % 60) + "  ";

                            if(rtmp_status == (-999)){
                                sss = getString(R.string.stream_status_demo_limitation);
                                closeStream();
                                recordTextStatus.setText(sss);
                                recordLedStatus.setImageResource(R.drawable.led_black);
                            }
                            else if(rtmp_status != (-1)) {
                                if (rtmp_status == 0) {
                                    recordLedStatus.setImageResource(R.drawable.led_red);
                                    sss += getString(R.string.stream_status_online);
                                }
                                else {
                                    recordLedStatus.setImageResource(R.drawable.led_black);
                                    //sss +=  "Err:" + rtmp_status + " ";
                                }

                                if(rtmp_status == (-5)){
                                    sss += " " + getString(R.string.stream_status_server_not_connected);
                                }else if(rtmp_status == (-12)){
                                    sss += " " + getString(R.string.stream_status_out_of_memory);
                                }

                                Log.v("StreamStat", "v:"+v_cnt+"  a:"+a_cnt+" getStatReconnectCount:"+nreconnects);
                                //sss += "\nv_pts: "+v_pts+" a_pts: "+a_pts+" delta: "+(v_pts-a_pts);


                            }else{
                                sss += " " + getString(R.string.stream_status_connecting);
                                recordLedStatus.setImageResource(R.drawable.led_green);
                            }

                            int rec_status = capturer.getRECStatus();
                            if(rec_status != -1){
                                if(rec_status == (-999)){
                                    sss = getString(R.string.stream_status_demo_limitation);
                                    closeStream();
                                    recordTextStatus.setText(sss);
                                    recordLedStatus.setImageResource(R.drawable.led_black);
                                }
                            }
                            recordTextStatus.setText(sss);
                        }
                        break;

                    default:
                        break;
                }
                if(strText != null){
                    Log.i(TAG, "=Status handleMessage str="+strText);
                }
            }
        };

        initViews();
        settings = PreferenceManager.getDefaultSharedPreferences(this);
        load_config();
        capturer.Open(null, this);

        errorDialogBuilder = new AlertDialog.Builder(this);

        Log.i(TAG, "Start try WebSocketAPI...");
        controller = CaptureStreamingController.getInstance(getApplicationContext());
        controller.setStreamActivityListener(this);
        controller.prepareCM();
    }

    private void initViews() {
        capturer = (MediaCapture)findViewById(R.id.capture_view);
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
        if (capturer != null) {
            capturer.onStart();
        }
    }

    @Override
    protected void onResume() {
        Log.d(TAG, "onResume()");
        super.onResume();
        if (capturer != null) {
            capturer.onResume();
        }
    }

    @Override
    protected void onPause() {
        Log.d(TAG, "onPause()");
        super.onPause();

        if (capturer != null)
            ;//capturer.onPause();
    }

    @Override
    protected void onStop() {
        Log.v(TAG, "onStop()");
        onErrorDialog(
                getString(R.string.error_dialog_title_app_issue),
                getString(R.string.error_dialog_activity_on_stop)
        );

        stoppedByUser = true;

        controller.unsetStreamActivityListener();

        super.onStop();
        if (capturer != null)
            capturer.onStop();

        if (mWakeLock.isHeld()) // A WakeLock should only be released when isHeld() is true !
            mWakeLock.release();

        if(misSurfaceCreated){
            if (capturer != null)
                capturer.Close();
        }
    }

    @Override
    protected void onDestroy() {
        Log.v(TAG, "onDestroy()");
        if (capturer != null)
            capturer.onDestroy();

        if (multicastLock != null) {
            multicastLock.release();
            multicastLock = null;
        }
        controller.logout();
        controller.release();
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
        if (capturer != null)
            capturer.onWindowFocusChanged(hasFocus);
    }

    private void startStream() {
        load_config();
        capturer.Start();
    }

    private void closeStream() {
        if (errorDialog != null && errorDialog.isShowing())
            errorDialog.dismiss();
        capturer.Stop();
        capturer.Close();
        finish();
    }

    private boolean isRec(){
        return ( capturer != null && capturer.getState() == MediaCapture.CaptureState.Started );
    }

    private void closeStreamDialog() {
        if (isRec()) {
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

    private void load_config() {
        if(capturer == null)
            return;

        int settings_changed = settings.getInt("streaming_changed", 1);
        if(settings_changed == 1) {
            SharedPreferences.Editor ed = settings.edit();
            //ed.putString("urlrtmp", rtmp_url);
            ed.putInt("streaming_changed", 0);
            ed.apply();
        }

        captureConfig = capturer.getConfig();
        int ncm = captureConfig.getCaptureMode();
        boolean misAudioEnabled = false;
        if(misAudioEnabled){
            ncm |= MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val();
        }else{
            ncm &= ~(MediaCaptureConfig.CaptureModes.PP_MODE_AUDIO.val());
        }
        //captureConfig.setUseAVSync(false); //av sync off
        captureConfig.setStreaming(true);
        captureConfig.setCaptureMode(ncm);
        captureConfig.setAudioFormat(MediaCaptureConfig.TYPE_AUDIO_AAC);
        captureConfig.setAudioBitrate(128);
        captureConfig.setAudioSamplingRate(44100); //hardcoded
        captureConfig.setAudioChannels(2);
        captureConfig.setvideoOrientation(0); //landscape
        captureConfig.setVideoFramerate(30);
        captureConfig.setVideoBitrate(1000);
        int resX = 640;
        switch( resX ){
            case 1920:
                captureConfig.setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_1920x1080);
                break;
            case 1280:
                captureConfig.setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_1280x720);
                break;
            case 640:
                captureConfig.setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_640x480);
                break;
            case 320:
                captureConfig.setVideoResolution(MediaCaptureConfig.CaptureVideoResolution.VR_320x240);
                break;
        }
        captureConfig.setRecording(false);
    }
}
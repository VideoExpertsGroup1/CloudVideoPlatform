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

package com.vxg.cnvrclient2;

import java.nio.ByteBuffer;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Message;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Gravity;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup.LayoutParams;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;
import veg.mediaplayer.sdk.MediaPlayer;
import veg.mediaplayer.sdk.MediaPlayerConfig;

import com.vxg.cnvrclient2.activities.CloudClientActivity;
import com.vxg.cnvrclient2.activities.SettingsActivity;

import veg.mediaplayer.sdk.MediaPlayer.PlayerNotifyCodes;

@SuppressLint("HandlerLeak")
public class PlayerWrapper implements MediaPlayer.MediaPlayerCallback {
	private final static String TAG = PlayerWrapper.class.getSimpleName();
	private MediaPlayer player = null;
	public FrameLayout m_fl = null;
	private Context mContext = null;
	private boolean m_bStarted = false;
	private boolean m_bEnded = false;
	private boolean m_bPlay = false;
	private String m_sUrl = null;
	private String m_sPlayerID = null;
	private long m_nPosition = 0;
	private MediaPlayer.MediaPlayerCallback mpcb = null;

	public PlayerWrapper(Context c, String playerId, FrameLayout fl) {
		mContext = c;
        player = new MediaPlayer(c);
        m_fl = fl;
        mpcb = this;
        m_sPlayerID = playerId;
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER);
        player.setLayoutParams(params);
        player.backgroundColor(0x131313);
        m_fl.setVisibility(View.VISIBLE);
        player.setVisibility(View.VISIBLE);
        m_fl.addView(player);
        // hide();
		Log.e(TAG, "RTSPPlayer instance " + playerId + ": " + player);
    }

	public MediaPlayer getMediaPlayer(){
		return player;
	}
	public boolean paused(){
		return !m_bStarted;
	}
	public boolean started(){
		return m_bStarted;
	}

	private Handler handler = new Handler() 
    {
        @Override
        public void handleMessage(Message msg)
        {
        	PlayerNotifyCodes status = (PlayerNotifyCodes) msg.obj;
        	Log.i(TAG, "=Status arg notify: " + status +" m_sPlayerID="+m_sPlayerID);

			if (status == PlayerNotifyCodes.CP_CONNECT_STARTING)
			{
				m_bStarted = false;
				Log.i(TAG, "CP_CONNECT_STARTING " + m_sPlayerID);
				execCallback("loadstart");
				// player.setVisibility(View.INVISIBLE);
			}
			
			if (status == PlayerNotifyCodes.PLP_BUILD_SUCCESSFUL){
				Log.i(TAG, "PLP_BUILD_SUCCESSFULL " + m_sPlayerID + " m_bPlay="+m_bPlay);
				execCallback("loadeddata");
			}
			
			if (status == PlayerNotifyCodes.PLP_PLAY_PAUSE){
				Log.i(TAG, "PLP_PLAY_PAUSE " + m_sPlayerID + " m_bPlay="+m_bPlay);
				if(m_bPlay && !m_bStarted){
					m_bEnded = false;
					m_bStarted = true;
					player.Play();
				}else{
					m_bStarted = false;
				}
			}
			if (status == PlayerNotifyCodes.PLP_PLAY_STOP){
				Log.i(TAG, "PLP_PLAY_STOP " + m_sPlayerID);
			}

			if (status == PlayerNotifyCodes.PLP_PLAY_SUCCESSFUL){
				m_bStarted = true;
			}

			if (status == PlayerNotifyCodes.PLP_PLAY_PLAY){
				Log.i(TAG, "PLP_PLAY_PLAY " + m_sPlayerID + " m_bPlay="+m_bPlay);
				if(!m_bPlay && m_bStarted){
					m_bStarted = false;
					player.Pause();
				}else{
					m_bStarted = true;
				}
			}

			if (status == PlayerNotifyCodes.CP_CONNECT_SUCCESSFUL){
				
				m_bEnded = false;
				Log.i(TAG, "CP_CONNECT_SUCCESSFUL " + m_sPlayerID);
			}

			if (status == PlayerNotifyCodes.PLP_CLOSE_STARTING)
			{
				m_bStarted = false;
				Log.i(TAG, "PLP_CLOSE_STARTING " + m_sPlayerID);
			}

			if (status == PlayerNotifyCodes.CP_STOPPED){
				m_bStarted = false;
				Log.i(TAG, "CP_STOPPED " + m_sPlayerID);
			}

			if(status == PlayerNotifyCodes.VRP_SURFACE_ACQUIRE){
				Log.i(TAG, "VRP_SURFACE_ACQUIRE " + m_sPlayerID);
			}
			if (status == PlayerNotifyCodes.PLP_EOS){
				Log.i(TAG, "PLP_EOS " + m_sPlayerID + "; eos: " + player.getStreamPosition());
				if(!m_bEnded){
					m_bEnded = true;
					// m_nPosition = 0;
					execCallback("ended");
					if(!m_bPlay)
						player.Close();
					// close();
				}
			}
        }
	};
	
	@Override
	public int OnReceiveData(ByteBuffer arg0, int arg1, long arg2) {
		// DO NOTHING
		return 0;
	}

	@Override
	public int Status(int arg0) {
		//Log.e("SDL", "Form Native Player status: " + arg0);

		Message msg = new Message();
		msg.obj = PlayerNotifyCodes.forValue(arg0);
    	PlayerNotifyCodes status = (PlayerNotifyCodes) msg.obj;
    	Log.e(TAG, "=Status arg : " + status +" m_sPlayerID="+m_sPlayerID);

		if (handler != null)
			handler.sendMessage(msg);
    	return 0;
	}

	public void setCurrentTime(long newTime){
		m_nPosition = newTime;
		Log.e(TAG, "PlayerWrapper:setCurerntTime:m_nPosition " + m_nPosition + " player: " + m_sPlayerID);
		player.setStreamPosition(newTime);
	}

	public long getCurrentTime(){
		// in seconds
		if (m_bStarted){
			long streamDuration = player.getStreamDuration()/1000; 
			long streamPosition = player.getStreamPosition()/1000;
			Log.e(TAG, "PlayerWrapper:getCurrentTime:m_nPosition (Started) (" + m_nPosition + "); " + Long.toString(streamPosition) + "/" + Long.toString(streamDuration) + " player: " + m_sPlayerID);
			if(m_nPosition > 0 && streamPosition == 0){
				return m_nPosition/1000;
			}

			m_nPosition = 0;
			return streamPosition;
		}else{
			Log.e(TAG, "PlayerWrapper:getCurrentTime:m_nPosition (Not Started) " + Long.toString(m_nPosition) + " player: " + m_sPlayerID);
			return m_nPosition/1000;
		}
	}

	public void setSource(String url){
		if(m_sUrl == url){
			execCallback("loadeddata");
		}

		if (m_sUrl != null && m_sUrl != url){
    		close();
    	}

		m_sUrl = url;
		if(m_sUrl == null) return;

		player.post(new Runnable() {
		   @Override
		   public void run() {
			   hide();
			   player.Close();

				MediaPlayerConfig conf = new MediaPlayerConfig();
				conf.setConnectionUrl(m_sUrl);
				conf.setColorBackground(0x131313);
				conf.setConnectionDetectionTime(1000);

			   if(!m_sPlayerID.equals("live-container")){ // only for record players
				   if(m_nPosition == 0 && (m_sPlayerID.equals("record-container1") || m_sPlayerID.equals("record-container2"))){
					   conf.setConnectionBufferingTime(3000);
				   }else{
					   conf.setConnectionBufferingTime(300);
				   }

				   Log.e(TAG, "PlayerWrapper:setSource:m_nPosition " + m_nPosition + " player: " + m_sPlayerID);
				   if(m_nPosition != 0){
					   conf.setStartOffest(m_nPosition);
				   }
				   conf.setStartPreroll(1);
			   }else {
				   SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mContext);
				   Boolean min_latency_enabled = prefs.getBoolean(SettingsActivity.PREF_MINIMAL_LATENCY_ENABLED, false);
				   if(min_latency_enabled) {
						Log.i(TAG, "minimal latency enabled");
						conf.setSynchroEnable(0); // min latency
						conf.setConnectionBufferingTime(0);
						conf.setSynchroNeedDropVideoFrames(1);
				   }
			   }

			   conf.setDecodingType(1); // h/w
			   player.Open(conf, mpcb);
			   // player.Pause();
			   Log.e(TAG, "PlayerWrapper:open " + m_sPlayerID);
		   }
		});
	}

	private void pause_(){
		Log.e(TAG, "PlayerWrapper:pause_ " + m_bPlay + "   " + m_sPlayerID);
		player.post(new Runnable() {
			@Override
			public void run() {
				try{
					// hide();
					player.Pause();
				}catch(Exception e){
					Log.e(TAG, "PlayerWrapper:error:onpause " + m_sPlayerID + ";  e: " + e.getMessage());
				}
			}
		});
	}

	public void pause(){
		m_bPlay = false;
		Log.e(TAG, "PlayerWrapper:pause " + m_bPlay + "   " + m_sPlayerID);
		if(m_sPlayerID.equals("live-container")){
			close();
		}else{
			pause_();
		}
	}

	private void play_(){
		Log.e(TAG, "PlayerWrapper:play_ " + m_bPlay + "   " + m_sPlayerID);
		player.post(new Runnable() {
			@Override
			public void run() {
				try{
					player.Play();
				}catch(Exception e){
					Log.e(TAG, "PlayerWrapper:error:onplay " + m_sPlayerID + ";  e: " + e.getMessage());
				}
			}
		});
	}

	public void play(){
		m_bPlay = true;
		m_bEnded = false;
		play_();
	}
	
	public String getSource(){
		return m_sUrl;
	}
	
	public void hide(){
		SurfaceView surfaceView = player.getSurfaceView();
		if(surfaceView != null){
			player.getSurfaceView().setZOrderOnTop(false);
			player.getSurfaceView().setZOrderMediaOverlay(false);
		}
	}

	public void show(){
		SurfaceView surfaceView = player.getSurfaceView();
		if(surfaceView != null){
			player.getSurfaceView().setZOrderOnTop(true);
			player.getSurfaceView().setZOrderMediaOverlay(true);
		}
	}

	public void close(){
		m_bPlay = false;
		m_sUrl = null;
		m_nPosition = 0;
		hide();
		player.post(new Runnable() {
			@Override
			public void run() {
				try{
					player.Close();
				}catch(Exception e){
					Log.e(TAG, "PlayerWrapper:error:onplay " + m_sPlayerID + ";  e: " + e.getMessage());
				}
			}
		});
	}

	public void execCallback(String name){
		final String cname = name;
		Log.i(TAG, "try execCallback:" + cname + " "  + m_sPlayerID);
		((CloudClientActivity)mContext).runOnUiThread(new Runnable() {
		     @Override
		     public void run() {
		    	try{
		    		try{
		        		Log.i(TAG, "before WebPlayerInterface1:" + cname + " "  + m_sPlayerID);
		        		WebView mWebView2 = (WebView) ((CloudClientActivity)mContext).findViewById(R.id.webView2);
		        		mWebView2.loadUrl("javascript:AndroidRTMPPlayer('" + m_sPlayerID + "')." + cname + "();");
		        		Log.i(TAG, "after WebPlayerInterface1:" + cname + " "  + m_sPlayerID);
		    		}catch(Exception e){
		    			Toast.makeText(mContext, cname + ", Error:" + e.getMessage(), Toast.LENGTH_SHORT).show();
		    		}
				}catch(Exception e){
					Toast.makeText(mContext,"Error on show: " + e.getMessage(), Toast.LENGTH_SHORT).show();
					Log.i(TAG, "Error on show: " + e.getMessage());
				}
		    }
		});
	}
}

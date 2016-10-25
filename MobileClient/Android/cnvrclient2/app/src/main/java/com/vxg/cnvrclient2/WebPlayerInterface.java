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

import com.vxg.cnvrclient2.activities.CloudClientActivity;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

public class WebPlayerInterface {
    private CloudClientActivity mp;
	private String strVolume = null;

	public PlayerWrapper playerLive = null;
	public PlayerWrapper playerPlayback1 = null;
	public PlayerWrapper playerPlayback2 = null;

    public WebPlayerInterface(Context c) {
        mp = (CloudClientActivity)c;
    }

    private PlayerWrapper getPlayerWrapperById(String playerId){
    	if(playerId.equals("live-container")){
    		return playerLive;
    	}else if(playerId.equals("record-container1")){
    		return playerPlayback1;
    	}else if(playerId.equals("record-container2")){
    		return playerPlayback2;    		
    	}
    	return null;
    }

    @JavascriptInterface
    public void pause(String playerId) {
        PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
        playerWrapper.pause();
    }
    
    @JavascriptInterface
    public void play(String playerId) {
    	Log.e("Test", "WebPlayerInterface1:play:playerId " + playerId);
    	PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
    	Log.e("Test", "WebPlayerInterface1:play " + playerWrapper.getSource());
    	playerWrapper.play();
    }

    @JavascriptInterface
    public void dispose(String playerId) {
    	PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
    	playerWrapper.setSource(null);
    	Log.e("Test", "WebPlayerInterface1:dispose:playerId " + playerId);
        Log.e("Test", "WebPlayerInterface1:dispose");
        try{
        	playerWrapper.hide();
        	playerWrapper.close();
	   }catch(Exception e){
		   Log.e("Test", "WebPlayerInterface1:error:onpuse " + playerId + ";  e: " + e.getMessage());
	   }
    }

    @JavascriptInterface
    public void setVolume(String playerId, String vol) {
    	Log.e("Test", "WebPlayerInterface1:setVolume:playerId " + playerId);
        Log.e("Test", "WebPlayerInterface1:setVolume " + vol);
        strVolume = new String(vol);
    }

    @JavascriptInterface
    public String getVolume(String playerId) {
    	Log.e("Test", "WebPlayerInterface1:getVolume:playerId " + playerId);
	    Log.e("Test", "WebPlayerInterface1:getVolume " + strVolume);
        return strVolume;
    }

    @JavascriptInterface
    public void setSource(String playerId, String url) {
    	Log.e("Test", "WebPlayerInterface1:setSource:playerId " + playerId);
	    Log.e("Test", "WebPlayerInterface1:setSource: " + url);
		PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
		playerWrapper.setSource(url);
    }

    @JavascriptInterface
    public String getSource(String playerId) {
    	PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
    	Log.e("Test", "WebPlayerInterface1:getSource:playerId " + playerId);
	    Log.v("Test", "WebPlayerInterface1:getSource: " + playerWrapper.getSource());
        return playerWrapper.getSource();
    }

    @JavascriptInterface
    public int getReadyState(String playerId){
    	// Log.e("Test", "WebPlayerInterface1:getReadyState:playerId " + playerId);
    	// TODO more states
    	PlayerWrapper player = getPlayerWrapperById(playerId);
    	return player.started() ? 4 : 0;
    }

    @JavascriptInterface
    public double getCurrentTime(String playerId) {
    	// in seconds
    	PlayerWrapper player = getPlayerWrapperById(playerId);
    	return player.getCurrentTime();
    }

    @JavascriptInterface
    public void setCurrentTime(String playerId, String val) {
        int newTime = (int)Float.parseFloat(val);
        newTime = newTime*1000;
    	PlayerWrapper playerWrapper = getPlayerWrapperById(playerId);
    	playerWrapper.setCurrentTime(newTime);
    }

    @JavascriptInterface
    public boolean paused(String playerId){
    	PlayerWrapper player = getPlayerWrapperById(playerId);
    	return player.paused();
    }

    @JavascriptInterface
    public void hide(final String playerId){
    	((CloudClientActivity)mp).runOnUiThread(new Runnable() {
		     @Override
		     public void run() {
		    	try{
		    		Log.e("Test", "=hide playerId="+playerId);
		    		// PlayerWrapper player = getPlayerWrapperById(playerId);
		    		// player.m_surfaceView.setLeft(0);
		    		// player.m_surfaceView.setZOrderOnTop(false);
				}catch(Exception e){
					Toast.makeText(mp,"Error on show: " + e.getMessage(), Toast.LENGTH_SHORT).show();
					Log.e("Test", "Error on show: " + e.getMessage());
				}
		    }
		});
    }

    public PlayerWrapper getPlayerLive(){
    	return getPlayerWrapperById("live-container");
    }
    
    public PlayerWrapper getPlayerRecord1(){
    	return getPlayerWrapperById("record-container1");
    }
    
    public PlayerWrapper getPlayerRecord2(){
    	return getPlayerWrapperById("record-container2");
    }
    
    @JavascriptInterface
    public void show(final String playerId){
    	
    	((CloudClientActivity)mp).runOnUiThread(new Runnable() {
		     @Override
		     public void run() {
		    	try{
		    		Log.e("Test", "=show playerId="+playerId);

		    		FrameLayout fl_main = (FrameLayout) mp.findViewById(R.id.playerView1);
		        	if(playerId.equals("live-container")){
		        		FrameLayout fl_player = (FrameLayout) mp.findViewById(R.id.playerViewLive);
		        		fl_main.bringChildToFront(fl_player);
		        	}
		        	
		        	if(playerId.equals("record-container1")){
		        		FrameLayout fl_player = (FrameLayout) mp.findViewById(R.id.playerViewPlayback1);
		        		fl_main.bringChildToFront(fl_player);
		        	}
		        	if(playerId.equals("record-container2")){
		        		FrameLayout fl_player = (FrameLayout) mp.findViewById(R.id.playerViewPlayback2);
		        		fl_main.bringChildToFront(fl_player);
		        	}
		        	
		        	WebView fl_web = (WebView) mp.findViewById(R.id.webView2);
		        	fl_main.bringChildToFront(fl_web);
		    		
		        	if(!playerId.equals("live-container")){
		        		getPlayerLive().hide();
		        	}
		        	if(!playerId.equals("record-container1")){
		        		getPlayerRecord1().hide();
		        	}
		        	if(!playerId.equals("record-container2")){
		        		getPlayerRecord2().hide();
		        	}

		        	PlayerWrapper player = getPlayerWrapperById(playerId);
		        	player.show();
		        	
		        	if(playerId.equals("live-container")){
		        		getPlayerRecord1().getMediaPlayer().Close();
		        		getPlayerRecord2().getMediaPlayer().Close();
		        	}else{
		        		getPlayerLive().getMediaPlayer().Close();
		        	}

				}catch(Exception e){
					Toast.makeText(mp,"Error on show: " + e.getMessage(), Toast.LENGTH_SHORT).show();
					Log.e("Test", "Error on show: " + e.getMessage());
				}
		    }
		});
    }

    @JavascriptInterface
    public void load(String playerId){
    	Log.e("Test", "WebPlayerInterface1:load:playerId " + playerId);
    	// TODO
        return;
    }

	@JavascriptInterface
	public int readyState(String playerId){
		Log.e("Test", "WebPlayerInterface1:readyState:playerId " + playerId);
		// TODO
	    // 4 - ready
	    return 4;
	}

	@JavascriptInterface
	public int getVideoHeight(String playerId){
		PlayerWrapper player = getPlayerWrapperById(playerId);
		return player.getMediaPlayer().getVideoHeight();
	}

	@JavascriptInterface
	public int getVideoWidth(String playerId){
		PlayerWrapper player = getPlayerWrapperById(playerId);
		return player.getMediaPlayer().getVideoWidth();
	}
}

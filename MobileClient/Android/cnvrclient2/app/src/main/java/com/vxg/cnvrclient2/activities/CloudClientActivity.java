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

package com.vxg.cnvrclient2.activities;

import com.vxg.cloud.AccountProvider.AccountProviderAPI;
import com.vxg.cloud.ServiceProvider.ServiceProviderAPI;
import com.vxg.cloud.ServiceProvider.ServiceProviderToken;
import com.vxg.cnvrclient2.ApplicationController;
import com.vxg.cnvrclient2.ApplicationMobileInterface;
import com.vxg.cnvrclient2.PlayerWrapper;
import com.vxg.cnvrclient2.R;
import com.vxg.cnvrclient2.WebPlayerInterface;
import com.vxg.cnvrclient2.objects.WebViewClientImpl;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager.NameNotFoundException;
import android.graphics.Color;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.RelativeLayout;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.prefs.Preferences;

public class CloudClientActivity extends Activity
{
	private final String TAG = "Activity";
	public RelativeLayout main_layout = null;
	private ApplicationMobileInterface appMobileInterface = null;
	public WebPlayerInterface webPlayerInterface = null;
	private ApplicationController controller = ApplicationController.getInstance();
	private boolean mLoginByGoogle = false;
	private boolean mLoginDemo = false;
	private boolean mOpenedGoogleProfile = false;
	private WebView mWebView2 = null;
	/*@Override
	public boolean onOptionsItemSelected(MenuItem item) {
	    switch (item.getItemId()) {
	        case android.R.id.home:
	            onBackPressed();
	            return true;
	    }
	    return false;
	}*/
	public boolean isLoginByGoogle(){
		return mLoginByGoogle;
	}


	public void logoutFromGoogle(){
		runOnUiThread(new Runnable() {
			@Override
			public void run() {
				mWebView2.loadUrl("https://accounts.google.com/Logout");
				mWebView2.setWebViewClient(new WebViewClient() {
					public void onPageFinished(WebView view, String url) {

						finish();
					}
				});
			}
		});
	}

	@Override
	public void onBackPressed() {

		if(mLoginByGoogle && mOpenedGoogleProfile) {
			mOpenedGoogleProfile = false;
			initWebView();
			return;
		}

		//  Toast.makeText(getApplicationContext(),"Back button clicked", Toast.LENGTH_SHORT).show();
		if(appMobileInterface != null){
			appMobileInterface.execCallbackBack();
		}else{
			super.onBackPressed();
		}
	}

    // private Movie mMovie;

    @Override
    public void onCreate(Bundle savedInstanceState) 
	{
		setTitle(R.string.app_name);
		super.onCreate(savedInstanceState);

        // TODO
		// Log.i(TAG, "GCM: open main activity " + getIntent().getStringExtra("gcmmessage"));
        // controller.setGcmLastMessage(getIntent().getStringExtra("gcmmessage"));
		// controller.initGCM(this);

		setContentView(R.layout.main);

        ((FrameLayout) findViewById(R.id.fl_cloudclient_loader)).setVisibility(View.GONE);
        // InputStream is = this.getResources().openRawResource(R.drawable.loader_white_330x28);
        // mMovie = Movie.decodeStream(is);
		Intent intent = getIntent();
		mLoginByGoogle = intent.getBooleanExtra("loginByGoogle", false);
		mLoginDemo = intent.getBooleanExtra("demo", false);
		appMobileInterface = new ApplicationMobileInterface(this);
		webPlayerInterface = new WebPlayerInterface(this);

		webPlayerInterface.playerLive = new PlayerWrapper(this, "live-container", (FrameLayout)findViewById(R.id.playerViewLive));
		webPlayerInterface.playerPlayback1 = new PlayerWrapper(this, "record-container1", (FrameLayout)findViewById(R.id.playerViewPlayback1));
		webPlayerInterface.playerPlayback2 = new PlayerWrapper(this, "record-container2", (FrameLayout)findViewById(R.id.playerViewPlayback2));

		mWebView2 = (WebView) findViewById(R.id.webView2);
		initWebView();
    }

	public String genereateUri(String token, String expire){
		String uri = "";
		String frontend = "http://cnvrclient2.videoexpertsgroup.com/vmanager/index.html"; // release
		// String frontend = "http://10.20.16.87/accpsite/vmanager/"; // debug
		String svcp_host_url = AccountProviderAPI.getInstance().getInfo().getServiceProviderHost();
		if(svcp_host_url == null){
			svcp_host_url = "web.skyvr.videoexpertsgroup.com";
		}
		String svcp_host = "http://" + svcp_host_url + "/";
		ServiceProviderAPI.getInstance().setHost(svcp_host);
		try {
			if(mLoginByGoogle){
				// debug uri
				// uri = "http://ec2-54-173-34-172.compute-1.amazonaws.com/svcauth/init?&src=doc&provider=ST_GOOGLE&vendor=VXG_DEV&redirect=http%3A%2F%2F54.173.34.172%3A12050%2Fvmanager%2F%3Fmobile%3D1";
				// Log.i(TAG, "loginByGoogle: " + mLoginByGoogle);

                // load from config
				SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
                Boolean use_custom = sharedPref.getBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, false);
                String vendor = SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH;
                String provider = SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH;
                if(use_custom){
                    vendor = sharedPref.getString(SettingsActivity.PREF_VENDOR_GOOGLE_AUTH, SettingsActivity.DEFAULT_VENDOR_GOOGLE_AUTH);
                    provider = sharedPref.getString(SettingsActivity.PREF_PROVIDER_GOOGLE_AUTH, SettingsActivity.DEFAULT_PROVIDER_GOOGLE_AUTH);
                }

				// release uri
				String redirect = frontend + "?mobile=&vendor=VXG&fcno=&svcp_host=" + URLEncoder.encode(svcp_host, "utf-8");
				uri = "http://web.skyvr.videoexpertsgroup.com/svcauth/init?&src=doc&provider=" + provider + "&vendor=" + vendor + "&redirect=" + URLEncoder.encode(redirect, "utf-8");
				ServiceProviderAPI.getInstance().setHost("http://web.skyvr.videoexpertsgroup.com/");
			} else if (mLoginDemo){
				uri = frontend + "?mobile=&demo=&vendor=VXG&svcp_host=" + URLEncoder.encode(svcp_host, "utf-8") + "#token=" + token + "&expire=" + expire;
				Log.i(TAG, "Demo login uri:" + uri);
			} else {
				uri = frontend + "?mobile=&vendor=VXG&fcno=&svcp_host=" + URLEncoder.encode(svcp_host, "utf-8") + "#token=" + token + "&expire=" + expire;
			}
		}catch(UnsupportedEncodingException e){
			Log.e(TAG, e.getMessage());
			e.printStackTrace();
		}
		return uri;
	};


	private void initWebView(){
		main_layout = (RelativeLayout) findViewById(R.id.main_view);
		// main_layout.setBackgroundColor(Color.parseColor("#131313"));

		final int sdk = android.os.Build.VERSION.SDK_INT;
		if(sdk < android.os.Build.VERSION_CODES.JELLY_BEAN) {
			main_layout.setBackgroundDrawable( getResources().getDrawable(R.drawable.bg_cnvrclient2) );
		} else {
			main_layout.setBackground( getResources().getDrawable(R.drawable.bg_cnvrclient2) );
		}

		main_layout.setOnTouchListener(new OnTouchListener(){
			public boolean onTouch(View v, MotionEvent event)
			{
				InputMethodManager inputManager = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
				inputManager.hideSoftInputFromWindow(getWindow().getCurrentFocus().getWindowToken(), 0);
				return true;
			}
		});


		mWebView2.setWebChromeClient(new WebChromeClient(){
			public void onConsoleMessage(String message, int lineNumber, String sourceID) {
				Log.v("Test", message + " -- From line "
						+ lineNumber + " of "
						+ sourceID);
			}
		});

		mWebView2.setWebViewClient(new WebViewClientImpl(getApplicationContext(), mLoginByGoogle));

		mWebView2.getSettings().setJavaScriptEnabled(true);
		mWebView2.getSettings().setBuiltInZoomControls(true);
		mWebView2.getSettings().setDomStorageEnabled(true);
		String versionName = "";
		try {
			versionName = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
		} catch (NameNotFoundException e) {
			e.printStackTrace();
		}

		ServiceProviderToken serviceProviderToken = ServiceProviderAPI.getInstance().getToken();
		String token = serviceProviderToken.getToken();
		String expire = serviceProviderToken.getExpire();
		String uri = genereateUri(token, expire);

		Log.i(TAG, "Open uri: " + uri);

		mWebView2.loadUrl(uri);
		mWebView2.addJavascriptInterface(webPlayerInterface, "AndroidWebPlayerInterface");
		mWebView2.addJavascriptInterface(appMobileInterface, "ApplicationMobileInterface");
		mWebView2.clearCache(true);
		mWebView2.setBackgroundColor(Color.TRANSPARENT);
		this.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
	}

  	@Override
	protected void onStart() 
  	{
      	Log.e("SDL", "SDL onStart()");
		super.onStart();
	}

  	@Override
	protected void onStop() 
  	{
  		Log.e("SDL", "SDL onStop()");
		super.onStop();
		/*if (player_live != null)
			player_live.onStop();*/
	}

  	@Override
  	public void onWindowFocusChanged(boolean hasFocus) 
  	{
  		Log.e("SDL", "SDL onWindowFocusChanged(): " + hasFocus);
  		super.onWindowFocusChanged(hasFocus);
  		/*if (player_live != null)
			player_live.onWindowFocusChanged(hasFocus);*/
  	}

	@Override
	protected void onResume()
	{
		Log.e("SDL", "SDL onResume()");
		super.onResume();
		/*if (player_live != null)
			player_live.onResume();*/
		controller.registerReceiver(this);
	}

  	@Override
  	protected void onPause() {
		controller.unregisterReceiver(this);
  	    super.onPause();
  	}
  	
    
  	@Override
  	public void onLowMemory() 
  	{
  		Log.e("SDL", "SDL onLowMemory()");
  		super.onLowMemory();
  		/*if (player_live != null)
			player_live.onLowMemory();*/
  	}

  	@Override
  	protected void onDestroy() 
  	{
  		Log.i("SDL", "SDL onDestroy()");
		/*if (player_live != null)
			player_live.onDestroy();*/
		if(webPlayerInterface != null){
			webPlayerInterface.onDestroy();
		}
        mWebView2.destroy();
		super.onDestroy();
   	}

    public void showUserProfile(){
		if(mLoginByGoogle) {
			mWebView2.loadUrl("https://myaccount.google.com/privacy?pli=1#personalinfo");
			mOpenedGoogleProfile = true;
		}else{
			Intent intent = new Intent(CloudClientActivity.this, UserProfileActivity.class);
			startActivity(intent);
		}
    }
}

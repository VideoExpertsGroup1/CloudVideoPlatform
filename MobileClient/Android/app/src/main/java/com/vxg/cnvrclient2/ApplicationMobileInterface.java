package com.vxg.cnvrclient2;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Build;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import com.vxg.cnvrclient2.activities.CloudClientActivity;
import com.vxg.cnvrclient2.activities.UserProfileActivity;
import com.vxg.cnvrclient2.controllers.LoginController;

public class ApplicationMobileInterface {
    private String TAG = "ApplicationMobileInterface";
	private CloudClientActivity mp;
	private String strNameCallback = "";

	/** Instantiate the interface and set the context */
	public ApplicationMobileInterface(Context c) {
        mp = (CloudClientActivity)c;
    }

    public void execCallbackBack() {
    	if(strNameCallback.length() > 0){
    		WebView mWebView2 = (WebView) this.mp.findViewById(R.id.webView2);
    		mWebView2.loadUrl("javascript:" + this.strNameCallback + "()");
    	}
    }

	@JavascriptInterface
    public void setBackCallback(String funcname) {
		this.strNameCallback = funcname;
    }

	@JavascriptInterface
    public void finish() {
		this.mp.finish();
    }

	@JavascriptInterface
	public void logout() {
        Log.i(TAG, "ApplicationMobileInterface.logout");
        LoginController.inst().updateActivityState(LoginController.LOGIN_START);
		this.mp.finish();
	}

	@JavascriptInterface
    public void toast(String str) {
		Toast.makeText(this.mp, str, Toast.LENGTH_SHORT).show();
    }

	@JavascriptInterface
    public void switchFullscreenMode(String str) {
		// Toast.makeText(this.mp,"switchFullscreenMode " + str, Toast.LENGTH_SHORT).show();

		/*View decorView = this.mp.getWindow().getDecorView();
		// Hide the status bar.
		int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN;
		decorView.setSystemUiVisibility(uiOptions);
		// Remember that you should never show the action bar if the
		// status bar is hidden, so hide that too if necessary.
		ActionBar actionBar = this.mp.getActionBar();
		if(str.equals("no-fullscreen")){
			actionBar.show();
		}else if(str.equals("no-fullscreen")){
			actionBar.hide();
		}*/
	}

	@JavascriptInterface
    public String versionName() {
		String versionName = "";
	    try {
			versionName = this.mp.getPackageManager().getPackageInfo(this.mp.getPackageName(), 0).versionName;
		} catch (NameNotFoundException e) {
			e.printStackTrace();
		}
	    return versionName;
	}

	@JavascriptInterface
	public String getTokenNotifications() {
		return ApplicationController.getInstance().getGCMToken();
	}

	@JavascriptInterface
	public String getPlatform() {
		return "android";
	}

	@JavascriptInterface
	public String getApplicationName() {
		return "VXG Cloud Client 2";
	}

	private String capitalize(String s) {
		if (s == null || s.length() == 0) {
			return "";
		}
		char first = s.charAt(0);
		if (Character.isUpperCase(first)) {
			return s;
		} else {
			return Character.toUpperCase(first) + s.substring(1);
		}
	}

	@JavascriptInterface
	public String getDeviceName() {
		String manufacturer = Build.MANUFACTURER;
		String model = Build.MODEL;
		if (model.startsWith(manufacturer)) {
			return capitalize(model);
		} else {
			return capitalize(manufacturer) + " " + model;
		}
	}

	@JavascriptInterface
	public String getDeviceSecret() {
		return ""; // Need only for ios
	}

	@JavascriptInterface
	public String getApiKey() {
		return "AIzaSyAmj3yWwOM8xF_xgyzV0yu9uzFnK5KzInQ";
	}

	@JavascriptInterface
	public String getGcmLastMessage() {
		return ApplicationController.getInstance().getGcmLastMessage();
	}

	@JavascriptInterface
	public void resetGcmLastMessage() {
		ApplicationController.getInstance().resetGcmLastMessage();
	}

	@JavascriptInterface
	public void seeDemo(String url){
		final String demourl = url;
		((CloudClientActivity)mp).runOnUiThread(new Runnable() {
			@Override
			public void run() {
				try {
					WebView mWebView2 = (WebView) mp.findViewById(R.id.webView2);
					mWebView2.clearCache(true);
					mWebView2.loadUrl(demourl);
				} catch (Exception e) {
					Log.e("Test", "Error on show: " + e.getMessage());
				}
			}
		});
	}

    @JavascriptInterface
    public void showUserProfile() {
        ((CloudClientActivity)mp).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    ((CloudClientActivity)mp).showUserProfile();
                } catch (Exception e) {
                    Log.e("Test", "Error on show: " + e.getMessage());
                }
            }
        });
    }

    @JavascriptInterface
    public void webAppStarted(){
        ((CloudClientActivity)mp).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.i(TAG, "webAppStarted!");
                    ((FrameLayout) ((CloudClientActivity)mp).findViewById(R.id.fl_cloudclient_loader)).setVisibility(View.GONE);
                } catch (Exception e) {
                    Log.e("Test", "Error on webAppStarted: " + e.getMessage());
                }
            }
        });
    }
}

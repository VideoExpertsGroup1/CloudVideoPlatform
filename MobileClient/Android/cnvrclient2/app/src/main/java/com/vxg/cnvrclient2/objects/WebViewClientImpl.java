package com.vxg.cnvrclient2.objects;

import android.content.Context;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.vxg.cnvrclient2.activities.CloudClientActivity;

import java.io.IOException;

public class WebViewClientImpl extends WebViewClient {
    private static String TAG = WebViewClientImpl.class.getSimpleName();
    private Context mContext = null;
    private boolean mLoginByGoogle = false;

    public WebViewClientImpl(Context context, boolean loginByGoogle){
        mContext = context;
        mLoginByGoogle = loginByGoogle;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        Log.v(TAG, "Page loaded");
        // disable 10 minutes
        // view.loadUrl("javascript:setInterval(function(){ try { ifvisible.off('idle'); } catch(e) { console.log('idle off - error'); } }, 2000);");
    }
    @Override
    public WebResourceResponse shouldInterceptRequest (WebView view, WebResourceRequest request){
        if(mLoginByGoogle){
            return null;
        }
        String url = request.getUrl().toString();
        String first_part = "http://cnvrclient2.videoexpertsgroup.com/vmanager/";
        if(url.contains("?")){
            url = url.split("\\?")[0];
        }
        if(url.startsWith(first_part)){
            String mimetype = null;
            if(url.endsWith(".js")) { mimetype = "text/javascript"; }
            if(url.endsWith(".css")) { mimetype = "text/css"; }
            if(url.endsWith(".svg")) { mimetype = "image/svg+xml"; }
            if(url.endsWith(".html")) { mimetype = "text/html"; }

            if(mimetype != null){
                return loadFileAssetFolder("vmanager/" + url.substring(first_part.length()), mimetype);
            }
        }else{
            Log.v(TAG, "shouldInterceptRequest " + request.getUrl().toString());
        }
        return null;
    }

    //return webresourceresponse
    public WebResourceResponse loadFileAssetFolder (String file_url, String mimetype) {
        try {
            Log.i(TAG, "Loaded from assets,  file:" + file_url + ", content-type: " + mimetype);
            return new WebResourceResponse(mimetype, "UTF-8", mContext.getAssets().open(String.valueOf(file_url)));
        } catch (IOException e) {
            e.printStackTrace();
        }

        return null;
    }
}

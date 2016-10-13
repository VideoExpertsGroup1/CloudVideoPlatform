package com.vxg.ServiceProvider;

import android.util.Log;

import com.vxg.cloud.platfrom.client.objects.CameraInfo;
import com.vxg.cloud.platfrom.client.objects.LiveUrls;

import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ServiceProviderAPI {
    private static String TAG = "ServiceProviderAPI";
    private static ServiceProviderAPI mInstance;
    private String mProtocol = "http";
    private String mHost = "";
    private ServiceProviderToken mToken = new ServiceProviderToken();
    private static final int readTimeout = 10000;
    private static final int connectTimeout = 15000;

    public ServiceProviderAPI(){
    }

    private String m_BaseURI = "";
    private String m_TokenURI = "";
    private String m_LoginURI = "";
    private String m_CamerasURI = "";

    private String m_Vendor = "";
    private String m_UAType = "web";
    private String m_Issuer = "";
    private String m_sLastError = "";
    private String m_sHeaderCookie = "";
    private HttpClient httpClient = new DefaultHttpClient();

    public SimpleDateFormat cookieExpired = new SimpleDateFormat( "EEE, d-MMM-yyyy HH:mm:ss z", Locale.US);

    private static ServiceProviderAPI self = null;

    public static ServiceProviderAPI inst(){
        if (null == self){
            self = new ServiceProviderAPI();
        }
        return self;
    }

    public void setServiceProviderToken(ServiceProviderToken token){
        mToken = token;
    }

    public String getBaseURI(){
        return m_BaseURI;
    }

    public void setHost(String protocol, String host){
        mProtocol = protocol;
        mHost = host;
        m_BaseURI = mProtocol + "://" + mHost + "/";
        m_TokenURI = m_BaseURI + "api/v2/account/token/api/";
        m_LoginURI = m_BaseURI + "api/v2/account/login/";
        m_CamerasURI = m_BaseURI + "api/v2/cameras/";
    }

    public ServiceProviderToken getServiceProviderToken(){
        return mToken;
    }

    public void refreshCloudApiToken(){
        if(mToken.isEmpty()){
            return;
        }
        HttpGet httpGet = new HttpGet(m_TokenURI);
        httpGet.setHeader("Authorization", "SkyVR " + mToken.getToken());
        mToken.reset();
        try {
            HttpResponse response = httpClient.execute(httpGet);
            Log.i(TAG, "getStatusLine: " + response.getStatusLine().toString());
            String respJson = EntityUtils.toString(response.getEntity());
            JSONObject resp = new JSONObject(respJson);
            Log.i(TAG, respJson);
            if(response.getStatusLine().getStatusCode() == 401){
                m_sLastError = resp.get("errorDetail").toString();
            }else if(response.getStatusLine().getStatusCode() == 200){
                mToken = new ServiceProviderToken(resp);
            }else{
                m_sLastError = resp.get("errorDetail").toString();
            }
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return;
    }

    public void setOAuth2Vendor(String val){
        m_Vendor = val;
    }

    public void setOAuth2UAtype(String val){
        m_UAType = val;
    }

    public void setOAuth2Issuer(String val){
        m_Issuer = val;
    }

    public void setOAuth2CookieOnOpenidAuthorize(String val){
        m_sHeaderCookie = val;
    }

    public String getLastError(){
        return m_sLastError;
    }

    public List<CameraInfo> getCameras(){
        List<CameraInfo> list = new ArrayList<CameraInfo>();
        if(mToken.isEmpty()){
            return list;
        }
        Log.i(TAG, "m_CamerasURI: " + m_CamerasURI);
        HttpGet httpGet = new HttpGet(m_CamerasURI);
        httpGet.setHeader("Authorization", "SkyVR " + mToken.getToken());
        try {
            // TODO limits
            HttpResponse response = httpClient.execute(httpGet);
            Log.i(TAG, "getStatusLine: " + response.getStatusLine().toString());
            // response.getEntity().
            // Charset.forName("UTF-8").encode(myString)
            String respJson = EntityUtils.toString(response.getEntity(),"UTF-8");
            Log.i(TAG, "respJson: " + respJson);
            Log.i(TAG, respJson);
            JSONObject resp = new JSONObject(respJson);
            if(response.getStatusLine().getStatusCode() == 401){
                m_sLastError = resp.get("errorDetail").toString();
            }else if(response.getStatusLine().getStatusCode() == 200){
                JSONArray cameras = resp.getJSONArray("objects");
                for(int i = 0; i < cameras.length(); i++){
                    JSONObject camJson = cameras.getJSONObject(i);
                    CameraInfo cam = CameraInfo.fromJson(camJson);
                    list.add(cam);
                }
            }else{
                m_sLastError = resp.get("errorDetail").toString();
            }
        } catch (IOException e) {
            e.printStackTrace();
            return list;
        } catch (JSONException e) {
            e.printStackTrace();
            return list;
        }
        return list;
    }

    public LiveUrls getLiveUrls(int cameraid){
        LiveUrls liveUrls = new LiveUrls();
        if(mToken.isEmpty()){
            return liveUrls;
        }
        String liveUrlsURI = m_CamerasURI + Integer.toString(cameraid) + "/live_urls/";
        Log.i(TAG, "liveUrlsURI: " + liveUrlsURI);
        HttpClient httpClient = new DefaultHttpClient();
        HttpGet httpGet = new HttpGet(liveUrlsURI);
        httpGet.setHeader("Authorization", "SkyVR " + mToken.getToken());
        try {
            HttpResponse response = httpClient.execute(httpGet);
            Log.i(TAG, "getStatusLine: " + response.getStatusLine().toString());
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, respJson);
            JSONObject resp = new JSONObject(respJson);
            if(response.getStatusLine().getStatusCode() == 200){
                liveUrls.setDash(resp.getString("dash"));
                liveUrls.setHls(resp.getString("hls"));
                liveUrls.setRtmp(resp.getString("rtmp"));
            }else{
                m_sLastError = resp.get("errorDetail").toString();
            }
        } catch (IOException e) {
            e.printStackTrace();
            return liveUrls;
        } catch (JSONException e) {
            e.printStackTrace();
            return liveUrls;
        }
        return liveUrls;
    }
}

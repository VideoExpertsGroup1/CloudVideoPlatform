package com.vxg.cloud.platfrom.client.api;

import android.util.Log;

import com.vxg.cloud.platfrom.client.objects.CameraInfo;
import com.vxg.cloud.platfrom.client.objects.LiveUrls;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.CookieStore;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.protocol.ClientContext;
import org.apache.http.client.utils.URIUtils;
import org.apache.http.client.utils.URLEncodedUtils;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicCookieStore;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.cookie.BasicClientCookie;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpParams;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HTTP;
import org.apache.http.protocol.HttpContext;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public class VXGCloudPlatform {
    private String TAG = "api.VXGCloudPlatform";
    private String m_BaseURI = "";
    private String m_Host = "auth2-web-1723830871.us-east-1.elb.amazonaws.com";
    private String m_TokenURI = "";
    private String m_LoginURI = "";
    private String m_CamerasURI = "";

    private String m_Vendor = "";
    private String m_UAType = "web";
    private String m_Issuer = "";
    private String m_CloudApiTokenID = "";
    private String m_CloudApiTokenExpire = "";
    private String m_CloudApiTokenType = "";
    private String m_sLastError = "";
    private String m_sHeaderCookie = "";
    private HttpClient httpClient = new DefaultHttpClient();

    public SimpleDateFormat cookieExpired = new SimpleDateFormat( "EEE, d-MMM-yyyy HH:mm:ss z", Locale.US);

    private static VXGCloudPlatform self = null;

    public static VXGCloudPlatform inst(){
        if (null == self){
            self = new VXGCloudPlatform();
        }
        return self;
    }

    public void setCloudApiToken(JSONObject token){
        try {
            m_CloudApiTokenID = token.get("token").toString();
            m_CloudApiTokenExpire = token.get("expire").toString();
            m_CloudApiTokenType = token.get("type").toString();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public String getBaseURI(){
        return m_BaseURI;
    }

    public VXGCloudPlatform(){
        setCloudHostURI("auth2-web-1723830871.us-east-1.elb.amazonaws.com");
    }

    public void setCloudHostURI(String host){
        m_BaseURI = "http://" + host + "/";
        m_Host = host;
        m_TokenURI = m_BaseURI + "api/v2/account/token/api/";
        m_LoginURI = m_BaseURI + "api/v2/account/login/";
        m_CamerasURI = m_BaseURI + "api/v2/cameras/";
    }

    public String getCloudApiTokenID(){
        return m_CloudApiTokenID;
    }
    public String getCloudApiTokenExpire(){
        return m_CloudApiTokenExpire;
    }

    public void refreshCloudApiToken(){
        if(m_CloudApiTokenID.equals("")){
            return;
        }
        HttpGet httpGet = new HttpGet(m_TokenURI);
        httpGet.setHeader("Authorization", "SkyVR " + m_CloudApiTokenID);
        m_CloudApiTokenID = "";
        try {
            HttpResponse response = httpClient.execute(httpGet);
            Log.i(TAG, "getStatusLine: " + response.getStatusLine().toString());
            String respJson = EntityUtils.toString(response.getEntity());
            JSONObject resp = new JSONObject(respJson);
            Log.i(TAG, respJson);
            if(response.getStatusLine().getStatusCode() == 401){
                m_sLastError = resp.get("errorDetail").toString();
            }else if(response.getStatusLine().getStatusCode() == 200){
                setCloudApiToken(resp); // set new token
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
        if(m_CloudApiTokenID.equals("")){
            return list;
        }
        Log.i(TAG, "m_CamerasURI: " + m_CamerasURI);
        HttpGet httpGet = new HttpGet(m_CamerasURI);
        httpGet.setHeader("Authorization", "SkyVR " + m_CloudApiTokenID);
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
        if(m_CloudApiTokenID.equals("")){
            return liveUrls;
        }
        String liveUrlsURI = m_CamerasURI + Integer.toString(cameraid) + "/live_urls/";
        Log.i(TAG, "liveUrlsURI: " + liveUrlsURI);
        HttpClient httpClient = new DefaultHttpClient();
        HttpGet httpGet = new HttpGet(liveUrlsURI);
        httpGet.setHeader("Authorization", "SkyVR " + m_CloudApiTokenID);
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

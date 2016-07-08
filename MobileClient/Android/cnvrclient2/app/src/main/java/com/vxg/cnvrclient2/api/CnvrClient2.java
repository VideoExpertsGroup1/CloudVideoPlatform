package com.vxg.cnvrclient2.api;

import android.util.Log;

import com.vxg.cloud.platfrom.client.api.VXGCloudPlatform;
import com.vxg.cloud.platfrom.client.objects.CameraInfo;
import com.vxg.cnvrclient2.api.objects.UserProfile;

import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.net.HttpURLConnection;

public class CnvrClient2 {
    private String TAG = "api.CnvrClient2";
    private String m_BaseURI = "http://cnvrclient2.videoexpertsgroup.com";
    private String m_sLastError = "";
    private static CnvrClient2 self = null;
    private String svcp_auth_web_url = "";
    private String svcp_auth_app_url = "";
    private HttpClient httpClient = new DefaultHttpClient();

    public static CnvrClient2 getInstance(){
        if (null == self){
            self = new CnvrClient2();
        }
        return self;
    }

    public String getLastError(){
        return m_sLastError;
    }

    public String getApiToken(){
        HttpGet httpGet = new HttpGet(svcp_auth_app_url);
        String cloudApiToken = "";
        try {
            HttpResponse response = httpClient.execute(httpGet);
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, respJson);
            JSONObject resp = new JSONObject(respJson);
            VXGCloudPlatform.inst().setCloudApiToken(resp);
            VXGCloudPlatform.inst().refreshCloudApiToken();
            cloudApiToken = VXGCloudPlatform.inst().getCloudApiTokenID();
        } catch (ClientProtocolException e) {
            // Log exception
            e.printStackTrace();
        } catch (IOException e) {
            // Log exception
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return cloudApiToken;
    }

    public boolean login(String username, String password){
        HttpPost httpPost = new HttpPost(m_BaseURI + "/api/v1/account/login/");

        //Encoding POST data
        try {
            JSONObject params = new JSONObject();
            params.put("username", username);
            params.put("password", password);

            Log.i(TAG, "Post data: " + params.toString());

            StringEntity requestData = new StringEntity(params.toString());
            requestData.setContentType(new BasicHeader(HTTP.CONTENT_TYPE, "application/json"));
            httpPost.setHeader("Accept", "application/json");
            httpPost.setHeader("Content-type", "application/json");

            httpPost.setEntity(requestData);
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            // log exception
            e.printStackTrace();
        }

        boolean bResult = false;
        //making POST request.
        try {
            HttpResponse response = httpClient.execute(httpPost);
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, respJson );
            JSONObject resp = new JSONObject(respJson);

            svcp_auth_web_url = resp.get("svcp_auth_web_url").toString();
            svcp_auth_app_url = resp.get("svcp_auth_app_url").toString();

            URL svcpURL = new URL(svcp_auth_web_url);
            String url = svcpURL.getHost() + (svcpURL.getPort() > 0 ? ":" + svcpURL.getPort() : "");
            VXGCloudPlatform.inst().setCloudHostURI(url);
            String cloudApiToken = getApiToken();

            bResult = true;
        } catch (ClientProtocolException e) {
            // Log exception
            e.printStackTrace();
        } catch (IOException e) {
            // Log exception
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return bResult;
    }

    public boolean registration(String username, String email, String password){
        HttpPost httpPost = new HttpPost(m_BaseURI + "/api/v1/account/register/");
        m_sLastError = "";
        //Encoding POST data
        try {
            JSONObject params = new JSONObject();
            params.put("username", username);
            params.put("email", email);
            params.put("password", password);

            Log.i(TAG, "Post data: " + params.toString());

            StringEntity requestData = new StringEntity(params.toString());
            // requestData.setContentType(new BasicHeader(HTTP.CONTENT_TYPE, "application/json"));
            httpPost.setHeader("Accept", "application/json");
            httpPost.setHeader("Content-type", "application/json");

            httpPost.setEntity(requestData);
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            // log exception
            e.printStackTrace();
        }

        boolean bResult = false;
        //making POST request.
        try {
            HttpResponse response = httpClient.execute(httpPost);
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, "respJson: " + respJson );
            int nStatusCode = response.getStatusLine().getStatusCode();
            Log.i(TAG, "statusCode: " + nStatusCode);
            if(nStatusCode == 200){
                bResult = true;
            }else{
                JSONObject resp = new JSONObject(respJson);
                m_sLastError = resp.getString("errorDetail");
                bResult = false;
            }
        } catch (ClientProtocolException e) {
            // Log exception
            e.printStackTrace();
        } catch (IOException e) {
            // Log exception
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return bResult;
    }

    public JSONObject userProfile() {
        HttpGet httpGet = new HttpGet(m_BaseURI + "/api/v1/account/");
        JSONObject result = new JSONObject();

        try {
            HttpResponse response = httpClient.execute(httpGet);
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, respJson );
            result = new JSONObject(respJson);
        } catch (ClientProtocolException e) {
            // Log exception
            e.printStackTrace();
        } catch (IOException e) {
            // Log exception
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return result;
    }

    public boolean updateUserProfile(UserProfile up){
        HttpPut httpPut = new HttpPut(m_BaseURI + "/api/v1/account/");

        //Encoding POST data
        try {
            JSONObject params = new JSONObject();
            params.put("email", up.getEmail());
            params.put("first_name", up.getFirstName());
            params.put("last_name", up.getLastName());
            params.put("country", up.getCountry());
            params.put("region", up.getRegion());
            params.put("city", up.getCity());
            params.put("address", up.getAddress());
            params.put("postcode", up.getPostcode());
            params.put("phone", up.getPhone());
            params.put("contact_way", up.getContactWay());

            Log.i(TAG, "Post data: " + params.toString());

            StringEntity requestData = new StringEntity(params.toString());
            httpPut.setHeader("Accept", "application/json");
            httpPut.setHeader("Content-type", "application/json");

            httpPut.setEntity(requestData);
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (UnsupportedEncodingException e) {
            // log exception
            e.printStackTrace();
        }

        boolean bResult = false;
        //making PUT request.
        try {
            HttpResponse response = httpClient.execute(httpPut);
            String respJson = EntityUtils.toString(response.getEntity());
            Log.i(TAG, "respJson: " + respJson);
            bResult = true;
        } catch (ClientProtocolException e) {
            // Log exception
            e.printStackTrace();
        } catch (IOException e) {
            // Log exception
            e.printStackTrace();
        }
        return bResult;
    }
}

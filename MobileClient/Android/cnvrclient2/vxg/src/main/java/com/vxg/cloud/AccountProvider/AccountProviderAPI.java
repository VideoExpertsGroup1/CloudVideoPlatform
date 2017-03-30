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

package com.vxg.cloud.AccountProvider;

import android.util.Log;
import android.util.Pair;

import com.vxg.cloud.ServiceProvider.ServiceProviderRegToken;
import com.vxg.cloud.ServiceProvider.ServiceProviderToken;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.Map;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

public class AccountProviderAPI {
    private static String TAG = AccountProviderAPI.class.getSimpleName();

    // default configuration you can change in you application
    public static String COOKIE_NAME = "sessionid";
    private static AccountProviderAPI mInstance = null;
    private AccountProviderInfo mInfo = new AccountProviderInfo();
    private static final int readTimeout = 10000;
    private static final int connectTimeout = 15000;
    private SSLContext mSslContext = null;

    public static String HOST = "cnvrclient2.videoexpertsgroup.com";
    public static String PROTOCOL = "http";
    public static int PORT = 80;


    private AccountProviderAPI() {

        // Create an SSLContext that uses our TrustManager
        try {

            String keyStoreType = KeyStore.getDefaultType();
            KeyStore keyStore = KeyStore.getInstance(keyStoreType);
            keyStore.load(null, null);
            TrustManager[] wrappedTrustManagers = new TrustManager[]{
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return null;
                        }

                        public void checkClientTrusted(X509Certificate[] certs, String authType) {
                            // nothing
                        }

                        public void checkServerTrusted(X509Certificate[] certs, String authType) {
                            // nothing
                        }
                    }
            };

            mSslContext = SSLContext.getInstance("TLS");
            mSslContext.init(null, wrappedTrustManagers, null);
            HttpsURLConnection.setDefaultSSLSocketFactory(mSslContext.getSocketFactory());
        }catch(NoSuchAlgorithmException e){
            Log.i(TAG, "NoSuchAlgorithmException " + e.getMessage());
            e.printStackTrace();
        }catch(KeyManagementException e){
            Log.i(TAG, "KeyManagementException " + e.getMessage());
            e.printStackTrace();
        }catch(CertificateException e){
            Log.i(TAG, "CertificateException " + e.getMessage());
            e.printStackTrace();
        }catch(KeyStoreException e){
            Log.i(TAG, "KeyStoreException " + e.getMessage());
            e.printStackTrace();
        }catch(IOException e){
            Log.i(TAG, "IOException " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static AccountProviderAPI getInstance() {
        if ( mInstance == null){
            mInstance = new AccountProviderAPI();
        }
        return mInstance;
    }

    private URL getURLByEndPoint(String endPoint) {
        try{
            return new URL(AccountProviderAPI.PROTOCOL + "://" + AccountProviderAPI.HOST + ":" + AccountProviderAPI.PORT + endPoint);
        } catch (MalformedURLException e) {
            Log.e(TAG, "getURLByEndPoint() " + e.getMessage());
            return null;
        }
    }

    public AccountProviderInfo getInfo(){
        return mInfo;
    }

    public void setInfo(AccountProviderInfo info){
        mInfo = info;
    }

    public AccountProviderLoginResult demo_login() {
        mInfo = new AccountProviderInfo("demo");

        JSONObject response = null;
        try {
            JSONObject data = new JSONObject();
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_DEMO_LOGIN(), data);
            if(resp.first == 200){
                response = new JSONObject(resp.second);
            }
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, ex.getMessage());
                    return new AccountProviderLoginResult(false);
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "login wrong json");
            e.printStackTrace();
        }

        if(response != null && !hasError(response)){
            if(response.has("svcp_auth_app_url")){
                try {
                    mInfo.setServiceProviderAuthAppUrl(response.getString("svcp_auth_app_url"));
                    URL svcp_auth_app_url = new URL(mInfo.getServiceProviderAuthAppUrl());
                    mInfo.setServiceProviderHost(svcp_auth_app_url.getHost());
                    return new AccountProviderLoginResult(true);
                } catch (MalformedURLException e){
                    Log.e(TAG, "Wrong url " + e.getMessage());
                } catch (JSONException e) {
                    Log.e(TAG, "Wrong json " + e.getMessage());
                }
            }
        }
        return new AccountProviderLoginResult(false);
    }

    public AccountProviderLoginResult login(String username, String password) {
        mInfo = new AccountProviderInfo(username);

        JSONObject response = null;
        try {
            JSONObject data = new JSONObject();
            data.put("username", username);
            data.put("password", password);
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_LOGIN(), data);
            // if(resp.first == 200){
            response = new JSONObject(resp.second);
            // }
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, "Error auth " + ex.getMessage());
                    return new AccountProviderLoginResult(401, "Invalid login or password");
                }else {
                    return new AccountProviderLoginResult(400, ex.getMessage());
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "login wrong json");
            e.printStackTrace();
        }

        if(response != null){
            if(hasError(response)) {
                return new AccountProviderLoginResult(false);
            }else{
                if(response.has("svcp_auth_app_url")){
                    try {
                        mInfo.setServiceProviderAuthAppUrl(response.getString("svcp_auth_app_url"));
                        URL svcp_auth_app_url = new URL(mInfo.getServiceProviderAuthAppUrl());
                        mInfo.setServiceProviderHost(svcp_auth_app_url.getHost());
                        return new AccountProviderLoginResult(true);
                    } catch (MalformedURLException e){
                        Log.e(TAG, "Wrong url " + e.getMessage());
                    } catch (JSONException e) {
                        Log.e(TAG, "Wrong json " + e.getMessage());
                    }
                }
            }
        }
        return new AccountProviderLoginResult(false);
    }

    public void logout(){
        JSONObject response = null;
        try {
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_LOGOUT(), null);
            if(resp.first != 200){
                Log.e(TAG, "Failed logout Error " + resp.first + ", resp: " + resp.second);
            }
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, ex.getMessage());
                }
            }
        }
    }

    public ServiceProviderRegToken createRegToken(String uuid){
        ServiceProviderRegToken regToken = null;
        try {
            JSONObject data = new JSONObject();
            data.put("uuid", uuid);
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.REG_TOKENS(), data);
            Log.i(TAG, "createRegToken, resp = " + resp.second);
            if(resp.second.isEmpty()){
                return null;
            }
            JSONObject response = new JSONObject(resp.second);
            regToken = new ServiceProviderRegToken(response);
        } catch (IOException e) {
            if (e.getMessage() != null) {
                if (e.getMessage().equals("invalid_auth 401") || e.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, e.getMessage());
                    return regToken;
                }
            }
            Log.e(TAG, e.getMessage());
            e.printStackTrace();
            return null;
        } catch (JSONException e) {
            Log.e(TAG, "createRegToken wrong json");
            e.printStackTrace();
            return null;
        }
        return regToken;
    }

    public ServiceProviderToken getServiceProviderToken(){
        ServiceProviderToken serviceProviderToken = new ServiceProviderToken();
        try {
            String resp_json = executeGetRequestWithRedirects(mInfo.getServiceProviderAuthAppUrl());
            JSONObject api_token_json = null;
            api_token_json = new JSONObject(resp_json);
            if(api_token_json == null) {
                return serviceProviderToken;
            }
            if(hasError(api_token_json)){
                Log.e(TAG, "Failed authorization: " + api_token_json.toString());
                return serviceProviderToken;
            }

             Log.d(TAG, api_token_json.toString());
             serviceProviderToken = new ServiceProviderToken(api_token_json);
        }catch(JSONException e){
            Log.e(TAG, "getServiceProviderToken, invalid json");
        }catch(IOException e){
            Log.e(TAG, "getServiceProviderToken, somthing wrong");
        }

        return serviceProviderToken;
    }

    private boolean hasError(JSONObject response) {
        return response != null && response.has("errorType");
    }

    public AccountProviderUserRegistrationResult registration(AccountProviderUserRegistrationInfo info){
        JSONObject response = null;
        String message = "";
        int codeResponse = 0;
        try {
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_REGISTER(), info.toJSONObject());
            Log.i(TAG, "Register1: " + resp.first);
            Log.i(TAG, "Register2: " + resp.second);
            if(!resp.second.isEmpty()){
                response = new JSONObject(resp.second);
                return new AccountProviderUserRegistrationResult(response);
            }
            codeResponse = resp.first;
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, ex.getMessage());
                    return new AccountProviderUserRegistrationResult(401, "Unauthorized request");
                }else{
                    return new AccountProviderUserRegistrationResult(400, ex.getMessage());
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "Wrong json");
            e.printStackTrace();
            return new AccountProviderUserRegistrationResult(500, "Wrong json");
        }
        if(codeResponse == 200) {
            return new AccountProviderUserRegistrationResult(true);
        }
        return new AccountProviderUserRegistrationResult(500, "Wrong request");
    }

    public AccountProviderUserProfile userProfile() {
        JSONObject json = null;
        try {
            Pair<Integer, String> resp = executeGetRequest(AccountProviderEndPoints.ACCOUNT());
            if(resp.first != 200) {
                return null;
            }
            json = new JSONObject(resp.second);
            if(hasError(json)){
                Log.e(TAG, "Failed request: " + json.toString(1));
                return null;
            }
        }catch(JSONException e){
            Log.e(TAG, "userProfile, invalid json");
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "userProfile, error: " + e.getMessage());
            e.printStackTrace();
        }
        return new AccountProviderUserProfile(json);
    }

    public boolean updateUserProfile(AccountProviderUserProfile up){
        boolean bResult = false;
        try {
            JSONObject data = up.toJson();
            Pair<Integer, String> resp = executePutRequest(AccountProviderEndPoints.ACCOUNT(), data);
            Log.e(TAG, "updateUserProfile, " + resp.second);
            Log.e(TAG, "updateUserProfile, " + resp.first);

            if(resp.first == 200){
                bResult = true;
            }
        }catch(IOException e){
            Log.e(TAG, "updateUserProfile, error: " + e.getMessage());
            e.printStackTrace();
        }
        return bResult;
    }

    private Pair<Integer,String> executeGetRequest(String endpoint) throws IOException {
        URL uri = getURLByEndPoint(endpoint);
        Log.i(TAG, "executeGetRequest " + uri.toString());

        HttpURLConnection urlConnection = (HttpURLConnection) uri.openConnection();
        urlConnection.setRequestMethod("GET");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setDoOutput(false);
        urlConnection.setUseCaches(false);
        // urlConnection.setRequestProperty("Content-type", "application/json");
        if(mInfo.getAccountProviderSessionID() != null){
            urlConnection.setRequestProperty("Cookie", AccountProviderAPI.COOKIE_NAME + "=" + mInfo.getAccountProviderSessionID() + ";");
        }

        StringBuilder buffer = new StringBuilder();

        Log.d(TAG, "GET ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + uri);
        if (urlConnection.getResponseCode() == 401) {
            throw new IOException("invalid_auth 401");
        }

        readCookie(urlConnection);

        int codeResponse = urlConnection.getResponseCode();
        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return new Pair<>(codeResponse, buffer.toString());
    }

    private Pair<Integer,String> executePutRequest(String endpoint, JSONObject data) throws IOException {
        URL uri = getURLByEndPoint(endpoint);
        Log.i(TAG, "executePutRequest " + uri.toString());

        HttpURLConnection urlConnection = (HttpURLConnection) uri.openConnection();
        urlConnection.setRequestMethod("PUT");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);
        urlConnection.setRequestProperty("Content-type", "application/json");
        if(mInfo.getAccountProviderSessionID() != null){
            urlConnection.setRequestProperty("Cookie", AccountProviderAPI.COOKIE_NAME + "=" + mInfo.getAccountProviderSessionID() + ";");
        }

        if (data != null) {
            urlConnection.setDoOutput(true);
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            wr.write(data.toString());
            wr.flush();
            wr.close();
        } else {
            urlConnection.setDoOutput(false);
        }

        StringBuilder buffer = new StringBuilder();

        Log.d(TAG, "PUT ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + uri);
        if (urlConnection.getResponseCode() == 401) {
            throw new IOException("invalid_auth 401");
        }

        readCookie(urlConnection);

        int codeResponse = urlConnection.getResponseCode();
        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return new Pair<>(codeResponse, buffer.toString());
    }

    private Pair<Integer,String> executePostRequest(String endpoint, JSONObject data) throws IOException {
        URL uri = getURLByEndPoint(endpoint);
        Log.i(TAG, "executePostRequest " + uri.toString());

        HttpURLConnection urlConnection = (HttpURLConnection) uri.openConnection();
        urlConnection.setRequestMethod("POST");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);
        urlConnection.setRequestProperty("Content-type", "application/json");
        if(mInfo.getAccountProviderSessionID() != null){
            urlConnection.setRequestProperty("Cookie", AccountProviderAPI.COOKIE_NAME + "=" + mInfo.getAccountProviderSessionID() + ";");
        }

        if (data != null) {
            urlConnection.setDoOutput(true);
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            wr.write(data.toString());
            wr.flush();
            wr.close();
        } else {
            urlConnection.setDoOutput(false);
        }

        StringBuilder buffer = new StringBuilder();

        Log.d(TAG, "POST ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + uri);
        if (urlConnection.getResponseCode() == 401) {
            throw new IOException("invalid_auth 401");
        }

        readCookie(urlConnection);

        int codeResponse = urlConnection.getResponseCode();
        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return new Pair<>(codeResponse, buffer.toString());
    }

    private void readCookie(HttpURLConnection urlConnection) {
        Map<String, List<String>> headerFields = urlConnection.getHeaderFields();
        List<String> cookiesHeader = headerFields.get("Set-Cookie");

        if(cookiesHeader != null){
            for (String cookie : cookiesHeader) {
                List<HttpCookie> cookies;
                try {
                    cookies = HttpCookie.parse(cookie);
                } catch (NullPointerException e) {
                    Log.e(TAG, "Wrong cookie string " + cookie);
                    //ignore the Null cookie header and proceed to the next cookie header
                    continue;
                }
                HttpCookie c = cookies.get(0);
                if(c.getName().equals(AccountProviderAPI.COOKIE_NAME)) {
                    Log.i(TAG, "Cookie keep OK");
                    mInfo.setAccountProviderSessionID(c.getValue());
                }else{
                    Log.i(TAG, "skipped cookie: " + cookie);
                }
            }
        }
    }

    private HostnameVerifier getHostnameVerifier(){
        return new HostnameVerifier() {
            @Override
            public boolean verify(String hostname, SSLSession session) {
                // HostnameVerifier hv = HttpsURLConnection.getDefaultHostnameVerifier();
                // return hv.verify("example.com", session);
                Log.i(TAG, "hostname: " + hostname);
                return true;
            }
        };
    }

    private String executeGetRequestWithRedirects(String svcp_auth_app_url) throws IOException {
        URL url = new URL(svcp_auth_app_url);
        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setRequestMethod("GET");
        urlConnection.setInstanceFollowRedirects(false);

        StringBuffer buffer = new StringBuffer();
        int code_response = urlConnection.getResponseCode();

        if (code_response == 302) {
            String newUrl = urlConnection.getHeaderField("Location");
            String cookies = urlConnection.getHeaderField("Set-Cookie");
            Log.v(TAG, "302 newUrl (1):  " + newUrl);
            String protocol = new URL(newUrl).getProtocol();
            if(protocol.equals("https")) {
                URL url2 = new URL(newUrl);
                HttpsURLConnection urlConnection2 = (HttpsURLConnection) url2.openConnection();
                urlConnection2.setHostnameVerifier(getHostnameVerifier());
                urlConnection2.setReadTimeout(readTimeout);
                urlConnection2.setConnectTimeout(connectTimeout);
                urlConnection2.setRequestMethod("GET");
                urlConnection2.setInstanceFollowRedirects(false);
                urlConnection2.setRequestProperty("Content-type", "application/json");
                urlConnection2.setRequestProperty("Cookie", AccountProviderAPI.COOKIE_NAME + "=" + mInfo.getAccountProviderSessionID() + ";");

                code_response = urlConnection2.getResponseCode();
                if (code_response == 302) {
                    newUrl = urlConnection2.getHeaderField("Location");
                    Log.v(TAG, "302 newUrl (2):  " + newUrl);

                    URL url3 = new URL(newUrl);
                    urlConnection = (HttpURLConnection) new URL(newUrl).openConnection();
                    urlConnection.setReadTimeout(readTimeout);
                    urlConnection.setConnectTimeout(connectTimeout);
                    urlConnection.setRequestMethod("GET");
                    urlConnection.setInstanceFollowRedirects(false);
                    urlConnection.setRequestProperty("Cookie", cookies);
                }

                code_response = urlConnection.getResponseCode();
                Log.d(TAG, "code_response " + code_response + " For URL: " + urlConnection.getURL());
            } else if(protocol.equals("http")) {
                URL url2 = new URL(newUrl);
                HttpURLConnection urlConnection2 = (HttpURLConnection) url2.openConnection();
                urlConnection2.setReadTimeout(readTimeout);
                urlConnection2.setConnectTimeout(connectTimeout);
                urlConnection2.setRequestMethod("GET");
                urlConnection2.setInstanceFollowRedirects(false);
                urlConnection2.setRequestProperty("Content-type", "application/json");
                urlConnection2.setRequestProperty("Cookie", AccountProviderAPI.COOKIE_NAME + "=" + mInfo.getAccountProviderSessionID() + ";");

                code_response = urlConnection2.getResponseCode();
                if (code_response == 302) {
                    newUrl = urlConnection2.getHeaderField("Location");
                    Log.v(TAG, "302 newUrl (2):  " + newUrl);

                    URL url3 = new URL(newUrl);
                    urlConnection = (HttpURLConnection) new URL(newUrl).openConnection();
                    urlConnection.setReadTimeout(readTimeout);
                    urlConnection.setConnectTimeout(connectTimeout);
                    urlConnection.setRequestMethod("GET");
                    urlConnection.setInstanceFollowRedirects(false);
                    urlConnection.setRequestProperty("Cookie", cookies);
                }

                code_response = urlConnection.getResponseCode();
                Log.d(TAG, "code_response " + code_response + " For URL: " + urlConnection.getURL());
            }
        }

        int codeResponse = urlConnection.getResponseCode();
        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return buffer.toString();
    }
}

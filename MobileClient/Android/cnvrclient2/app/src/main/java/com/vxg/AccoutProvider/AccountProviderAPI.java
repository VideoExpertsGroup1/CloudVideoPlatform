package com.vxg.AccoutProvider;

import android.util.Log;
import android.util.Pair;

import com.vxg.ServiceProvider.ServiceProviderToken;
import com.vxg.ServiceProvider.ServiceProviderAPI;

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
    private String TAG = "AccountProviderAPI";
    public static String COOKIE_NAME = "sessionid";
    private static AccountProviderAPI mInstance = null;
    private AccountProviderInfo mInfo = new AccountProviderInfo();
    private static final int readTimeout = 10000;
    private static final int connectTimeout = 15000;
    private SSLContext mSslContext = null;


    public static final String HOST = "cnvrclient2.videoexpertsgroup.com";
    public static final String PROTOCOL = "http";
    public static final int PORT = 80;
    private String m_sLastError = "";


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

    public static AccountProviderAPI getInstance(){
        if (null == mInstance){
            mInstance = new AccountProviderAPI();
        }
        return mInstance;
    }

    public String getLastError(){
        return m_sLastError;
    }

    private URL getURLByEndPoint(String endPoint) {
        try{
            return new URL(AccountProviderAPI.PROTOCOL + "://" + AccountProviderAPI.HOST + ":" + AccountProviderAPI.PORT + endPoint);
        } catch (MalformedURLException e) {
            Log.e(TAG, "getURLByEndPoint() " + e.getMessage());
            return null;
        }
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
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "getServiceProviderToken, error: " + e.getMessage());
            e.printStackTrace();
        }

        return serviceProviderToken;
    }

    public boolean login(String username, String password) {
        mInfo = new AccountProviderInfo(username);

        JSONObject response = null;
        try {
            JSONObject data = new JSONObject();
            data.put("username", username);
            data.put("password", password);
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_LOGIN(), data);
            if(!resp.second.isEmpty()){
                response = new JSONObject(resp.second);
            }
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, ex.getMessage());
                    return false;
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

                    // local implementation
                    ServiceProviderAPI.inst().setHost(svcp_auth_app_url.getProtocol(), svcp_auth_app_url.getHost());
                    // TODO
                    // String cloudApiToken = getApiToken();
                    return true;
                } catch (MalformedURLException e){
                    Log.e(TAG, "MalformedURLException " + e.getMessage());
                } catch (JSONException e) {
                    Log.e(TAG, "Wrong json " + e.getMessage());
                }
            }
        }
        return false;
    }

    public boolean registration(String username, String email, String password){
        JSONObject response = null;
        String message = "";
        int codeResponse = 0;
        try {
            JSONObject data = new JSONObject();
            data.put("username", username);
            data.put("email", email);
            data.put("password", password);
            Pair<Integer, String> resp = executePostRequest(AccountProviderEndPoints.ACCOUNT_REGISTER(), data);
            Log.i(TAG, "Register: " + resp);
            if(!resp.second.isEmpty()){
                response = new JSONObject(resp.second);
            }
            codeResponse = resp.first;
        } catch (IOException ex) {
            if (ex.getMessage() != null) {
                if (ex.getMessage().equals("invalid_auth 401") || ex.getMessage().equals("No authentication challenges found")) {
                    Log.e(TAG, ex.getMessage());
                    return false;
                }
            }
        } catch (JSONException e) {
            Log.e(TAG, "login wrong json");
            e.printStackTrace();
        }

        if(codeResponse == 200) {
            return true;
        }
        return false;
    }

    public JSONObject userProfile() {
        JSONObject json = null;
        try {
            Pair<Integer, String> resp = executeGetRequest(AccountProviderEndPoints.ACCOUNT());
            json = new JSONObject(resp.second);
            if(json == null) {
                return null;
            }
            if(hasError(json)){
                Log.e(TAG, "Failed request: " + json.toString(1));
                return null;
            }
            Log.e(TAG, "userProfile, " + json.toString(1));
        }catch(JSONException e){
            Log.e(TAG, "userProfile, invalid json");
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "userProfile, error: " + e.getMessage());
            e.printStackTrace();
        }
        return json;
    }

    public boolean updateUserProfile(AccountProviderUserProfile up){
        boolean bResult = false;
        try {
            JSONObject data = new JSONObject();
            data.put("email", up.getEmail());
            data.put("first_name", up.getFirstName());
            data.put("last_name", up.getLastName());
            data.put("country", up.getCountry());
            data.put("region", up.getRegion());
            data.put("city", up.getCity());
            data.put("address", up.getAddress());
            data.put("postcode", up.getPostcode());
            data.put("phone", up.getPhone());
            data.put("contact_way", up.getContactWay());

            Pair<Integer, String> resp = executePutRequest(AccountProviderEndPoints.ACCOUNT(), data);
            Log.e(TAG, "updateUserProfile, " + resp.second);
            Log.e(TAG, "updateUserProfile, " + resp.first);

            if(resp.first == 200){
                bResult = true;
            }
        }catch(JSONException e){
            Log.e(TAG, "updateUserProfile, invalid json");
            e.printStackTrace();
        }catch(IOException e){
            Log.e(TAG, "updateUserProfile, error: " + e.getMessage());
            e.printStackTrace();
        }
        return bResult;
    }

    private boolean hasError(JSONObject response) {
        return response != null && response.has("errorType");
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

    private void readCookie(HttpURLConnection urlConnection) {
        CookieManager msCookieManager = new CookieManager();

        Map<String, List<String>> headerFields = urlConnection.getHeaderFields();
        List<String> cookiesHeader = headerFields.get("Set-Cookie");

        if(cookiesHeader != null){
            for (String cookie : cookiesHeader) {
                msCookieManager.getCookieStore().add(null, HttpCookie.parse(cookie).get(0));
            }
        }

        if(msCookieManager.getCookieStore().getCookies().size() > 0)
        {
            List<HttpCookie> cookies = msCookieManager.getCookieStore().getCookies();
            for (HttpCookie cookie : cookies) {
                Log.i(TAG, "Cookie " + cookie.getName() + "=" + cookie.getValue());
                if(cookie.getName().equals(AccountProviderAPI.COOKIE_NAME)){
                    mInfo.setAccountProviderSessionID(cookie.getValue());
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

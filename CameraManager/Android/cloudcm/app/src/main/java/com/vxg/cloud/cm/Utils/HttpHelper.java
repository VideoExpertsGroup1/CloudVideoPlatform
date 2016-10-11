package com.vxg.cloud.cm.Utils;

import android.util.Log;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;

public class HttpHelper {
    private static final String TAG = "HttpHelper";

    public static final String HTTP_EXCEPTION_INVALID_AUTH = "invalid_auth 401";

    private static final int readTimeout = 10_000;
    private static final int connectTimeout = 15_000;

    private static JsonHelper cookie;

    public static String executeGetRequest(URL url, String[] header) throws IOException {
        //HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setRequestMethod("GET");

        if (header != null) {
            int i = 0;
            while ( i + 1 < header.length) {
                urlConnection.setRequestProperty(header[i], header[i+1]);
                i += 2;
            }
        }

        StringBuffer buffer = new StringBuffer();
        int code_response = urlConnection.getResponseCode();
        Log.d(TAG, "Get ResponseCode: " + code_response + " for URL: " + url);

        readCookie(urlConnection);

        boolean isError = code_response >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return buffer.toString();
    }

    public static String executePostRequest(URL url, String[] header, String body) throws IOException {
        //HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setRequestMethod("POST");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);

        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);
        if (header != null) {
            int i = 0;
            while ( i + 1 < header.length) {
                urlConnection.setRequestProperty(header[i], header[i+1]);
                i += 2;
            }
        }

        if (body != null) {
            urlConnection.setDoOutput(true);
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            wr.write(body);
            wr.flush();
            wr.close();
        }
        else
            urlConnection.setDoOutput(false);

        StringBuffer buffer = new StringBuffer();

        Log.d(TAG, "POST ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + url);
        if (urlConnection.getResponseCode() == 401) {
            throw new IOException(HTTP_EXCEPTION_INVALID_AUTH);
        }

        readCookie(urlConnection);

        boolean isError = urlConnection.getResponseCode() >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }


        return buffer.toString();
    }

    public static String executeGetRequestWithRedirects(URL url, String[] header) throws IOException {
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
            Log.v(TAG, "302 newUrl:  " + newUrl);

            urlConnection = (HttpURLConnection) new URL(newUrl).openConnection();
            urlConnection.setReadTimeout(readTimeout);
            urlConnection.setConnectTimeout(connectTimeout);
            urlConnection.setRequestMethod("GET");
            urlConnection.setInstanceFollowRedirects(false);

            if (header != null) {
                int i = 0;
                while ( i + 1 < header.length) {
                    urlConnection.setRequestProperty(header[i], header[i+1]);
                    i += 2;
                }
            }

            code_response = urlConnection.getResponseCode();
            if (code_response == 302) {
                newUrl = urlConnection.getHeaderField("Location");
                Log.v(TAG, "302 newUrl:  " + newUrl);

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


        readCookie(urlConnection);

        boolean isError = urlConnection.getResponseCode() >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }

        return buffer.toString();
    }

    public static JsonHelper getLastCookie() {
        return cookie;
    }
    public static String getFromLastCookie(String name) {
        if ( cookie != null) {
            return cookie.getString(name);
        }
        else
            return null;
    }

    private static void readCookie(HttpURLConnection urlConnection) {
        cookie = new JsonHelper();
        CookieManager msCookieManager = new java.net.CookieManager();

        Map<String, List<String>> headerFields = urlConnection.getHeaderFields();
        List<String> cookiesHeader = headerFields.get("Set-Cookie");

        if(cookiesHeader != null)
        {
            for (String cookie : cookiesHeader)
            {
                msCookieManager.getCookieStore().add(null, HttpCookie.parse(cookie).get(0));
            }
        }

        if(msCookieManager.getCookieStore().getCookies().size() > 0)
        {
            List<HttpCookie> cookies = msCookieManager.getCookieStore().getCookies();
            for (HttpCookie coo : cookies) {
                cookie.put(
                        new Object[]{
                                coo.getName(),
                                coo.getValue()
                        }
                );
            }
        }
    }
}
package com.vxg.cloud.cm;

import android.content.Context;
import android.os.AsyncTask;
import android.os.Handler;
import android.util.Log;

import com.vxg.cloud.cm.Objects.AccountConfiguration;
import com.vxg.cloud.cm.Utils.HttpHelper;
import com.vxg.cloud.cm.Utils.JsonHelper;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.TimeZone;

public class WebAPI {
    private final String TAG = "WebAPI";

    private String accp_host = "cnvrclient2.videoexpertsgroup.com";
    private int accp_port = 80;

    private String svcp_host;
    private String protocol = "http";

    private final String END_POINT_LOGIN = "/api/v1/account/login/";
    private final String END_POINT_LOGOUT = "/api/v1/account/logout/";
    private final String END_POINT_CREATE_REG_TOKENS = "/api/v1/reg_tokens/";

    private final String SVCP_END_POINT_CAMERAS = "/api/v2/cameras/";
    private final String SVCP_END_POINT_LOGOUT = "/api/v2/account/logout/";
    private final String SVCP_END_POINT_API_TOKEN = "/api/v2/account/token/api/";

    private String reg_token;
    private String accp_sessionid;
    private String svcp_api_token;

    private Handler handler;
    private Context context;
    private Runnable startRefreshToken;


    public WebAPI(Handler handler, Context context) {
        this.handler = handler;
        this.context = context;

        startRefreshToken = new Runnable() {
            @Override
            public void run() {
                refreshToken();
            }
        };
    }



    public boolean login(String username, String password) throws IOException {
        String resp_json;
        try {
            resp_json = HttpHelper.executePostRequest(
                    getURLforEndPoint(END_POINT_LOGIN, true),
                    getHeader(),
                    JsonHelper.toJsonString(
                            new String[]{"username", username},
                            new String[]{"password", password}
                    )
            );
        } catch (IOException ex) {
            if (ex.getMessage().equals(HttpHelper.HTTP_EXCEPTION_INVALID_AUTH) || ex.getMessage().equals("No authentication challenges found")) {
                Log.e(TAG, ex.getMessage());
                return false;
            }
            else
                throw ex;
        }

        int y=0;

        JsonHelper json = new JsonHelper(resp_json);
        if (!json.hasErrors()) {
            accp_sessionid = HttpHelper.getFromLastCookie("sessionid");
            URL svcp_auth_app_url = getURL(json.getString("svcp_auth_app_url"));
            svcp_host = svcp_auth_app_url.getHost();

//            resp_json = HttpHelper.executeGetRequestWithRedirects(
//                    svcp_auth_app_url,
//                    getACCPHeader(accp_sessionid)
//            );
        } else {
            Log.e(TAG, json.getErrorDetail());
            return false;
        }

//        JsonHelper api_token_json = new JsonHelper(resp_json);
//        if (!json.hasErrors()) {
//            svcp_api_token = api_token_json.getString("token");
//            handler.postDelayed(
//                    startRefreshToken,
//                    getApiTokenUpdateDelta(api_token_json.getString("expire"))
//            );
//        }
//        else {
//            Log.e(TAG, api_token_json.getErrorDetail());
//            return false;
//        }






        AccountConfiguration configuration = AccountConfiguration.getInstance(context);
        if (configuration.isRegistered() && !configuration.isNewUser(username)) {
            configuration.putBool(AccountConfiguration.WAS_LOGOUT, false);
            configuration.clearValue(AccountConfiguration.REG_TOKEN);

            return true;
        }
        else if ((reg_token = createRegToken()) != null) {
            Log.d(TAG, "reg_token" + reg_token);

            configuration.initConfig(username, password, reg_token);

            return true;
        }
        else
            return false;
    }

    public boolean logout() throws IOException {
        handler.removeCallbacks(startRefreshToken);
        if (accp_sessionid != null) {
            HttpHelper.executePostRequest(
                    getURLforEndPoint(END_POINT_LOGOUT, true),
                    getACCPHeader(accp_sessionid),
                    null
            );
        }
        if (svcp_api_token != null) {
            HttpHelper.executePostRequest(
                    getURLforEndPoint(SVCP_END_POINT_LOGOUT, false),
                    getSVCPAuthorizationHeader(svcp_api_token),
                    null
            );
        }

        accp_sessionid = null;
        svcp_api_token = null;

        return false;
    }

    public String createRegToken() throws IOException {
        String reg_token_json = HttpHelper.executePostRequest(
                getURLforEndPoint(END_POINT_CREATE_REG_TOKENS, true),
                getACCPHeader(accp_sessionid),
                "{}"
        );

        if (reg_token_json == null)
            return null;

        JsonHelper json = new JsonHelper(reg_token_json);
        //Log.e(TAG, json.toString(1));
        if (!json.hasErrors()) {
            return json.getString(JsonHelper.STR_TOKEN);
        } else {
            Log.e(TAG, json.getErrorDetail());
            return null;
        }
    }

    public String getRegToken() {
        return reg_token;
    }

    private void getCamerasList() throws IOException{
        //params = {'offset': 0, 'limit': 100}
        String resp = HttpHelper.executeGetRequest(
                getURLforEndPoint(SVCP_END_POINT_CAMERAS, false),
                getSVCPAuthorizationHeader(svcp_api_token)
        );
        Log.e(TAG, new JsonHelper(resp).toString(1));
    }

    private void refreshToken() {
        new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                if (svcp_api_token == null)
                    return null;

                String result = null;
                try {
                    result = HttpHelper.executeGetRequest(
                            getURLforEndPoint(SVCP_END_POINT_API_TOKEN, false),
                            getSVCPAuthorizationHeader(svcp_api_token)
                    );
                } catch (IOException e) {
                    Log.e(TAG, "refreshToken error: ", e);
                    handler.postDelayed(
                            startRefreshToken,
                            600
                    );
                    return null;
                }

                Log.v(TAG, "refreshToken result:" + result);
                if (result != null) {
                    JsonHelper json = new JsonHelper(result);
                    if (json.hasValue(JsonHelper.STR_TOKEN)) {
                        svcp_api_token = json.getString(JsonHelper.STR_TOKEN);
                        handler.postDelayed(
                                startRefreshToken,
                                getApiTokenUpdateDelta(json.getString("expire"))
                        );
                    }
                    else if (json.hasErrors() && JsonHelper.ERROR_INVALID_AUTH.equals(json.getString(JsonHelper.STR_ERROR_TYPE))) {
                        Log.e(TAG, "refreshToken error: " + json.getErrorDetail());
                        handler.postDelayed(
                                startRefreshToken,
                                1000*60*10
                        ); // TODO useless
                    }
                    else {
                        Log.e(TAG, "refreshToken unknown error: ");
                        handler.postDelayed(
                                startRefreshToken,
                                1000*10
                        );
                    }
                }
                return null;
            }
        }.execute();
    }
    private long getApiTokenUpdateDelta(String expire) {
        Calendar expireTime = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
        Calendar now_time = Calendar.getInstance(TimeZone.getTimeZone("UTC"));

        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
            Date date = sdf.parse(expire);
            expireTime.set(
                    date.getYear() + 1900,
                    date.getMonth(),
                    date.getDate(),
                    date.getHours(),
                    date.getMinutes(),
                    date.getSeconds()
            );
        } catch (ParseException e) {
            Log.e(TAG, "getApiTokenUpdateDelta", e);
        }

        long millis = (expireTime.getTimeInMillis() - now_time.getTimeInMillis()) / 2;

        if ( millis > 0)
            return millis;
        else
            return 1000*60*5;
    }

    private URL getURL(String url) {
        try {
            return new URL(url);
        } catch (MalformedURLException e) {
            Log.e(TAG, "getURL() " + e.getMessage());
            return null;
        }
    }
    private URL getURLforEndPoint(String endPoint, boolean isAccp) {
        try {
            if (isAccp)
                return new URL(protocol + "://" + accp_host + ":" + accp_port + endPoint);
            else
                return new URL(protocol + "://" + svcp_host + endPoint);
        } catch (MalformedURLException e) {
            Log.e(TAG, "getURLforEndPoint() " + e.getMessage());
            return null;
        }
    }
    private String[] getHeader() {
        return new String[] {"Content-type", "application/json"};
    }
    private String[] getACCPHeader(String value) {
        return new String[] {
                "Content-type", "application/json",
                "Cookie", "sessionid" + "=" + value + ";"
        };
    }
    private String[] getSVCPAuthorizationHeader(String token) {
        return new String[] {
                "Content-type", "application/json",
                "Authorization", "SkyVR " + token
        };
    }
}
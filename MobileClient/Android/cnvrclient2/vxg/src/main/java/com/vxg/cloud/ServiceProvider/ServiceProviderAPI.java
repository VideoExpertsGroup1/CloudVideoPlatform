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

package com.vxg.cloud.ServiceProvider;

import android.os.AsyncTask;
import android.util.Log;
import android.util.Pair;

import com.vxg.cloud.ServiceProvider.Filters.ServiceProviderCamerasFilter;
import com.vxg.cloud.ServiceProvider.Filters.ServiceProviderCamsessFilter;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.UnknownHostException;
import java.util.ArrayList;

public class ServiceProviderAPI {
    private static String TAG = ServiceProviderAPI.class.getSimpleName();
    private static ServiceProviderAPI mInstance;
    private String mProtocol = "http";
    private String mHost = "";
    private ServiceProviderToken mToken = new ServiceProviderToken();
    private static final int readTimeout = 10000;
    private static final int connectTimeout = 2000;

    public ServiceProviderAPI(){

    }

    public void setHost(String host){
        mHost = host;
    }

    public String getHost(){
        return mHost;
    }

    public void setProtocol(String protocol){
        mProtocol = protocol;
    }

    public String getProtocol(){
        return mProtocol;
    }

    public static ServiceProviderAPI getInstance() {
        if ( mInstance == null)
            mInstance = new ServiceProviderAPI();
        return mInstance;
    }

    private URL makeURL(String endPoint) {
        try{
            return new URL(mProtocol + "://" + mHost + endPoint); // TODO port
        } catch (MalformedURLException e) {
            Log.e(TAG, "getURLByEndPoint() " + e.getMessage());
            return null;
        }
    }

    public void setToken(ServiceProviderToken token){
        mToken = token;
    }

    public ServiceProviderToken getToken(){
        return mToken;
    }

    public void resetToken(){
        mToken.reset();
    }

    public boolean tokenIsEmpty(){
        return mToken.isEmpty();
    }

    public boolean refreshToken(){
        if(mToken.isEmpty()){
            return false;
        }
        try {
            String resp = executeGetRequest(ServiceProviderEndPoints.ACCOUNT_API_TOKEN);
            JSONObject response = new JSONObject(resp);
            ServiceProviderToken token = new ServiceProviderToken(response);
            if(token.hasError()){
                Log.e(TAG, "refreshToken, Error(" + token.getErrorStatus() + ") token refresh " + token.getErrorDetail());
                return false;
            }
            mToken = token;
            return true;
        } catch (IOException e) {
            Log.e(TAG, "refreshToken, error: ", e);
            e.printStackTrace();
        } catch (JSONException e){
            Log.e(TAG, "refreshToken, error (invalid json): ", e);
            e.printStackTrace();
        }
        return false;
    }

    public JSONObject hasActiveCamsess(long camID) {
        JSONObject response = null;

        if(mToken.isEmpty()){
            return null;
        }

        try{
            String resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS + "?detail=detail&camid=" + camID + "&active=" + true);
            response = new JSONObject(resp);
        } catch (IOException e) {
            Log.e(TAG, "hasActiveCamsess error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "hasActiveCamsess has invalid json");
            e.printStackTrace();
        }
        return response;
    }

    public String getServerTime(){
        String serverTime = null;
        try {
            String resp = executeGetRequest(ServiceProviderEndPoints.SERVER_TIME);
            JSONObject response = new JSONObject(resp);
            if(response.has("utc")){
                serverTime = response.getString("utc");
            }
        } catch (IOException e) {
            Log.e(TAG, "getServerTime error: ", e);
            e.printStackTrace();
        } catch (JSONException e){
            Log.e(TAG, "getServerTime error (invalid json): ", e);
            e.printStackTrace();
        }
        return serverTime;
    }

    public ServiceProviderRegToken resetCameraManager(long cmngrsID){
        ServiceProviderRegToken regToken = null;
        if(mToken.isEmpty()){
            return regToken;
        }
        try{
            String resp = executePostRequest(ServiceProviderEndPoints.CMNGRS_RESET(cmngrsID), null);
            Log.e(TAG, "resetCameraManager resp: " + resp);
            JSONObject response = new JSONObject(resp);
            regToken = new ServiceProviderRegToken(response);
        } catch (IOException e) {
            Log.e(TAG, "resetCameraManager error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "resetCameraManager has invalid json");
            e.printStackTrace();
        }
        return regToken;
    }

    public ServiceProviderCamsessDetail getCamsess(long camsessID){
        ServiceProviderCamsessDetail cameraDetail = new ServiceProviderCamsessDetail();

        if(mToken.isEmpty()){
            return cameraDetail;
        }
        try{
            String resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS + camsessID + "/");
            Log.e(TAG, "getCamsess resp (str): " + resp);
            JSONObject response = new JSONObject(resp);
            Log.e(TAG, "getCamsess resp(json): " + response.toString(1));
            cameraDetail = new ServiceProviderCamsessDetail(response);
        } catch (IOException e) {
            Log.e(TAG, "getCamsess error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getCamsess has invalid json");
            e.printStackTrace();
        }
        return cameraDetail;
    }

    public Pair<Integer, JSONObject> getAccount(){
        JSONObject response = new JSONObject();
        Integer responseCode = 0;
        if(mToken.isEmpty()){
            return new Pair<>(responseCode, response);
        }
        try{
            String resp = executeGetRequest(ServiceProviderEndPoints.ACCOUNT);
            Log.e(TAG, "getAccount resp: " + resp);
            response = new JSONObject(resp);
        } catch (IOException e) {
            Log.e(TAG, "getAccount error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getAccount has invalid json");
            e.printStackTrace();
        }
        return new Pair<>(responseCode, response);
    }

    public ServiceProviderCamsessDetail createCamsess(JSONObject data){
        ServiceProviderCamsessDetail cameraDetail = new ServiceProviderCamsessDetail();
        if (mToken.isEmpty()){
            return cameraDetail;
        }
        try {
            Log.e(TAG, "createCamsess resp: " + data.toString(1));
            String resp = executePostRequest(ServiceProviderEndPoints.CAMSESS + "?detail=detail", data);
            Log.e(TAG, "createCamsess resp: " + resp);
            JSONObject response = new JSONObject(resp);
            if(response != null) {
                cameraDetail = new ServiceProviderCamsessDetail(response);
            }
        } catch (IOException e) {
            Log.e(TAG, "createCamsess error: ", e);
            e.printStackTrace();
        } catch(JSONException e){
            Log.e(TAG, "createCamsess has invalid json");
            e.printStackTrace();
        }
        return cameraDetail;
    }

    public Pair<Integer, ArrayList<ServiceProviderCameraDetail>> getCamerasListPage(ServiceProviderCamerasFilter filter){
        ArrayList<ServiceProviderCameraDetail> result = new ArrayList<>();
        Integer totalCount = 0;
        try{
            String str_resp = executeGetRequest(ServiceProviderEndPoints.CAMERAS + "?" + filter.toUrlString_ForGetRequest());
            JSONObject json_response = new JSONObject(str_resp);
            ServiceProviderResponseWithMeta meta = new ServiceProviderResponseWithMeta(json_response);
            totalCount = meta.getTotalCount();
            Log.e(TAG, "getCamerasListPage, totalCount: " + totalCount);
            JSONArray objects = meta.getObjects();
            for(int i = 0; i < objects.length(); i++){
                ServiceProviderCameraDetail cameraDetail = new ServiceProviderCameraDetail(objects.getJSONObject(i));
                result.add(cameraDetail);
            }
        }catch(IOException e){
            Log.e(TAG, "getCamerasListPage has errors: " + e.getMessage());
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getCamerasListPage has invalid json: " + e.getMessage());
            e.printStackTrace();
        }
        return new Pair<>(totalCount, result);
    }

    public Pair<Integer, ArrayList<ServiceProviderCamsessDetail>> getCamsessListPage(ServiceProviderCamsessFilter filter){
        ArrayList<ServiceProviderCamsessDetail> result = new ArrayList<>();
        Integer totalCount = 0;
        try{
            String str_resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS + "?" + filter.toUrlString_ForGetRequest());
            JSONObject json_response = new JSONObject(str_resp);
            ServiceProviderResponseWithMeta meta = new ServiceProviderResponseWithMeta(json_response);
            totalCount = meta.getTotalCount();
            JSONArray objects = meta.getObjects();
            for(int i = 0; i < objects.length(); i++){
                ServiceProviderCamsessDetail camsessDetail = new ServiceProviderCamsessDetail(objects.getJSONObject(i));
                result.add(camsessDetail);
            }
        }catch(IOException e){
            Log.e(TAG, "getCamsessListPage has errors: " + e.getMessage());
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getCamsessListPage has invalid json: " + e.getMessage());
            e.printStackTrace();
        }
        return new Pair<>(totalCount, result);
    }

    public ServiceProviderResponseWithMeta _getCamsessList(ServiceProviderCamsessFilter filter){
        ServiceProviderResponseWithMeta response = null;
        try{
            String str_resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS + "?" + filter.toUrlString_ForGetRequest());
            JSONObject json_response = new JSONObject(str_resp);
            response = new ServiceProviderResponseWithMeta(json_response);
        }catch(IOException e){
            Log.e(TAG, "_getCamsessRecords has errors: " + e.getMessage());
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "_getCamsessRecords has invalid json: " + e.getMessage());
            e.printStackTrace();
        }
        return response;
    }

    public ArrayList<ServiceProviderCamsessLightDetail> getCamsessLightList(ServiceProviderCamsessFilter filter){
        filter.setMoreDetails(false);
        ArrayList<ServiceProviderCamsessLightDetail> result = new ArrayList<>();
        if (mToken.isEmpty()){
            Log.e(TAG, "getCamsessLightList request is unathorized");
            return result;
        }

        try{
            ServiceProviderResponseWithMeta meta = _getCamsessList(filter);
            if (meta == null)
            {
                Log.e(TAG, "getCamsessLightList return null meta");
                return result;
            }

            JSONArray objects = meta.getObjects();
            for(int i = 0; i < objects.length(); i++){
                ServiceProviderCamsessLightDetail camsessDetail = new ServiceProviderCamsessLightDetail(objects.getJSONObject(i));
                result.add(camsessDetail);
            }
            Log.e(TAG, "getCamsessList getTotalCount: " + meta.getTotalCount() + " loaded: " + result.size() + " json size: " + objects.toString().length());
            while(result.size() < meta.getTotalCount()){
                filter.setOffset(meta.getOffset() + meta.getLimit());
                filter.setLimit(meta.getLimit());
                meta = _getCamsessList(filter);
                objects = meta.getObjects();
                for(int i = 0; i < objects.length(); i++){
                    ServiceProviderCamsessLightDetail camsessDetail = new ServiceProviderCamsessLightDetail(objects.getJSONObject(i));
                    result.add(camsessDetail);
                }
                Log.e(TAG, "getCamsessList getTotalCount: " + meta.getTotalCount() + " loaded: " + result.size());
            }
        }catch(JSONException e){
            Log.e(TAG, "getCamsessList has invalid json");
            e.printStackTrace();
        } catch (Exception e) {
            Log.e(TAG, "getCamsessList error: ", e);
            e.printStackTrace();
        }
        return result;
    }

    public void updateCamera(int camera_id, JSONObject data){
        if (mToken.isEmpty()){
            Log.e(TAG, "updateCamera request is unathorized");
            return;
        }
        try {
            String resp = executePutRequest(ServiceProviderEndPoints.CAMERAS + camera_id + "/", data);
            Log.e(TAG, "updateCamera resp: " + resp);
        } catch (IOException e) {
            Log.e(TAG, "updateCamera error: ", e);
            e.printStackTrace();
        } /*catch(JSONException e){
            Log.e(TAG, "updateCamera has invalid json");
            e.printStackTrace();
        }*/
    }

    public void updateCamsess_async(final long camsessid, final JSONObject data) {
        if(camsessid == 0) return;
        ServiceProviderHelper.executeAsyncTask(new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                updateCamsess((int)camsessid, data);
                return null;
            }
        });
    }


    public void updateCamsess(long camsessid, JSONObject data){
        if(mToken.isEmpty()){
            return;
        }

        if(camsessid == 0) return;

        try {
            Log.i(TAG, "updateCamsess request: " + data.toString(1));
            String resp = executePutRequest(ServiceProviderEndPoints.CAMSESS(camsessid), data);
            Log.i(TAG, "updateCamsess response: " + resp);
        } catch (JSONException e){
            Log.e(TAG, "updateCamsess invalid json: ", e);
            e.printStackTrace();
        } catch (IOException e) {
            Log.e(TAG, "updateCamsess error: ", e);
            e.printStackTrace();
        }
    }

    public void deleteCamsess_async(final long camsessid) {
        if(camsessid == 0) return;
        ServiceProviderHelper.executeAsyncTask(new AsyncTask<Void, Void, Void>() {
            @Override
            protected Void doInBackground(Void... params) {
                deleteCamsess(camsessid);
                return null;
            }
        });
    }

    public void deleteCamsess(long camsessid){
        if(mToken.isEmpty()){
            return;
        }

        if(camsessid == 0) return;

        try {
            String resp = executeDeleteRequest(ServiceProviderEndPoints.CAMSESS(camsessid));
            Log.i(TAG, "updateCamsess response: " + resp);
        } catch (IOException e) {
            Log.e(TAG, "updateCamsess error: ", e);
            e.printStackTrace();
        }
    }



    public void camsessSendChatMessage(int camsessid, String message){
        if (mToken.isEmpty()){
            Log.e(TAG, "camsessSendChatMessage request is unathorized");
            return;
        }
        if(camsessid <= 0){
            Log.e(TAG, "Invalid camsessid");
            return;
        }
        try {
            JSONObject data = new JSONObject();
            data.put("message", message);
            String resp_json = executePostRequest(ServiceProviderEndPoints.CAMSESS_CHAT_SEND_MESSAGE(camsessid), data);
        } catch (IOException e) {
            Log.e(TAG, "camsessSendChatMessage error: ", e);
            e.printStackTrace();
        } catch(JSONException e){
            Log.e(TAG, "camsessSendChatMessage has invalid json");
            e.printStackTrace();
        }
        return;
    }

    /*
        Create upload url
        input:
            duration - in ms
            size - in bytes
            time - format like "2016-06-20T04:13:25.488000"
     */
    public String createCamsessRecordsUpload(long camsessid, ServiceProviderRecordDetails recordDetails){
        if (mToken.isEmpty()){
            Log.e(TAG, "createCamsessRecordsUpload request is unathorized");
            return null;
        }
        if(camsessid <= 0){
            Log.e(TAG, "Invalid camsessid");
            return null;
        }
        try {
            JSONArray data = new JSONArray();
            JSONObject record_data = new JSONObject();
            record_data.put("duration", recordDetails.getDuration());
            record_data.put("size", recordDetails.getSize());
            record_data.put("time", recordDetails.getStartAsString());
            data.put(record_data);
            String resp_json = executePostRequestArray(ServiceProviderEndPoints.CAMESESS_RECORDS_UPLOAD(camsessid), data);
            Log.e(TAG, "createCamsessRecordsUpload resp: " + resp_json);
            JSONObject response = new JSONObject(resp_json);
            if(response.has("urls")){
                JSONArray urls = response.getJSONArray("urls");
                if(urls.length() > 0)
                    return urls.getString(0);
            }
            return null;
        } catch (IOException e) {
            Log.e(TAG, "createCamsessRecordsUpload error: ", e);
            e.printStackTrace();
        } catch(JSONException e){
            Log.e(TAG, "createCamsessRecordsUpload has invalid json");
            e.printStackTrace();
        }
        return null;
    }

    /*
       Create upload url
       input:
           duration - in ms
           size - in bytes
           time - format like "2016-06-20T04:13:25.488000"
    */

    public String createCamsessPreviewUpload(long camsessid, String time, long size, long width, long height){
        if (mToken.isEmpty()){
            Log.e(TAG, "createCamsessPreviewUpload request is unathorized");
            return null;
        }

        if(camsessid <= 0){
            Log.e(TAG, "createCamsessPreviewUpload, Invalid camsessid");
            return null;
        }

        try {
            JSONObject data = new JSONObject();
            data.put("width", width);
            data.put("height", height);
            data.put("size", size);
            data.put("time", time);
            String resp_json = executePostRequest(ServiceProviderEndPoints.CAMESESS_PREVIEW_UPLOAD(camsessid), data);
            Log.e(TAG, "createCamsessPreviewUpload resp: " + resp_json);
            JSONObject response = new JSONObject(resp_json);
            if(response.has("url") && !response.isNull("url")){
                return response.getString("url");
            }
            return null;
        } catch (IOException e) {
            Log.e(TAG, "createCamsessPreviewUpload error: ", e);
            e.printStackTrace();
        } catch(JSONException e){
            Log.e(TAG, "createCamsessPreviewUpload has invalid json");
            e.printStackTrace();
        }
        return null;
    }

    private ServiceProviderResponseWithMeta _getCamsessRecords(long camsessid, int offset, int limit){
        ServiceProviderResponseWithMeta response = null;
        try{
            String params = "offset=" + Integer.toString(offset) + "&limit=" + Integer.toString(limit);
            String str_resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS_RECORDS(camsessid) + "?" + params);
            JSONObject json_response = new JSONObject(str_resp);
            response = new ServiceProviderResponseWithMeta(json_response);
        }catch(IOException e){
            Log.e(TAG, "_getCamsessRecords has errors: " + e.getMessage());
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "_getCamsessRecords has invalid json: " + e.getMessage());
            e.printStackTrace();
        }
        return response;
    }

    public ArrayList<ServiceProviderRecordDetails> getCamsessRecords(long camsessid){
        ArrayList<ServiceProviderRecordDetails> records = new ArrayList<>();
        if(mToken.isEmpty()){
            return records;
        }
        try{
            ServiceProviderResponseWithMeta resp = _getCamsessRecords(camsessid, 0, 100);
            JSONArray objects = resp.getObjects();
            for(int i = 0; i < objects.length(); i++){
                ServiceProviderRecordDetails recordDetail = new ServiceProviderRecordDetails(objects.getJSONObject(i));
                records.add(recordDetail);
            }
            while(records.size() < resp.getTotalCount()){
                resp = _getCamsessRecords(camsessid, resp.getOffset() + resp.getLimit(), resp.getLimit());
                objects = resp.getObjects();
                for(int i = 0; i < objects.length(); i++){
                    ServiceProviderRecordDetails recordDetail = new ServiceProviderRecordDetails(objects.getJSONObject(i));
                    records.add(recordDetail);
                }
            }
        }catch(JSONException e){
            Log.e(TAG, "getCamsessRecords has invalid json");
            e.printStackTrace();
        }
        return records;
    }

    public ServiceProviderCameraDetail findCameraByUUID(String uuid){
        ServiceProviderCameraDetail cameraDetail = new ServiceProviderCameraDetail();
        if (mToken.isEmpty()){
            Log.e(TAG, "getCameraByUUID request is unathorized");
            return cameraDetail;
        }
        if(uuid == null){
            return cameraDetail;
        }
        try{
            String resp = executeGetRequest(ServiceProviderEndPoints.CAMERAS + "?uuid=" + uuid);
            JSONObject response = new JSONObject(resp);
            ServiceProviderResponseWithMeta meta = new ServiceProviderResponseWithMeta(response);
            if(meta.getTotalCount() == 1){
                cameraDetail = new ServiceProviderCameraDetail(meta.getObjects().getJSONObject(0));
            }
        } catch (IOException e) {
            Log.e(TAG, "getCameraByUUID error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getCameraByUUID has invalid json");
            e.printStackTrace();
        }
        return cameraDetail;
    }

    public ServiceProviderCamsessLiveStats getCamsesLiveStats(long camsessid){
        ServiceProviderCamsessLiveStats camsessLiveStats = new ServiceProviderCamsessLiveStats();
        if (mToken.isEmpty()){
            Log.e(TAG, "getCamsesLiveStats request is unathorized");
            return camsessLiveStats;
        }
        if(camsessid <= 0){
            return camsessLiveStats;
        }
        try{
            String resp = executeGetRequest(ServiceProviderEndPoints.CAMSESS_LIVE_STATS(camsessid));
            JSONObject response = new JSONObject(resp);
            camsessLiveStats = new ServiceProviderCamsessLiveStats(response);
        }catch(UnknownHostException e){
            Log.e(TAG, "getCamsesLiveStats has UnknownHostException (network off)");
            e.printStackTrace();
        } catch (IOException e) {
            Log.e(TAG, "getCamsesLiveStats error: ", e);
            e.printStackTrace();
        }catch(JSONException e){
            Log.e(TAG, "getCamsesLiveStats has invalid json");
            e.printStackTrace();
        }
        return camsessLiveStats;
    }

    public ArrayList<ServiceProviderCamsessChatMessage> getCamsessChatMessages(String chat_url){
        ArrayList<ServiceProviderCamsessChatMessage> result = new ArrayList<>();

        try {
            URL url = new URL(chat_url);
            // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
            // Log.d(TAG, "GET " + url);

            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setReadTimeout(readTimeout);
            urlConnection.setConnectTimeout(connectTimeout);
            urlConnection.setRequestMethod("GET");
            urlConnection.setUseCaches(true);

            StringBuffer buffer = new StringBuffer();
            int code_response = urlConnection.getResponseCode();

            if(code_response == 404){
                return result;
            }

            if(code_response == 500){
                return result;
            }

            // Log.d(TAG, "GET ResponseCode: " + code_response + " for URL: " + url);

            boolean isError = code_response >= 400;
            InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
            String line;
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }

            String resp = buffer.toString();
            // Log.d(TAG, "GET ResponseCode (" + url + ") resp: " + resp);
            JSONObject data = new JSONObject(resp);
            if(data.has("messages") && !data.isNull("messages")){
                JSONArray messages = data.getJSONArray("messages");
                for(int i = 0; i < messages.length(); i++){
                    ServiceProviderCamsessChatMessage msg = new ServiceProviderCamsessChatMessage(messages.getJSONObject(i));
                    result.add(msg);
                }
            }
        } catch(JSONException e) {
            Log.e(TAG, "getCamsessChatMessages invalid json " + e.getMessage());
            e.printStackTrace();
        } catch(IOException e) {
            Log.e(TAG, "getCamsessChatMessages failed " + e.getMessage());
            e.printStackTrace();
        }

        return result;
    };

    public String executeGetRequest(String endPoint) throws IOException {
        URL url = makeURL(endPoint);
        // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        Log.d(TAG, "GET " + url);

        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        urlConnection.setRequestMethod("GET");

        if (!mToken.isEmpty()) {
            urlConnection.setRequestProperty("Authorization", "SkyVR " + mToken.getToken());
        }

        StringBuffer buffer = new StringBuffer();
        int code_response = urlConnection.getResponseCode();
        Log.d(TAG, "GET ResponseCode: " + code_response + " for URL: " + url);

        boolean isError = code_response >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        return buffer.toString();
    }

    public String executePostRequest(String endPoint,  JSONObject data) throws IOException {
        URL url = makeURL(endPoint);
        // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        Log.d(TAG, "POST " + url);

        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setRequestMethod("POST");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        Log.i(TAG, "readTimeout " + readTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);

        if (!mToken.isEmpty()) {
            urlConnection.setRequestProperty("Authorization", "SkyVR " + mToken.getToken());
        }

        if(data != null) {
            urlConnection.setRequestProperty("Content-type", "application/json");
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            wr.write(data.toString());
            wr.flush();
            wr.close();
        }

        StringBuffer buffer = new StringBuffer();

        Log.d(TAG, "POST ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + url);
        if (urlConnection.getResponseCode() == 401) {
            // throw new IOException(HTTP_EXCEPTION_INVALID_AUTH);
            // return
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

    public String executePostRequestArray(String endPoint, JSONArray data) throws IOException {
        URL url = makeURL(endPoint);
        // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        Log.d(TAG, "PUT " + url);

        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setRequestMethod("POST");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        Log.i(TAG, "readTimeout " + readTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);

        if (!mToken.isEmpty()) {
            urlConnection.setRequestProperty("Authorization", "SkyVR " + mToken.getToken());
        }

        if(data != null) {
            urlConnection.setRequestProperty("Content-type", "application/json");
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            Log.e(TAG, "POST RequestText: " + data.toString());
            wr.write(data.toString());
            wr.flush();
            wr.close();
        }

        int codeResponse = urlConnection.getResponseCode();

        Log.d(TAG, "POST ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + url);
        if (urlConnection.getResponseCode() == 401) {
            // throw new IOException(HTTP_EXCEPTION_INVALID_AUTH);
            // return
        }

        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        StringBuffer buffer = new StringBuffer();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        if(codeResponse != 200){
            Log.e(TAG, "POST ResponseText: " + buffer.toString());
        }
        return buffer.toString();
    }


    public String executePutRequest(String endPoint, JSONObject data) throws IOException {
        URL url = makeURL(endPoint);
        // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        Log.d(TAG, "PUT " + url);

        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setRequestMethod("PUT");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        Log.i(TAG, "readTimeout " + readTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setUseCaches(false);

        if (!mToken.isEmpty()) {
            urlConnection.setRequestProperty("Authorization", "SkyVR " + mToken.getToken());
        }

        if(data != null) {
            urlConnection.setRequestProperty("Content-type", "application/json");
            OutputStreamWriter wr = new OutputStreamWriter(urlConnection.getOutputStream());
            Log.e(TAG, "PUT RequestText: " + data.toString());
            wr.write(data.toString());
            wr.flush();
            wr.close();
        }

        int codeResponse = urlConnection.getResponseCode();

        Log.d(TAG, "PUT ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + url);
        if (urlConnection.getResponseCode() == 401) {
            // throw new IOException(HTTP_EXCEPTION_INVALID_AUTH);
            // return
        }

        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        StringBuffer buffer = new StringBuffer();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        if(codeResponse != 200){
            Log.e(TAG, "PUT ResponseText: " + buffer.toString());
        }
        return buffer.toString();
    }

    public String executeDeleteRequest(String endPoint) throws IOException {
        URL url = makeURL(endPoint);
        // HttpsURLConnection urlConnection = (HttpsURLConnection) url.openConnection();
        Log.d(TAG, "DELETE " + url);

        HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
        urlConnection.setRequestMethod("DELETE");
        urlConnection.setReadTimeout(readTimeout);
        urlConnection.setConnectTimeout(connectTimeout);
        Log.i(TAG, "readTimeout " + readTimeout);
        urlConnection.setDoInput(true);
        urlConnection.setDoOutput(false);
        urlConnection.setUseCaches(false);

        if (!mToken.isEmpty()) {
            urlConnection.setRequestProperty("Authorization", "SkyVR " + mToken.getToken());
        }

        int codeResponse = urlConnection.getResponseCode();

        Log.d(TAG, "DELETE ResponseCode: " + urlConnection.getResponseCode() + " for URL: " + url);
        if (urlConnection.getResponseCode() == 401) {
            // throw new IOException(HTTP_EXCEPTION_INVALID_AUTH);
            // return
        }

        boolean isError = codeResponse >= 400;
        InputStream inputStream = isError ? urlConnection.getErrorStream() : urlConnection.getInputStream();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
        StringBuffer buffer = new StringBuffer();
        String line;
        while ((line = reader.readLine()) != null) {
            buffer.append(line);
        }
        if(codeResponse != 200){
            Log.e(TAG, "DELETE ResponseText: " + buffer.toString());
        }
        return buffer.toString();
    }
}

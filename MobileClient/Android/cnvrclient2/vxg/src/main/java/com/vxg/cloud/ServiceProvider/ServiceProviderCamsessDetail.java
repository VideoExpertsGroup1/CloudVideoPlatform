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

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ServiceProviderCamsessDetail {
    private static final String TAG = ServiceProviderCamsessDetail.class.getSimpleName();

    private String mDetails;
    private boolean mHasError = true;
    private boolean mIsActive = false;
    private boolean mIsPublic = false;
    private String mErrorDetail = "";
    private int mErrorStatus = 0;
    private String mRTMPLiveUrl = null;
    private String mHLSLiveUrl = null;
    private String mTitle = "";
    private String mCharURL = null;
    private int mID = 0;
    private int mCamID = 0;
    private long mStart = 0;
    private long mEnd = 0;
    private String mPreviewUrl = null;
    private int mPreviewSize = 0;
    private int mPreviewHeight = 0;
    private int mPreviewWidth = 0;
    private long mPreviewTime = 0;
    private double mLongitude = 0.0;
    private double mLatitude = 0.0;
    private int mStatisticsPlayback = 0;
    private int mStatisticsLive = 0;
    private int mStatisticsPeakLive = 0;
    private String mAuthorName = null;
    private String mAuthorPreferredName = null;
    private String mAuthorFirstName = null;
    private String mAuthorLastName = null;

    private boolean mAccessAll = false;
    private boolean mAccessWatch = false;
    private boolean mHasRecords = false;


    public ServiceProviderCamsessDetail(){
        mHasError = true;
    }

    public ServiceProviderCamsessDetail(JSONObject details){
        try {
            mDetails = details.toString(1);
            // Log.i(TAG, "mDetails=" + mDetails);
            if (details.has("errorType") && details.has("errorDetail")) {
                mHasError = true;
                mErrorDetail = details.getString("errorDetail");
                if(details.has("status")){
                    mErrorStatus = details.getInt("status");
                }
            } else {
                mHasError = false;

                if(details.has("access") && !details.isNull("access")) {
                    JSONArray access = details.getJSONArray("access");
                    for(int i = 0; i < access.length(); i++){
                        mAccessWatch = access.get(i).toString().equals("watch") || mAccessWatch;
                        mAccessAll = access.get(i).toString().equals("all") || mAccessAll;
                    }
                }

                if(details.has("active") && !details.isNull("active")){
                    mIsActive = details.getBoolean("active");
                }

                if(details.has("has_records") && !details.isNull("has_records")){
                    mHasRecords = details.getBoolean("has_records");
                }

                if(details.has("public") && !details.isNull("public")){
                    mIsPublic = details.getBoolean("public");
                }

                if(details.has("title") && !details.isNull("title")){
                    mTitle = details.getString("title");
                }

                if(details.has("id") && !details.isNull("id")){
                    mID = details.getInt("id");
                }

                if(details.has("camid") && !details.isNull("camid")){
                    mCamID = details.getInt("camid");
                }

                if(details.has("start") && !details.isNull("start")){
                    String start = details.getString("start");
                    mStart = ServiceProviderHelper.parseTime(start);
                }

                if(details.has("end") && !details.isNull("end")){
                    String end = details.getString("end");
                    mEnd = ServiceProviderHelper.parseTime(end);
                }

                if(details.has("longitude") && !details.isNull("longitude")){
                    mLongitude = details.getDouble("longitude");
                }

                if(details.has("latitude") && !details.isNull("latitude")){
                    mLatitude = details.getDouble("latitude");
                }

                if(details.has("chat") && !details.isNull("chat")){
                    JSONObject chat = details.getJSONObject("chat");
                    if(chat.has("url") && !chat.isNull("url")){
                        mCharURL = chat.getString("url");
                    }
                }

                if(details.has("live_urls") && !details.isNull("live_urls")){
                    JSONObject live_urls = details.getJSONObject("live_urls");

                    if(live_urls.has("rtmp") && !live_urls.isNull("rtmp")){
                        mRTMPLiveUrl = live_urls.getString("rtmp");
                    }

                    if(live_urls.has("hls") && !live_urls.isNull("hls")){
                        mHLSLiveUrl = live_urls.getString("hls");
                    }
                }

                // preview info
                if(details.has("preview") && !details.isNull("preview")){
                    JSONObject preview = details.getJSONObject("preview");
                    if(preview.has("url") && !preview.isNull("url")){
                        mPreviewUrl = preview.getString("url");
                    }

                    if(preview.has("size") && !preview.isNull("size")){
                        mPreviewSize = preview.getInt("size");
                    }

                    if(preview.has("time") && !preview.isNull("time")){
                        mPreviewTime = ServiceProviderHelper.parseTime(preview.getString("time"));
                    }

                    if(preview.has("height") && !preview.isNull("height")){
                        mPreviewHeight = preview.getInt("height");
                    }

                    if(preview.has("width") && !preview.isNull("width")){
                        mPreviewWidth = preview.getInt("width");
                    }
                }

                if (details.has("author") && !details.isNull("author")) {
                    JSONObject author = details.getJSONObject("author");

                    if(author.has("name") && !author.isNull("name")){
                        mAuthorName =  author.getString("name");
                    }

                    if(author.has("first_name") && !author.isNull("first_name")){
                        mAuthorFirstName =  author.getString("first_name");
                    }

                    if(author.has("last_name") && !author.isNull("last_name")){
                        mAuthorLastName =  author.getString("last_name");
                    }

                    if(author.has("preferred_name") && !author.isNull("preferred_name")){
                        mAuthorPreferredName =  author.getString("preferred_name");
                    }
                }

                if (details.has("statistics") && !details.isNull("statistics")) {
                    JSONObject statistics = details.getJSONObject("statistics");

                    if(statistics.has("playback") && !statistics.isNull("playback")){
                        mStatisticsPlayback = statistics.getInt("playback");
                    }

                    if(statistics.has("live") && !statistics.isNull("live")){
                        mStatisticsLive = statistics.getInt("live");
                    }

                    if(statistics.has("peak_live") && !statistics.isNull("peak_live")){
                        mStatisticsPeakLive = statistics.getInt("peak_live");
                    }
                }
            }
        } catch(JSONException e) {
            Log.e(TAG, "Constructor CamsessDetail error: ", e);
            mHasError = true;
            e.printStackTrace();
        }
    }

    public boolean isActive(){
        return mIsActive;
    }

    public boolean isPublic(){
        return mIsPublic;
    }

    public String getTitle(){
        return mTitle;
    }

    public boolean hasError(){
        return mHasError;
    }

    public String getErrorDetail(){
        return mErrorDetail;
    }

    public int getErrorStatus(){
        return mErrorStatus;
    }

    public int getID(){
        return mID;
    }

    public int getCamID(){
        return mCamID;
    }

    public boolean hasRtmpLiveUrl(){
        return mRTMPLiveUrl != null;
    }

    public String getRtmpLiveUrl(){
        return mRTMPLiveUrl;
    }

    public String getCharURL(){
        return mCharURL;
    }

    public boolean hasHlsLiveUrl(){
        return mHLSLiveUrl != null;
    }

    public String getHlsLiveUrl(){
        return mHLSLiveUrl;
    }

    public long getStart(){
        return mStart;
    }

    public String getStartAsString() {
        return ServiceProviderHelper.formatTime(mStart);
    }

    public long getEnd() {
        return mEnd;
    }

    public boolean hasAccessWatch() {
        return mAccessAll || mAccessWatch;
    }

    public boolean hasAccessAll() {
        return mAccessAll;
    }

    public String getEndAsString(){
        return ServiceProviderHelper.formatTime(mEnd);
    }

    public long getDuration() {
        return (mEnd - mStart);
    }

    public String getPreviewURL(){
        return mPreviewUrl;
    }

    public int getStatisticsPlayback(){
        return mStatisticsPlayback;
    }

    public int getStatisticsLive(){
        return mStatisticsLive;
    }

    public int getStatisticsPeakLive(){
        return mStatisticsPeakLive;
    }

    public String getAuthorName(){
        return mAuthorName;
    }

    public String getAuthorPreferredName(){
        return mAuthorPreferredName;
    }

    public String getAuthorFirstName(){
        return mAuthorFirstName;
    }

    public String getAuthorLastName(){
        return mAuthorLastName;
    }

    public double getLongitude(){
        return mLongitude;
    }

    public double getLatitude(){
        return mLatitude;
    }

    public String toString(){
        return mDetails;
    }

    public boolean hasRecords(){
        return mHasRecords;
    }

}

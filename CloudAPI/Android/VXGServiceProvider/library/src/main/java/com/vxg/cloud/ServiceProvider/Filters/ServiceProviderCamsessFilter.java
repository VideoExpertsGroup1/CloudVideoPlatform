package com.vxg.cloud.ServiceProvider.Filters;

import android.util.Log;

import com.google.android.gms.maps.model.LatLngBounds;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

public class ServiceProviderCamsessFilter {
    private static String TAG = ServiceProviderCamsessFilter.class.getSimpleName();

    public enum CameraStatus {
        CAMERA_STATUS_ACTIVE,
        CAMERA_STATUS_INACTIVE,
        CAMERA_STATUS_ANY
    };

    public enum CameraOnline { YES, NO, ANY };
    public enum CamsessStreaming { YES, NO, ANY };
    public enum CamsessHasRecords { YES, NO, ANY };

    private int mOffset = 0;
    private boolean mMoreDetails = true;
    private int mLimit = 50;
    private long mCamsessID = 0;
    private String mStartLessThen = null;
    private String mTitle = null;
    private String mAuthorName = null;
    private String mAuthorPrefferedName = null;
    private CameraStatus mCameraStatus = CameraStatus.CAMERA_STATUS_ANY;
    private CameraOnline mCameraOnline = CameraOnline.ANY;
    private CamsessStreaming mCamsessStreaming = CamsessStreaming.ANY;
    private CamsessHasRecords mCamsessHasRecords = CamsessHasRecords.ANY;
    private boolean mLatLngUpdated = false;
    private double mLatitudeMin = 0.0f;
    private double mLatitudeMax = 0.0f;
    private double mLongitudeMin = 0.0f;
    private double mLongitudeMax = 0.0f;

    public ServiceProviderCamsessFilter(CameraStatus cameraStatus){
        mCameraStatus = cameraStatus;
    }

    public ServiceProviderCamsessFilter() {

    }
    public ServiceProviderCamsessFilter(int offset, int limit, CameraStatus cameraStatus){
        mOffset = offset;
        mLimit = limit;
        mCameraStatus = cameraStatus;
    };

    public int getOffset(){
        return mOffset;
    }

    public void setOffset(int offset){
        mOffset = offset;
    }

    public int getLimit(){
        return mLimit;
    }

    public void setLimit(int limit){
        mLimit = limit;
    }

    public void setStartLessThen(String startLessThen) {
        mStartLessThen = startLessThen;
    }

    public void setTitle(String title) {
        mTitle = title;
    }

    public String getTitle() {
        return mTitle;
    }

    public void setCamsessID(long val){
        mCamsessID = val;
    }

    public void setCameraOnline(CameraOnline cameraOnline) {
        mCameraOnline = cameraOnline;
    }

    public CameraOnline getCameraOnline() {
        return mCameraOnline;
    }

    public void setStreaming(CamsessStreaming camsessStreaming) {
        mCamsessStreaming = camsessStreaming;
    }

    public CamsessStreaming getStreaming() {
        return mCamsessStreaming;
    }

    public void setHasRecords(CamsessHasRecords camsessHasRecords) {
        mCamsessHasRecords = camsessHasRecords;
    }

    public CamsessHasRecords getHasRecords() {
        return mCamsessHasRecords;
    }

    public void setAuthorName(String authorName) {
        mAuthorName = authorName;
    }

    public String getAuthorName() {
        return mAuthorName;
    }

    public void setAuthorPreferredName(String authorName) {
        mAuthorPrefferedName = authorName;
    }

    public String getAuthorPreferredName() {
        return mAuthorPrefferedName;
    }

    public void setMoreDetails(boolean moreDetails) {
        mMoreDetails = moreDetails;
    }

    public boolean getMoreDetails() {
        return mMoreDetails;
    }

    public void setLatLngBounds(LatLngBounds bounds){
        mLatLngUpdated = true;

        mLatitudeMin = bounds.southwest.latitude;
        mLatitudeMax = bounds.northeast.latitude;
        mLongitudeMin = bounds.southwest.longitude;
        mLongitudeMax = bounds.northeast.longitude;
    }
    public void clearLatLngBounds(){
        mLatLngUpdated = false;
    }

    private Map<String, String> makeParams(){
        Map<String, String> params = new HashMap<String,String>();
        params.put("offset", Integer.toString(mOffset));
        params.put("limit", Integer.toString(mLimit));
        if(mCameraStatus == CameraStatus.CAMERA_STATUS_ACTIVE){
            params.put("active", "true");
        } else if(mCameraStatus == CameraStatus.CAMERA_STATUS_INACTIVE) {
            params.put("active", "false");
        }

        if(mCameraOnline != CameraOnline.ANY){
            params.put("camera_online", mCameraOnline == CameraOnline.YES ? "true" : "false");
        }

        if(mCamsessStreaming != CamsessStreaming.ANY){
            params.put("streaming", mCamsessStreaming == CamsessStreaming.YES ? "true" : "false");
        }

        if(mCamsessHasRecords != CamsessHasRecords.ANY){
            params.put("has_records", mCamsessHasRecords == CamsessHasRecords.YES ? "true" : "false");
        }

        if(mCamsessID > 0){
            params.put("id", Long.toString(mCamsessID));
        }

        params.put("order_by", "-start"); // sorting by start

        if(mMoreDetails) {
            params.put("detail", "detail"); // more details
        }

        if(mStartLessThen != null){
            params.put("start__lte", mStartLessThen);
        }

        if(mTitle != null){
            // params.put("title__contains", mTitle); // case sensitive
            params.put("title__icontains", mTitle); // ignore case
        }

        if(mAuthorName != null){
            params.put("author_name__icontains", mAuthorName);
        }

        if(mAuthorPrefferedName != null){
            params.put("author_preferred_name__icontains", mAuthorPrefferedName);
        }

        // TODO: don't forget check situation when MAX < MIN (if it possible, of course)!!!!
        if(mLatLngUpdated && mLatitudeMin <= mLatitudeMax){
            params.put("latitude__gte", Double.toString(mLatitudeMin));
            params.put("latitude__lte", Double.toString(mLatitudeMax));
        }

        if(mLatLngUpdated && mLongitudeMin <= mLongitudeMax){
            params.put("longitude__gte", Double.toString(mLongitudeMin));
            params.put("longitude__lte", Double.toString(mLongitudeMax));
        }
        return params;
    }

    public String toUrlString_ForGetRequest(){
        String url_get_request = "";
        Map<String, String> params = this.makeParams();
        for (String key : params.keySet()) {
            String sKey = "";
            String sValue = "";
            try {
                sKey = URLEncoder.encode(key, "utf-8");
                sValue = URLEncoder.encode(params.get(key), "utf-8");
            } catch (UnsupportedEncodingException e) {
                e.printStackTrace();
            }
            if(!key.isEmpty()) {
                url_get_request += url_get_request.length() != 0 ? "&" : "";
                url_get_request += sKey + "=" + sValue;
            }
        }
        Log.d(TAG, "toUrlString_ForGetRequest: " + url_get_request);
        return url_get_request;
    };
}

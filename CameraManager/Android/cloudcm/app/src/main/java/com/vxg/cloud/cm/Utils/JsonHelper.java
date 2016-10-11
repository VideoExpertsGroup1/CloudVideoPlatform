package com.vxg.cloud.cm.Utils;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class JsonHelper {
    private static final String TAG = "JsonHelper";
    public JSONObject jsonObject;

    // from webAPI
    public static final String STR_TOKEN = "token";
    public static final String STR_ERROR_TYPE = "errorType";
    public static final String STR_ERROR_DETAIL = "errorDetail";

    public static final String ERROR_INVALID_AUTH = "invalid_auth";

    // from serverAPI
    public static final String PARAM_REG_TOKEN = "reg_token";
    public static final String PARAM_PWD = "pwd";
    public static final String PARAM_USER = "user";
    public static final String PARAM_ORIG_CMD = "orig_cmd";
    public static final String PARAM_STATUS = "status";
    public static final String PARAM_REFID = "refid";
    public static final String PARAM_MSGID = "msgid";
    public final static String PARAM_CMD = "cmd";
    public final static String PARAM_SERVER = "server";
    public final static String PARAM_REASON = "reason";
    public final static String PARAM_SID = "sid";
    public final static String PARAM_UPLOAD_URL = "upload_url";
    public final static String PARAM_MEDIA_SERVER = "media_server";
    public final static String PARAM_PREV_SID = "prev_sid";
    public final static String PARAM_IP = "ip";
    public final static String PARAM_UUID = "uuid";
    public final static String PARAM_CA = "ca";
    public final static String PARAM_BRAND = "brand";
    public final static String PARAM_MODEL = "model";
    public final static String PARAM_SN = "sn";
    public final static String PARAM_VERSION = "version";
    public final static String PARAM_CAM_ID = "cam_id";
    public final static String PARAM_MEDIA_URL = "media_url";
    public final static String PARAM_STREAMING = "streaming";
    public final static String PARAM_STATUS_LED = "status_led";
    public final static String PARAM_ACTIVITY = "activity";
    public final static String PARAM_STREAMS = "streams";
    public final static String PARAM_VIDEO_ES = "video_es";
    public final static String PARAM_AUDIO_ES = "audio_es";
    public final static String PARAM_ID = "id";
    public final static String PARAM_VIDEO = "video";
    public final static String PARAM_AUDIO = "audio";
    public final static String PARAM_ENABLED = "enabled";
    public final static String PARAM_EVENTS = "events";
    public final static String PARAM_EVENT = "event";
    public final static String PARAM_ACTIVE = "active";
    public final static String PARAM_STREAM = "stream";
    public final static String PARAM_SNAPSHOT = "snapshot";
    public final static String PARAM_CAPS = "caps";
    public final static String PARAM_POST_EVENT = "post_event";
    public final static String PARAM_MIC = "mic";
    public final static String PARAM_SPKR = "spkr";
    public final static String PARAM_BACKWARD = "backward";
    public final static String PARAM_STREAM_ID = "stream_id";
    public final static String PARAM_TZ = "tz";
    public final static String PARAM_VENDOR = "vendor";
    public final static String PARAM_VER = "ver";
    public final static String PARAM_CAPS_VIDEO = "caps_video";
    public final static String PARAM_CAPS_AUDIO = "caps_audio";
    public final static String PARAM_FORMATS = "formats";
    public final static String PARAM_FORMAT = "format";
    public final static String PARAM_RESOLUTIONS = "resolutions";
    public final static String PARAM_FPS = "fps";
    public final static String PARAM_GOP = "gop";
    public final static String PARAM_BRT = "brt";
    public final static String PARAM_VBR = "vbr";
    public final static String PARAM_SRT = "srt";
    public final static String PARAM_QUALITY = "quality";
    public final static String PARAM_HORZ = "horz";
    public final static String PARAM_VERT = "vert";
    public final static String PARAM_CONNID = "connid";


    public JsonHelper(String strJSON) {
        try {
            jsonObject = new JSONObject(strJSON);
        } catch (JSONException e) {
            Log.e(TAG, "JsonHelper(String strJSON): ", e);
            jsonObject = new JSONObject();
        }
    }

    public JsonHelper() {
        jsonObject = new JSONObject();
    }

    public JsonHelper(JSONObject jsonObject) {
        this.jsonObject = jsonObject;
    }

    public boolean hasValue(String key) {
        return jsonObject.has(key);
    }

    public boolean hasErrors() {
        return jsonObject.has(STR_ERROR_TYPE);
    }

    public String getErrorDetail() {
        if (hasErrors())
            try {
                return jsonObject.getString(STR_ERROR_DETAIL);
            } catch (JSONException e) {
                Log.e(TAG, "getErrorDetail ", e);
            }

        return null;
    }

    public void put(Object[]... args) {
        for (Object[] val : args) {
            try {
                jsonObject.put((String)val[0], val[1]);
            } catch (JSONException e) {
                Log.e(TAG, "put ", e);
            }
        }
    }
    public void putArrayOfPairs(String name, Object[]... args) {
        JSONArray array = new JSONArray();
        for (Object[] val : args) {
            JSONArray pair_array = new JSONArray();
            pair_array.put(val[0]);
            pair_array.put(val[1]);
            array.put(pair_array);
        }
        try {
            jsonObject.put(name, array);
        } catch (JSONException e) {
            Log.e(TAG, "putArrayOfPairs ", e);
        }
    }
    public void putArray(String name, Object... args) {
        JSONArray array = new JSONArray();
        for (Object val : args)
            array.put(val);
        try {
            jsonObject.put(name, array);
        } catch (JSONException e) {
            Log.e(TAG, "putArray ", e);
        }
    }
    public void putArrayOfString(String name, String [] strings) {
        JSONArray array = new JSONArray();
        try {
            for (String val : strings)
                array.put(val);

            jsonObject.put(name, array);
        } catch (JSONException e) {
            Log.e(TAG, "putArrayOfString ", e);
        }
    }
    public void putArrayOfJson(String name, JsonHelper... args) {
        JSONArray array = new JSONArray();
        try {
        for (JsonHelper val : args)
            array.put(new JSONObject(val.toString()));

            jsonObject.put(name, array);
        } catch (JSONException e) {
            Log.e(TAG, "putArrayOfJson ", e);
        }
    }
    public void putJson(String name, JsonHelper arg) {
        try {
            jsonObject.put(name, new JSONObject(arg.toString()));
        } catch (JSONException e) {
            Log.e(TAG, "putJson ", e);
        }
    }

    public String[] getArrayString(String name) {
        try {
            JSONArray array = jsonObject.getJSONArray(name);
            String [] result = new String[array.length()];

            for (int i = 0; i < array.length(); i++) {
                result[i] = array.getString(i);
            }
            return result;
        } catch (JSONException e) {
            Log.e(TAG, "getArrayString ", e);
            return null;
        }
    }
    public String getString(String name) {
        try {
            return jsonObject.getString(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ");
            return null;
        }
    }
    public int getInt(String name) {
        try {
            return jsonObject.getInt(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ", e);
            return -1;
        }
    }
    public boolean getBoolean(String name) {
        try {
            return jsonObject.getBoolean(name);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ", e);
            return false;
        }
    }

    @Override
    public String toString() {
        return jsonObject.toString();
    }

    public String toString(int s) {
        try {
            return jsonObject.toString(s);
        } catch (JSONException e) {
            Log.e(TAG, "no such mapping exists: ", e);
            return null;
        }
    }

    public static String toJsonString(Object[]... args) {
       return toJsonObject(args) == null ? null : toJsonObject(args).toString();
    }

    public static JSONObject toJsonObject(Object[]... args) {
        try {
            JSONObject auth_info_json = new JSONObject();

            for (Object[] val : args) {
                auth_info_json.put((String)val[0], val[1]);
            }
            return auth_info_json;

        } catch (JSONException e) {
            Log.e(TAG, "toJsonObject ", e);
            return null;
        }
    }
}
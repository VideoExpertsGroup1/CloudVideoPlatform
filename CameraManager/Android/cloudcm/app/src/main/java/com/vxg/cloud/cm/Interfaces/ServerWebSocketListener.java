package com.vxg.cloud.cm.Interfaces;

import com.vxg.cloud.cm.Utils.VEG_WebSocket;
import com.vxg.cloud.cm.Utils.JsonHelper;

import java.net.URI;

public interface ServerWebSocketListener {
    void onCloseWebSocket(URI uri, boolean wasOpened, boolean wasPinged);
    void onErrorWebSocket(VEG_WebSocket.ERROR_TYPE error);
    void onOpenWebSocket();
    void onConfigureReceived(int refid, String orig_cmd, JsonHelper json);
    void onBuyReceived(int refid, String orig_cmd, String reason);
    void onHelloReceived(int refid, String orig_cmd, JsonHelper json);
    void onCamHelloReceived(int refid, String orig_cmd, int cam_id, String media_url, boolean activity);
    void onGetCamStatusReceived(int refid, int cam_id);
    void onGetSupportedStreamsReceived(int refid, int cam_id);
    void onGetCamEventsReceived(int refid, int cam_id);
    void onSetCamEventsReceived(int refid, String orig_cmd, int cam_id);
    void onGetStreamByEventReceived(int refid, int cam_id);
    void onGetCamVideoConfReceived(int refid, int cam_id);
    void onGetCamAudioConfReceived(int refid, int cam_id);
    void onSetCamVideoConfReceived(int refid, String orig_cmd, int cam_id);
    void onSetCamAudioConfReceived(int refid, String orig_cmd, int cam_id);
    void onStreamStartReceived(int refid, String orig_cmd, int cam_id, String stream_id, String reason);
    void onGetStreamCapsReceived(int refid, int cam_id, String[] video_es, String[] audio_es);
    void onGetStreamConfigReceived(int refid, int cam_id, String[] video_es, String[] audio_es);
}
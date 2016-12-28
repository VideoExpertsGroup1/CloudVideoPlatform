package com.vxg.cloud.cm.Interfaces;

import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;

import java.net.URI;

public interface ServerWebSocketListener {
    void onCloseWebSocket(URI uri, boolean wasOpened);
    void onErrorWebSocket(CameraManagerErrors error);
    void onOpenWebSocket();
    void onCamHelloReceived(int refid, String orig_cmd, int cam_id, String media_url, boolean activity);
}
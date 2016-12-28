package com.vxg.cloud.cm.Interfaces;

import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;

public interface WebSocketApiListener {
    void onPreparedCM();
    void onServerConnClose(CameraManagerErrors reason);
    void onUpdatedCameraManagerConfig(CameraManagerConfig config);
}

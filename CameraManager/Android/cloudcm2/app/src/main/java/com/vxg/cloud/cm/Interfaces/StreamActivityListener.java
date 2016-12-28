package com.vxg.cloud.cm.Interfaces;

import com.vxg.cloud.CameraManager.Enums.CameraManagerErrors;

import java.io.File;

public interface StreamActivityListener {
    void logout();
    void availableStream(String mediaServerURL);
    void startStream();
    void stopStream();
    void streamStarted();
    void streamStopped();
    void serverConnClose(CameraManagerErrors error);
    void takePreview(String url);
    void takedCaptureCroppedPreview(File cropPreview);
}

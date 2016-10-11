package com.vxg.cloud.cm.Interfaces;

public interface StreamActivityListener {
    void logout();
    void availableStream(String mediaServerURL);
    void failStartStream();
    void serverConnClose(String error);
}

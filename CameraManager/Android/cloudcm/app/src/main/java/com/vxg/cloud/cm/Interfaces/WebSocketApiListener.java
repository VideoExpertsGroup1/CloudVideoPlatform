package com.vxg.cloud.cm.Interfaces;

public interface WebSocketApiListener {
    void onPreparedCM();
    void OnFailRegisterCM();
    void onServerConnClose(String reason);
}

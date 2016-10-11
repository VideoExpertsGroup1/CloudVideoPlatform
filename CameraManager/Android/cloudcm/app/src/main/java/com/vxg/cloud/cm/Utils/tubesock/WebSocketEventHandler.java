package com.vxg.cloud.cm.Utils.tubesock;


public interface WebSocketEventHandler {
    public void onOpen();

    public void onMessage(WebSocketMessage message);

    public void onClose();

    public void onError(WebSocketException e);

    public void onLogMessage(String msg);
}

package com.vxg.cloud.cm.Interfaces;

import com.vxg.cloud.CameraManager.CameraManagerConfig;

public interface LoginActivityListener {
    void showProgress(boolean mode);
    void onAuthFailure();
    void onSuccessRegistryCamera();
    void onGotRegTokenAfterLogin(String reg_token);
    void onShowError(String errorMessage);
    void updateCameraConfiguration(CameraManagerConfig config);
}

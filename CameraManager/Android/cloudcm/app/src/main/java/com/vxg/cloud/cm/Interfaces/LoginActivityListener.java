package com.vxg.cloud.cm.Interfaces;

public interface LoginActivityListener {
    void onSuccessfulLogin();
    void onIncorrectPassword();
    void onHttpErrors();
    void showProgress(boolean mode);
}

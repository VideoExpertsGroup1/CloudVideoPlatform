package com.vxg.cloud.cm.Interfaces;

public interface UserLoginTaskListener {
    void onSuccessfulLogin();
    void onIncorrectPassword();
    void onCancelled();
    void onHttpErrors();
}
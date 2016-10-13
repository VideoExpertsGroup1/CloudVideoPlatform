package com.vxg.AccoutProvider;

public class AccountProviderInfo {
    private final String TAG = "ServiceProviderToken";
    private String mUsername = null;
    private String mAccountProviderSessionID = null;
    private String mServiceProviderHost = null;
    private String mServiceProviderAuthAppUrl = null;

    public AccountProviderInfo(String username){
        mUsername = username.trim();
    }

    public AccountProviderInfo(){
        // nothing
    }

    public void reset(){
        mAccountProviderSessionID = null;
        mServiceProviderHost = null;
        mServiceProviderAuthAppUrl = null;
    }

    public boolean isEmpty(){
        return (mUsername == null || mAccountProviderSessionID == null || mServiceProviderHost == null || mServiceProviderAuthAppUrl == null);
    }

    public String getUsername(){
        return mUsername;
    }

    public void setAccountProviderSessionID(String accountProviderSessionID){
        mAccountProviderSessionID = accountProviderSessionID;
    }

    public String getAccountProviderSessionID(){
        return mAccountProviderSessionID;
    }

    public void setServiceProviderHost(String serviceProviderHost){
        mServiceProviderHost = serviceProviderHost;
    }

    public String getServiceProviderHost(){
        return mServiceProviderHost;
    }

    public void setServiceProviderAuthAppUrl(String serviceProviderAuthAppUrl){
        mServiceProviderAuthAppUrl = serviceProviderAuthAppUrl;
    }

    public String getServiceProviderAuthAppUrl(){
        return mServiceProviderAuthAppUrl;
    }
}

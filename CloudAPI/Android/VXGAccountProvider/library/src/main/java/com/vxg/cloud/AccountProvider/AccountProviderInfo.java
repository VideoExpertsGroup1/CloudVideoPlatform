//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

package com.vxg.cloud.AccountProvider;

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

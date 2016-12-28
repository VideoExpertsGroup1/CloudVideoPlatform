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

package com.vxg.cloud.CameraManager;

import com.vxg.cloud.CameraManager.Interfaces.CameraManagerClientListener;

public class CameraManagerClient {
    private static String TAG = CameraManagerClient.class.getSimpleName();
    private CameraManagerClientListener mListener = null;
    private CameraManagerConfig mConfig = null;

    public CameraManagerClient(CameraManagerClientListener listener){
        mListener = listener;
        mConfig = new CameraManagerConfig();
    }

    public CameraManagerConfig getConfig(){
        return mConfig;
    }

    public void setConfig(CameraManagerConfig config){
        mConfig = config;
    }
}

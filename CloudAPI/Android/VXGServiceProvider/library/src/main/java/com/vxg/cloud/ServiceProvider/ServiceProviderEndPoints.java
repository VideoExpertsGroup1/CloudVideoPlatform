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

package com.vxg.cloud.ServiceProvider;

public class ServiceProviderEndPoints {
    public static String CAMERAS = "/api/v2/cameras/";
    public static String ACCOUNT_LOGOUT = "/api/v2/account/logout/";
    public static String ACCOUNT_API_TOKEN = "/api/v2/account/token/api/";
    public static String SERVER_TIME = "/api/v2/server/time/";
    public static String CMNGRS = "/api/v2/cmngrs/";
    public static String CAMSESS = "/api/v2/camsess/";

    public static String LIVE_URLS = "/live_urls/";
    public static String ACCOUNT = "/api/v2/account/";

    public static String CAMSESS_PREVIEW_UPDATE(long camsessID) { // TODO
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/preview/update/";
    }

    public static String CAMSESS_RECORDS(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/records/";
    }

    public static String CAMSESS(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/";
    }

    public static String CAMESESS_RECORDS_UPLOAD(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/records/upload/";
    }

    public static String CAMESESS_PREVIEW_UPLOAD(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/preview/upload/";
    }

    public static String CAMERAS_PREVIEW(long cameraID) {
        return ServiceProviderEndPoints.CAMERAS + Long.toString(cameraID) + "/preview/";
    }

    public static String CAMERAS(long cameraID) {
        return ServiceProviderEndPoints.CAMERAS + Long.toString(cameraID) + "/";
    }

    public static String CMNGRS_RESET(long cmngrsID) {
        return ServiceProviderEndPoints.CMNGRS + Long.toString(cmngrsID) + "/reset/";
    }

    public static String CAMSESS_LIVE_STATS(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/live_stats/";
    }

    public static String CAMSESS_CHAT_SEND_MESSAGE(long camsessID) {
        return ServiceProviderEndPoints.CAMSESS + Long.toString(camsessID) + "/chat/send_message/";
    }



}

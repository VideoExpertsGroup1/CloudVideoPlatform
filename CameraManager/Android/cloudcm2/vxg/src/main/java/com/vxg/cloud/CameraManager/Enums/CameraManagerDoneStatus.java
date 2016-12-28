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

package com.vxg.cloud.CameraManager.Enums;

public enum CameraManagerDoneStatus {
    OK, // Success is “OK”. Predefined values are:
    ERROR, // general error
    SYSTEM_ERROR, // system failure
    NOT_SUPPORTED, // functionality is not supported
    INVALID_PARAM, // some parameter in packet is invalid
    MISSED_PARAM, // mandatory parameter is missed in the packet
    TOO_MANY, // list contains too many elements
    RETRY // peer is busy, retry later
}

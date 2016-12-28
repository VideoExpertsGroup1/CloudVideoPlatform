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

public enum CameraManagerByeReasons {
    ERROR, //general application error
    SYSTEM_ERROR, // – system failure on peer
    INVALID_USER, //  user not found
    AUTH_FAILURE, // authentication failure
    CONN_CONFLICT, //there is another alive connection from the CM
    RECONNECT, // no error but reconnection is required
    SHUTDOWN, //CM shutdown or reboot is requested

    // CM has been deleted from account it belonged to. CM must stop all
    // attempts to connect to server and forget all related data:
    // account (user), password, server address and port.
    DELETED
}

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

import Foundation

class CloudAPIToken {
    var token : String = "";
    var type : String = "";
    var expire : String = "";
    
    func fromJSON(jsonData: NSData) {
        do {
            let json = try NSJSONSerialization.JSONObjectWithData(jsonData, options: .MutableContainers)
            let tokenStruct = (json as? NSDictionary)!
            
            if((tokenStruct.objectForKey("token")) != nil){
                self.token = tokenStruct["token"] as! String;
            }
            
            if((tokenStruct.objectForKey("type")) != nil){
                self.type = tokenStruct["type"] as! String;
            }
            
            if((tokenStruct.objectForKey("expire")) != nil){
                self.expire = tokenStruct["expire"] as! String;
            }
        } catch _ {
            return;
        }
        return;
    }
}

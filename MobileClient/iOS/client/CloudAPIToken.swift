//
//  CloudAPIToken.swift
//  VXGCloudClient
//
//  Created by sea-kg on 16.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
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
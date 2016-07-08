//
//  UserProfile.swift
//  VXG Cloud Client
//
//  Created by sea-kg on 15.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation

class UserProfile  {
    var username : String = "";
    var email : String = "";
    var first_name : String = "";
    var last_name : String = "";
    var country : String = "";
    var region : String = "";
    var city : String = "";
    var address : String = "";
    var postcode : String = "";
    var phone : String = "";
    var contact_way : String = "";
    var language : String = "";
    
    func fromJSON(jsonData: NSData) {
        do {
            let json = try NSJSONSerialization.JSONObjectWithData(jsonData, options: .MutableContainers)
            let account = (json as? NSDictionary)!
            
            if((account.objectForKey("username")) != nil){
                self.username = account["username"] as! String;
            }
                
            if((account.objectForKey("email")) != nil){
                self.email = account["email"] as! String;
            }
                
            if((account.objectForKey("first_name")) != nil){
                self.first_name = account["first_name"] as! String;
            }
                
            if((account.objectForKey("last_name")) != nil){
                self.last_name = account["last_name"] as! String;
            }
                
            if((account.objectForKey("country")) != nil){
                self.country = account["country"] as! String;
            }
                
            if((account.objectForKey("region")) != nil){
                self.region = account["region"] as! String;
            }
                
            if((account.objectForKey("city")) != nil){
                self.city = account["city"] as! String;
            }
                
            if((account.objectForKey("address")) != nil){
                self.address = account["address"] as! String;
            }
                
            if((account.objectForKey("postcode")) != nil){
                self.postcode = account["postcode"] as! String;
            }
                
            
            if((account.objectForKey("phone")) != nil){
                self.phone = account["phone"] as! String;
            }
                
            
            if((account.objectForKey("contact_way")) != nil){
                self.contact_way = account["contact_way"] as! String;
            }
                
            
            if((account.objectForKey("language")) != nil){
                self.language = account["language"] as! String;
            }
        } catch _ {
            return;
        }
        return;
    }
}
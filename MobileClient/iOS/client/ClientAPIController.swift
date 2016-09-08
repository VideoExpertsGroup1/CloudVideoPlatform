//
//  ClientAPIController.swift
//  client
//
//  Created by sea-kg on 03.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation
typealias ResponseUserProfile = (Bool, UserProfile) -> Void

class ClientApiController : NSObject {
    
    var m_sLastError : String = "";
    var m_sBaseUrl = "http://cnvrclient2.videoexpertsgroup.com";
    var svcp_auth_web_url = "";
    var svcp_auth_app_url = "";
    var svcp_host = "";
    let session = NSURLSession.sharedSession()
    let jar = NSHTTPCookieStorage.sharedHTTPCookieStorage()

    class var sharedInstance:ClientApiController {
        struct Singleton {
            static let instance = ClientApiController()
        }
        return Singleton.instance
    }
    
    func getLastError() -> String {
        return m_sLastError;
    }
    
    func setBaseUrl(sBaseUrl: String){
        m_sBaseUrl = sBaseUrl;
        print(m_sBaseUrl)
    }
    
    func deleteCookies(){
        
        let url:NSURL = NSURL(string: self.m_sBaseUrl + "/" )!
        
        let cookies = self.jar.cookiesForURL(url)
        for coo in cookies! {
            self.jar.deleteCookie(coo as NSHTTPCookie)
        }
    }
    
    func login(email:String, password:String, onComplete: Response){
        // empty cookies
        self.deleteCookies();

        let login_data = ["username": email, "password": password];
        var jsonData = "";
        do {
            let data : NSData = try NSJSONSerialization.dataWithJSONObject(login_data, options: NSJSONWritingOptions(rawValue: 0))
            jsonData = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
        } catch _ {
            
        }
        
        let url:NSURL = NSURL(string: self.m_sBaseUrl + "/api/v1/account/login/" )!
                
        let request = NSMutableURLRequest(URL: url)
        request.HTTPMethod = "POST"
        request.cachePolicy = NSURLRequestCachePolicy.ReloadIgnoringCacheData
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(String(jsonData.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)), forHTTPHeaderField: "Content-Length")
        print("jsonData: " + jsonData);
        request.HTTPBody = jsonData.dataUsingEncoding(NSUTF8StringEncoding)
        let task = self.session.dataTaskWithRequest(request){(let data, let response, let error) in
            guard let _:NSData = data, let _:NSURLResponse = response  where error == nil else {
                self.m_sLastError = "Failed";
                print("Failed");
                let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
                print(dataString)
                onComplete(false);
                return
            }
            let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print(dataString)
            let jsonData: NSData! = dataString?.dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: true)
            var respJson: NSDictionary;
            var nStatus: Int = 200;
            var errorDetail: String = "";
            do {
                let json = try NSJSONSerialization.JSONObjectWithData(jsonData, options: .MutableContainers)
                respJson = (json as? NSDictionary)!
                if((respJson.objectForKey("status")) != nil){
                    nStatus = respJson["status"] as! Int;
                    errorDetail = respJson["errorDetail"] as! String;
                }else{
                    self.svcp_auth_web_url = respJson["svcp_auth_web_url"] as! String;
                    self.svcp_auth_app_url = respJson["svcp_auth_app_url"] as! String;
                    let url:NSURL = NSURL(string: self.svcp_auth_app_url )!
                    self.svcp_host = url.host!;
                }
            } catch _ {
                self.m_sLastError = (error?.localizedDescription)!;
                onComplete(false);
                return;
            }
            
            if(nStatus != 200){
                self.m_sLastError = errorDetail;
                onComplete(false);
                return;
            }
            onComplete(true);
        }
        task.resume()
    }
    
    func userProfile(onComplete: ResponseUserProfile){
        let url:NSURL = NSURL(string: self.m_sBaseUrl + "/api/v1/account/" )!
        let userProfileData = UserProfile();
        let request = NSMutableURLRequest(URL: url)
        request.HTTPMethod = "GET"
        request.cachePolicy = NSURLRequestCachePolicy.ReloadIgnoringCacheData
        let task = self.session.dataTaskWithRequest(request){(let data, let response, let error) in
            guard let _:NSData = data, let _:NSURLResponse = response  where error == nil else {
                self.m_sLastError = "Failed";
                print("Failed");
                let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
                print(dataString)
                onComplete(false, userProfileData);
                return
            }
            let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print(dataString)
            let jsonData: NSData! = dataString?.dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: true)
            userProfileData.fromJSON(jsonData);
            onComplete(true, userProfileData);
        }
        task.resume();
    }
    
    func updateUserProfile(userProfileData: UserProfile, onComplete: Response){
        let url:NSURL = NSURL(string: self.m_sBaseUrl + "/api/v1/account/" )!
        
        let login_data = [
                "email": userProfileData.email,
                 "first_name": userProfileData.first_name,
                 "last_name": userProfileData.last_name,
                 "country": userProfileData.country,
                 "region": userProfileData.region,
                 "city": userProfileData.city,
                 "address": userProfileData.address,
                 "postcode": userProfileData.postcode,
                 "phone": userProfileData.phone,
                 "contact_way": userProfileData.contact_way
        ];
        var jsonData = "";
        do {
            let data : NSData = try NSJSONSerialization.dataWithJSONObject(login_data, options: NSJSONWritingOptions(rawValue: 0))
            jsonData = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
        } catch _ {
            
        }
        
        // let userProfileData = UserProfile();
        let request = NSMutableURLRequest(URL: url)
        request.HTTPMethod = "PUT"
        request.cachePolicy = NSURLRequestCachePolicy.ReloadIgnoringCacheData
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(String(jsonData.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)), forHTTPHeaderField: "Content-Length")
        request.HTTPBody = jsonData.dataUsingEncoding(NSUTF8StringEncoding)
        let task = self.session.dataTaskWithRequest(request){(let data, let response, let error) in
            guard let _:NSData = data, let _:NSURLResponse = response  where error == nil else {
                self.m_sLastError = "Failed";
                print("Failed");
                let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
                print(dataString)
                onComplete(false);
                return
            }
            let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print(dataString)
            // let jsonData: NSData! = dataString?.dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: true)
            // userProfileData.fromJSON(jsonData);
            onComplete(true);
        }
        task.resume();
    }
    
    func registration(username: String, email:String, password:String, onComplete: Response){
        
        // empty cookies
        self.deleteCookies();
        
        let login_data = [
            "username": username,
            "email": email,
            "password": password];
        var jsonData = "";
        do {
            let data : NSData = try NSJSONSerialization.dataWithJSONObject(login_data, options: NSJSONWritingOptions(rawValue: 0))
            jsonData = NSString(data: data, encoding: NSUTF8StringEncoding)! as String
        } catch _ {
            
        }
        
        let url:NSURL = NSURL(string: self.m_sBaseUrl + "/api/v1/account/register/" )!
        
        let request = NSMutableURLRequest(URL: url)
        request.HTTPMethod = "POST"
        request.cachePolicy = NSURLRequestCachePolicy.ReloadIgnoringCacheData
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(String(jsonData.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)), forHTTPHeaderField: "Content-Length")
        print("jsonData: " + jsonData);
        request.HTTPBody = jsonData.dataUsingEncoding(NSUTF8StringEncoding)
        let task = self.session.dataTaskWithRequest(request){(let data, let response, let error) in
            
            guard let _:NSData = data, let _:NSURLResponse = response  where error == nil else {
                self.m_sLastError = "Failed";
                print("Failed");
                let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
                print(dataString)
                onComplete(false);
                return
            }
            var nStatus: Int = (response as! NSHTTPURLResponse).statusCode
            
            if(nStatus == 200){
                self.m_sLastError = "";
                onComplete(true);
                return;
            }
            
            let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
            print("dataString: " + String(dataString))
            let jsonData: NSData! = dataString?.dataUsingEncoding(NSUTF8StringEncoding, allowLossyConversion: true)
            var respJson: NSDictionary;
            
            var errorDetail: String = "";
            do {
                let json = try NSJSONSerialization.JSONObjectWithData(jsonData, options: .MutableContainers)
                respJson = (json as? NSDictionary)!
                if((respJson.objectForKey("status")) != nil){
                    nStatus = respJson["status"] as! Int;
                    errorDetail = respJson["errorDetail"] as! String;
                }else{
                    // self.svcp_auth_web_url = respJson["svcp_auth_web_url"] as! String;
                    // self.svcp_auth_app_url = respJson["svcp_auth_app_url"] as! String;
                }
            } catch _ {
                if(error != nil){
                    self.m_sLastError = (error?.localizedDescription)!;
                }else{
                    self.m_sLastError = "Something wrong";
                }
                onComplete(false);
                return;
            }
            
            print("Status: " + String(nStatus));
            
            if(nStatus != 200){
                self.m_sLastError = errorDetail;
                onComplete(false);
                return;
            }else{
               self.m_sLastError = "";
            }
            onComplete(true);
        }
        task.resume()
    }


}

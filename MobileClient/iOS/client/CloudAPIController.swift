//
//  CloudAPIController.swift
//  client
//
//  Created by sea-kg on 03.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation

typealias Response = (Bool) -> Void
typealias ResponseString = (Bool, String) -> Void
typealias ResponseCloudAPIToken = (Bool, CloudAPIToken) -> Void

class CloudApiController : NSObject {
    var m_sLastError : String = "";
    var cloudAPIToken : CloudAPIToken = CloudAPIToken();
    let session = NSURLSession.sharedSession()
    let jar = NSHTTPCookieStorage.sharedHTTPCookieStorage()
    
    class var sharedInstance : CloudApiController {
        struct Singleton {
            static let instance = CloudApiController()
        }
        return Singleton.instance
    }
    
    func getApiToken(svcp_auth_app_url: String, onComplete: ResponseCloudAPIToken){
        self.cloudAPIToken = CloudAPIToken();
        let url = NSURL(string: svcp_auth_app_url);
        let request = NSMutableURLRequest(URL: url!)
        request.HTTPMethod = "GET"
        request.cachePolicy = NSURLRequestCachePolicy.ReloadIgnoringCacheData
        let task = self.session.dataTaskWithRequest(request){(let data, let response, let error) in
            guard let _:NSData = data, let _:NSURLResponse = response  where error == nil else {
                self.m_sLastError = "Failed";
                print("Failed");
                let dataString = NSString(data: data!, encoding: NSUTF8StringEncoding)
                print(dataString)
                onComplete(false, self.cloudAPIToken);
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
                    self.cloudAPIToken.fromJSON(jsonData);
                }
            } catch _ {
                self.m_sLastError = (error?.localizedDescription)!;
                onComplete(false, self.cloudAPIToken);
                return;
            }
            
            if(nStatus != 200){
                self.m_sLastError = errorDetail;
                onComplete(false, self.cloudAPIToken);
                return;
            }
            onComplete(true, self.cloudAPIToken);
        }
        task.resume()
    }
}
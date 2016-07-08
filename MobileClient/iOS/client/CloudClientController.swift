//
//  CloudClientController.swift
//  VXGCloudClient
//
//  Created by sea-kg on 16.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation

import UIKit
import JavaScriptCore

/*class WebViewDelegate : UIWebViewDelegate {

 
};*/


class CloudClientController: UIViewController, UIWebViewDelegate {
    
    @IBOutlet var vwParent: UIView!
    @IBOutlet weak var wvCloudClient: UIWebView!
    @IBOutlet weak var vwPlayerLive: UIView!
    @IBOutlet weak var vwPlayerRecord1: UIView!
    @IBOutlet weak var vwPlayerRecord2: UIView!
    @IBOutlet weak var vwLoader: UIView!
    @IBOutlet weak var imgGifLoader: UIImageView!

    let baseURI = "http://auth2-web-1723830871.us-east-1.elb.amazonaws.com/?mobile&login=test"
    var liveContainer : PlayerWrapper! = nil;
    var recordContainer1 : PlayerWrapper! = nil;
    var recordContainer2 : PlayerWrapper! = nil;
    
    func webViewDidFinishLoad(webView: UIWebView){
        if(!webView.loading){
            print("Page loaded");
        }
    }

    override func viewDidLayoutSubviews() {
        if(self.vwLoader.hidden == false){
            Helpers.redrawGradient(self.vwLoader);
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        self.navigationController?.navigationBarHidden = true;
        self.wvCloudClient.scrollView.bounces = false;
        self.wvCloudClient.delegate = self;
        self.vwLoader.hidden = false;
        Helpers.applyGradient(self.vwLoader)
        self.imgGifLoader.image = UIImage.gifWithName("loader_white_330x28")
        let apiToken = CloudApiController.sharedInstance.cloudAPIToken;
        print("Token: " + apiToken.token);
        NSOperationQueue.mainQueue().addOperationWithBlock({
            let url = NSURL(string: self.baseURI + "#token=" + apiToken.token + "&expire=" + apiToken.expire);
            let requestObj = NSURLRequest(URL: url!);
            self.wvCloudClient.loadRequest(requestObj);
            print("loadRequest async?")
            self.initJSContext();
        });
    }
    
    func initJSContext(){
        let context = self.wvCloudClient.valueForKeyPath("documentView.webView.mainFrame.javaScriptContext") as! JSContext;
        
        /*context.exceptionHandler = { context, exception in
            print("[ERROR JS] \(exception)");
        }*/
        
        let logFunction : @convention(block)(String) -> Void = {
            (msg: String) in
            print("[LOG] " + msg)
        }
        
        let errorFunction : @convention(block)(String) -> Void = {
            (msg: String) in
            print("[ERROR] " + msg)
        }
        
        let warnFunction : @convention(block)(String) -> Void = {
            (msg: String) in
            print("[WARN] " + msg)
        }
        context.objectForKeyedSubscript("console").setObject(unsafeBitCast(logFunction, AnyObject.self), forKeyedSubscript: "log")
        context.objectForKeyedSubscript("console").setObject(unsafeBitCast(errorFunction, AnyObject.self), forKeyedSubscript: "error")
        context.objectForKeyedSubscript("console").setObject(unsafeBitCast(warnFunction, AnyObject.self), forKeyedSubscript: "warn")
        initApplicationMobileInterface();
        initPlayerInterface();
    }
    
    func hasPlayerById(playerId: String) -> Bool {
        if(playerId == "live-container"){
            return true;
        }else if(playerId == "record-container1"){
            return true;
        }else if(playerId == "record-container2"){
            return true;
        }
        return false;
    }
    
    func getPlayerById(playerId: String) -> PlayerWrapper {
        var player : PlayerWrapper! = nil;
        if(playerId == "live-container"){
            player = self.liveContainer;
        }else if(playerId == "record-container1"){
            player = self.recordContainer1;
        }else if(playerId == "record-container2"){
            player = self.recordContainer2;
        }
        return player;
    }
    
    func initApplicationMobileInterface(){
        let context = self.wvCloudClient.valueForKeyPath("documentView.webView.mainFrame.javaScriptContext") as! JSContext;
        
        // ApplicationMobileInterface
        context.evaluateScript("window.ApplicationMobileInterface = {}");
        
        // JS: setBackCallback // compabilities for android
        let setBackCallback : @convention(block)(String) -> Void = {
            (handlerName: String) in
            print("setBackCallback " + handlerName)
            // nothing
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(setBackCallback, AnyObject.self), forKeyedSubscript: "setBackCallback")
        
        // JS: setBackCallback // compabilities for android
        let toast : @convention(block)(String) -> Void = {
            (msg: String) in
            print("toast " + msg)
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(toast, AnyObject.self), forKeyedSubscript: "toast")
        
        // JS: getTokenNotifications
        let getTokenNotifications : @convention(block)() -> String = {
            () in
            print("getTokenNotifications: TODO")
            // TODO
            return "TODO";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getTokenNotifications, AnyObject.self), forKeyedSubscript: "getTokenNotifications")
        
        // JS: getPlatform
        let getPlatform : @convention(block)() -> String = {
            () in
            print("getPlatform")
            // TODO
            return "ios";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getPlatform, AnyObject.self), forKeyedSubscript: "getPlatform")
        
        // JS: getApplicationName
        let getApplicationName : @convention(block)() -> String = {
            () in
            print("getApplicationName")
            return "VXG Cloud Client";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getApplicationName, AnyObject.self), forKeyedSubscript: "getApplicationName")
        
        // JS: getDeviceName
        let getDeviceName : @convention(block)() -> String = {
            () in
            print("getDeviceName " + UIDevice.currentDevice().name)
            return UIDevice.currentDevice().name;
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getDeviceName, AnyObject.self), forKeyedSubscript: "getDeviceName")
        
        // JS: getDeviceSecret
        let getDeviceSecret : @convention(block)() -> String = {
            () in
            print("getDeviceSecret: TODO")
            // TODO
            return "TODO";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getDeviceSecret, AnyObject.self), forKeyedSubscript: "getDeviceSecret")
        
        // JS: getApiKey // notifications
        let getApiKey : @convention(block)() -> String = {
            () in
            print("getApiKey: TODO")
            // TODO
            return "TODO";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getApiKey, AnyObject.self), forKeyedSubscript: "getApiKey")
        
        // JS: getGcmLastMessage // notifications
        let getGcmLastMessage : @convention(block)() -> String = {
            () in
            print("getGcmLastMessage: TODO")
            // TODO
            return "TODO";
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(getGcmLastMessage, AnyObject.self), forKeyedSubscript: "getGcmLastMessage")
        
        // JS: resetGcmLastMessage // notifications
        let resetGcmLastMessage : @convention(block)() -> Void = {
            () in
            print("resetGcmLastMessage: TODO")
            // TODO
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(resetGcmLastMessage, AnyObject.self), forKeyedSubscript: "resetGcmLastMessage")
        
        // JS: seeDemo
        let seeDemo : @convention(block)(String) -> Void = {
            (url: String) in
            print("seeDemo: TODO")
            // TODO
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(seeDemo, AnyObject.self), forKeyedSubscript: "seeDemo")
        
        // JS: showUserProfile
        let showUserProfile : @convention(block)() -> Void = {
            () in
            print("showUserProfile")
            NSOperationQueue.mainQueue().addOperationWithBlock({
                self.performSegueWithIdentifier("sgUserProfile", sender: self)
            });
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(showUserProfile, AnyObject.self), forKeyedSubscript: "showUserProfile")
        
        // JS: logout
        let logout : @convention(block)() -> Void = {
            () in
            print("logout")
            NSOperationQueue.mainQueue().addOperationWithBlock({
                self.dismissViewControllerAnimated(true, completion: nil)
            });
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(logout, AnyObject.self), forKeyedSubscript: "logout")
        
        // JS: appStarted
        let webAppStarted : @convention(block)() -> Void = {
            () in
            print("webAppStarted")
            NSOperationQueue.mainQueue().addOperationWithBlock({
                self.vwLoader.hidden = true;
            });
        }
        context.objectForKeyedSubscript("ApplicationMobileInterface").setObject(unsafeBitCast(webAppStarted, AnyObject.self), forKeyedSubscript: "webAppStarted")
    }

    func initPlayerInterface(){
        let context = self.wvCloudClient.valueForKeyPath("documentView.webView.mainFrame.javaScriptContext") as! JSContext;
        // PlayerInterface
        context.evaluateScript("AndroidWebPlayerInterface = {}");
        
        // JS: pause
        let pause : @convention(block)(String) -> Void = {
            (playerId: String) in
            print("pause " + playerId)
            NSOperationQueue.mainQueue().addOperationWithBlock({
                if(self.hasPlayerById(playerId)){
                    self.getPlayerById(playerId).pause();
                }
            });
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(pause, AnyObject.self), forKeyedSubscript: "pause")
        
        // JS: play
        let play : @convention(block)(String) -> Void = {
            (playerId: String) in
            
            print("play " + playerId)

            NSOperationQueue.mainQueue().addOperationWithBlock({
                if(self.hasPlayerById(playerId)){
                    print("Player " + playerId + " call play ")
                    self.getPlayerById(playerId).play();
                }
            });
            
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(play, AnyObject.self), forKeyedSubscript: "play")
        
        // JS: dispose
        let dispose : @convention(block)(String) -> Void = {
            (playerId: String) in
            print("dispose " + playerId);
            NSOperationQueue.mainQueue().addOperationWithBlock({
                if(self.hasPlayerById(playerId)){
                    self.getPlayerById(playerId).close();
                    self.getPlayerById(playerId).dispose();
                }
            });
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(dispose, AnyObject.self), forKeyedSubscript: "dispose")

        // JS: setVolume
        let setVolume : @convention(block)(String, String) -> Void = {
            (playerId: String, val: String) in
            print("setVolume " + playerId + " new value: " + val)
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(setVolume, AnyObject.self), forKeyedSubscript: "setVolume")
        
        // JS: getVolume
        let getVolume : @convention(block)(String) -> String = {
            (playerId: String) in
            print("getVolume " + playerId)
            return "0";
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getVolume, AnyObject.self), forKeyedSubscript: "getVolume")
        
        // JS: setSource
        let setSource : @convention(block)(String, String) -> Void = {
            (playerId: String, url: String) in
            print("setSource " + playerId + ", set url " + url)
            if(self.hasPlayerById(playerId)){
                self.getPlayerById(playerId).setSource(url);
            }
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(setSource, AnyObject.self), forKeyedSubscript: "setSource")
        
        // JS: getSource
        let getSource : @convention(block)(String) -> String = {
            (playerId: String) in
            print("getSource " + playerId)
            var url : String = "";
            if(self.hasPlayerById(playerId)){
                url = self.getPlayerById(playerId).getSource();
            }
            return url;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getSource, AnyObject.self), forKeyedSubscript: "getSource")
        
        // JS: getReadyState
        let getReadyState : @convention(block)(String) -> Int = {
            (playerId: String) in
            print("getReadyState " + playerId)
            var state : Int = 0;
            if(self.hasPlayerById(playerId)){
                state = self.getPlayerById(playerId).isStarted() ? 4 : 0;
            }
            return state;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getReadyState, AnyObject.self), forKeyedSubscript: "getReadyState")
        
        // JS: getCurrentTime
        let getCurrentTime : @convention(block)(String) -> Float = {
            (playerId: String) in
            print("getCurrentTime " + playerId)
            var position : Float = 0.0;
            if(self.hasPlayerById(playerId)){
                position = Float(self.getPlayerById(playerId).getCurrentPosition())/Float(1000);
                print("getCurrentTime " + playerId + ", position: " + String(position))
            }
            return position;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getCurrentTime, AnyObject.self), forKeyedSubscript: "getCurrentTime")
        
        // JS: paused
        let setCurrentTime :
            @convention(block)(String, String) -> Void = {
                (playerId: String, val: String) in
                print("setCurrentTime1 " + playerId + " val " + val);
                var position : Float = (val as NSString).floatValue;
                print("setCurrentTime2 " + playerId + " val " + val);
                position = position*1000;
                print("setCurrentTime3 " + playerId + " val " + val);
                if(self.hasPlayerById(playerId)){
                    print("setCurrentTime4 " + playerId + " val " + val);
                     self.getPlayerById(playerId).setCurrentTime(position);
                }
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(setCurrentTime, AnyObject.self), forKeyedSubscript: "setCurrentTime")
        
        
        // JS: paused
        let paused : @convention(block)(String) -> Bool = {
            (playerId: String) in
            print("paused " + playerId)
            var bPaused : Bool = true;
            if(self.hasPlayerById(playerId)){
                bPaused = !self.getPlayerById(playerId).isStarted();
            }
            return bPaused;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(paused, AnyObject.self), forKeyedSubscript: "paused")
        
        // JS: hide
        let hide : @convention(block)(String) -> Void = {
            (playerId: String) in
            print("hide " + playerId)
            // nothing
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(hide, AnyObject.self), forKeyedSubscript: "hide")
        
        // JS: show
        let show : @convention(block)(String) -> Void = {
            (playerId: String) in
            print("show " + playerId)
            NSOperationQueue.mainQueue().addOperationWithBlock({
                if(playerId != "live-container"){
                    self.vwParent.sendSubviewToBack(self.vwPlayerLive)
                }
                
                if(playerId != "record-container1"){
                    self.vwParent.sendSubviewToBack(self.vwPlayerRecord1)
                }
                
                if(playerId != "record-container2"){
                    self.vwParent.sendSubviewToBack(self.vwPlayerRecord2)
                }
                
                /*if(self.hasPlayerById(playerId)){
                    self.getPlayerById(playerId).close();
                }*/
            });
            
            // TODO
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(show, AnyObject.self), forKeyedSubscript: "show")
        
        // JS: load
        let load : @convention(block)(String) -> Void = {
            (playerId: String) in
            print("load " + playerId)
            // TODO
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(load, AnyObject.self), forKeyedSubscript: "load")

        // JS: readyState
        let readyState : @convention(block)(String) -> Int = {
            (playerId: String) in
            print("readyState " + playerId)
            var state : Int = 0;
            if(self.hasPlayerById(playerId)){
                state = self.getPlayerById(playerId).isStarted() ? 4 : 0;
            }
            return state;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(readyState, AnyObject.self), forKeyedSubscript: "readyState")

        // JS: getVideoHeight
        let getVideoHeight : @convention(block)(String) -> Int = {
            (playerId: String) in
            print("getVideoHeight " + playerId)
            // TODO
            return 1024;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getVideoHeight, AnyObject.self), forKeyedSubscript: "getVideoHeight")
        
        // JS: getVideoWidth
        let getVideoWidth : @convention(block)(String) -> Int = {
            (playerId: String) in
            print("getVideoWidth " + playerId)
            // TODO
            return 480;
        }
        context.objectForKeyedSubscript("AndroidWebPlayerInterface").setObject(unsafeBitCast(getVideoWidth, AnyObject.self), forKeyedSubscript: "getVideoWidth")

        self.liveContainer = PlayerWrapper(viewPlayer: vwPlayerLive, playerID: "live-container");
        self.recordContainer1 = PlayerWrapper(viewPlayer: vwPlayerRecord1, playerID: "record-container1");
        self.recordContainer2 = PlayerWrapper(viewPlayer: vwPlayerRecord2, playerID: "record-container2");
        
        self.liveContainer.setExecCallback(self.execCallback);
        self.recordContainer1.setExecCallback(self.execCallback);
        self.recordContainer2.setExecCallback(self.execCallback);
    }
    
    func execCallback(playerId:String, name:String){
        print("execCallback main " + name);
        let context = self.wvCloudClient.valueForKeyPath("documentView.webView.mainFrame.javaScriptContext") as! JSContext;
        let script = "AndroidRTMPPlayer('" + playerId + "')." + name + "();";
        print("eval script 1: " + script);
        context.evaluateScript(script);
        print("eval script 2: " + script);
    }
}
//
//  Player.swift
//  VXGCloudClient
//
//  Created by sea-kg on 16.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation
import CoreData
import UIKit
import MediaPlayer

typealias ExecuteCallback = (String, String) -> Void

class PlayerWrapper : NSObject, MediaPlayerCallback
{
    private var container: UIView! = nil;
    private var m_bStarted : Bool = false;
    private var m_bEnded : Bool = false;
    private var m_bPlay : Bool = false;
    private var m_bClosed : Bool = true;
    private var m_sUrl : String = "";
    private var m_sPlayerID : String = "";
    private var m_nPosition : Int64 = 0;
    var executeCallback : ExecuteCallback! = nil;
    private var player: MediaPlayer! = nil
    
    var isClosing: Bool = false
    
    init(viewPlayer: UIView, playerID: String)
    {
        self.container = viewPlayer;
        self.m_sPlayerID = playerID;
        
        self.player = MediaPlayer(CGRect(x: 0, y: 0, width: 320, height: 240));
        if(self.player != nil){
            player!.contentView().translatesAutoresizingMaskIntoConstraints = true
            player!.contentView().autoresizingMask = [.FlexibleLeftMargin, .FlexibleRightMargin, .FlexibleTopMargin, .FlexibleBottomMargin, .FlexibleWidth, .FlexibleHeight];
            player!.contentView().bounds  = self.container.bounds
            player!.contentView().center = CGPointMake(self.container.bounds.midX, self.container.bounds.midY)
            
            player!.contentView().userInteractionEnabled = false
            player!.contentView().hidden = true
            self.container.addSubview(player!.contentView())
        }else{
            print("could not init player");
        }
    }
    
    func setSource(url: String){
        if (self.player == nil) {
            print("Player is nil " + url);
            return;
        }
        
        if(self.m_sUrl == url){
            executeCallback_("loadeddata")
            return
        }
        NSOperationQueue.mainQueue().addOperationWithBlock({
            if (self.m_sUrl != "" && self.m_sUrl != url){
                self.close();
            }
            
            self.m_sUrl = url
            
            let config = MediaPlayerConfig();
            config.connectionUrl = self.m_sUrl;
            config.decodingType = 0; // 1 - hardware, 0 - software
            config.synchroEnable = 1; // syncronization enabled
            config.synchroNeedDropVideoFrames = 1; // synchroNeedDropVideoFrames
            
            config.connectionNetworkProtocol = -1; // // 0 - udp, 1 - tcp, 2 - http, 3 - https, -1 - AUTO
            config.connectionDetectionTime = 1000 // in milliseconds
            
            if(self.m_sPlayerID != "live-container"){
                if(self.m_nPosition == 0 && (self.m_sPlayerID == "record-container1" || self.m_sPlayerID == "record-container2")){
                    config.connectionBufferingTime = 3000 // in milliseconds
                }else{
                    config.connectionBufferingTime = 300 // in milliseconds
                }
                
                if(self.m_nPosition > 0){
                    config.startOffest = UInt64(self.m_nPosition);
                }
                config.startPreroll = 1;
                // config.
                
            }else{
                config.connectionBufferingTime = 300 // in milliseconds
            }
            
            // config.connectionBufferingTime = 300 // in milliseconds
            
            // force for preview
            config.aspectRatioMode = 1; // Int32(Settings.sharedInstance.rendererAspectRatioMode)
            config.enableAudio = 1; // 0 - disable, 1 - enable
            
            if(self.player.getState() != MediaPlayerClosed){
                self.player!.Close();
            }
            self.player!.Open(config, callback: self)
        })
    }
    
    func getSource() -> String{
        return self.m_sUrl
    }

    func isStarted() -> Bool
    {
        return m_bStarted
    }
    
    func pause() -> Void{
        m_bPlay = false;
        if(self.player != nil){
            if(m_sPlayerID == "live-container"){
                close();
            }else{
                NSOperationQueue.mainQueue().addOperationWithBlock({
                    if(!self.m_bClosed){
                        self.player?.Pause()
                        print("Set player to pause")
                    }
                });
            }
        }
    }
    
    func play() -> Void{
        m_bPlay = true;
        m_bEnded = false;
        print("Player " + self.m_sPlayerID + " play1 ")
        if(self.player != nil){
            print("Player " + self.m_sPlayerID + " play2 ")
            NSOperationQueue.mainQueue().addOperationWithBlock({
                print("Player " + self.m_sPlayerID + " self.player!.Play(-1); ")
                self.player?.Play(-1);
            });
        }else{
            print("Error player " + self.m_sPlayerID + " is nil ");
        }
    }
    
    func dispose() -> Void{
        if (isClosing){
            return;
        }
        isClosing = true;
        if(self.player == nil){
            return
        }
        print("Player: start close")
        self.player!.Close()
        print("Player: continue close")
        // player!.contentView().removeFromSuperview()
        
        // self.player = nil
        print("Player: close \(m_sPlayerID)")
        isClosing = false;
    }
    
    func close() -> Void
    {
        print("Here close");
        m_bPlay = false;
        m_sUrl = "";
        m_nPosition = 0;
        if(!self.m_bClosed){
            self.player?.Close();
        }
    }
    
    func getCurrentPosition() -> Int64 {
        // in seconds;
        var position : Int64 = 0;
        if(!isClosing && self.player != nil){
             position = self.player.getRenderPosition()
            // self.player.getStreamPosition()
        }
        return position; // in seconds
    }
    
    func setCurrentTime(newPosition: Float) -> Void {
        m_nPosition = Int64(newPosition);
        print("setCurrentTime inside");
        if(player != nil){
            print("setCurrentTime inside2");
            self.player.setStreamPosition(m_nPosition);
        }
        print("setCurrentTime inside3");
    }
    
    func setExecCallback(execCallback : ExecuteCallback){
        self.executeCallback = execCallback
    }
    
    func executeCallback_(name: String) {
        print("executeCallback: " + name)
        if(self.executeCallback != nil){
            NSOperationQueue.mainQueue().addOperationWithBlock({
                self.executeCallback(self.m_sPlayerID,name);
            });
        }
    }
    
    @objc func Status(player: MediaPlayer!, args arg: Int32) -> Int32
    {
        print("Player: callback(\(self.m_sPlayerID)) Status(\(player)): \(arg)")
        print("player status: " + String(arg));
        let uarg : UInt32 = UInt32(arg)
        switch uarg {
        case CP_CONNECT_STARTING.rawValue:
            print("CP_CONNECT_STARTING " + self.m_sPlayerID)
            self.m_bStarted = false;
            self.m_bClosed = false;
            executeCallback_("loadstart")
            break
        case PLP_BUILD_SUCCESSFUL.rawValue:
            print("PLP_BUILD_SUCCESSFUL " + self.m_sPlayerID)
            executeCallback_("loadeddata")
            break
        case PLP_PLAY_PAUSE.rawValue:
            print("PLP_PLAY_PAUSE pause " + self.m_sPlayerID)
            if(m_bPlay && !self.m_bStarted){
                print("PLP_PLAY_PAUSE pause " + self.m_sPlayerID)
                m_bEnded = false;
                m_bStarted = true;
                NSOperationQueue.mainQueue().addOperationWithBlock({
                    print("PLP_PLAY_PAUSE play " + self.m_sPlayerID)
                    self.player?.Play(-1);
                });
            }else{
                m_bStarted = false;
            }
            break
        case PLP_PLAY_SUCCESSFUL.rawValue:
            print("PLP_PLAY_SUCCESSFUL " + self.m_sPlayerID)
            self.m_bStarted = true;
            break
        case PLP_PLAY_PLAY.rawValue:
            print("PLP_PLAY_PLAY " + self.m_sPlayerID)
            if(!m_bPlay && m_bStarted){
                m_bStarted = false;
                // TODO in ui thread
                NSOperationQueue.mainQueue().addOperationWithBlock({
                    print("PLP_PLAY_PLAY Pause() " + self.m_sPlayerID)
                    self.player?.Pause()
                });
            }else{
                m_bStarted = true;
            }
            break
        case CP_CONNECT_SUCCESSFUL.rawValue:
            print("CP_CONNECT_SUCCESSFUL " + self.m_sPlayerID)
            self.m_bEnded = true;
            break
        case PLP_CLOSE_STARTING.rawValue:
            print("PLP_CLOSE_STARTING " + self.m_sPlayerID)
            self.m_bStarted = false;
            break
        case CP_STOPPED.rawValue:
            print("CP_STOPPED " + self.m_sPlayerID)
            self.m_bStarted = false;
            self.m_bClosed = false;
            break
        case CP_RECORD_CLOSED.rawValue:
            print("CP_RECORD_CLOSED " + self.m_sPlayerID)
            self.m_bClosed = true;
            break
        case CP_INTERRUPTED.rawValue:
            print("CP_INTERRUPTED " + self.m_sPlayerID)
            break
        case CP_INIT_FAILED.rawValue:
            print("CP_INIT_FAILED " + self.m_sPlayerID)
            self.m_bClosed = true;
            break
        case VRP_STOPPED.rawValue:
            print("VRP_STOPPED " + self.m_sPlayerID)
            self.m_bClosed = true;
            break
        case PLP_EOS.rawValue:
            print("PLP_EOS " + self.m_sPlayerID)
            if(!m_bEnded){
                m_bEnded = true;
                executeCallback_("ended");
                if(!m_bPlay){
                    NSOperationQueue.mainQueue().addOperationWithBlock({
                        print("PLP_EOS player.close() " + self.m_sPlayerID)
                        self.player?.Close();
                    });
                }
            }
            break
        default:
            break
        }
        return 0
    }
    
    @objc func OnReceiveData(player: MediaPlayer?, buffer: UnsafeMutablePointer<Void>, size: Int32, pts: Int) -> Int32
    {
        return 0
    }
    
    @objc func OnReceiveSubtitleString(player: MediaPlayer?, data: String?, duration: UInt64) -> Int32
    {
        return 0
    }
}


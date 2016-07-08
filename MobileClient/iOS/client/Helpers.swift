//
//  Helpers.swift
//  VXGCloudClient
//
//  Created by sea-kg on 24.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation

class Helpers {
    static var gradientStartColor : UIColor = UIColor(red: 41.0/256.0, green: 128.0/256.0, blue: 185.0/256.0, alpha: 1.0)
    static var gradientStopColor : UIColor = UIColor(red: 0.0/256.0, green: 105.0/256.0, blue: 140.0/256.0, alpha: 1.0)
    
    static func applyGradient(view : UIView){
        // self.vwParent.backgroundColor = UIColor(red: 41.0/255.0, green: 128.0/255.0, blue: 185.0/255.0, alpha: 1.0);
        print("draw gradient");
        view.backgroundColor = gradientStartColor;
        let gradient: CAGradientLayer = CAGradientLayer();
        gradient.frame = UIScreen.mainScreen().bounds;
        gradient.colors = [gradientStartColor.CGColor, gradientStopColor.CGColor]
        print("Count: " + String(view.layer.sublayers?.count))
        view.layer.insertSublayer(gradient, atIndex: 0)
        
    }
    
    static func redrawGradient(view : UIView){
        print("redraw gradient");
        if(view.layer.sublayers != nil){
            view.layer.sublayers?.removeAtIndex(0)
        }
        Helpers.applyGradient(view);
    }
    static func applyButtonStyle(btn : UIButton){
        btn.layer.borderWidth = 1.2;
        btn.layer.borderColor = UIColor.whiteColor().CGColor;
        btn.layer.cornerRadius = 5;
        btn.contentHorizontalAlignment = UIControlContentHorizontalAlignment.Center;
    }
    
    static func applyTextFieldStyle(edt : UITextField){
        edt.layer.borderWidth = 1.2;
        edt.layer.borderColor = UIColor.whiteColor().CGColor;
        edt.layer.cornerRadius = 5;
    }
}
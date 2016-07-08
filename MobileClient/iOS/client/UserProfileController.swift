//
//  UserProfileController.swift
//  VXG Cloud Client
//
//  Created by sea-kg on 15.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation

import UIKit

class UserPlayerViewController: UITableViewController {

    @IBOutlet weak var btnEmail: UIButton!
    @IBOutlet weak var edtEmail: UITextField!
    @IBOutlet weak var edtFirstName: UITextField!
    @IBOutlet weak var edtLastName: UITextField!
    @IBOutlet weak var edtCountry: UITextField!
    @IBOutlet weak var edtRegion: UITextField!
    @IBOutlet weak var edtCity: UITextField!
    @IBOutlet weak var edtAddress: UITextField!
    @IBOutlet weak var edtPostcode: UITextField!
    @IBOutlet weak var edtPhone: UITextField!
    @IBOutlet weak var edtContactWay: UITextField!
    @IBOutlet weak var btnUpdate: UIButton!
    @IBOutlet weak var btnCancel: UIButton!
    @IBOutlet weak var vwParent: UITableViewCell!
    
    override func viewDidLayoutSubviews() {
        Helpers.redrawGradient(self.vwParent);
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        Helpers.applyGradient(self.vwParent)
        
        self.navigationController?.navigationBarHidden = true;
        // Do any additional setup after loading the view, typically from a nib.
        ClientApiController.sharedInstance.userProfile { (bResult, userProfileData) in
            // TODO
            NSOperationQueue.mainQueue().addOperationWithBlock({
                self.btnEmail.setTitle(userProfileData.email, forState: UIControlState.Normal);
                self.edtEmail.text = userProfileData.email;
                self.edtFirstName.text = userProfileData.first_name;
                self.edtLastName.text = userProfileData.last_name;
                self.edtCountry.text = userProfileData.country;
                self.edtRegion.text = userProfileData.region;
                self.edtCity.text = userProfileData.city;
                self.edtAddress.text = userProfileData.address;
                self.edtPostcode.text = userProfileData.postcode;
                self.edtPhone.text = userProfileData.phone;
                self.edtContactWay.text = userProfileData.contact_way;
            });
        }
        Helpers.applyButtonStyle(btnUpdate);
        Helpers.applyButtonStyle(btnCancel);
        // TODO change password
    }
    
    @IBAction func btnEmail_click(sender: AnyObject) {
        NSOperationQueue.mainQueue().addOperationWithBlock({
            self.dismissViewControllerAnimated(true, completion: nil)
        });
    }
    
    
    @IBAction func btnUpdate_click(sender: AnyObject) {
        let userProfileData = UserProfile();
        userProfileData.city = self.edtCity.text!
        userProfileData.email = self.edtEmail.text!;
        userProfileData.first_name = self.edtFirstName.text!;
        userProfileData.last_name = self.edtLastName.text!;
        userProfileData.country = self.edtCountry.text!;
        userProfileData.region = self.edtRegion.text!;
        userProfileData.city = self.edtCity.text!;
        userProfileData.address = self.edtAddress.text!;
        userProfileData.postcode = self.edtPostcode.text!;
        userProfileData.phone = self.edtPhone.text!;
        userProfileData.contact_way = self.edtContactWay.text!;

        ClientApiController.sharedInstance.updateUserProfile(userProfileData, onComplete: {(bResult) in
            // show alert dilaog
            NSOperationQueue.mainQueue().addOperationWithBlock({
                let alertController : UIAlertController = UIAlertController.init(title: "Profile", message: "Profile updated", preferredStyle: UIAlertControllerStyle.Alert)
                let cancel = UIAlertAction(title: "OK", style: .Cancel, handler: nil)
                alertController.addAction(cancel)
                self.presentViewController(alertController, animated: true, completion: nil)
            });
        });
    }
    
    @IBAction func btnCancel_click(sender: AnyObject) {
        NSOperationQueue.mainQueue().addOperationWithBlock({
            self.dismissViewControllerAnimated(true, completion: nil)
        });
    }
}
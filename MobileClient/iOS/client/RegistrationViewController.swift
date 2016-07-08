//
//  RegistrationViewController.swift
//  client
//
//  Created by sea-kg on 03.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import Foundation
import UIKit

class RegistrationViewController: UIViewController {
    
    @IBOutlet var vwParent: UIView!
    @IBOutlet weak var edtUsername: UITextField!
    @IBOutlet weak var edtEmail: UITextField!
    @IBOutlet weak var edtPassword: UITextField!
    @IBOutlet weak var btnSignUp: UIButton!
    @IBOutlet weak var btnSignIn: UIButton!
    @IBOutlet weak var lblStatus: UILabel!
    
    func configureView() {
        
        Helpers.applyTextFieldStyle(edtUsername);
        Helpers.applyTextFieldStyle(edtEmail);
        Helpers.applyTextFieldStyle(edtPassword);
        Helpers.applyButtonStyle(btnSignIn);
        Helpers.applyButtonStyle(btnSignUp);
        
        self.lblStatus.text = "";
    }

    override func viewDidLayoutSubviews() {
        Helpers.redrawGradient(self.vwParent);
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.navigationController?.navigationBarHidden = true;
        Helpers.applyGradient(self.vwParent)
        self.configureView();
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func btnSignUp_click(sender: UIButton) {
        lblStatus.text = "Registring...";
        ClientApiController.sharedInstance.registration(edtUsername.text!, email: edtEmail.text!, password: edtPassword.text!, onComplete: { (bResult) in
            if(bResult){
                NSOperationQueue.mainQueue().addOperationWithBlock({
                    self.lblStatus.text = "";
                    let alertController : UIAlertController = UIAlertController.init(title: "Registration", message: "Registration successfully completed!", preferredStyle: UIAlertControllerStyle.Alert)
                    let cancel = UIAlertAction(title: "OK", style: .Cancel, handler: { (UIAlertAction) -> Void in
                        print("123");
                        self.dismissViewControllerAnimated(true, completion: nil)
                    })
                    alertController.addAction(cancel)
                    self.presentViewController(alertController, animated: true, completion: nil);
                })
            }else{
                NSOperationQueue.mainQueue().addOperationWithBlock({
                    self.lblStatus.text = ClientApiController.sharedInstance.getLastError();
                    let alertController : UIAlertController = UIAlertController.init(title: "Registration failed", message: ClientApiController.sharedInstance.getLastError(), preferredStyle: UIAlertControllerStyle.Alert)
                    let cancel = UIAlertAction(title: "OK", style: .Cancel, handler: nil)
                    alertController.addAction(cancel)
                    self.presentViewController(alertController, animated: true, completion: nil)
                })
                
            }
        })
    }
    
    @IBAction func btnSignIn_click(sender: UIButton) {
        NSOperationQueue.mainQueue().addOperationWithBlock({
            self.dismissViewControllerAnimated(true, completion: nil)
        })
    }
    
    /*@IBAction func btnBack_click(sender: UIBarButtonItem) {
        NSOperationQueue.mainQueue().addOperationWithBlock({
            self.dismissViewControllerAnimated(true, completion: nil)
        })
    }*/
}
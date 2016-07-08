//
//  DetailViewController.swift
//  client
//
//  Created by sea-kg on 03.06.16.
//  Copyright © 2016 Video Experts Group. All rights reserved.
//

import UIKit

class LoginViewController: UIViewController {


    @IBOutlet weak var edtLogin: UITextField!
    @IBOutlet weak var edtPassword: UITextField!
    @IBOutlet weak var btnSignIn: UIButton!
    @IBOutlet weak var btnSignUp: UIButton!
    
    @IBOutlet weak var lblStatus: UILabel!
    @IBOutlet var vwParent: UIView!
    @IBOutlet weak var imgLogo: UIImageView!
    
    var detailItem: AnyObject? {
        didSet {
            // Update the view.
            self.configureView()
        }
    }

    func configureView() {
        edtLogin.layer.borderWidth = 1.2;
        edtLogin.layer.borderColor = UIColor.whiteColor().CGColor;
        edtLogin.layer.cornerRadius = 5;
        
        edtPassword.layer.borderWidth = 1.2;
        edtPassword.layer.borderColor = UIColor.whiteColor().CGColor;
        edtPassword.layer.cornerRadius = 5;
        
        edtLogin.layer.borderWidth = 1.2;
        edtLogin.layer.borderColor = UIColor.whiteColor().CGColor;
        edtLogin.layer.cornerRadius = 5;
        

        btnSignIn.layer.borderWidth = 1.2;
        btnSignIn.layer.borderColor = UIColor.whiteColor().CGColor;
        btnSignIn.layer.cornerRadius = 5;
        btnSignIn.contentHorizontalAlignment = UIControlContentHorizontalAlignment.Center;
        
        btnSignUp.layer.borderWidth = 1.2;
        btnSignUp.layer.borderColor = UIColor.whiteColor().CGColor;
        btnSignUp.layer.cornerRadius = 5;
        btnSignUp.contentHorizontalAlignment = UIControlContentHorizontalAlignment.Center;
    }
    
    override func didRotateFromInterfaceOrientation(fromInterfaceOrientation: UIInterfaceOrientation) {
        if(imgLogo.frame.origin.y < 0){
            imgLogo.hidden = true;
        }else{
            imgLogo.hidden = false;
        }
    }
    
    override func viewDidLayoutSubviews() {
        Helpers.redrawGradient(self.vwParent);
        
        if(imgLogo.frame.origin.y < 0){
            imgLogo.hidden = true;
        }else{
            imgLogo.hidden = false;
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        self.navigationController?.navigationBarHidden = true;
        // Do any additional setup after loading the view, typically from a nib.
        self.configureView()
        Helpers.applyGradient(self.vwParent)
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func btnSignIn_click(sender: AnyObject) {
        lblStatus.text = "Login...";
        ClientApiController.sharedInstance.login(edtLogin.text!, password: edtPassword.text!, onComplete: { (bResult) in
            if(bResult){
                CloudApiController.sharedInstance.getApiToken(ClientApiController.sharedInstance.svcp_auth_app_url, onComplete: { bResult, apiToken in
                    print(apiToken.token);
                    NSOperationQueue.mainQueue().addOperationWithBlock({
                        self.lblStatus.text = "";
                        self.performSegueWithIdentifier("sgCloudClient", sender: self)
                    })
                });
            }else{
                NSOperationQueue.mainQueue().addOperationWithBlock({
                   self.lblStatus.text = ClientApiController.sharedInstance.getLastError();
                    
                    let alertController : UIAlertController = UIAlertController.init(title: "Login failed", message: ClientApiController.sharedInstance.getLastError(), preferredStyle: UIAlertControllerStyle.Alert)
                    let cancel = UIAlertAction(title: "OK", style: .Cancel, handler: nil)
                    alertController.addAction(cancel)
                    self.presentViewController(alertController, animated: true, completion: nil)
                })
                
            }
        })
    }
    
    @IBAction func btnSignUp_click(sender: UIButton) {
        NSOperationQueue.mainQueue().addOperationWithBlock({
            self.lblStatus.text = "";
            self.performSegueWithIdentifier("sgSignup", sender: self)
        })
    }

}


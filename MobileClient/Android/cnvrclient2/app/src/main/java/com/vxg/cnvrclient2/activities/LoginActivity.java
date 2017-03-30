//
//  Copyright © 2016 VXG Inc. All rights reserved.
//  Contact: https://www.videoexpertsgroup.com/contact-vxg/
//  This file is part of the demonstration of the VXG Cloud Platform.
//
//  Commercial License Usage
//  Licensees holding valid commercial VXG licenses may use this file in
//  accordance with the commercial license agreement provided with the
//  Software or, alternatively, in accordance with the terms contained in
//  a written agreement between you and VXG Inc. For further information
//  use the contact form at https://www.videoexpertsgroup.com/contact-vxg/
//

package com.vxg.cnvrclient2.activities;

import android.accounts.AccountManager;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Configuration;
import android.graphics.Rect;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Parcelable;
import android.preference.PreferenceManager;
import android.util.Log;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.ScrollView;

import com.google.android.gms.auth.GoogleAuthException;
import com.google.android.gms.auth.GoogleAuthUtil;
import com.google.android.gms.auth.UserRecoverableAuthException;
import com.google.android.gms.common.AccountPicker;
import com.google.android.gms.common.SignInButton;
import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;
import com.vxg.cnvrclient2.R;
import com.vxg.cnvrclient2.Tasks.LoadConfigTask;
import com.vxg.cnvrclient2.controllers.LoginController;

import java.io.IOException;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Stack;
import java.util.TimeZone;

public class LoginActivity extends Activity {
    private String TAG = LoginActivity.class.getSimpleName();
    private LoginController controller = LoginController.inst();
    private SignInButton mSignInButton = null;
    private View mViewLoginForm = null;
    private ScrollView mBackgroundScrollView = null;
    private ScrollView mBackgroundScrollView_progress = null;
    private final static String G_PLUS_SCOPE =
            "oauth2:https://www.googleapis.com/auth/plus.me";
    private final static String USERINFO_SCOPE =
            "https://www.googleapis.com/auth/userinfo.profile";
    private final static String EMAIL_SCOPE =
            "https://www.googleapis.com/auth/userinfo.email";
    private final static String SCOPES = G_PLUS_SCOPE + " " + USERINFO_SCOPE + " " + EMAIL_SCOPE;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.login_activity);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);

        checkSettings();

        // ActionBar bar = getActionBar();
        // bar.setBackgroundDrawable(getResources().getDrawable(R.drawable.btn_seedemo_cnvrclient2));

        mBackgroundScrollView = (ScrollView) findViewById(R.id.backgroundScrollView);
        mBackgroundScrollView_progress = (ScrollView) findViewById(R.id.backgroundScrollView_progress);

        Button btn_login_signIn = (Button) findViewById(R.id.btn_login_signIn);
        btn_login_signIn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                EditText edt_login_username = (EditText) findViewById(R.id.edt_login_username);
                EditText edt_login_password = (EditText) findViewById(R.id.edt_login_password);
                controller.tryLogin(edt_login_username.getText().toString(), edt_login_password.getText().toString());
            }
        });

        Button btnSignUp = (Button) findViewById(R.id.btnSignUp);
        btnSignUp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = new Intent(LoginActivity.this, RegistrationActivity.class);
                startActivity(intent);
            }
        });

        ImageButton btn_gplus_login = (ImageButton) findViewById(R.id.btn_gplus_login);
        btn_gplus_login.setImageResource(R.drawable.btn_google_signin);
        btn_gplus_login.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                mBackgroundScrollView_progress.setVisibility(View.VISIBLE);
                mBackgroundScrollView.setVisibility(View.GONE);

                Intent intent = new Intent(LoginActivity.this, CloudClientActivity.class);
                intent.putExtra("loginByGoogle",true);
                startActivity(intent);
            }
        });

        // another method
        mSignInButton = (SignInButton) findViewById(R.id.btn_sign_in_google);
        mSignInButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent = AccountPicker.newChooseAccountIntent(null, null, new String[]{"com.google"},
                        false, null, null, null, null);
                startActivityForResult(intent, 123);
            }
        });

        Button btnSeeDemo = (Button) findViewById(R.id.btnSeeDemo);
        btnSeeDemo.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                controller.tryLoginDemo();
            }
        });
        mViewLoginForm = (View) findViewById(R.id.viewLoginForm);

        // hide log if keyboard is opened
        final View activityRootView = findViewById(R.id.loginActivityRoot);
        activityRootView.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                Rect r = new Rect();
                activityRootView.getWindowVisibleDisplayFrame(r);
                int screenHeight = activityRootView.getRootView().getHeight();

                // r.bottom is the position above soft keypad or device button.
                // if keypad is shown, the r.bottom is smaller than that before.
                int keypadHeight = screenHeight - r.bottom;
                // Log.d(TAG, "keypadHeight = " + keypadHeight);
                if (keypadHeight > screenHeight * 0.15) { // 0.15 ratio is perhaps enough to determine keypad height.
                    // keyboard is opened
                    ImageView iv = (ImageView) findViewById(R.id.imgLogo);
                    iv.setVisibility(View.GONE);

                    FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                    params.gravity = Gravity.TOP;
                    mViewLoginForm.setLayoutParams(params);
                } else {
                    // keyboard is closed
                    // only if not portrait
                    if(getResources().getConfiguration().orientation != Configuration.ORIENTATION_LANDSCAPE) {
                        ImageView iv = (ImageView) findViewById(R.id.imgLogo);
                        iv.setVisibility(View.VISIBLE);

                        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                        params.gravity = Gravity.CENTER;
                        mViewLoginForm.setLayoutParams(params);
                    }
                }
            }
        });
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            case R.id.action_settings:
                Intent intent = new Intent(LoginActivity.this, SettingsActivity.class);
                startActivity(intent);
                return true;

            case R.id.action_about:
                AlertDialog.Builder builder = new AlertDialog.Builder(LoginActivity.this);
                try {
                    builder.setTitle("About")
                        .setMessage("Version: " + getPackageManager().getPackageInfo(getPackageName(), 0).versionName)
                        .setIcon(R.drawable.ic_launcher)
                        .setCancelable(false)
                        .setNegativeButton("OK",
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    dialog.cancel();
                                }
                            });
                } catch (PackageManager.NameNotFoundException e) {
                    e.printStackTrace();
                }
                AlertDialog alert = builder.create();
                alert.show();
                return true;

            default:
                // If we got here, the user's action was not recognized.
                // Invoke the superclass to handle it.
                return super.onOptionsItemSelected(item);
        }
    }

    @Override
    protected void onActivityResult(final int requestCode, final int resultCode,
                                    final Intent data) {
        if (requestCode == 123 && resultCode == RESULT_OK) {
            final String accountName = data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
            AsyncTask<Void, Void, String> getToken = new AsyncTask<Void, Void, String>() {
                @Override
                protected String doInBackground(Void... params) {
                    String token = null;
                    try {
                        token = GoogleAuthUtil.getToken(LoginActivity.this, accountName,
                                SCOPES);
                        return token;

                    } catch (UserRecoverableAuthException userAuthEx) {
                        startActivityForResult(userAuthEx.getIntent(), 123);
                    }  catch (IOException ioEx) {
                        Log.d(TAG, "IOException");
                    }  catch (GoogleAuthException fatalAuthEx)  {
                        Log.d(TAG, "Fatal Authorization Exception" + fatalAuthEx.getLocalizedMessage());
                    }
                    return token;
                }

                @Override
                protected void onPostExecute(String token) {
                    Log.i(TAG, "Google token: " + token);
                    if(token != null)
                        test_send_gtoken(token);
                }

            };
            getToken.execute(null, null, null);
        }
    }

    public Intent createEmailOnlyChooserIntent(Intent source, CharSequence chooserTitle)
    {
        Stack<Intent> intents = new Stack<Intent>();
        Intent i = new Intent(Intent.ACTION_SENDTO, Uri.fromParts("mailto", "info@domain.com", null));
        List<ResolveInfo> activities = getPackageManager().queryIntentActivities(i, 0);

        for(ResolveInfo ri : activities)
        {
            Intent target = new Intent(source);
            target.setPackage(ri.activityInfo.packageName);
            intents.add(target);
        }

        if(!intents.isEmpty())
        {
            Intent chooserIntent = Intent.createChooser(intents.remove(0), chooserTitle);
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intents.toArray(new Parcelable[intents.size()]));
            return chooserIntent;
        }
        else
        {
            return Intent.createChooser(source, chooserTitle);
        }
    }

    public void test_send_gtoken(String google_token){
        Log.v(TAG, "=>test_send_gtoken()");

        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("*/*");

        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        fmt.setTimeZone(TimeZone.getTimeZone("GMT"));
        String date = fmt.format(new Date());
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        i.putExtra(Intent.EXTRA_EMAIL, new String[] { "ip@videoexpertsgroup.com", "tsibenko@videoexpertsgroup.com", "evgenii@videoexpertsgroup.com" });
        i.putExtra(Intent.EXTRA_SUBJECT, "CNVRClient2 Google Token (" + date + ")");
        //i.putExtra(Intent.EXTRA_TEXT, "Some crash report details");
        i.putExtra(Intent.EXTRA_TEXT, "Google Token: " + google_token + "\nWarning: Token will be expired after 10 minutes");
        startActivity(createEmailOnlyChooserIntent(i, "Send via email"));

        Log.v(TAG, "<=test_send_gtoken()");
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);

        // Checks the orientation of the screen
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            ImageView iv = (ImageView) findViewById(R.id.imgLogo);
            iv.setVisibility(View.GONE);
        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT){
            ImageView iv = (ImageView) findViewById(R.id.imgLogo);
            iv.setVisibility(View.VISIBLE);
        }
    }

    @Override
    protected void onResume(){
        super.onResume();
        controller.setActivity(this);
        controller.refreshActivityState();
    }

    @Override
    protected void onPause(){
        super.onPause();
        controller.resetActivity();
    }

    private void showErrorBox(String sTitle, String sError){
        AlertDialog.Builder builder = new AlertDialog.Builder(LoginActivity.this);
        builder.setTitle(sTitle)
                .setMessage(sError)
                .setIcon(R.drawable.ic_launcher)
                .setCancelable(false)
                .setNegativeButton("OK",
                new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });

        AlertDialog alert = builder.create();
        alert.show();
    }

    public void onUpdateState(int s){
        if(s == LoginController.LOGIN_START){
            Log.i(TAG, "LOGIN_START");
            mBackgroundScrollView.setVisibility(View.VISIBLE);
            mBackgroundScrollView_progress.setVisibility(View.GONE);
        }else if(s == LoginController.LOGIN_PROGRESS){
            Log.i(TAG, "LOGIN_PROGRESS");
            mBackgroundScrollView.setVisibility(View.GONE);
            mBackgroundScrollView_progress.setVisibility(View.VISIBLE);
        }else if(s == LoginController.LOGIN_FAIL){
            Log.i(TAG, "LOGIN_FAIL");
            String sError = controller.getLoginError();
            if(!sError.isEmpty()) {
                showErrorBox("Login failed", sError);
            }
            controller.updateActivityState(LoginController.LOGIN_START);
        }else if(s == LoginController.LOGIN_OK){
            Log.i(TAG, "LOGIN_OK");
            mBackgroundScrollView.setVisibility(View.VISIBLE);
            mBackgroundScrollView_progress.setVisibility(View.GONE);
            Intent intent = new Intent(LoginActivity.this, CloudClientActivity.class);
            intent.putExtra("demo",controller.isDemo());
            startActivity(intent);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        super.onCreateOptionsMenu(menu);
        getMenuInflater().inflate(R.menu.main_menu, menu);
        return true;
    }

    private void checkSettings(){
        Log.i(TAG, "checkSettings");
        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        SettingsActivity.mLastValidCode = sharedPref.getString(SettingsActivity.PREF_CUSTOMER_CODE, "");
        Boolean use_custom = sharedPref.getBoolean(SettingsActivity.PREF_CUSTOMER_CODE_SWITCH, false);
        if(use_custom){
            Log.i(TAG, "checkSettings code = " + SettingsActivity.mLastValidCode);
            ServiceProviderHelper.executeAsyncTask(new LoadConfigTask(getApplicationContext(), SettingsActivity.mLastValidCode, false));
        }else{
            Log.i(TAG, "checkSettings use default");
        }
    }
}

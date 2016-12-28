package com.vxg.cloud.cm.activities;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.TextView;

import com.vxg.cloud.AccountProvider.AccountProviderAPI;
import com.vxg.cloud.CameraManager.CameraManagerConfig;
import com.vxg.cloud.ServiceProvider.ServiceProviderHelper;
import com.vxg.cloud.cm.Control.StreamController;
import com.vxg.cloud.cm.Interfaces.LoginActivityListener;
import com.vxg.cloud.cm.Objects.CameraConfiguration;
import com.vxg.cloud.cm.R;
import com.vxg.cloud.cm.Tasks.AccountProviderLoginTask;

public class LoginActivity extends AppCompatActivity implements LoginActivityListener {
    private final String TAG = LoginActivity.class.getSimpleName();

    private StreamController mStreamController;

    private EditText mEditTextRegToken;
    private EditText mEditTextUsername;
    private EditText mEditTextPassword;
    private View mProgressFormView;
    private View mRegTokenFormView;
    private View mSwitcherFormView;
    private View mLoginFormView;
    private TextView tvVersionApp;
    private AlertDialog.Builder errorDialogBuilder;
    private AlertDialog errorDialog;

    private boolean inProcessing = false;
    private enum ActivityLoginMode{
        SWITCHER,
        LOGIN,
        REG_TOKEN
    }
    private ActivityLoginMode mMode = ActivityLoginMode.SWITCHER;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.v(TAG, "onCreate()");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);
        mEditTextRegToken = (EditText) findViewById(R.id.txt_reg_token);
        mEditTextUsername = (EditText) findViewById(R.id.txt_username);
        mEditTextPassword = (EditText) findViewById(R.id.txt_password);

        Button btn_registry_camera = (Button) findViewById(R.id.btn_registry_camera);
        if (btn_registry_camera != null) {
            btn_registry_camera.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View view) {
                    View focused_view = getCurrentFocus();
                    if (focused_view != null) {
                        InputMethodManager imm = (InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                        imm.hideSoftInputFromWindow(focused_view.getWindowToken(), 0);
                    }

                    mStreamController = StreamController.getInstance(getApplicationContext());
                    mStreamController.setLoginActivityListener(LoginActivity.this);
                    registryCamera();
                }
            });
        }

        mRegTokenFormView = findViewById(R.id.reg_token_form);
        mSwitcherFormView = findViewById(R.id.switcher_form);
        mLoginFormView = findViewById(R.id.login_form);

        mProgressFormView = findViewById(R.id.progress_form);
        errorDialogBuilder = new AlertDialog.Builder(LoginActivity.this);

        tvVersionApp = (TextView) findViewById(R.id.tvVersionApp);
        try {
            String s = "Ver. " + getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            tvVersionApp.setText(s);
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "tvVersionApp.setText: ",e );
        }

        Button switcher_next = (Button) findViewById(R.id.switcher_next);
        switcher_next.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                RadioButton to_reg_token_form = (RadioButton) findViewById(R.id.to_reg_token_form);
                RadioButton to_login_form = (RadioButton) findViewById(R.id.to_login_form);

                if(to_reg_token_form.isChecked()){
                    mMode = ActivityLoginMode.REG_TOKEN;
                    showProgress(false); // Update UI
                }else if (to_login_form.isChecked()){
                    mMode = ActivityLoginMode.LOGIN;
                    showProgress(false); // Update UI
                }
            }
        });

        Button btn_signin = (Button) findViewById(R.id.btn_signin);
        btn_signin.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                View focused_view = getCurrentFocus();
                if (focused_view != null) {
                    InputMethodManager imm = (InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                    imm.hideSoftInputFromWindow(focused_view.getWindowToken(), 0);
                }
                mStreamController = StreamController.getInstance(getApplicationContext());
                mStreamController.setLoginActivityListener(LoginActivity.this);
                showProgress(true);
                registryCameraByAccp();
            }
        });

        // auto start
        CameraManagerConfig config = CameraConfiguration.loadCameraManagerConfig(getApplicationContext());
        Log.i(TAG, "onCreate CameraConfiguration config.getUUID() = " + config.getUUID());
        if(!config.getUUID().equals("")){
            showProgress(true);
            View focused_view = getCurrentFocus();
            if (focused_view != null) {
                InputMethodManager imm = (InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(focused_view.getWindowToken(), 0);
            }

            mStreamController = StreamController.getInstance(getApplicationContext());
            mStreamController.setLoginActivityListener(LoginActivity.this);
            mStreamController.prepareCM(null);
        }
    }

    @Override
    public void showProgress(final boolean show) {
        inProcessing = show;
        if(show) {
            mProgressFormView.setVisibility(View.VISIBLE);
            mRegTokenFormView.setVisibility(View.GONE);
            mSwitcherFormView.setVisibility(View.GONE);
            mLoginFormView.setVisibility(View.GONE);
        }else{
            mProgressFormView.setVisibility(View.GONE);
            mRegTokenFormView.setVisibility(mMode == ActivityLoginMode.REG_TOKEN ? View.VISIBLE : View.GONE);
            mSwitcherFormView.setVisibility(mMode == ActivityLoginMode.SWITCHER ? View.VISIBLE : View.GONE);
            mLoginFormView.setVisibility(mMode == ActivityLoginMode.LOGIN ? View.VISIBLE : View.GONE);
        }
    }

    @Override
    public void onAuthFailure(){
        LoginActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                errorDialogBuilder.setTitle("Error");
                errorDialogBuilder.setMessage("Invalid reg token. Try another reg token.");
                errorDialogBuilder.setNegativeButton(
                        "OK",
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                errorDialog.dismiss();
                                showProgress(false);
                            }
                        }
                );
                errorDialogBuilder.setCancelable(false);
                errorDialog = errorDialogBuilder.show();
            }
        });
    }

    @Override
    public void onShowError(final String errorMessage){
        LoginActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                errorDialogBuilder.setTitle("Error");
                errorDialogBuilder.setMessage(errorMessage);
                errorDialogBuilder.setNegativeButton(
                        "OK",
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                errorDialog.dismiss();
                                showProgress(false);
                            }
                        }
                );
                errorDialogBuilder.setCancelable(false);
                errorDialog = errorDialogBuilder.show();
            }
        });
    }

    @Override
    public void onGotRegTokenAfterLogin(String reg_token){
        mStreamController.registryCamera(reg_token);
    }

    @Override
    public void onSuccessRegistryCamera(){
        LoginActivity.this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Log.i(TAG, "onSuccessRegistryCamera");
                startActivity(new Intent(getApplicationContext(), StreamActivity.class));
                showProgress(false);
            }
        });
    }

    @Override
    public void updateCameraConfiguration(CameraManagerConfig config){
        Log.i(TAG, "updateCameraConfiguration");
        Log.i(TAG, "updateCameraConfiguration, config.getConnID(): " + config.getConnID());
        CameraConfiguration.saveCameraManagerConfig(getApplicationContext(), config);
    }

    @Override
    protected void onResume() {
        Log.d(TAG, "onResume()");
        super.onResume();
        if (mStreamController != null)
            mStreamController.refreshLoginViews();
    }

    @Override
    protected void onPause() {
        Log.d(TAG, "onPause()");
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        Log.d(TAG, "onDestroy()");
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (!inProcessing) {
            if(mMode == ActivityLoginMode.SWITCHER){
                finish();
            }else{
                mMode = ActivityLoginMode.SWITCHER;
                showProgress(false);
            }
            //mStreamController.release(); TODO check ??
        } else {
            // mStreamController.cancelAuthenticationUser();
        }
    }

    private void registryCamera() {
        // Store values at the time of the login attempt.
        String reg_token = mEditTextRegToken.getText().toString();

        boolean cancel = false;
        View focusView = null;

        if (cancel) {
            focusView.requestFocus();
        } else {
            mStreamController.registryCamera(reg_token);
        }
    }

    private void registryCameraByAccp(){
        String username = mEditTextUsername.getText().toString().trim();
        String password = mEditTextPassword.getText().toString();

        ServiceProviderHelper.executeAsyncTask(new AccountProviderLoginTask(username, password, this));
    }
}
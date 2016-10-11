package com.vxg.cloud.cm.Views;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.vxg.cloud.cm.Control.CaptureStreamingController;
import com.vxg.cloud.cm.Interfaces.LoginActivityListener;
import com.vxg.cloud.cm.R;


public class LoginActivity extends AppCompatActivity implements LoginActivityListener {
    private final String TAG = LoginActivity.class.getSimpleName();

    private CaptureStreamingController controller;

    private EditText mEmailView;
    private EditText mPasswordView;
    private View mProgressView;
    private View mProgressFormView;
    private View mLoginFormView;
    private TextView tvVersionApp;
    private Button mEmailSignInButton;

    private boolean inProcessing = false;


    // LoginActivityListener
    @Override
    public void onSuccessfulLogin() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {

                showProgress(false);
                Toast.makeText(
                        LoginActivity.this,
                        getString(R.string.toast_on_successful_login),
                        Toast.LENGTH_SHORT
                ).show();
                if (controller != null)
                    controller.unsetLoginActivityListener();
                startActivity(new Intent(getApplicationContext(), StreamActivity.class));
                //finish();
            }
        });
    }
    @Override
    public void onIncorrectPassword() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                showProgress(false);
                mPasswordView.setError(getString(R.string.error_incorrect_password));
                mPasswordView.requestFocus();
            }
        });

    }
    @Override
    public void onHttpErrors() {
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                showProgress(false);
                Toast.makeText(
                        LoginActivity.this,
                        getString(R.string.toast_on_http_error),
                        Toast.LENGTH_SHORT
                ).show();
            }
        });

    }
    @Override
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
    public void showProgress(final boolean show) {
        inProcessing = show;

        // On Honeycomb MR2 we have the ViewPropertyAnimator APIs, which allow
        // for very easy animations. If available, use these APIs to fade-in
        // the progress spinner.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
            int shortAnimTime = getResources().getInteger(android.R.integer.config_shortAnimTime);

            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
            mLoginFormView.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
                }
            });

            mProgressFormView.setVisibility(show ? View.VISIBLE : View.GONE);
            mProgressFormView.animate().setDuration(shortAnimTime).alpha(
                    show ? 1 : 0).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mProgressFormView.setVisibility(show ? View.VISIBLE : View.GONE);
                }
            });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            mProgressFormView.setVisibility(show ? View.VISIBLE : View.GONE);
            mLoginFormView.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Log.v(TAG, "onCreate()");
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        android.support.v7.app.ActionBar ab = getSupportActionBar();
        if (ab != null) {
            ab.setDisplayShowHomeEnabled(true);
            ab.setIcon(R.drawable.app_logo);
        }

        mEmailView = (EditText) findViewById(R.id.email);
        mPasswordView = (EditText) findViewById(R.id.password);
        mPasswordView.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                if (actionId == EditorInfo.IME_ACTION_DONE) {
                    mEmailSignInButton.performClick();
                    return true;
                }
                return false;
            }
        });

        mEmailSignInButton = (Button) findViewById(R.id.email_sign_in_button);
        if (mEmailSignInButton != null) {
            mEmailSignInButton.setOnClickListener(new OnClickListener() {
                @Override
                public void onClick(View view) {
                    View focused_view = getCurrentFocus();
                    if (focused_view != null) {
                        InputMethodManager imm = (InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                        imm.hideSoftInputFromWindow(focused_view.getWindowToken(), 0);
                    }

                    controller = CaptureStreamingController.getInstance(getApplicationContext());
                    controller.setLoginActivityListener(LoginActivity.this);

                    attemptLogin();
                }
            });
        }

        mLoginFormView = findViewById(R.id.login_form);
        mProgressFormView = findViewById(R.id.progress_form);
        mProgressView = findViewById(R.id.login_progress);

        mEmailView.setText(
                PreferenceManager.getDefaultSharedPreferences(this).getString("LAST_LOGIN", "")
        );
        mPasswordView.setText(
                PreferenceManager.getDefaultSharedPreferences(this).getString("LAST_PASS","")
        );

        tvVersionApp = (TextView) findViewById(R.id.tvVersionApp);
        try {
            tvVersionApp.setText("Ver. " + getPackageManager().getPackageInfo(getPackageName(), 0).versionName);
        } catch (PackageManager.NameNotFoundException e) {
            Log.e(TAG, "tvVersionApp.setText: ",e );
        }
    }

    @Override
    protected void onResume() {
        Log.d(TAG, "onResume()");
        super.onResume();
        if (controller != null)
            controller.refreshLoginViews();
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
            //controller.release(); TODO check ??
            finish();
        }
        else
            controller.cancelAuthenticationUser();
    }

    /**
     * Attempts to sign in or register the account specified by the login form.
     * If there are form errors (invalid email, missing fields, etc.), the
     * errors are presented and no actual login attempt is made.
     */
    private void attemptLogin() {
        // Reset errors.
        mEmailView.setError(null);
        mPasswordView.setError(null);

        // Store values at the time of the login attempt.
        String email = mEmailView.getText().toString();
        String password = mPasswordView.getText().toString();

        boolean cancel = false;
        View focusView = null;

        // Check for a valid password
        if (TextUtils.isEmpty(password)) {
            mPasswordView.setError(getString(R.string.error_field_required));
            focusView = mPasswordView;
            cancel = true;
        } else if (!isPasswordValid(password)) {
            mPasswordView.setError(getString(R.string.error_invalid_password));
            focusView = mPasswordView;
            cancel = true;
        }

        // Check for a valid email address.
        if (TextUtils.isEmpty(email)) {
            mEmailView.setError(getString(R.string.error_field_required));
            focusView = mEmailView;
            cancel = true;
        } else if (!isEmailValid(email)) {
            mEmailView.setError(getString(R.string.error_invalid_email));
            focusView = mEmailView;
            cancel = true;
        }

        if (cancel) {
            focusView.requestFocus();
        } else {
            controller.authenticationUser(email, password);
        }
    }

    private boolean isEmailValid(String email) {
        return true;
    }
    private boolean isPasswordValid(String password) {
        return true;
    }
}
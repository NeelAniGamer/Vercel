package com.educational.col;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.educational.col.data.ColDatabaseHelper;
import com.educational.col.engine.MechanicalSoundEngine;
import com.educational.col.ui.QrStudioActivity;
import com.educational.col.ui.SolarLabActivity;
import com.educational.col.ui.TrafficQuizActivity;
import com.educational.col.ui.TypingSprintActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final String BASE_PORTAL_URL = "https://advancedlogiclabs.dpdns.org";
    private static final String VERSION_JSON_URL = "https://advancedlogiclabs.dpdns.org/version.json";
    private static final String GOOGLE_WEB_CLIENT_ID = "500448449044-hv2rp3k0lsok9ara1bred87c75lnsp7l.apps.googleusercontent.com";

    private WebView portalWebView;
    private ProgressBar pbPortalLoading;
    private LinearLayout boxPortalOffline;
    private FrameLayout fullscreenContainer;
    private View customFullscreenView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private ValueCallback<Uri[]> fileUploadCallback;
    private PermissionRequest pendingWebPermissionRequest;

    private GoogleSignInClient googleSignInClient;
    private ActivityResultLauncher<Intent> googleSignInLauncher;
    private ActivityResultLauncher<Intent> fileChooserLauncher;
    private ActivityResultLauncher<String> cameraPermissionLauncher;

    private long downloadId = -1L;
    private boolean isReceiverRegistered = false;

    private ColDatabaseHelper db;
    private MechanicalSoundEngine sound;

    private final BroadcastReceiver onDownloadComplete = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
            if (id == downloadId && downloadId != -1L) {
                installDownloadedApk();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        db = ColDatabaseHelper.getInstance(this);
        sound = MechanicalSoundEngine.getInstance(this);

        initActivityLaunchers();
        initGoogleSignIn();
        initWebView(savedInstanceState);
        initBackHandler();
        checkForUpdates(false);
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        if (portalWebView != null) {
            portalWebView.saveState(outState);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (portalWebView != null) {
            portalWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        if (portalWebView != null) {
            portalWebView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (isReceiverRegistered) {
            try {
                unregisterReceiver(onDownloadComplete);
            } catch (Exception ignored) {
            }
        }
        if (portalWebView != null) {
            portalWebView.destroy();
        }
        super.onDestroy();
    }

    private void initActivityLaunchers() {
        fileChooserLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    if (fileUploadCallback == null) return;
                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        String dataString = result.getData().getDataString();
                        if (dataString != null) {
                            results = new Uri[]{Uri.parse(dataString)};
                        }
                    }
                    fileUploadCallback.onReceiveValue(results);
                    fileUploadCallback = null;
                }
        );

        cameraPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> {
                    if (pendingWebPermissionRequest != null) {
                        if (granted) {
                            pendingWebPermissionRequest.grant(pendingWebPermissionRequest.getResources());
                        } else {
                            pendingWebPermissionRequest.deny();
                        }
                        pendingWebPermissionRequest = null;
                    }
                }
        );
    }

    private void initGoogleSignIn() {
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(GOOGLE_WEB_CLIENT_ID)
                .requestEmail()
                .build();
        googleSignInClient = GoogleSignIn.getClient(this, gso);

        googleSignInLauncher = registerForActivityResult(
                new ActivityResultContracts.StartActivityForResult(),
                result -> {
                    Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(result.getData());
                    try {
                        GoogleSignInAccount account = task.getResult(ApiException.class);
                        if (account != null) {
                            String name = account.getDisplayName();
                            String email = account.getEmail();
                            String handle = email != null && email.contains("@")
                                    ? "@" + email.substring(0, email.indexOf('@')).replaceAll("[^a-zA-Z0-9_]", "")
                                    : "@col_learner";
                            ColDatabaseHelper.LearnerProfile cur = db.getProfile();
                            db.updateIdentity(
                                    name != null ? name : cur.displayName,
                                    handle,
                                    cur.preferredVehicle,
                                    cur.academicStream
                            );
                            db.awardXp(50, "Cloud Auth", "Connected Google Account (" + (email != null ? email : "Verified") + ")");

                            String idToken = account.getIdToken();
                            if (idToken != null && portalWebView != null) {
                                String safeToken = idToken.replace("'", "\\'");
                                portalWebView.evaluateJavascript(
                                        "if(window.handleGoogleOneTap){window.handleGoogleOneTap({credential:'" + safeToken + "'});}",
                                        null
                                );
                            }
                            sound.playSuccessChime();
                            Toast.makeText(this, "Signed In As " + (name != null ? name : handle), Toast.LENGTH_SHORT).show();
                        }
                    } catch (ApiException e) {
                        Toast.makeText(this, "Google Sign-In Cancelled Or Unavailable (Code " + e.getStatusCode() + ")", Toast.LENGTH_SHORT).show();
                    }
                }
        );
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void initWebView(Bundle savedInstanceState) {
        portalWebView = findViewById(R.id.portalWebView);
        pbPortalLoading = findViewById(R.id.pbPortalLoading);
        boxPortalOffline = findViewById(R.id.boxPortalOffline);
        fullscreenContainer = findViewById(R.id.fullscreenContainer);

        portalWebView.setBackgroundColor(Color.parseColor("#070A14"));

        WebSettings ws = portalWebView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        // Lock text zoom to 100% so the WebView typography matches Chrome browser 1:1
        ws.setTextZoom(100);
        ws.setBuiltInZoomControls(false);
        ws.setDisplayZoomControls(false);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setJavaScriptCanOpenWindowsAutomatically(true);
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        ws.setCacheMode(isNetworkAvailable() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);
        ws.setUserAgentString(ws.getUserAgentString() + " ClassOfLearnersApp/2.0.0");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(portalWebView, true);

        portalWebView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        portalWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    pbPortalLoading.setVisibility(View.VISIBLE);
                    pbPortalLoading.setProgress(newProgress);
                } else {
                    pbPortalLoading.setVisibility(View.GONE);
                }
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean needsCamera = false;
                    for (String res : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) {
                            needsCamera = true;
                            break;
                        }
                    }
                    if (needsCamera && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                            != PackageManager.PERMISSION_GRANTED) {
                        pendingWebPermissionRequest = request;
                        cameraPermissionLauncher.launch(Manifest.permission.CAMERA);
                    } else {
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (fileUploadCallback != null) {
                    fileUploadCallback.onReceiveValue(null);
                }
                fileUploadCallback = filePathCallback;
                try {
                    Intent intent = fileChooserParams.createIntent();
                    fileChooserLauncher.launch(intent);
                } catch (Exception e) {
                    fileUploadCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customFullscreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customFullscreenView = view;
                customViewCallback = callback;
                fullscreenContainer.addView(view);
                fullscreenContainer.setVisibility(View.VISIBLE);
                portalWebView.setVisibility(View.GONE);
            }

            @Override
            public void onHideCustomView() {
                if (customFullscreenView == null) return;
                fullscreenContainer.removeView(customFullscreenView);
                fullscreenContainer.setVisibility(View.GONE);
                customFullscreenView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                portalWebView.setVisibility(View.VISIBLE);
            }
        });

        portalWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase(Locale.US) : "";

                if ("mailto".equals(scheme) || "tel".equals(scheme) || "intent".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {
                    }
                    return true;
                }

                String host = uri.getHost() != null ? uri.getHost().toLowerCase(Locale.US) : "";
                if (host.contains("buymeacoffee.com")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    } catch (Exception ignored) {
                    }
                    return true;
                }

                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                pbPortalLoading.setVisibility(View.GONE);
                view.evaluateJavascript(
                        "(function(){var s=document.getElementById('col-light-logo-style');if(!s){s=document.createElement('style');s.id='col-light-logo-style';s.textContent='.brand-logo,.cmd-logo{background-color:#ffffff!important;border-radius:8px!important;padding:0!important;box-shadow:none!important;filter:drop-shadow(0 0 8px rgba(56,189,248,0.4))!important;}';document.head.appendChild(s);}})();",
                        null
                );
                CookieManager.getInstance().flush();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    boxPortalOffline.setVisibility(View.VISIBLE);
                }
            }
        });

        portalWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                if (url == null) return;
                if (url.endsWith(".apk") || url.contains("COL.apk")) {
                    startApkDownload(url);
                    return;
                }
                try {
                    DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
                    req.setMimeType(mimeType);
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) req.addRequestHeader("cookie", cookies);
                    req.addRequestHeader("User-Agent", userAgent);
                    req.setTitle(fileName);
                    req.setDescription("Downloading from Class Of Learners...");
                    req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(req);
                        Toast.makeText(MainActivity.this, "Downloading " + fileName + "...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (Exception ignored) {
                    }
                }
            }
        });

        findViewById(R.id.btnOfflineRetry).setOnClickListener(v -> {
            boxPortalOffline.setVisibility(View.GONE);
            if (portalWebView.getUrl() != null) {
                portalWebView.reload();
            } else {
                portalWebView.loadUrl(BASE_PORTAL_URL);
            }
        });

        findViewById(R.id.btnOfflineTraffic).setOnClickListener(v -> startActivity(new Intent(this, TrafficQuizActivity.class)));
        findViewById(R.id.btnOfflineSolar).setOnClickListener(v -> startActivity(new Intent(this, SolarLabActivity.class)));
        findViewById(R.id.btnOfflineTyping).setOnClickListener(v -> startActivity(new Intent(this, TypingSprintActivity.class)));
        findViewById(R.id.btnOfflineQr).setOnClickListener(v -> startActivity(new Intent(this, QrStudioActivity.class)));

        if (savedInstanceState != null) {
            portalWebView.restoreState(savedInstanceState);
        } else {
            portalWebView.loadUrl(BASE_PORTAL_URL);
        }
    }

    private void initBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (customFullscreenView != null) {
                    if (portalWebView != null && portalWebView.getWebChromeClient() != null) {
                        portalWebView.getWebChromeClient().onHideCustomView();
                    }
                    return;
                }
                if (boxPortalOffline != null && boxPortalOffline.getVisibility() == View.VISIBLE) {
                    boxPortalOffline.setVisibility(View.GONE);
                    return;
                }
                if (portalWebView != null && portalWebView.canGoBack()) {
                    portalWebView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    private void launchGoogleSignIn() {
        try {
            Intent signInIntent = googleSignInClient.getSignInIntent();
            googleSignInLauncher.launch(signInIntent);
        } catch (Exception e) {
            Toast.makeText(this, "Google Sign-In Unavailable On Device", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return false;
            NetworkCapabilities caps = cm.getNetworkCapabilities(cm.getActiveNetwork());
            return caps != null && (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                    || caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
                    || caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
        } catch (Exception e) {
            return true;
        }
    }

    @SuppressWarnings("deprecation")
    private String getCertificateFingerprintInternal() {
        try {
            Signature[] signatures;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo pkgInfo = getPackageManager().getPackageInfo(getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                SigningInfo signingInfo = pkgInfo.signingInfo;
                signatures = signingInfo != null ? signingInfo.getApkContentsSigners() : null;
            } else {
                PackageInfo pkgInfo = getPackageManager().getPackageInfo(getPackageName(), PackageManager.GET_SIGNATURES);
                signatures = pkgInfo.signatures;
            }
            if (signatures != null && signatures.length > 0) {
                MessageDigest md = MessageDigest.getInstance("SHA-1");
                byte[] digest = md.digest(signatures[0].toByteArray());
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < digest.length; i++) {
                    if (i > 0) sb.append(":");
                    sb.append(String.format(Locale.US, "%02X", digest[i] & 0xFF));
                }
                return sb.toString();
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private void checkForUpdates(boolean manual) {
        new Thread(() -> {
            try {
                HttpURLConnection conn = (HttpURLConnection) new URL(VERSION_JSON_URL + "?t=" + System.currentTimeMillis()).openConnection();
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);
                if (conn.getResponseCode() != 200) {
                    if (manual) runOnUiThread(() -> Toast.makeText(this, "Up To Date (v2.0.0)", Toast.LENGTH_SHORT).show());
                    return;
                }
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();

                JSONObject json = new JSONObject(sb.toString());
                int serverCode = json.optInt("versionCode", 0);
                String rawApkUrl = json.optString("apkUrl", "/COL.apk");
                String notes = json.optString("releaseNotes", "A new version of Class Of Learners is available.");

                PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                long currentCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? pInfo.getLongVersionCode() : pInfo.versionCode;

                SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
                int dismissed = prefs.getInt("dismissed_update_version", -1);

                if (serverCode > currentCode && (manual || serverCode != dismissed)) {
                    String fullApkUrl = rawApkUrl.startsWith("http") ? rawApkUrl : (BASE_PORTAL_URL + rawApkUrl);
                    runOnUiThread(() -> showUpdateDialog(serverCode, fullApkUrl, notes));
                } else if (manual) {
                    runOnUiThread(() -> Toast.makeText(this, "You Are Running The Latest Version (v2.0.0)!", Toast.LENGTH_SHORT).show());
                }
            } catch (Exception e) {
                if (manual) {
                    runOnUiThread(() -> Toast.makeText(this, "Offline — Running Installed Build (v2.0.0)", Toast.LENGTH_SHORT).show());
                }
            }
        }).start();
    }

    private void showUpdateDialog(int serverVersionCode, String apkUrl, String notes) {
        new AlertDialog.Builder(this)
                .setTitle("Class Of Learners Update Available")
                .setMessage(notes)
                .setPositiveButton("Update Now", (d, w) -> startApkDownload(apkUrl))
                .setNegativeButton("Later", (d, w) -> {
                    getSharedPreferences("app_prefs", MODE_PRIVATE)
                            .edit()
                            .putInt("dismissed_update_version", serverVersionCode)
                            .apply();
                })
                .show();
    }

    private void startApkDownload(String apkUrl) {
        try {
            File oldApk = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "COL_update.apk");
            if (oldApk.exists()) oldApk.delete();

            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(apkUrl))
                    .setTitle("Class Of Learners Update")
                    .setDescription("Downloading latest version...")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "COL_update.apk");

            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                downloadId = dm.enqueue(req);
                if (!isReceiverRegistered) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_EXPORTED);
                    } else {
                        registerReceiver(onDownloadComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
                    }
                    isReceiverRegistered = true;
                }
                Toast.makeText(this, "Downloading Update...", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Download Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private void installDownloadedApk() {
        try {
            File apkFile = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "COL_update.apk");
            if (apkFile.exists()) {
                Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(install);
            }
        } catch (Exception ignored) {
        }
    }

    public class WebAppInterface {
        private final Context mContext;

        public WebAppInterface(Context context) {
            this.mContext = context;
        }

        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(MainActivity.this::launchGoogleSignIn);
        }

        @JavascriptInterface
        public String getCertificateFingerprint() {
            return getCertificateFingerprintInternal();
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "2.0.0";
        }

        @JavascriptInterface
        public void triggerHaptic(String style) {
            sound.hapticTap("heavy".equalsIgnoreCase(style) ? 22 : 9);
        }

        @JavascriptInterface
        public void awardNativeXp(int points, String reason) {
            db.awardXp(points, "Cloud Portal", reason != null ? reason : "Completed Interactive Module");
        }

        @JavascriptInterface
        public void checkForUpdates() {
            MainActivity.this.checkForUpdates(true);
        }

        @JavascriptInterface
        public void openNativeLab(String labId) {
            runOnUiThread(() -> {
                if ("traffic".equalsIgnoreCase(labId)) {
                    startActivity(new Intent(mContext, TrafficQuizActivity.class));
                } else if ("solar".equalsIgnoreCase(labId)) {
                    startActivity(new Intent(mContext, SolarLabActivity.class));
                } else if ("typing".equalsIgnoreCase(labId)) {
                    startActivity(new Intent(mContext, TypingSprintActivity.class));
                } else if ("qr".equalsIgnoreCase(labId)) {
                    startActivity(new Intent(mContext, QrStudioActivity.class));
                }
            });
        }
    }
}

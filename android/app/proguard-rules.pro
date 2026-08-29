# Proguard rules for Class Of Learners
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public void *(...);
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(...);
}

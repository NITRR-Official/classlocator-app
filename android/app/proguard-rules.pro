# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ---- Keep source file + line numbers so Play Console crash stacks remain useful ----
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---------------------------------------------------------------------------
# React Native (most rules ship via the RN Gradle plugin's consumer file,
# these are extra safety nets that have repeatedly caused obscure crashes
# under R8 if missing).
# ---------------------------------------------------------------------------
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep @com.facebook.proguard.annotations.DoNotStrip class * { *; }
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
    @com.facebook.common.internal.DoNotStrip *;
}

# Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# ---------------------------------------------------------------------------
# react-native-reanimated
# ---------------------------------------------------------------------------
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# ---------------------------------------------------------------------------
# react-native-webview
# ---------------------------------------------------------------------------
-keep class com.reactnativecommunity.webview.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---------------------------------------------------------------------------
# react-native-vector-icons
# ---------------------------------------------------------------------------
-keep class com.oblador.vectoricons.** { *; }

# ---------------------------------------------------------------------------
# react-native-svg
# ---------------------------------------------------------------------------
-keep public class com.horcrux.svg.** {*;}

# ---------------------------------------------------------------------------
# Mixpanel
# ---------------------------------------------------------------------------
-keep class com.mixpanel.android.** { *; }
-dontwarn com.mixpanel.android.**

# ---------------------------------------------------------------------------
# OkHttp / Okio (axios -> network stack pulls these in)
# ---------------------------------------------------------------------------
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**

# ---------------------------------------------------------------------------
# Misc native bridge
# ---------------------------------------------------------------------------
-keepclassmembers class * implements com.facebook.react.bridge.NativeModule { *; }
-keepclassmembers,includedescriptorclasses class * { native <methods>; }

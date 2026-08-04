# GlowLab — reglas R8 / ProGuard (release)

# Flutter engine & embedding
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# WebView JavaScript bridge (GlowLabBridgeChannel)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Gson / reflection-heavy plugins (si se añaden más adelante)
-dontwarn com.google.gson.**
-dontwarn javax.annotation.**

# Keep line numbers for crash deobfuscation (Play App Bundle → mapping.txt)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

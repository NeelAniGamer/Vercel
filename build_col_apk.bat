@echo off
setlocal
title Class Of Learners (CoL v2.0) - Native Android APK Compiler
echo =====================================================================
echo  CLASS OF LEARNERS (CoL v2.0.0) - NATIVE ANDROID BUILD SYSTEM
echo =====================================================================
echo.

set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=C:\Users\neelg\AppData\Local\Android\Sdk"

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ERROR] JDK not found at %JAVA_HOME%. Please install Android Studio or OpenJDK 17/21.
    exit /b 1
)

echo [1/2] Compiling native Android APK (com.educational.col v2.0.0) via Gradle...
cd android
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo [ERROR] Gradle compilation failed.
    cd ..
    exit /b 1
)
cd ..

echo [2/2] Staging COL.apk to root distribution...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "COL.apk" >nul

echo.
echo =====================================================================
echo  NATIVE APK COMPILED SUCCESSFULLY: COL.apk
echo =====================================================================

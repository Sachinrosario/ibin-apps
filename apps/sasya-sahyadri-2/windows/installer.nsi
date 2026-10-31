; Setup for the Sasya Sahyadri 2 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Sasya Sahyadri 2"
OutFile "SasyaSahyadri2_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\SasyaSahyadri2"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Sasya Sahyadri 2"
VIAddVersionKey "FileDescription" "Setup - Sasya Sahyadri 2"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Sasya Sahyadri 2 (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SasyaSahyadri2.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Sasya Sahyadri 2 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\SasyaSahyadri2"

Section "Install"
  SetOutPath "$INSTDIR"
  File "SasyaSahyadri2.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\SasyaSahyadri2"
  CreateShortcut "$SMPROGRAMS\SasyaSahyadri2\SasyaSahyadri2.lnk" "$INSTDIR\SasyaSahyadri2.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\SasyaSahyadri2\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\SasyaSahyadri2.lnk" "$INSTDIR\SasyaSahyadri2.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Sasya Sahyadri 2"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SasyaSahyadri2.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\SasyaSahyadri2\*.lnk"
  RMDir "$SMPROGRAMS\SasyaSahyadri2"
  Delete "$DESKTOP\SasyaSahyadri2.lnk"
  RMDir /r "$LOCALAPPDATA\SasyaSahyadri2"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

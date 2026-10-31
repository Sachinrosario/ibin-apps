; Setup for the Sasya Sahyadri (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Sasya Sahyadri"
OutFile "SasyaSahyadri_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\SasyaSahyadri"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Sasya Sahyadri"
VIAddVersionKey "FileDescription" "Setup - Sasya Sahyadri"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Sasya Sahyadri (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SasyaSahyadri.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Sasya Sahyadri now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\SasyaSahyadri"

Section "Install"
  SetOutPath "$INSTDIR"
  File "SasyaSahyadri.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\SasyaSahyadri"
  CreateShortcut "$SMPROGRAMS\SasyaSahyadri\SasyaSahyadri.lnk" "$INSTDIR\SasyaSahyadri.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\SasyaSahyadri\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\SasyaSahyadri.lnk" "$INSTDIR\SasyaSahyadri.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Sasya Sahyadri"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SasyaSahyadri.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\SasyaSahyadri\*.lnk"
  RMDir "$SMPROGRAMS\SasyaSahyadri"
  Delete "$DESKTOP\SasyaSahyadri.lnk"
  RMDir /r "$LOCALAPPDATA\SasyaSahyadri"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

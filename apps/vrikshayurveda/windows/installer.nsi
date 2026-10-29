; Setup for the Vrikshayurveda (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Vrikshayurveda"
OutFile "Vrikshayurveda_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Vrikshayurveda"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Vrikshayurveda"
VIAddVersionKey "FileDescription" "Setup - Vrikshayurveda"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Vrikshayurveda (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Vrikshayurveda.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Vrikshayurveda now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\Vrikshayurveda"

Section "Install"
  SetOutPath "$INSTDIR"
  File "Vrikshayurveda.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Vrikshayurveda"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda\Vrikshayurveda.lnk" "$INSTDIR\Vrikshayurveda.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Vrikshayurveda.lnk" "$INSTDIR\Vrikshayurveda.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Vrikshayurveda"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Vrikshayurveda.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Vrikshayurveda\*.lnk"
  RMDir "$SMPROGRAMS\Vrikshayurveda"
  Delete "$DESKTOP\Vrikshayurveda.lnk"
  RMDir /r "$LOCALAPPDATA\Vrikshayurveda"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

; Setup for the Vrikshayurveda 3 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Vrikshayurveda 3"
OutFile "Vrikshayurveda3_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Vrikshayurveda3"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Vrikshayurveda 3"
VIAddVersionKey "FileDescription" "Setup - Vrikshayurveda 3"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Vrikshayurveda 3 (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Vrikshayurveda3.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Vrikshayurveda 3 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\Vrikshayurveda3"

Section "Install"
  SetOutPath "$INSTDIR"
  File "Vrikshayurveda3.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Vrikshayurveda 3"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda 3\Vrikshayurveda 3.lnk" "$INSTDIR\Vrikshayurveda3.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda 3\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Vrikshayurveda 3.lnk" "$INSTDIR\Vrikshayurveda3.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Vrikshayurveda 3"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Vrikshayurveda3.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Vrikshayurveda 3\*.lnk"
  RMDir "$SMPROGRAMS\Vrikshayurveda 3"
  Delete "$DESKTOP\Vrikshayurveda 3.lnk"
  RMDir /r "$LOCALAPPDATA\Vrikshayurveda3"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

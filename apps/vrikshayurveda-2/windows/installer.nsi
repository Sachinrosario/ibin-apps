; Setup for the Vrikshayurveda 2 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Vrikshayurveda 2"
OutFile "Vrikshayurveda2_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Vrikshayurveda2"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Vrikshayurveda 2"
VIAddVersionKey "FileDescription" "Setup - Vrikshayurveda 2"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Vrikshayurveda 2 (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\Vrikshayurveda2.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Vrikshayurveda 2 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\Vrikshayurveda2"

Section "Install"
  SetOutPath "$INSTDIR"
  File "Vrikshayurveda2.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Vrikshayurveda 2"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda 2\Vrikshayurveda 2.lnk" "$INSTDIR\Vrikshayurveda2.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Vrikshayurveda 2\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Vrikshayurveda 2.lnk" "$INSTDIR\Vrikshayurveda2.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Vrikshayurveda 2"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Vrikshayurveda2.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Vrikshayurveda 2\*.lnk"
  RMDir "$SMPROGRAMS\Vrikshayurveda 2"
  Delete "$DESKTOP\Vrikshayurveda 2.lnk"
  RMDir /r "$LOCALAPPDATA\Vrikshayurveda2"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

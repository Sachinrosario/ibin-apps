; Setup for the Eastern Ghats Mapping 2 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Eastern Ghats Mapping 2"
OutFile "EasternGhatsMapping2_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\EasternGhatsMapping2"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Eastern Ghats Mapping 2"
VIAddVersionKey "FileDescription" "Setup - Eastern Ghats Mapping 2"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Eastern Ghats Mapping 2 (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\EasternGhatsMapping2.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Eastern Ghats Mapping 2 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\EasternGhatsMapping2"

Section "Install"
  SetOutPath "$INSTDIR"
  File "EasternGhatsMapping2.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\EasternGhatsMapping2"
  CreateShortcut "$SMPROGRAMS\EasternGhatsMapping2\EasternGhatsMapping2.lnk" "$INSTDIR\EasternGhatsMapping2.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\EasternGhatsMapping2\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\EasternGhatsMapping2.lnk" "$INSTDIR\EasternGhatsMapping2.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Eastern Ghats Mapping 2"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\EasternGhatsMapping2.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\EasternGhatsMapping2\*.lnk"
  RMDir "$SMPROGRAMS\EasternGhatsMapping2"
  Delete "$DESKTOP\EasternGhatsMapping2.lnk"
  RMDir /r "$LOCALAPPDATA\EasternGhatsMapping2"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

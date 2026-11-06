; Setup for the Western Ghats Mapping 2 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Western Ghats Mapping 2"
OutFile "WesternGhatsMapping2_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\WesternGhatsMapping2"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Western Ghats Mapping 2"
VIAddVersionKey "FileDescription" "Setup - Western Ghats Mapping 2"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Western Ghats Mapping 2 (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\WesternGhatsMapping2.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Western Ghats Mapping 2 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\WesternGhatsMapping2"

Section "Install"
  SetOutPath "$INSTDIR"
  File "WesternGhatsMapping2.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\WesternGhatsMapping2"
  CreateShortcut "$SMPROGRAMS\WesternGhatsMapping2\WesternGhatsMapping2.lnk" "$INSTDIR\WesternGhatsMapping2.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\WesternGhatsMapping2\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\WesternGhatsMapping2.lnk" "$INSTDIR\WesternGhatsMapping2.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Western Ghats Mapping 2"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\WesternGhatsMapping2.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\WesternGhatsMapping2\*.lnk"
  RMDir "$SMPROGRAMS\WesternGhatsMapping2"
  Delete "$DESKTOP\WesternGhatsMapping2.lnk"
  RMDir /r "$LOCALAPPDATA\WesternGhatsMapping2"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

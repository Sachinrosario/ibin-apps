; Setup for the Birds Group Identification (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Birds Group Identification"
OutFile "BirdsGroupIdentification_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\BirdsGroupIdentification"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Birds Group Identification"
VIAddVersionKey "FileDescription" "Setup - Birds Group Identification"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Birds Group Identification (with Prob) (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\BirdsGroupIdentification.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Birds Group Identification now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\BirdsGroupIdentification"

Section "Install"
  SetOutPath "$INSTDIR"
  File "BirdsGroupIdentification.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Birds Group Identification"
  CreateShortcut "$SMPROGRAMS\Birds Group Identification\Birds Group Identification.lnk" "$INSTDIR\BirdsGroupIdentification.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Birds Group Identification\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Birds Group Identification.lnk" "$INSTDIR\BirdsGroupIdentification.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Birds Group Identification"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\BirdsGroupIdentification.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Birds Group Identification\*.lnk"
  RMDir "$SMPROGRAMS\Birds Group Identification"
  Delete "$DESKTOP\Birds Group Identification.lnk"
  RMDir /r "$LOCALAPPDATA\BirdsGroupIdentification"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

; Setup for the Birds Identification 2 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Birds Identification 2"
OutFile "BirdsIdentification2_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\BirdsIdentification2"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Birds Identification 2"
VIAddVersionKey "FileDescription" "Setup - Birds Identification 2"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Birds Identification 2 (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\BirdsIdentification2.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Birds Identification 2 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\BirdsIdentification2"

Section "Install"
  SetOutPath "$INSTDIR"
  File "BirdsIdentification2.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Birds Identification 2"
  CreateShortcut "$SMPROGRAMS\Birds Identification 2\Birds Identification 2.lnk" "$INSTDIR\BirdsIdentification2.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Birds Identification 2\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Birds Identification 2.lnk" "$INSTDIR\BirdsIdentification2.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Birds Identification 2"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\BirdsIdentification2.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Birds Identification 2\*.lnk"
  RMDir "$SMPROGRAMS\Birds Identification 2"
  Delete "$DESKTOP\Birds Identification 2.lnk"
  RMDir /r "$LOCALAPPDATA\BirdsIdentification2"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

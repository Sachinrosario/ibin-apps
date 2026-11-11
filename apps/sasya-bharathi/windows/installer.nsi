; Setup for the Sasya Bharathi (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Sasya Bharathi"
OutFile "SasyaBharathi_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\SasyaBharathi"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Sasya Bharathi"
VIAddVersionKey "FileDescription" "Setup - Sasya Bharathi"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Sasya Bharathi (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SasyaBharathi.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Sasya Bharathi now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\SasyaBharathi"

Section "Install"
  SetOutPath "$INSTDIR"
  File "SasyaBharathi.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Sasya Bharathi"
  CreateShortcut "$SMPROGRAMS\Sasya Bharathi\Sasya Bharathi.lnk" "$INSTDIR\SasyaBharathi.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Sasya Bharathi\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Sasya Bharathi.lnk" "$INSTDIR\SasyaBharathi.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Sasya Bharathi"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SasyaBharathi.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Sasya Bharathi\*.lnk"
  RMDir "$SMPROGRAMS\Sasya Bharathi"
  Delete "$DESKTOP\Sasya Bharathi.lnk"
  RMDir /r "$LOCALAPPDATA\SasyaBharathi"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

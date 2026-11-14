; Setup for the Pathanga Bharathi (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Pathanga Bharathi"
OutFile "PathangaBharathi_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\PathangaBharathi"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Pathanga Bharathi"
VIAddVersionKey "FileDescription" "Setup - Pathanga Bharathi"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Pathanga Bharathi (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\PathangaBharathi.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Pathanga Bharathi now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PathangaBharathi"

Section "Install"
  SetOutPath "$INSTDIR"
  File "PathangaBharathi.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Pathanga Bharathi"
  CreateShortcut "$SMPROGRAMS\Pathanga Bharathi\Pathanga Bharathi.lnk" "$INSTDIR\PathangaBharathi.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Pathanga Bharathi\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Pathanga Bharathi.lnk" "$INSTDIR\PathangaBharathi.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Pathanga Bharathi"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\PathangaBharathi.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Pathanga Bharathi\*.lnk"
  RMDir "$SMPROGRAMS\Pathanga Bharathi"
  Delete "$DESKTOP\Pathanga Bharathi.lnk"
  RMDir /r "$LOCALAPPDATA\PathangaBharathi"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

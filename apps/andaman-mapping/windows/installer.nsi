; Setup for the Andaman Mapping (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Andaman Mapping"
OutFile "AndamanMapping_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\AndamanMapping"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Andaman Mapping"
VIAddVersionKey "FileDescription" "Setup - Andaman Mapping"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Andaman Mapping (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\AndamanMapping.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Andaman Mapping now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\AndamanMapping"

Section "Install"
  SetOutPath "$INSTDIR"
  File "AndamanMapping.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\AndamanMapping"
  CreateShortcut "$SMPROGRAMS\AndamanMapping\AndamanMapping.lnk" "$INSTDIR\AndamanMapping.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\AndamanMapping\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\AndamanMapping.lnk" "$INSTDIR\AndamanMapping.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Andaman Mapping"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\AndamanMapping.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\AndamanMapping\*.lnk"
  RMDir "$SMPROGRAMS\AndamanMapping"
  Delete "$DESKTOP\AndamanMapping.lnk"
  RMDir /r "$LOCALAPPDATA\AndamanMapping"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

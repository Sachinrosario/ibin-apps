; Setup for the Bird Identification 3 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Bird Identification 3"
OutFile "BirdIdentification3_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\BirdIdentification3"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Bird Identification 3"
VIAddVersionKey "FileDescription" "Setup - Bird Identification 3"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Birds Identification (c) K.N. Ganeshaiah. Version 3 (species) 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\BirdIdentification3.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Bird Identification 3 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\BirdIdentification3"

Section "Install"
  SetOutPath "$INSTDIR"
  File "BirdIdentification3.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Bird Identification 3"
  CreateShortcut "$SMPROGRAMS\Bird Identification 3\Bird Identification 3.lnk" "$INSTDIR\BirdIdentification3.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Bird Identification 3\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Bird Identification 3.lnk" "$INSTDIR\BirdIdentification3.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Bird Identification 3"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\BirdIdentification3.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Bird Identification 3\*.lnk"
  RMDir "$SMPROGRAMS\Bird Identification 3"
  Delete "$DESKTOP\Bird Identification 3.lnk"
  RMDir /r "$LOCALAPPDATA\BirdIdentification3"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

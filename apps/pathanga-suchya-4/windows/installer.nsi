; Setup for the Pathanga Suchya 4 (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Pathanga Suchya 4"
OutFile "PathangaSuchya4_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\PathangaSuchya4"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Pathanga Suchya 4"
VIAddVersionKey "FileDescription" "Setup - Pathanga Suchya 4"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Pathanga Suchya 4 (c) 2006-2018 K.N. Ganeshaiah, GKVK. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\PathangaSuchya4.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Pathanga Suchya 4 now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PathangaSuchya4"

Section "Install"
  SetOutPath "$INSTDIR"
  File "PathangaSuchya4.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Pathanga Suchya 4"
  CreateShortcut "$SMPROGRAMS\Pathanga Suchya 4\Pathanga Suchya 4.lnk" "$INSTDIR\PathangaSuchya4.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Pathanga Suchya 4\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Pathanga Suchya 4.lnk" "$INSTDIR\PathangaSuchya4.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Pathanga Suchya 4"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\PathangaSuchya4.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Pathanga Suchya 4\*.lnk"
  RMDir "$SMPROGRAMS\Pathanga Suchya 4"
  Delete "$DESKTOP\Pathanga Suchya 4.lnk"
  RMDir /r "$LOCALAPPDATA\PathangaSuchya4"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

; Setup for the Pathanga Suchya (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Pathanga Suchya"
OutFile "PathangaSuchya_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\PathangaSuchya"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Pathanga Suchya"
VIAddVersionKey "FileDescription" "Setup - Pathanga Suchya"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Pathanga Suchya (c) 2006-2018 K.N. Ganeshaiah, GKVK. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\PathangaSuchya.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Pathanga Suchya now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PathangaSuchya"

Section "Install"
  SetOutPath "$INSTDIR"
  File "PathangaSuchya.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Pathanga Suchya"
  CreateShortcut "$SMPROGRAMS\Pathanga Suchya\Pathanga Suchya.lnk" "$INSTDIR\PathangaSuchya.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Pathanga Suchya\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Pathanga Suchya.lnk" "$INSTDIR\PathangaSuchya.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Pathanga Suchya"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\PathangaSuchya.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Pathanga Suchya\*.lnk"
  RMDir "$SMPROGRAMS\Pathanga Suchya"
  Delete "$DESKTOP\Pathanga Suchya.lnk"
  RMDir /r "$LOCALAPPDATA\PathangaSuchya"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

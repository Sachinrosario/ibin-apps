; Setup for the Sahyadri Pathanga (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Sahyadri Pathanga"
OutFile "SahyadriPathanga_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\SahyadriPathanga"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Sahyadri Pathanga"
VIAddVersionKey "FileDescription" "Setup - Sahyadri Pathanga"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Sahyadri Pathanga (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SahyadriPathanga.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Sahyadri Pathanga now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\SahyadriPathanga"

Section "Install"
  SetOutPath "$INSTDIR"
  File "SahyadriPathanga.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Sahyadri Pathanga"
  CreateShortcut "$SMPROGRAMS\Sahyadri Pathanga\Sahyadri Pathanga.lnk" "$INSTDIR\SahyadriPathanga.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Sahyadri Pathanga\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Sahyadri Pathanga.lnk" "$INSTDIR\SahyadriPathanga.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Sahyadri Pathanga"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SahyadriPathanga.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Sahyadri Pathanga\*.lnk"
  RMDir "$SMPROGRAMS\Sahyadri Pathanga"
  Delete "$DESKTOP\Sahyadri Pathanga.lnk"
  RMDir /r "$LOCALAPPDATA\SahyadriPathanga"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

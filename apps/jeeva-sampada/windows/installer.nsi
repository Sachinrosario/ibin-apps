; Setup for the Jeeva Sampada (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Jeeva Sampada"
OutFile "JeevaSampada_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\JeevaSampada"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Jeeva Sampada"
VIAddVersionKey "FileDescription" "Setup - Jeeva Sampada"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Jeeva Sampada (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\JeevaSampada.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Jeeva Sampada now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\JeevaSampada"

Section "Install"
  SetOutPath "$INSTDIR"
  File "JeevaSampada.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\JeevaSampada"
  CreateShortcut "$SMPROGRAMS\JeevaSampada\JeevaSampada.lnk" "$INSTDIR\JeevaSampada.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\JeevaSampada\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\JeevaSampada.lnk" "$INSTDIR\JeevaSampada.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Jeeva Sampada"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\JeevaSampada.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\JeevaSampada\*.lnk"
  RMDir "$SMPROGRAMS\JeevaSampada"
  Delete "$DESKTOP\JeevaSampada.lnk"
  RMDir /r "$LOCALAPPDATA\JeevaSampada"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

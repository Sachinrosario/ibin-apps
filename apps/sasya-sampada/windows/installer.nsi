; Setup for the Sasya Sampada (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Sasya Sampada"
OutFile "SasyaSampada_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\SasyaSampada"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Sasya Sampada"
VIAddVersionKey "FileDescription" "Setup - Sasya Sampada"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Sasya Sampada (c) K.N. Ganeshaiah. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SasyaSampada.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Sasya Sampada now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\SasyaSampada"

Section "Install"
  SetOutPath "$INSTDIR"
  File "SasyaSampada.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Sasya Sampada"
  CreateShortcut "$SMPROGRAMS\Sasya Sampada\Sasya Sampada.lnk" "$INSTDIR\SasyaSampada.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Sasya Sampada\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Sasya Sampada.lnk" "$INSTDIR\SasyaSampada.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Sasya Sampada"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\SasyaSampada.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Sasya Sampada\*.lnk"
  RMDir "$SMPROGRAMS\Sasya Sampada"
  Delete "$DESKTOP\Sasya Sampada.lnk"
  RMDir /r "$LOCALAPPDATA\SasyaSampada"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

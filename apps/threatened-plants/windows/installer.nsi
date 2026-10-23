; Setup for the Threatened Plants of Western Ghats (version passed in as /DVERSION=x.y.z)
; Installs for the current user only: no administrator password needed.
Unicode true
!ifndef VERSION
  !define VERSION "1.0.0"
!endif
!include "MUI2.nsh"
Name "Threatened Plants of Western Ghats"
OutFile "ThreatenedPlants_${VERSION}_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\ThreatenedPlants"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "Threatened Plants of Western Ghats"
VIAddVersionKey "FileDescription" "Setup - Threatened Plants of Western Ghats"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Threatened Plants of Western Ghats (c) 2015-2016 K.N. Ganeshaiah, UAS Bangalore. Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\ThreatenedPlants.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open Threatened Plants of Western Ghats now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\ThreatenedPlants"

Section "Install"
  SetOutPath "$INSTDIR"
  File "ThreatenedPlants.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Threatened Plants of Western Ghats"
  CreateShortcut "$SMPROGRAMS\Threatened Plants of Western Ghats\Threatened Plants of Western Ghats.lnk" "$INSTDIR\ThreatenedPlants.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Threatened Plants of Western Ghats\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Threatened Plants of Western Ghats.lnk" "$INSTDIR\ThreatenedPlants.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Threatened Plants of Western Ghats"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\ThreatenedPlants.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Threatened Plants of Western Ghats\*.lnk"
  RMDir "$SMPROGRAMS\Threatened Plants of Western Ghats"
  Delete "$DESKTOP\Threatened Plants of Western Ghats.lnk"
  RMDir /r "$LOCALAPPDATA\ThreatenedPlants"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

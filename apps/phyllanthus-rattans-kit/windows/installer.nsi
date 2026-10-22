; Setup for the Phyllanthus & Rattans Identification Kit, Version 1.0.0 (Original)
; Installs for the current user only: no administrator password needed.
Unicode true
!include "MUI2.nsh"
Name "Phyllanthus & Rattans Identification Kit"
OutFile "PhyllanthusRattansKit_1.0.0_Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\PhyllanthusRattansKit"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "Phyllanthus and Rattans Identification Kit"
VIAddVersionKey "FileDescription" "Setup - Phyllanthus and Rattans Identification Kit"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "ProductVersion" "1.0.0 Original"
VIAddVersionKey "CompanyName" "IBIN Apps"
VIAddVersionKey "LegalCopyright" "Indian Barcode of Life kit (DBT; ATREE, UAS Bangalore, BSI). Rebuild 2026."
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\PhyllanthusRattansKit.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Open the Identification Kit now"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!define UNINST "Software\Microsoft\Windows\CurrentVersion\Uninstall\PhyllanthusRattansKit"

Section "Install"
  SetOutPath "$INSTDIR"
  File "PhyllanthusRattansKit.exe"
  File "app.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\Phyllanthus & Rattans Identification Kit"
  CreateShortcut "$SMPROGRAMS\Phyllanthus & Rattans Identification Kit\Phyllanthus & Rattans Identification Kit.lnk" "$INSTDIR\PhyllanthusRattansKit.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\Phyllanthus & Rattans Identification Kit\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\Phyllanthus & Rattans Identification Kit.lnk" "$INSTDIR\PhyllanthusRattansKit.exe" "" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "DisplayName" "Phyllanthus & Rattans Identification Kit"
  WriteRegStr HKCU "${UNINST}" "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "${UNINST}" "Publisher" "IBIN Apps"
  WriteRegStr HKCU "${UNINST}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${UNINST}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINST}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINST}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINST}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\PhyllanthusRattansKit.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$SMPROGRAMS\Phyllanthus & Rattans Identification Kit\*.lnk"
  RMDir "$SMPROGRAMS\Phyllanthus & Rattans Identification Kit"
  Delete "$DESKTOP\Phyllanthus & Rattans Identification Kit.lnk"
  RMDir /r "$LOCALAPPDATA\PhyllanthusRattansKit"
  DeleteRegKey HKCU "${UNINST}"
SectionEnd

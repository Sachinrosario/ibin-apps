; Setup for Eastern Ghats Mapping Version 1 (version passed in as /DVERSION=x.y.z).
; Built with Inno Setup so the wizard has the look of the original 2015 setup.exe, with the same
; pages as its script (WGVMAPTOOL\setup.iss): Welcome, Destination, Additional Tasks, Ready, Installing, Finished.
; Unlike the original it installs for the current user only: no administrator password, and nothing
; is written to the system folders or C:\MapInfo.
#ifndef VERSION
  #define VERSION "1.0.0"
#endif

[Setup]
AppId=EasternGhatsMapping
AppName=Eastern Ghats Mapping
AppVersion={#VERSION}
AppVerName=Eastern Ghats Mapping {#VERSION}
AppPublisher=IBIN Apps
AppCopyright=Eastern Ghats Mapping (c) K.N. Ganeshaiah (proprietary right holder). Updated in 2026 by Sachin A. Rosario.
VersionInfoVersion={#VERSION}
VersionInfoDescription=Setup - Eastern Ghats Mapping
DefaultDirName={localappdata}\Programs\EasternGhatsMapping
DefaultGroupName=Eastern Ghats Mapping
PrivilegesRequired=lowest
; the look of the original wizard
WizardStyle=classic
WizardImageFile=compiler:WizClassicImage.bmp
WizardSmallImageFile=compiler:WizClassicSmallImage.bmp
DisableWelcomePage=no
DisableDirPage=no
DisableProgramGroupPage=yes
DisableReadyPage=no
DisableFinishedPage=no
SetupIconFile=app.ico
UninstallDisplayIcon={app}\app.ico
Compression=lzma
SolidCompression=yes
OutputDir=.
OutputBaseFilename=EasternGhatsMapping_{#VERSION}_Setup

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop icon"; GroupDescription: "Additional icons:"

[InstallDelete]
; left by the earlier NSIS-built setup of this app
Type: files; Name: "{app}\Uninstall.exe"
Type: filesandordirs; Name: "{userprograms}\EasternGhatsMapping"
Type: files; Name: "{userdesktop}\EasternGhatsMapping.lnk"

[Registry]
; the earlier setup's entry in Apps & features, so the app is not listed twice
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Uninstall\EasternGhatsMapping"; ValueType: none; Flags: deletekey

[Files]
Source: "EasternGhatsMapping.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "app.ico"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Eastern Ghats Mapping"; Filename: "{app}\EasternGhatsMapping.exe"; IconFilename: "{app}\app.ico"
Name: "{group}\Uninstall Eastern Ghats Mapping"; Filename: "{uninstallexe}"
Name: "{userdesktop}\Eastern Ghats Mapping"; Filename: "{app}\EasternGhatsMapping.exe"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\EasternGhatsMapping"

[Code]
// button captions of Inno Setup 5, which built the original; newer versions drop the arrows
procedure CurPageChanged(CurPageID: Integer);
begin
  WizardForm.BackButton.Caption := '< &Back';
  if (CurPageID <> wpReady) and (CurPageID <> wpFinished) then
    WizardForm.NextButton.Caption := '&Next >';
end;

$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\etherworldQC\engine-lab"
$Target = Join-Path $ProjectRoot "client\src\tools\visual-forge"
$ZipPath = Join-Path $env:USERPROFILE "Downloads\engine_lab_visual_forge.zip"
$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Backup = Join-Path $ProjectRoot "_backup_visual_forge_$Stamp"
$Temp = Join-Path $env:TEMP "engine_lab_visual_forge_$Stamp"

if (!(Test-Path $ProjectRoot)) {
  throw "Projet introuvable: $ProjectRoot"
}

if (!(Test-Path $ZipPath)) {
  throw "ZIP introuvable: $ZipPath"
}

New-Item -ItemType Directory -Force $Temp | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $Temp -Force

$Source = Join-Path $Temp "client\src\tools\visual-forge"

if (!(Test-Path $Source)) {
  Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue
  throw "Le dossier visual-forge est absent du ZIP."
}

if (Test-Path $Target) {
  New-Item -ItemType Directory -Force $Backup | Out-Null
  Copy-Item $Target (Join-Path $Backup "visual-forge") -Recurse -Force
  Write-Host "Backup: $Backup" -ForegroundColor Yellow
}

New-Item -ItemType Directory -Force (Split-Path $Target -Parent) | Out-Null
Copy-Item $Source $Target -Recurse -Force

Remove-Item $Temp -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "VISUAL FORGE INSTALLÉ" -ForegroundColor Green
Write-Host "Chemin: $Target" -ForegroundColor Cyan
Write-Host ""

Get-ChildItem $Target -Recurse -File |
  Select-Object FullName, Length |
  Format-Table -AutoSize

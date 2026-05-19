# PowerShell script to install Chrome or Edge and print path
# Requires administrator privileges

Write-Host "Attempting to install Microsoft Edge (Chromium) via winget..."
if (Get-Command winget -ErrorAction SilentlyContinue) {
  winget install --id Microsoft.Edge -e --silent || Write-Host "winget install failed — please install Chrome/Edge manually"
  $paths = @(
    "$Env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "$Env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
    "$Env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "$Env:ProgramFiles(x86)\Google\Chrome\Application\chrome.exe"
  )
  foreach ($p in $paths) {
    if (Test-Path $p) { Write-Host "Found browser at: $p" }
  }
  Write-Host "Set CHROME_EXECUTABLE_PATH to the found path before starting the server. Example:`$env:CHROME_EXECUTABLE_PATH='$paths[0]'`"
} else {
  Write-Host "winget not found. Please install Chrome/Edge manually and set CHROME_EXECUTABLE_PATH."
}

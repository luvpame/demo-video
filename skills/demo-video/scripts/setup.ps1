# 録画に要る道具をそろえる（Windows 用。Mac は setup.sh）。何度流してもよい。
# 使い方: powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = if ($env:DEMO_VIDEO_HOME) { $env:DEMO_VIDEO_HOME } else { Join-Path $HOME ".cache\demo-video" }
New-Item -ItemType Directory -Force $root | Out-Null

# Node.js が無いか古ければ、公式の配布版を $root\node に入れる。管理者の権限は要らない
$hasNode = [bool](Get-Command node -ErrorAction SilentlyContinue)
if (-not $hasNode -or [int](node -p "process.versions.node.split('.')[0]") -lt 18) {
  if (-not (Test-Path "$root\node\node.exe")) {
    if ($env:PROCESSOR_ARCHITECTURE -ne "AMD64") {
      Write-Output "node: この PC（$env:PROCESSOR_ARCHITECTURE）には対応していません。Intel か AMD の CPU の Windows が要ります"
      exit 1
    }
    $base = "https://nodejs.org/dist/latest-v24.x"
    $line = ((Invoke-WebRequest -UseBasicParsing "$base/SHASUMS256.txt").Content -split "`n") | Where-Object { $_ -match "-win-x64\.zip$" }
    $hash, $file = $line.Trim() -split "\s+"
    Write-Output "node: Node.js を入れます（$file）"
    $zip = Join-Path $root $file
    Invoke-WebRequest -UseBasicParsing -OutFile $zip "$base/$file"
    if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $hash) {
      Remove-Item $zip
      Write-Output "node: ダウンロードが壊れています。もう一度流してください"
      exit 1
    }
    Remove-Item -Recurse -Force "$root\node", "$root\node-unzip" -ErrorAction SilentlyContinue
    Expand-Archive $zip "$root\node-unzip"
    Move-Item (Get-ChildItem "$root\node-unzip")[0].FullName "$root\node"
    Remove-Item -Recurse -Force $zip, "$root\node-unzip"
  }
  $env:Path = "$root\node;$env:Path"
}

Copy-Item "$PSScriptRoot\package.json" "$root\package.json"
$installed = "$root\.installed.json"
$fresh = (Test-Path "$root\node_modules\playwright") -and (Test-Path $installed) -and
  ((Get-FileHash "$root\package.json").Hash -eq (Get-FileHash $installed).Hash)
if (-not $fresh) {
  $env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1"
  Push-Location $root
  # Windows PowerShell 5.1 は、Stop のままだと npm の警告（標準エラー）だけで止まる。成否は終了コードで見る
  $ErrorActionPreference = "Continue"
  npm install --no-audit --no-fund --silent
  $code = $LASTEXITCODE
  $ErrorActionPreference = "Stop"
  Pop-Location
  if ($code -ne 0) { exit $code }
  Copy-Item "$root\package.json" $installed
}
node (Join-Path $PSScriptRoot "check.mjs")
exit $LASTEXITCODE

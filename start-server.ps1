$ErrorActionPreference = 'Stop'

$systemNode = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'

if ($systemNode) {
  $nodePath = $systemNode.Source
} elseif (Test-Path -LiteralPath $bundledNode) {
  $nodePath = $bundledNode
} else {
  throw 'Node.js를 찾을 수 없습니다. Node.js를 설치하거나 Codex 환경에서 실행하세요.'
}

Write-Host 'FLAGSHIP server starting...' -ForegroundColor Green
Write-Host 'Open http://localhost:8000/login.html' -ForegroundColor Cyan
Write-Host 'Stop with Ctrl+C.' -ForegroundColor DarkGray

& $nodePath (Join-Path $PSScriptRoot 'server.mjs')

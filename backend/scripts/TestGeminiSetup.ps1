$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'GeminiKeyInput.ps1')
$example='EXAMPLE.KEY~WITH+SYMBOLS=VALUE'
$accepted=@($example,('  '+$example+"`r`n"),([char]34+$example+[char]34),([char]39+$example+[char]39),([char]0x201C+$example+[char]0x201D),([char]0xFEFF+$example+[char]0x200B))
foreach($value in $accepted){if((ConvertTo-GeminiApiKey $value) -cne $example){throw 'Key normalization failed.'}}
foreach($value in @('', 'My chatbot key', '***********************', 'https://aistudio.google.com/apikey', ($example+"`n"+$example))){
  $rejected=$false;try{$null=ConvertTo-GeminiApiKey $value}catch{$rejected=$true}
  if(-not $rejected){throw 'Invalid input was accepted.'}
}
$backendRoot=[IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$testRoot=[IO.Path]::GetFullPath((Join-Path $backendRoot ('.logs/gemini-setup-check-'+[guid]::NewGuid().ToString('N'))))
if(-not $testRoot.StartsWith($backendRoot+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Test path is outside backend.'}
try{
  $null=New-Item -ItemType Directory -Path (Join-Path $testRoot 'scripts') -Force
  Copy-Item -LiteralPath (Join-Path $backendRoot 'configure-gemini.ps1') -Destination (Join-Path $testRoot 'configure-gemini.ps1')
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'GeminiKeyInput.ps1') -Destination (Join-Path $testRoot 'scripts/GeminiKeyInput.ps1')
  function Read-Host {param([string]$Prompt,[switch]$AsSecureString) if($AsSecureString){ConvertTo-SecureString ('  '+[char]34+$example+[char]34+'  ') -AsPlainText -Force}else{'example-model'}}
  & (Join-Path $testRoot 'configure-gemini.ps1')
  $lines=Get-Content -LiteralPath (Join-Path $testRoot 'gemini-local.properties')
  if($lines.Count -ne 3 -or $lines[1] -cne 'edgemart.gemini.model=example-model' -or $lines[2] -cne ('edgemart.gemini.key='+$example)){throw 'Configuration output was incorrect.'}
  Write-Host 'Gemini setup passed: key formats, pasted whitespace/quotes, rejected input and private file output (dummy credentials only).'
}finally{
  if(Test-Path -LiteralPath $testRoot){Remove-Item -LiteralPath $testRoot -Recurse -Force}
}

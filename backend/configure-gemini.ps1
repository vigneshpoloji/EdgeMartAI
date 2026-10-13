$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'scripts/GeminiKeyInput.ps1')
$model=(Read-Host 'Gemini model [gemini-3.1-flash-lite]').Trim()
if(-not $model){$model='gemini-3.1-flash-lite'}
if($model -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{1,99}$'){throw 'Enter a model name from Google AI Studio.'}
$hiddenKey=Read-Host 'Gemini API key (hidden)' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($hiddenKey)
try{$key=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}
try{
  $key=ConvertTo-GeminiApiKey $key
  $propertyKey=$key.Replace('\','\\')
  [IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'gemini-local.properties'),@('# Private Gemini configuration. Do not share or commit.',('edgemart.gemini.model='+$model),('edgemart.gemini.key='+$propertyKey)),[Text.UTF8Encoding]::new($false))
}finally{$key=$null;$propertyKey=$null;$hiddenKey.Dispose()}
Write-Host 'Gemini configuration saved privately. Restart using .\start-backend.ps1 -Restart.'

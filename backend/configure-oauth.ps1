param([Parameter(Mandatory=$true)][ValidateSet('google','github')][string]$Provider)
$ErrorActionPreference='Stop'
$configurationPath=Join-Path $PSScriptRoot 'oauth-local.properties'
Write-Host "Configure $Provider sign-in for EdgeMart. The secret is entered privately and saved only in the ignored backend configuration."
$clientId=(Read-Host 'Application / client ID').Trim()
if ([string]::IsNullOrWhiteSpace($clientId) -or $clientId.Length -gt 1000) { throw 'Enter a valid client ID.' }
$hiddenSecret=Read-Host 'Client secret VALUE (hidden)' -AsSecureString
$secretPointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($hiddenSecret)
try { $clientSecret=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
if ([string]::IsNullOrWhiteSpace($clientSecret) -or $clientSecret.Length -gt 4096) { throw 'Enter the client secret value.' }
function ConvertTo-PropertyValue([string]$Value) {
  if ($Value.Contains("`r") -or $Value.Contains("`n")) { throw 'Configuration values must be on one line.' }
  return $Value.Replace('\','\\').Replace(' ','\ ').Replace("`t",'\t')
}
$updates=@{}
$updates["edgemart.oauth.$Provider-id"]=ConvertTo-PropertyValue $clientId
$updates["edgemart.oauth.$Provider-secret"]=ConvertTo-PropertyValue $clientSecret
$lines=if(Test-Path -LiteralPath $configurationPath){@(Get-Content -LiteralPath $configurationPath)}else{@('# Private OAuth client configuration. Do not share or commit this file.')}
$kept=@($lines | Where-Object {$key=($_ -split '=',2)[0];-not $updates.ContainsKey($key)})
$kept+=@($updates.Keys | Sort-Object | ForEach-Object {$_+'='+$updates[$_]})
[IO.File]::WriteAllLines($configurationPath,$kept,[Text.UTF8Encoding]::new($false))
$clientSecret=$null;$updates=$null;$hiddenSecret.Dispose()
Write-Host "$Provider credentials saved. Restart with .\start-backend.ps1 -Restart."
Write-Host "Register this callback URL with the provider: http://localhost:8081/login/oauth2/code/$Provider"

param(
    [Parameter(Mandatory=$true)][string]$Email,
    [switch]$Reset
)
$ErrorActionPreference = 'Stop'
$javaExecutable = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else {
    $installedJdk = Get-ChildItem 'C:\Program Files\Java' -Directory | Where-Object { $_.Name -like 'jdk-*' } | Sort-Object Name -Descending | Select-Object -First 1
    if ($installedJdk) { Join-Path $installedJdk.FullName 'bin\java.exe' } else { (Get-Command java.exe).Source }
}
# Maven's helper exits its script; launch it in a separate PowerShell process.
Push-Location $PSScriptRoot
try {
    & (Get-Process -Id $PID).Path -NoProfile -File (Join-Path $PSScriptRoot 'mvn.ps1') -q compile dependency:build-classpath '-Dmdep.outputFile=target/account-recovery.classpath'
    if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the account recovery tool.' }
    $dependencyClasspath = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'target/account-recovery.classpath') -Raw).Trim()
    $recoveryMode = if ($Reset) { '--reset' } else { '--check' }
    & $javaExecutable -cp ((Join-Path $PSScriptRoot 'target/classes') + [IO.Path]::PathSeparator + $dependencyClasspath) com.edgemart.tools.AccountRecovery $recoveryMode $Email
    $result = $LASTEXITCODE
} finally { Pop-Location }
exit $result

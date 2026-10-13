param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Goals)
$ErrorActionPreference = 'Stop'
# OneDrive can mark generated directories read-only, preventing Maven clean on Windows.
if ($Goals -contains 'clean') {
    $buildTarget = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'target'))
    $backendRoot = [IO.Path]::GetFullPath($PSScriptRoot) + [IO.Path]::DirectorySeparatorChar
    if (-not $buildTarget.StartsWith($backendRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to modify a build directory outside the backend.'
    }
    if (Test-Path -LiteralPath $buildTarget) {
        $generatedItems = @(Get-Item -LiteralPath $buildTarget -Force) + @(Get-ChildItem -LiteralPath $buildTarget -Recurse -Force)
        foreach ($generatedItem in $generatedItems) {
            $generatedItem.Attributes = $generatedItem.Attributes -band (-bnot [IO.FileAttributes]::ReadOnly)
        }
    }
}
$mavenCommand = (Get-Command mvn.cmd -ErrorAction Stop).Source
$mavenRoot = Split-Path (Split-Path $mavenCommand -Parent) -Parent
$javaExecutable = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\java.exe' } else {
    $installedJdk = Get-ChildItem 'C:\Program Files\Java' -Directory | Where-Object { $_.Name -like 'jdk-*' } | Sort-Object Name -Descending | Select-Object -First 1
    if ($installedJdk) { Join-Path $installedJdk.FullName 'bin\java.exe' } else { (Get-Command java.exe).Source }
}
$launcher = (Get-ChildItem (Join-Path $mavenRoot 'boot') -Filter 'plexus-classworlds-*.jar' | Select-Object -First 1).FullName
Push-Location $PSScriptRoot
try {
    & $javaExecutable --enable-native-access=ALL-UNNAMED "-Dmaven.home=$mavenRoot" "-Dclassworlds.conf=$mavenRoot\bin\m2.conf" "-Dmaven.multiModuleProjectDirectory=$PSScriptRoot" -cp $launcher org.codehaus.plexus.classworlds.launcher.Launcher @Goals
    $result = $LASTEXITCODE
} finally { Pop-Location }
exit $result

param([switch]$Restart)
$ErrorActionPreference = 'Stop'
$backendRoot = [IO.Path]::GetFullPath($PSScriptRoot)
if ($env:PORT -and $env:PORT -ne '8081') {
    throw 'This local startup helper uses port 8081. Clear PORT or use mvn.ps1 for a custom port.'
}
if ($Restart) { & (Join-Path $backendRoot 'stop-backend.ps1') }
$connection = Get-NetTCPConnection -State Listen -ErrorAction Stop |
    Where-Object LocalPort -eq 8081 | Select-Object -First 1
if ($connection) {
    $application = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
    $maven = if ($application) { Get-CimInstance Win32_Process -Filter "ProcessId = $($application.ParentProcessId)" }
    if (-not $application -or -not $maven -or
        -not $application.CommandLine.Contains('com.edgemart.EdgeMartApplication') -or
        -not $maven.CommandLine.Contains('org.codehaus.plexus.classworlds.launcher.Launcher') -or
        -not $maven.CommandLine.Replace('/', '\').Contains($backendRoot)) {
        throw 'Port 8081 belongs to another application. Nothing was stopped or started.'
    }
    try {
        $null = Invoke-RestMethod 'http://localhost:8081/api/health/live' -TimeoutSec 8
    } catch {
        throw 'This backend already owns port 8081 but has not answered its health check. Check its startup terminal; no second server was started.'
    }
    try {
        $null = Invoke-RestMethod 'http://localhost:8081/api/health' -TimeoutSec 35
        Write-Host 'EdgeMart backend is already running and connected to MongoDB at http://localhost:8081.'
    } catch {
        Write-Host 'EdgeMart backend is running, but MongoDB is temporarily unavailable. Check Atlas network access and your connection; the server was left running.' -ForegroundColor Yellow
    }
    Write-Host 'No second server was started. To reload backend changes, run .\start-backend.ps1 -Restart.'
    exit 0
}
Write-Host 'Starting EdgeMart on http://localhost:8081. Keep this terminal open; Ctrl+C stops the server.'
& (Join-Path $backendRoot 'mvn.ps1') spring-boot:run
exit $LASTEXITCODE

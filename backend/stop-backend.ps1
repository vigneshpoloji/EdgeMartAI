$ErrorActionPreference = 'Stop'
$backendRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$connection = Get-NetTCPConnection -State Listen -ErrorAction Stop |
    Where-Object LocalPort -eq 8081 | Select-Object -First 1
if (-not $connection) {
    Write-Host 'No backend is listening on port 8081.'
    exit 0
}
$application = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
$maven = Get-CimInstance Win32_Process -Filter "ProcessId = $($application.ParentProcessId)"
if (-not $application -or -not $maven -or
    -not $application.CommandLine.Contains('com.edgemart.EdgeMartApplication') -or
    -not $maven.CommandLine.Contains('org.codehaus.plexus.classworlds.launcher.Launcher') -or
    -not $maven.CommandLine.Replace('/', '\').Contains($backendRoot)) {
    throw 'Port 8081 belongs to a process that cannot be verified as this workspace backend. Nothing was stopped.'
}
$launcher = Get-CimInstance Win32_Process -Filter "ProcessId = $($maven.ParentProcessId)"
$backgroundLauncher = $launcher -and $launcher.Name -in @('pwsh.exe', 'powershell.exe') -and
    ($launcher.CommandLine.Contains('mvn.ps1') -or $launcher.CommandLine.Contains('start-backend.ps1')) -and
    $launcher.CommandLine.Replace('/', '\').Contains($backendRoot) -and
    $launcher.CommandLine.Contains('-File')

# Stop only the verified application and Maven; preserve the user's interactive terminal.
foreach ($process in @($application, $maven)) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.ProcessId)"
    if ($current -and $current.CreationDate -eq $process.CreationDate) {
        try { Stop-Process -Id $current.ProcessId -ErrorAction Stop }
        catch {
            $remaining = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.ProcessId)"
            if ($remaining -and $remaining.CreationDate -eq $process.CreationDate) { throw }
        }
    }
}
# A background PowerShell launcher holds its redirected log files open on Windows.
if ($backgroundLauncher) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $($launcher.ProcessId)"
    if ($current -and $current.CreationDate -eq $launcher.CreationDate) {
        try { Stop-Process -Id $current.ProcessId -ErrorAction Stop }
        catch {
            $remaining = Get-CimInstance Win32_Process -Filter "ProcessId = $($launcher.ProcessId)"
            if ($remaining -and $remaining.CreationDate -eq $launcher.CreationDate) { throw }
        }
    }
}
Write-Host 'EdgeMart backend stopped. Port 8081 and background log handles are released.'

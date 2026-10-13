$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'scripts/ContactKeyValidation.ps1')
$contactKey = $env:BREVO_API_KEY
try {
    if (-not $contactKey) {
        $contactPath = Join-Path $PSScriptRoot 'contact-local.properties'
        if (-not (Test-Path -LiteralPath $contactPath)) { throw 'Run configure-contact.ps1 first.' }
        $contactLine = Get-Content -LiteralPath $contactPath | Where-Object { $_ -match '^edgemart\.contact\.key=' } | Select-Object -First 1
        if (-not $contactLine) { throw 'Run configure-contact.ps1 first.' }
        $contactKey = $contactLine.Substring($contactLine.IndexOf('=')+1).Trim().Replace('\\', '\')
    }
    Confirm-BrevoApiKey -Key $contactKey
    try {
        $contactHeaders = @{'api-key'=$contactKey; 'Accept'='application/json'}
        $contactSenders = Invoke-RestMethod 'https://api.brevo.com/v3/senders' -Headers $contactHeaders -TimeoutSec 15 -ErrorAction Stop
        $contactActive = @($contactSenders.senders | Where-Object { $_.email -eq 'vigneshpoloji@gmail.com' -and $_.active -eq $true })
        if ($contactActive.Count) { Write-Host 'Sender vigneshpoloji@gmail.com is active. You can now test the website form.' }
        else { Write-Warning 'Verify vigneshpoloji@gmail.com under Brevo Settings -> Senders before testing the form.' }
    } catch { throw 'The API key passed validation, but the sender check failed. Check Brevo account access and sender verification.' }
} finally {
    $contactKey = $null; $contactHeaders = $null; $contactLine = $null
    $contactSenders = $null; $contactActive = $null
}

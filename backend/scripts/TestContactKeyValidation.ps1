$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'ContactKeyValidation.ps1')
$contactCalls = [Collections.Generic.List[object]]::new()
$contactSuccess = {
    param($Headers)
    $contactCalls.Add($Headers['api-key'])
    [pscustomobject]@{relay=[pscustomobject]@{enabled=$true}}
}
Confirm-BrevoApiKey -Key 'xkeysib-test-credential-12345' -Request $contactSuccess
if ($contactCalls.Count -ne 1) { throw 'Valid credential was not checked exactly once.' }
foreach ($contactInvalid in @('xsmtpsib-dummy-credential', 'xkeysib-masked***', '"xkeysib-quoted-value"', 'xkeysib-truncated...')) {
    $contactRejected = $false
    try { Confirm-BrevoApiKey -Key $contactInvalid -Request $contactSuccess } catch { $contactRejected=$true }
    if (-not $contactRejected) { throw 'Invalid key was accepted.' }
}
if ($contactCalls.Count -ne 1) { throw 'An invalid key reached the provider.' }
$contactRejected = $false
try {
    Confirm-BrevoApiKey -Key 'xkeysib-test-credential-12345' -Request {
        param($Headers)
        throw [Net.Http.HttpRequestException]::new('Private provider details and xkeysib-test-credential-12345', $null, [Net.HttpStatusCode]::Unauthorized)
    }
} catch {
    $contactRejected = $_.Exception.Message.Contains('(401)') -and -not $_.Exception.Message.Contains('xkeysib-test-credential-12345') -and -not $_.Exception.Message.Contains('Private provider')
}
if (-not $contactRejected) { throw 'Provider authentication errors were not reported safely.' }
$contactRejected = $false
try {
    Confirm-BrevoApiKey -Key 'xkeysib-test-credential-12345' -Request {
        param($Headers)
        $contactException = [Net.Http.HttpRequestException]::new('Private upstream details', $null, [Net.HttpStatusCode]::Unauthorized)
        $contactRecord = [Management.Automation.ErrorRecord]::new($contactException, 'BrevoFailure', [Management.Automation.ErrorCategory]::AuthenticationError, $null)
        $contactRecord.ErrorDetails = [Management.Automation.ErrorDetails]::new('{"code":"unauthorized","message":"Unrecognised IP address 192.0.2.1"}')
        throw $contactRecord
    }
} catch {
    $contactRejected = $_.Exception.Message.Contains('Authorized IPs') -and -not $_.Exception.Message.Contains('192.0.2.1') -and -not $_.Exception.Message.Contains('Private upstream')
}
if (-not $contactRejected) { throw 'IP restrictions were confused with invalid credentials or exposed upstream details.' }
Write-Host 'Contact key validation checks passed. Mock requests only; no real keys or email used.'

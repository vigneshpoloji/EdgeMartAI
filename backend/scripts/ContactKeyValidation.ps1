function Confirm-BrevoApiKey {
    param(
        [Parameter(Mandatory=$true)][string]$Key,
        [scriptblock]$Request = {
            param($Headers)
            Invoke-RestMethod 'https://api.brevo.com/v3/account' -Headers $Headers -TimeoutSec 15 -ErrorAction Stop
        }
    )
    if ($Key.StartsWith('xsmtpsib-')) {
        throw 'This is an SMTP key. Generate a key under Brevo Settings -> SMTP & API -> API keys.'
    }
    if ($Key -notmatch '^[\x21-\x7E]{15,4096}$' -or $Key -match '[*"''“”‘’•…]' -or $Key.Contains('...') -or $Key -match '^https?://') {
        throw 'Paste the complete API key using Copy when it is generated. Do not copy a masked key, quotes or a URL.'
    }
    try {
        $contactHeaders = @{'api-key'=$Key; 'Accept'='application/json'}
        $contactAccount = & $Request $contactHeaders
    } catch {
        $contactStatus = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode }
            elseif ($_.Exception.StatusCode) { [int]$_.Exception.StatusCode } else { 0 }
        $contactProviderMessage = ''
        try { $contactProviderMessage = [string](($_.ErrorDetails.Message | ConvertFrom-Json).message) } catch {}
        if ($contactProviderMessage -match '(?i)unrecogni[sz]ed IP|IP address|whitelist|IP security') {
            throw 'Brevo blocked the backend IP address. In Brevo open your profile -> Security -> Authorized IPs, or review its security notification email, and authorize your own backend request. A new API key is not required for this IP block.'
        }
        if ($contactStatus -eq 401) {
            throw 'Brevo rejected this API key (401). Generate a new active API key and copy its full value immediately. The key was not saved.'
        }
        if ($contactStatus -eq 403) {
            throw 'Brevo denied this API check (403). Check your account access and API IP security notifications. The key was not saved.'
        }
        throw 'Brevo could not validate the API key. Check your connection and try again. The key was not saved.'
    } finally {
        $contactHeaders = $null
        $contactProviderMessage = $null
        $Key = $null
    }
    if ($null -eq $contactAccount -or $null -eq $contactAccount.relay) {
        throw 'Brevo did not return a valid account response. The key was not saved.'
    }
    if (-not $contactAccount.relay.enabled) {
        Write-Warning 'Brevo accepted the key, but transactional sending is not enabled. Complete Brevo account activation before testing the form.'
    }
    $contactAccount = $null
    Write-Host 'Brevo API key validated successfully. No email was sent.'
}

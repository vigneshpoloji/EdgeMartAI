$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'scripts/ContactKeyValidation.ps1')
Write-Host 'First verify vigneshpoloji@gmail.com as a sender in Brevo. Use an API key, not an SMTP key.'
$taskSecret = Read-Host 'Brevo API key (hidden)' -AsSecureString
$taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecret)
try {
    $taskKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer).Trim()
    Confirm-BrevoApiKey -Key $taskKey
    $taskLines = @('# Private local contact-email configuration; do not commit.',
        ('edgemart.contact.key=' + $taskKey.Replace('\', '\\')),
        'edgemart.contact.sender=vigneshpoloji@gmail.com')
    [IO.File]::WriteAllLines((Join-Path $PSScriptRoot 'contact-local.properties'), $taskLines, [Text.UTF8Encoding]::new($false))
    Write-Host 'Contact email configuration saved privately. Run .\start-backend.ps1 -Restart once, then submit the contact form.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer)
    $taskKey = $null
    $taskSecret.Dispose()
}

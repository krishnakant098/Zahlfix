$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$key = [Convert]::ToBase64String($bytes)
Write-Host ""
Write-Host "ZahlFix Netlify Setup Key" -ForegroundColor Yellow
Write-Host "-------------------------"
Write-Host $key
Write-Host ""
Write-Host "Copy this into Netlify as ZAHLFIX_SETUP_KEY." -ForegroundColor Cyan
Write-Host "Do not commit this key to Git." -ForegroundColor Red

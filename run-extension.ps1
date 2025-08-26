# VibeReader Extension Runner
# Usage: .\run-extension.ps1 [additional web-ext args]
# Example: .\run-extension.ps1 --browser-console

param(
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$AdditionalArgs = @()
)

# Base command with usual arguments (excluding --browser-console by default)
$baseArgs = @(
    "run"
    "--verbose"
    "--devtools"
    "--no-reload"
    "--firefox=`"C:\Program Files\Firefox Developer Edition\firefox.exe`""
)

# Add any additional arguments passed to the script
$allArgs = $baseArgs + $AdditionalArgs

# Change to extension directory
Set-Location "C:\Users\jacks\experiments\WebStormProjects\vibe-reader-extension"

Write-Host "Running web-ext with args: $($allArgs -join ' ')" -ForegroundColor Cyan

# Run web-ext with all arguments and capture output
& web-ext @allArgs 2>&1 | Out-File -FilePath dump.log -Encoding UTF8
Write-Host "Processing dump.log..." -ForegroundColor Yellow

# Sort and deduplicate with counts
Get-Content dump.log | Sort-Object | Group-Object | ForEach-Object { "$($_.Count.ToString().PadLeft(3)) $($_.Name)" } | Out-File dump-sorted.log

Write-Host "Results written to dump-sorted.log" -ForegroundColor Green
Write-Host "`nTop 10 most frequent log entries:" -ForegroundColor Green
Get-Content dump-sorted.log | Sort-Object { [int]($_ -split ' ')[0] } -Descending | Select-Object -First 10
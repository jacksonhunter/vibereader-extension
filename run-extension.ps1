# VibeReader Extension Debugger for Claude Analysis
# Captures Firefox extension debug output silently, filters web-ext noise, shows only relevant debug info
# Usage: .\run-extension.ps1 [-AutoCloseSeconds 30] [additional web-ext args]

param(
    [Parameter()]
    [int]$AutoCloseSeconds = 30,  # Default to 30 seconds

    [Parameter()]
    [switch]$NoAutoClose = $false,

    [Parameter(ValueFromRemainingArguments)]
    [string[]]$AdditionalArgs = @()
)

# Base command with usual arguments
$baseArgs = @(
    "run"
    "--config=web-ext-config.cjs"
    "--verbose"
    "--devtools"
    "--no-reload"
    "--firefox=`"C:\Program Files\Firefox Developer Edition\firefox.exe`""
)

$allArgs = $baseArgs + $AdditionalArgs

Set-Location "C:\Users\jacks\experiments\WebStormProjects\vibe-reader-extension"

Write-Host "Running web-ext for $AutoCloseSeconds seconds..." -ForegroundColor Cyan
Write-Host "Firefox launching (output being captured silently)..." -ForegroundColor Yellow

# Clear previous log files
@("dump.log", "dump-sorted.log") | ForEach-Object {
    if (Test-Path $_) { Remove-Item $_ }
}

# Create timer for auto-close
if (-not $NoAutoClose) {
    $timerJob = Start-Job -ScriptBlock {
        param($seconds)
        Start-Sleep -Seconds $seconds
        Get-Process -Name "firefox*" -ErrorAction SilentlyContinue | Stop-Process -Force
    } -ArgumentList $AutoCloseSeconds
}

try {
    # Run web-ext and capture output SILENTLY to file only
    & web-ext @allArgs 2>&1 > dump.log
} finally {
    if ($timerJob -and $timerJob.State -eq 'Running') {
        Stop-Job -Job $timerJob
        Remove-Job -Job $timerJob -Force
    }
}

Write-Host "`nProcessing captured output..." -ForegroundColor Yellow

if (Test-Path "dump.log") {
    # Get raw lines, clean Firefox prefixes FIRST, then filter out web-ext noise
    $rawLines = Get-Content dump.log | ForEach-Object {
        # Clean up Firefox stdout/stderr prefixes but keep the actual message
        if ($_ -match "Firefox (stdout|stderr):\s*(.+)") {
            $matches[2]
        } else {
            $_
        }
    } | Where-Object {
        # Keep lines that are NOT web-ext noise (now applied to cleaned content)
        $_ -notmatch "^\[.*node_modules\\web-ext.*\]" -and  # All web-ext debug/info messages
        $_ -notmatch "Retrying Firefox.*connection error" -and  # Connection retry noise
        $_ -notmatch "Connecting to Firefox on port" -and
                $_ -notmatch "Connecting to the remote Firefox" -and
                $_ -notmatch "Connected to the remote Firefox" -and
                $_ -notmatch "Received .* from Firefox client" -and
                $_ -notmatch "installTemporaryAddon:" -and
                $_ -notmatch "Installed .* as a temporary add-on" -and
                $_ -notmatch "Automatic extension reloading" -and
                $_ -notmatch "Firefox closed" -and
                $_ -notmatch "^\s*$" -and  # Empty lines
        $_.Trim() -ne ""
    }

    $rawCount = ($rawLines | Measure-Object).Count

    # Sort and deduplicate with counts
    $sorted = $rawLines |
            Sort-Object |
            Group-Object |
            ForEach-Object {
                [PSCustomObject]@{
                    Count = $_.Count
                    Text = $_.Name
                }
            } |
            Sort-Object Count -Descending

    # Save sorted version
    $sorted | ForEach-Object { "$($_.Count.ToString().PadLeft(5)) $($_.Text)" } |
            Out-File dump-sorted.log

    # Display categorized output
    Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
    Write-Host "EXTENSION DEBUG OUTPUT [$rawCount lines, $($sorted.Count) unique]" -ForegroundColor Cyan
    Write-Host ("=" * 80) -ForegroundColor Cyan

    # Categorize messages by type
    $jsErrors = $sorted | Where-Object { $_.Text -match "JavaScript error:|TypeError|ReferenceError|NotFoundError" }
    $consoleErrors = $sorted | Where-Object { $_.Text -match "console\.error:" -and $_.Text -notmatch "JavaScript error:" }
    $extensionLogs = $sorted | Where-Object {
        $_.Text -match "VibeReader|Subscriber|terminal-|start-extraction|content-extracted|contentExtracted" -and
                $_.Text -notmatch "error"
    }
    $otherMessages = $sorted | Where-Object {
        $_ -notin $jsErrors -and
                $_ -notin $consoleErrors -and
                $_ -notin $extensionLogs
    }

    # Show JavaScript errors first (most important)
    if ($jsErrors.Count -gt 0) {
        Write-Host "`n### JAVASCRIPT ERRORS ###" -ForegroundColor Red
        $jsErrors | ForEach-Object {
            Write-Host "[$($_.Count.ToString().PadLeft(4))] $($_.Text)" -ForegroundColor Red
        }
    }

    # Console errors
    if ($consoleErrors.Count -gt 0) {
        Write-Host "`n### CONSOLE ERRORS ###" -ForegroundColor Yellow
        $consoleErrors | ForEach-Object {
            Write-Host "[$($_.Count.ToString().PadLeft(4))] $($_.Text)" -ForegroundColor Yellow
        }
    }

    # Extension logs (your actual debug output)
    if ($extensionLogs.Count -gt 0) {
        Write-Host "`n### EXTENSION LOGS ###" -ForegroundColor Cyan
        $extensionLogs | ForEach-Object {
            # Highlight high-frequency logs
            $color = if ($_.Count -ge 10) { "White" } else { "Gray" }
            Write-Host "[$($_.Count.ToString().PadLeft(4))] $($_.Text)" -ForegroundColor $color
        }
    }

    # Other messages (limit to avoid clutter)
    if ($otherMessages.Count -gt 0) {
        Write-Host "`n### OTHER MESSAGES ###" -ForegroundColor DarkGray
        $otherMessages | Select-Object -First 10 | ForEach-Object {
            Write-Host "[$($_.Count.ToString().PadLeft(4))] $($_.Text)" -ForegroundColor DarkGray
        }
        if ($otherMessages.Count -gt 10) {
            Write-Host "... and $($otherMessages.Count - 10) more (see dump-sorted.log)" -ForegroundColor DarkGray
        }
    }

    Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan

    # Quick summary of error types
    $errorSummary = @{
        "JS Errors" = $jsErrors.Count
        "Console Errors" = $consoleErrors.Count
        "Extension Logs" = $extensionLogs.Count
        "Other" = $otherMessages.Count
    }

    Write-Host "SUMMARY:" -ForegroundColor Green
    $errorSummary.GetEnumerator() | ForEach-Object {
        if ($_.Value -gt 0) {
            Write-Host "  $($_.Key): $($_.Value) unique messages" -ForegroundColor Green
        }
    }

} else {
    Write-Host "No dump.log file found!" -ForegroundColor Red
}
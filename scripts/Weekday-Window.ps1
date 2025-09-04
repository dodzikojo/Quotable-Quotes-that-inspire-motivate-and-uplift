<# 
Rewrite-WeekdayWindow.ps1

Deletes weekday commits between a time window on the current branch (HEAD),
retaining the latest commit (HEAD) even if it matches the window.

Parameters:
 -Execute           Perform the rewrite (omit for dry run list only)
 -StartHour         Start boundary (HH:mm) (default 08:00)
 -EndHour           End boundary (exclusive) (default 18:00)
#>

[CmdletBinding()]
param(
  [switch]$Execute,
  [string]$StartHour = "08:00",
  [string]$EndHour   = "18:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Parse-HHMM {
  param([string]$s)
  if (-not $s -or $s -notmatch '^\d{2}:\d{2}$') {
    throw "Invalid time '$s'. Use HH:mm (e.g., 08:00)."
  }
  $ts = [TimeSpan]::ParseExact($s, 'hh\:mm', $null)
  return [int]($ts.Hours * 60 + $ts.Minutes)
}

$startM = Parse-HHMM $StartHour
$endM   = Parse-HHMM $EndHour
if ($startM -ge $endM) {
  throw "StartHour must be earlier than EndHour."
}

# Ensure we are in a git repo and git-filter-repo is available
git rev-parse --is-inside-work-tree *> $null 2>&1
if ($LASTEXITCODE -ne 0) { throw "Not inside a Git work tree." }

git filter-repo -h *> $null 2>&1
if ($LASTEXITCODE -ne 0) { throw "git-filter-repo not found in PATH." }

# HEAD commit to retain
$headOid = (git rev-parse HEAD).Trim().ToLowerInvariant()

function Convert-AuthorRawToLocal {
  param(
    [long]$Epoch,
    [string]$Tz # +HHMM or -HHMM
  )
  $sign = if ($Tz.StartsWith('+')) { +1 } else { -1 }
  $tzHours = [int]$Tz.Substring(1,2)
  $tzMins  = [int]$Tz.Substring(3,2)
  $offsetMins = $sign * ($tzHours*60 + $tzMins)
  $dtoUtc = [DateTimeOffset]::FromUnixTimeSeconds($Epoch)
  return $dtoUtc.ToOffset([TimeSpan]::FromMinutes($offsetMins))
}

function Get-CommitsOnHead {
  # Use git log with raw date: "%H<TAB>%ad<TAB>%s", where %ad is "epoch tz"
  $lines = git log --date=raw --pretty=format:"%H`t%ad`t%s" HEAD
  foreach ($line in $lines) {
    if (-not $line) { continue }
    $parts = $line -split "`t", 3
    if ($parts.Count -lt 3) { continue }
    $sha = $parts[0]
    $ad = $parts[1] # "1689003540 -0700"
    $subj = $parts[2]
    $adParts = $ad -split ' '
    if ($adParts.Count -ne 2) { continue }
    $epoch = [long]$adParts[0]
    $tz = $adParts[1]
    $local = Convert-AuthorRawToLocal -Epoch $epoch -Tz $tz
    [pscustomobject]@{
      ShaFull = $sha
      Sha     = $sha.Substring(0,7)
      Epoch   = $epoch
      Tz      = $tz
      Local   = $local
      Subject = $subj
    }
  }
}

function In-WeekdayWindow {
  param([datetimeoffset]$Local, [int]$StartMin, [int]$EndMin)
  $dow = $Local.DayOfWeek
  $isWeekday = ($dow -ne 'Saturday' -and $dow -ne 'Sunday')
  $mins = $Local.Hour*60 + $Local.Minute
  return ($isWeekday -and ($mins -ge $StartMin) -and ($mins -lt $EndMin))
}

# DRY RUN: list commits that would be removed
$commits = Get-CommitsOnHead
$toDrop = @()
foreach ($c in $commits) {
  if ($c.ShaFull.ToLowerInvariant() -eq $headOid) { continue } # retain latest
  if (In-WeekdayWindow -Local $c.Local -StartMin $startM -EndMin $endM) {
    $toDrop += $c
  }
}

if (-not $Execute) {
  Write-Host "DRY RUN: the following commits on HEAD would be deleted (weekday within $StartHour-$EndHour, End exclusive):"
  $props = @(
    @{n='When (local)';e={$_.Local.ToString('yyyy-MM-dd HH:mm zzz')}}
    @{n='Day';e={$_.Local.DayOfWeek}}
    @{n='SHA';e={$_.Sha}}
    @{n='TZ';e={$_.Tz}}
    @{n='Subject';e={$_.Subject}}
  )
  $toDrop | Sort-Object Local | Select-Object $props | Format-Table -AutoSize
  exit 0
}

# EXECUTE: build Python callback and run filter-repo
$callback = @'
from datetime import datetime, timedelta
import os

KEEP_OID = os.environ.get("KEEP_OID", "").strip().lower().encode("ascii")

def parse_hhmm(s):
    hh, mm = s.split(":")
    return int(hh)*60 + int(mm)

START_MIN = parse_hhmm(os.environ.get("FILTER_START", "08:00"))
END_MIN   = parse_hhmm(os.environ.get("FILTER_END", "18:00"))

def in_weekday_window(commit):
    raw = commit.author_date.decode("utf-8")  # e.g. "1689003540 -0700"
    epoch_s, tz = raw.split()
    epoch = int(epoch_s)
    sign = 1 if tz == "+" else -1
    tz_h = int(tz[1:3]); tz_m = int(tz[3:5])
    offset_min = sign*(tz_h*60 + tz_m)
    dt_local = datetime.utcfromtimestamp(epoch) + timedelta(minutes=offset_min)
    mins = dt_local.hour*60 + dt_local.minute
    return dt_local.weekday() < 5 and START_MIN <= mins < END_MIN

# Skip matching commits, but always keep the latest (HEAD) by original id
if commit.original_id != KEEP_OID and in_weekday_window(commit):
    commit.skip()
'@

$tempDir = Join-Path ([IO.Path]::GetTempPath()) ("git-prune-window-" + [guid]::NewGuid().ToString("n"))
$null = New-Item -ItemType Directory -Path $tempDir -Force
$cbFile  = Join-Path $tempDir "callback.py"
[IO.File]::WriteAllText($cbFile, $callback, [Text.Encoding]::UTF8)

$env:FILTER_START = $StartHour
$env:FILTER_END   = $EndHour
$env:KEEP_OID     = $headOid

Write-Host "Rewriting history on current branch; keeping HEAD $headOid and dropping weekday commits within $StartHour-$EndHour (End exclusive)..."

# Use the supported @file form to avoid quoting/env pitfalls on Windows
& git filter-repo --force --refs HEAD --replace-refs update-or-add --commit-callback=@$cbFile

if ($LASTEXITCODE -ne 0) {
  throw "git filter-repo failed (exit $LASTEXITCODE). Check .git/fast_import_crash_* for details."
}

Remove-Item -Recurse -Force $tempDir
Write-Host "Done. Inspect history and force-push as needed."


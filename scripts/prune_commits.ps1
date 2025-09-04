<#
Prune (rewrite) Git history by deleting commits whose AUTHOR local time falls on a weekday (Mon-Fri)
between 08:00 (inclusive) and 18:00 (exclusive), while ALWAYS preserving the current HEAD commit
even if it matches the window.

WARNING: This rewrites history (force-push needed). Only run AFTER reading the notes below.

Features:
 - Dry run (default) lists commits that WOULD be removed.
 - Execute mode performs the rewrite using git-filter-repo.
 - Creates a safety backup branch before rewriting.

Prerequisites:
 - git-filter-repo installed (https://github.com/newren/git-filter-repo)
   Install (Python + pip):  pip install git-filter-repo
   Verify:                  git filter-repo --version

Usage (PowerShell):
   # Dry run (recommended first)
   ./scripts/prune_commits.ps1

   # Execute rewrite
   ./scripts/prune_commits.ps1 -Execute

Optional parameters:
   -StartHour  (default 08:00)
   -EndHour    (default 18:00)  (End boundary is EXCLUSIVE)
   -IncludeSeconds (treat input hh:mm:ss) (not usually needed)

After executing:
   git push --force-with-lease origin <branch>

To undo (before force-push) you can reset to the created backup branch.
To undo (after remote push) collaborators must re-clone or hard reset; coordinate first.

DISCLAIMER: Removing commits also removes their changes UNLESS those changes are present
in later retained commits. Review the dry-run list carefully.
#>

param(
    [switch]$Execute,
    [string]$StartHour = '08:00',
    [string]$EndHour   = '18:00',
    [switch]$IncludeSeconds,
    [switch]$KeepTemp,          # Keep the generated Python callback file for debugging
    [switch]$AllowDirty         # Skip clean worktree check
)

function Parse-Time($s) {
    if ($IncludeSeconds) { [DateTime]::ParseExact($s, 'HH:mm:ss', $null) }
    else { [DateTime]::ParseExact($s, 'HH:mm', $null) }
}

try {
    $start = Parse-Time $StartHour
    $end   = Parse-Time $EndHour
} catch {
    Write-Error "Invalid time format. Use HH:mm (or HH:mm:ss with -IncludeSeconds)."; exit 1
}

if ($start -ge $end) { Write-Error 'StartHour must be earlier than EndHour.'; exit 1 }

# Ensure we are inside a git repo
git rev-parse --is-inside-work-tree 2>$null 1>$null
if ($LASTEXITCODE -ne 0) { Write-Error 'Not inside a git repository.'; exit 1 }

if (-not $AllowDirty) {
    $status = git status --porcelain
    if ($status) {
        Write-Host 'Working tree not clean. Stash or commit changes, or use -AllowDirty to proceed.' -ForegroundColor Yellow
        Write-Host 'Aborting (use -AllowDirty to override).' -ForegroundColor Yellow
        exit 1
    }
}

$headSha = (git rev-parse HEAD).Trim()
$branch  = (git rev-parse --abbrev-ref HEAD).Trim()

Write-Host "Current branch: $branch" -ForegroundColor Cyan
Write-Host "HEAD commit:   $headSha" -ForegroundColor Cyan
Write-Host "Window: Weekdays between $StartHour and $EndHour (local author time)" -ForegroundColor Cyan

# Collect commits (topo-order oldest -> newest)
$commits = git rev-list --topo-order --reverse HEAD

function Get-Author-Date($sha) {
    # ISO strict local (e.g., 2025-09-04T10:15:30+01:00)
    $iso = git show -s --format=%ad --date=iso-strict-local $sha
    return [DateTimeOffset]::Parse($iso)
}

$toRemove = @()
$toKeep   = @()

foreach ($sha in $commits) {
    $dto = Get-Author-Date $sha
    $local = $dto.LocalDateTime
    $weekday = $local.DayOfWeek  # Monday=1 in display but .NET enumeration: Monday=1, Sunday=0
    $timeOnly = [DateTime]::ParseExact($local.ToString('HH:mm:ss'), 'HH:mm:ss', $null)
    $weekdayIndex = [int]$local.DayOfWeek
    $isWeekday = ($weekdayIndex -ge 1 -and $weekdayIndex -le 5)  # Mon..Fri

    $startCmp = [DateTime]::Today.AddHours($start.Hour).AddMinutes($start.Minute).AddSeconds($start.Second)
    $endCmp   = [DateTime]::Today.AddHours($end.Hour).AddMinutes($end.Minute).AddSeconds($end.Second)

    $inWindow = $isWeekday -and ($timeOnly.TimeOfDay -ge $start.TimeOfDay) -and ($timeOnly.TimeOfDay -lt $end.TimeOfDay)

    if ($sha -eq $headSha) { $toKeep += $sha; continue }
    if ($inWindow) { $toRemove += [pscustomobject]@{ Sha=$sha; LocalTime=$local } }
    else { $toKeep += $sha }
}

if (-not $Execute) {
    Write-Host "--- DRY RUN (no history rewritten) ---" -ForegroundColor Yellow
    Write-Host "Commits that WOULD be removed ($($toRemove.Count)):" -ForegroundColor Yellow
    foreach ($c in $toRemove) {
        Write-Host ("{0}  {1}" -f $c.Sha.Substring(0,10), $c.LocalTime) -ForegroundColor DarkYellow
    }
    Write-Host "Commits kept ($($toKeep.Count)) including HEAD:" -ForegroundColor Green
    Write-Host ($toKeep | ForEach-Object { $_.Substring(0,10) }) -Separator ' '
    Write-Host ''
    Write-Host 'If this looks correct run again with -Execute to rewrite history.' -ForegroundColor Cyan
    exit 0
}

if ($toRemove.Count -eq 0) {
    Write-Host 'No commits matched the criteria. Nothing to do.' -ForegroundColor Green
    exit 0
}

Write-Host "Rewriting history..." -ForegroundColor Yellow

# Safety backup branch
$backupBranch = "backup/pre-prune-$(Get-Date -Format yyyyMMddHHmmss)"
git branch $backupBranch
Write-Host "Created backup branch: $backupBranch" -ForegroundColor Yellow

<#
Detect git-filter-repo availability. We first try the git subcommand form (preferred):
    git filter-repo --version
If unavailable, we try Python module:
    python -m git_filter_repo --version
If still missing we fail with guidance.
#>
$global:FILTER_REPO_MODE = 'git'
git filter-repo --version 1>$null 2>$null
if ($LASTEXITCODE -ne 0) {
        python -m git_filter_repo --version 1>$null 2>$null
        if ($LASTEXITCODE -eq 0) { $global:FILTER_REPO_MODE = 'python' }
        else {
                Write-Error @'
git-filter-repo not found.

Install options:
    1) Using pip (recommended):
             python -m pip install --upgrade git-filter-repo
         Ensure your Python Scripts directory is in PATH, e.g.:
             C:\Users\\<you>\\AppData\\Local\\Programs\\Python\\Python311\\Scripts

    2) Manual single-file install:
             Download git-filter-repo from https://github.com/newren/git-filter-repo
             Place the file named "git-filter-repo" (or git-filter-repo.py) somewhere on PATH
             (rename to git-filter-repo without extension if needed).

After installing, re-run this script.
'@; exit 1
        }
}

function Run-FilterRepo {
        param([string[]]$Args)
        if ($FILTER_REPO_MODE -eq 'python') {
                & python -m git_filter_repo @Args
        } else {
                git filter-repo @Args
        }
}

$tempPy = Join-Path $env:TEMP ("commit_filter_{0}.py" -f ([guid]::NewGuid().ToString('N')))

$headLower = $headSha.ToLower()
$removeSet = $toRemove.Sha | ForEach-Object { $_.ToLower() }
$removeJson = ($removeSet | ConvertTo-Json)

@'
import os, json, datetime
remove_shas = set(json.loads(os.environ["PRUNE_REMOVE_SET"]))
head_sha = os.environ["PRUNE_HEAD_SHA"].lower()

def commit_callback(commit):
    sha = commit.original_id.decode('ascii').lower()
    if sha == head_sha:
        return  # always keep HEAD
    if sha in remove_shas:
        commit.skip()
'@ | Set-Content -Encoding UTF8 $tempPy

$env:PRUNE_REMOVE_SET = $removeJson
$env:PRUNE_HEAD_SHA    = $headLower

$callbackExpr = "exec(compile(open(r'$tempPy', 'rb').read(), r'$tempPy', 'exec'))"
$args = @('--force','--commit-callback', $callbackExpr)

Write-Host 'Invoking git-filter-repo...' -ForegroundColor Yellow
$filterOutput = & Run-FilterRepo --Args $args 2>&1
$exit = $LASTEXITCODE
if ($exit -ne 0) {
    Write-Error "git-filter-repo failed (exit $exit). Truncated output:";
    $filterOutput | Select-Object -First 40 | ForEach-Object { Write-Host $_ -ForegroundColor DarkRed }
    Write-Host ''
    Write-Host 'Troubleshooting tips:' -ForegroundColor Cyan
    Write-Host '  1. Ensure no hooks or filters aborting.'
    Write-Host '  2. Try: git fsck --no-reflogs --full --strict' -ForegroundColor DarkCyan
    Write-Host '  3. Run again with -KeepTemp and inspect the Python file.' -ForegroundColor DarkCyan
    Write-Host '  4. Upgrade: python -m pip install --upgrade git-filter-repo' -ForegroundColor DarkCyan
    Write-Host "  5. Restore backup: git reset --hard $backupBranch" -ForegroundColor DarkCyan
    Write-Host '  6. If sparse checkout or alternates in use, disable temporarily.' -ForegroundColor DarkCyan
    if (-not $KeepTemp) { Write-Host "Temp file kept automatically for debugging: $tempPy" -ForegroundColor Yellow }
    else { Write-Host "Temp file location: $tempPy" -ForegroundColor Yellow }
    exit 1
}

if (-not $KeepTemp) { Remove-Item $tempPy -ErrorAction SilentlyContinue }

Write-Host 'History rewritten successfully.' -ForegroundColor Green
Write-Host "Next step (review first): git log --oneline" -ForegroundColor Cyan
Write-Host "Force push (after verifying): git push --force-with-lease origin $branch" -ForegroundColor Cyan
Write-Host "If something is wrong: git reset --hard $backupBranch (before force-push)" -ForegroundColor Yellow

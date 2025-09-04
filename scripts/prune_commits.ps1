<#
Prune (rewrite) Git history by deleting commits whose AUTHOR local time falls on a weekday (Mon-Fri)
between 08:00 (inclusive) and 18:00 (exclusive), while ALWAYS preserving the current HEAD commit
even if it matches the window.

CAUTION: Rewrites history. Coordinate with collaborators before force-pushing.

Modes:
  1) git-filter-repo (default, if available) using --commit-callback (preserves DAG shape except removed commits).
  2) Cherry-pick linear rebuild (-CherryPickMode) – recreates a linear history (merges become linearized or re-applied with -m mainline parent).

Parameters:
  -Execute           Perform the rewrite (omit for dry run list only)
  -StartHour         Start boundary (HH:mm) (default 08:00)
  -EndHour           End boundary (exclusive) (default 18:00)
  -IncludeSeconds    Interpret Start/End with HH:mm:ss
  -AllowDirty        Skip clean worktree check
  -KeepTemp          Keep temp Python callback file (filter-repo mode)
  -CherryPickMode    Use manual cherry-pick strategy instead of git-filter-repo
  -MergeMainline <n> Mainline parent index (1-based) for merge commits in cherry-pick (default 1)

Examples (PowerShell):
  Dry run:   pwsh ./scripts/prune_commits.ps1
  Execute (filter-repo): pwsh ./scripts/prune_commits.ps1 -Execute
  Execute (cherry-pick): pwsh ./scripts/prune_commits.ps1 -Execute -CherryPickMode
  Execute cherry-pick choosing second parent as mainline merges: pwsh ./scripts/prune_commits.ps1 -Execute -CherryPickMode -MergeMainline 2

After success review: git log --oneline --graph
Force push when satisfied: git push --force-with-lease origin <branch>

Restore (before push): git reset --hard backup/pre-prune-<timestamp>
#>

param(
    [switch]$Execute,
    [string]$StartHour = '08:00',
    [string]$EndHour   = '18:00',
    [switch]$IncludeSeconds,
    [switch]$KeepTemp,
    [switch]$AllowDirty,
    [switch]$CherryPickMode,
    [int]$MergeMainline = 1
)

function Parse-Time($s) {
    if ($IncludeSeconds) { [DateTime]::ParseExact($s, 'HH:mm:ss', $null) }
    else { [DateTime]::ParseExact($s, 'HH:mm', $null) }
}

try { $start = Parse-Time $StartHour; $end = Parse-Time $EndHour } catch { Write-Error 'Invalid time format.'; exit 1 }
if ($start -ge $end) { Write-Error 'StartHour must be earlier than EndHour.'; exit 1 }

git rev-parse --is-inside-work-tree *> $null; if ($LASTEXITCODE -ne 0) { Write-Error 'Not inside a git repository.'; exit 1 }
if (-not $AllowDirty) { if (git status --porcelain) { Write-Host 'Working tree not clean (stash/commit or use -AllowDirty).' -ForegroundColor Yellow; exit 1 } }

$headSha = (git rev-parse HEAD).Trim()
$branch  = (git rev-parse --abbrev-ref HEAD).Trim()
Write-Host "Current branch: $branch" -ForegroundColor Cyan
Write-Host "HEAD commit:   $headSha" -ForegroundColor Cyan
Write-Host "Window: Weekdays between $StartHour and $EndHour (author local time)" -ForegroundColor Cyan

$commits = git rev-list --topo-order --reverse HEAD

function Get-Author-Date($sha) {
    $iso = git show -s --format=%ad --date=iso-strict-local $sha
    [DateTimeOffset]::Parse($iso)
}

$toRemove = @(); $toKeep = @()
foreach ($sha in $commits) {
    $dto = Get-Author-Date $sha
    $local = $dto.LocalDateTime
    $weekdayIndex = [int]$local.DayOfWeek   # Sunday=0
    $isWeekday = ($weekdayIndex -ge 1 -and $weekdayIndex -le 5)
    $timeOnly = [DateTime]::ParseExact($local.ToString('HH:mm:ss'),'HH:mm:ss',$null)
    $inWindow = $isWeekday -and ($timeOnly.TimeOfDay -ge $start.TimeOfDay) -and ($timeOnly.TimeOfDay -lt $end.TimeOfDay)
    if ($sha -eq $headSha) { $toKeep += $sha; continue }
    if ($inWindow) { $toRemove += [pscustomobject]@{Sha=$sha; LocalTime=$local} } else { $toKeep += $sha }
}

if (-not $Execute) {
    Write-Host '--- DRY RUN ---' -ForegroundColor Yellow
    Write-Host "Remove candidates ($($toRemove.Count)):" -ForegroundColor Yellow
    foreach ($c in $toRemove) { Write-Host ("{0}  {1}" -f $c.Sha.Substring(0,10), $c.LocalTime) -ForegroundColor DarkYellow }
    Write-Host "Kept ($($toKeep.Count)) inc. HEAD:" -ForegroundColor Green
    Write-Host ($toKeep | ForEach-Object { $_.Substring(0,10) }) -Separator ' '
    Write-Host 'Run with -Execute to apply.' -ForegroundColor Cyan
    if ($CherryPickMode) { Write-Host 'NOTE: -CherryPickMode selected (linear rewrite).' -ForegroundColor Cyan }
    exit 0
}

if ($toRemove.Count -eq 0) { Write-Host 'No commits matched; nothing to do.' -ForegroundColor Green; exit 0 }

Write-Host 'Rewriting history...' -ForegroundColor Yellow
$backupBranch = "backup/pre-prune-$(Get-Date -Format yyyyMMddHHmmss)"
git branch $backupBranch; Write-Host "Backup branch: $backupBranch" -ForegroundColor Yellow

function Get-Parents($sha) { (git rev-list --parents -n1 $sha).Split(' ') | Select-Object -Skip 1 }

function Do-CherryPickRewrite {
    param([string[]]$KeepList)
    Write-Host 'Using CherryPickMode (linear rebuild).' -ForegroundColor Yellow
    if ($MergeMainline -lt 1) { Write-Error '-MergeMainline must be >= 1'; return 99 }
    # Determine base commit: first non-merge; else parent of first merge (mainline parent)
    $baseCommit = $null; $baseIsParent = $false
    foreach ($k in $KeepList) { $parents = Get-Parents $k; if ($parents.Count -le 1) { $baseCommit = $k; break } }
    if (-not $baseCommit) {
        # All merges; choose first commit's selected parent
        $firstMerge = $KeepList[0]
        $parents = Get-Parents $firstMerge
        if ($MergeMainline -gt $parents.Count) { Write-Error "MergeMainline $MergeMainline exceeds parent count $($parents.Count) for $firstMerge"; return 98 }
        $parentIdx = $MergeMainline - 1
        $baseCommit = $parents[$parentIdx]
        $baseIsParent = $true
        Write-Host "All kept commits are merges; basing branch from parent $($baseCommit.Substring(0,10)) of first merge." -ForegroundColor Yellow
    }
    $newBranch = "rewrite/pruned-$(Get-Date -Format yyyyMMddHHmmss)"
    git checkout -q -b $newBranch $baseCommit
    if ($LASTEXITCODE -ne 0) { Write-Error 'Failed to create rewrite branch.'; return 1 }
    for ($i=0; $i -lt $KeepList.Count; $i++) {
        $c = $KeepList[$i]
        if (-not $baseIsParent -and $i -eq 0 -and $c -eq $baseCommit) { continue } # already at base commit
        $parents = Get-Parents $c
        if ($parents.Count -gt 1) {
            if ($MergeMainline -gt $parents.Count) { Write-Error "MergeMainline $MergeMainline exceeds parent count $($parents.Count) for $c"; return 97 }
            git cherry-pick -x -m $MergeMainline $c
        } else {
            git cherry-pick -x $c
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Conflict during cherry-pick: $c" -ForegroundColor Red
            Write-Host 'Resolve conflicts, then run: git cherry-pick --continue  (or abort with git cherry-pick --abort). Afterwards you may manually finish remaining commits.' -ForegroundColor Red
            return 2
        }
    }
    Write-Host "Cherry-pick rewrite complete on branch $newBranch" -ForegroundColor Green
    Write-Host "Replace original branch when satisfied:" -ForegroundColor Cyan
    Write-Host "  git checkout $branch" -ForegroundColor Cyan
    Write-Host "  git reset --hard $newBranch" -ForegroundColor Cyan
    Write-Host "  git push --force-with-lease origin $branch" -ForegroundColor Cyan
    return 0
}

if ($CherryPickMode) {
    $status = Do-CherryPickRewrite -KeepList $toKeep
    exit $status
}

# git-filter-repo path detection
$global:FILTER_REPO_MODE = 'git'
git filter-repo --version *> $null
if ($LASTEXITCODE -ne 0) {
    python -m git_filter_repo --version *> $null
    if ($LASTEXITCODE -eq 0) { $global:FILTER_REPO_MODE = 'python' } else {
        Write-Error 'git-filter-repo not available; re-run with -CherryPickMode or install git-filter-repo.'; exit 1 }
}

function Run-FilterRepo { param([string[]]$Args) if ($FILTER_REPO_MODE -eq 'python') { & python -m git_filter_repo @Args } else { git filter-repo @Args } }

$tempPy = Join-Path $env:TEMP ("commit_filter_{0}.py" -f ([guid]::NewGuid().ToString('N')))
$headLower = $headSha.ToLower(); $removeSet = $toRemove.Sha | ForEach-Object { $_.ToLower() }; $removeJson = ($removeSet | ConvertTo-Json)

@'
import os, json
remove_shas = set(json.loads(os.environ["PRUNE_REMOVE_SET"]))
head_sha = os.environ["PRUNE_HEAD_SHA"].lower()
def commit_callback(commit):
    sha = commit.original_id.decode('ascii').lower()
    if sha == head_sha:
        return
    if sha in remove_shas:
        commit.skip()
'@ | Set-Content -Encoding UTF8 $tempPy

$env:PRUNE_REMOVE_SET = $removeJson
$env:PRUNE_HEAD_SHA = $headLower
$callbackExpr = "exec(open(r'$tempPy','rb').read(),globals())"
$args = @($callbackExpr)
Write-Host 'Invoking git-filter-repo...' -ForegroundColor Yellow
$out = & Run-FilterRepo --Args $args 2>&1; $code=$LASTEXITCODE
if ($code -ne 0) {
    Write-Error "git-filter-repo failed (exit $code). Showing first lines:"; $out | Select-Object -First 40 | ForEach-Object { Write-Host $_ -ForegroundColor DarkRed }
    Write-Host 'Try installing standalone git-filter-repo script or fallback to -CherryPickMode.' -ForegroundColor Cyan
    Write-Host "Restore backup: git reset --hard $backupBranch" -ForegroundColor Yellow
    if ($KeepTemp) { Write-Host "Temp file kept: $tempPy" -ForegroundColor Yellow } else { Write-Host "Temp file retained due to failure: $tempPy" -ForegroundColor Yellow }
    exit 1
}
if (-not $KeepTemp) { Remove-Item $tempPy -ErrorAction SilentlyContinue }
Write-Host 'History rewritten successfully.' -ForegroundColor Green
Write-Host 'Review: git log --oneline --graph' -ForegroundColor Cyan
Write-Host "Force push when satisfied: git push --force-with-lease origin $branch" -ForegroundColor Cyan
Write-Host "Restore (pre-push): git reset --hard $backupBranch" -ForegroundColor Yellow

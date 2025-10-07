# Safe Vercel Deployment Script (PowerShell)
# Prevents accidental production deployments

$ErrorActionPreference = "Stop"

# Get current branch
$currentBranch = git branch --show-current

Write-Host "🚀 Safe Vercel Deployment" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Check if on main branch
if ($currentBranch -eq "main") {
    Write-Host "❌ ERROR: You are on the 'main' branch!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Production deployments should only happen via GitHub PR merge." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To deploy to production:"
    Write-Host "  1. Create PR: gh pr create --base main --head develop"
    Write-Host "  2. Get approval and merge"
    Write-Host "  3. Vercel will automatically deploy"
    Write-Host ""
    exit 1
}

# Check if on develop branch (DEV)
if ($currentBranch -eq "develop") {
    Write-Host "✓ Current branch: " -NoNewline -ForegroundColor Green
    Write-Host "develop" -ForegroundColor Green -NoNewline
    Write-Host " (DEV environment)" -ForegroundColor Green
    Write-Host ""
    Write-Host "This will deploy to: Preview/DEV environment"
    Write-Host "Database: DEV_POSTGRES_URL"
    Write-Host ""

    $response = Read-Host "Continue with DEV deployment? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Host ""
    Write-Host "Deploying to DEV..." -ForegroundColor Green
    vercel --yes
    exit 0
}

# For other branches (feature branches)
Write-Host "⚠ Current branch: " -NoNewline -ForegroundColor Yellow
Write-Host $currentBranch -ForegroundColor Yellow
Write-Host ""
Write-Host "This will deploy to: Preview environment"
Write-Host ""

$response = Read-Host "Continue with Preview deployment? (y/N)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Deploying to Preview..." -ForegroundColor Green
vercel --yes

# PowerShell script to install nodemailer
# Run this script as Administrator

Write-Host "🔧 Installing nodemailer for Gmail SMTP..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run this script as Administrator" -ForegroundColor Red
    Write-Host "💡 Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Set execution policy
Write-Host "📋 Setting execution policy..." -ForegroundColor Blue
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Install nodemailer
Write-Host "📦 Installing nodemailer..." -ForegroundColor Blue
npm install nodemailer

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ nodemailer installed successfully!" -ForegroundColor Green
    Write-Host "🚀 Your Gmail OTP service is now ready!" -ForegroundColor Green
    Write-Host "📧 Restart the backend server to send actual emails" -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to install nodemailer" -ForegroundColor Red
    Write-Host "💡 Try running: npm install nodemailer manually" -ForegroundColor Yellow
}

Write-Host "Press any key to continue..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

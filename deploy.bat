@echo off
echo 🚀 DEPLOYING ALEXANDRITE PROXY TO CLOUDFLARE...
echo ═══════════════════════════════════════════════

echo 📋 Checking TypeScript compilation...
npx tsc --noEmit --project .

if %ERRORLEVEL% neq 0 (
    echo ❌ TypeScript compilation failed! Fix errors before deploying.
    pause
    exit /b 1
)

echo ✅ TypeScript compilation successful!

echo 📦 Deploying to Cloudflare Workers...
npx wrangler deploy

if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo 🎉 DEPLOYMENT SUCCESSFUL!
echo ═══════════════════════════════════════════════
echo ✅ Chutes provider forcing is now LIVE
echo ✅ NVIDIA model mapping is active  
echo ✅ Thinking token filtering enabled
echo 💰 Vercel keys will use cheapest Chutes pricing
echo 🔑 NVIDIA keys will use direct API with mapping
echo ═══════════════════════════════════════════════

echo 🧪 Testing deployment...
timeout /t 3 /nobreak >nul

echo Running quick test...
node test-deployed-worker.js

pause
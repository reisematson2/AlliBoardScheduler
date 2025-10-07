@echo off
echo AlliBoard Scheduler - Vercel Deployment
echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check for errors.
    pause
    exit /b 1
)
echo.
echo Build successful! Deploying to Vercel...
echo.
vercel --prod
echo.
echo Deployment complete!
pause

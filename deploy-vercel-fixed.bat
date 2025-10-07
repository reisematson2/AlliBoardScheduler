@echo off
echo AlliBoard Scheduler - Fixed Vercel Deployment
echo.
echo Building React app...
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
echo.
echo Your app should now work at the Vercel URL!
pause

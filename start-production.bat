@echo off
echo Starting AlliBoard Scheduler in Production Mode...
echo.
echo Building application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please check for errors.
    pause
    exit /b 1
)
echo.
echo Starting production server...
call npm start

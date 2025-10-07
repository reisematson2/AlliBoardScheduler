@echo off
echo Setting up AlliBoard Scheduler...
echo.
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Installation failed! Please check for errors.
    pause
    exit /b 1
)
echo.
echo Creating environment file...
if not exist .env (
    echo NODE_ENV=development > .env
    echo PORT=5000 >> .env
    echo DATABASE_URL=postgresql://user:password@localhost:5432/alliboard >> .env
    echo Environment file created!
) else (
    echo Environment file already exists.
)
echo.
echo Setup complete! 
echo.
echo To start the development server, run: npm run dev
echo To start the production server, run: npm start
echo.
pause

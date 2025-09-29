@echo off
set NODE_ENV=development
set DATABASE_URL=postgresql://user:password@localhost:5432/alliboard
set PORT=5000
npx tsx server/index.ts

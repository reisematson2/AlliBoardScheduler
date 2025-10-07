# 📅 AlliBoard Scheduler

A comprehensive schedule management application for educational settings, built with React, Express.js, and PostgreSQL.

## ✨ Features

- **📊 Dashboard**: Overview of today's schedule with quick stats
- **📋 Schedule Management**: Drag-and-drop interface for creating schedules
- **👥 Multiple Views**: Master view, individual student/aide views
- **⚠️ Conflict Detection**: Real-time detection of scheduling conflicts
- **📄 Templates**: Save and load schedule templates
- **🖨️ Print Support**: Optimized print layouts for schedules
- **📱 Mobile Responsive**: Works on all devices

## 🚀 Quick Start

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:5000`

4. **Add sample data** (optional):
   ```bash
   node scripts/populate-sample-data.js
   ```

### Deploy to Vercel (Recommended)

```bash
# Deploy with one command
vercel

# Or use the deployment script
deploy-vercel.bat
```

**Your app will be live at `https://your-project.vercel.app`**

## 📖 Documentation

- [Launch Guide](LAUNCH_GUIDE.md) - Complete setup and usage instructions
- [Vercel Deployment](VERCEL_DEPLOYMENT.md) - Deploy to Vercel in 5 minutes
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Pre-launch checklist

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check
- `npm run db:push` - Push database schema

### Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Radix UI primitives with shadcn/ui
- **State**: TanStack Query, React Hook Form

## 📝 License

MIT License - see LICENSE file for details

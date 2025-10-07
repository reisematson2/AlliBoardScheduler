# 🚀 AlliBoard Scheduler - Launch Guide

## Quick Start (5 minutes)

### Option 1: Development Mode (Recommended for testing)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser to http://localhost:5000
```

### Option 2: Production Mode

```bash
# 1. Build the application
npm run build

# 2. Start production server
npm start

# 3. Open browser to http://localhost:5000
```

## 📊 Adding Sample Data

To populate the app with realistic test data:

```bash
# In a new terminal, run the sample data script
node scripts/populate-sample-data.js
```

This will create:

- 6 students with different colors
- 6 aides with different colors
- 15 different activities
- A complete week of varied schedules
- Sample templates

## 🎯 Key Features

### Dashboard

- Overview of today's schedule
- Quick stats (students, aides, sessions, conflicts)
- Next upcoming activity
- Available students/aides

### Schedule Management

- **Master View**: See all schedules at once
- **Student View**: Filter by individual student
- **Aide View**: Filter by individual aide
- **Day/Week View**: Toggle between daily and weekly views

### Drag & Drop

- Drag students/aides to schedule blocks
- Visual conflict detection
- Real-time updates

### Templates

- Save current schedule as template
- Load templates for quick setup
- Local storage backup

### Print View

- Optimized print layout
- Customizable print options
- Individual student/aide schedules

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and update as needed:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/alliboard
```

### Database Setup

The app works in two modes:

1. **In-Memory Mode** (default): Data resets on restart
2. **Database Mode**: Persistent data storage

For production, set up a PostgreSQL database and update the DATABASE_URL.

## 🎨 Customization

### Colors

Each student, aide, and activity has a color that can be customized:

- Students: Blue, Green, Purple, Orange, Teal, Indigo
- Aides: Green, Purple, Orange, Teal, Indigo, Pink
- Activities: Various colors for easy identification

### Time Slots

Default schedule runs 8 AM - 4 PM with 30-minute intervals.
Can be customized in the code.

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   - Change PORT in .env file
   - Or kill process using port 5000

2. **Database connection failed**

   - App will automatically use in-memory storage
   - Check DATABASE_URL in .env file

3. **Build errors**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version (requires 18+)

### Getting Help

- Check browser console for errors
- Check server logs in terminal
- Ensure all dependencies are installed: `npm install`

## 📱 Mobile Support

The app is responsive and works on tablets and mobile devices.

## 🔒 Data Security

- All data is stored locally or in your database
- No external data sharing
- Full control over your schedule data

## 🎉 Ready to Use!

Your AlliBoard Scheduler is ready for immediate use. The app includes:

- Beautiful, modern interface
- Intuitive drag-and-drop scheduling
- Real-time conflict detection
- Comprehensive print functionality
- Template system for quick setup

Start with the sample data to see all features in action!

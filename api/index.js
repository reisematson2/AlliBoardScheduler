// api/index.js - Vercel serverless function
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Simple in-memory storage (same as your current setup)
const storage = {
  students: [],
  aides: [],
  activities: [],
  blocks: [],
  templates: []
};

// API Routes
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({ 
    message: "Server is working!", 
    timestamp: new Date().toISOString(),
    storage: "Storage initialized",
    directory: __dirname
  });
});

// Add a debug endpoint to check file system
app.get('/api/debug', (req, res) => {
  console.log('🔧 Debug endpoint called');
  import('fs').then(fs => {
    try {
      const distPath = path.join(__dirname, '../dist');
      const publicPath = path.join(__dirname, '../dist/public');
      const indexPath = path.join(__dirname, '../dist/public/index.html');
      const assetsPath = path.join(__dirname, '../dist/public/assets');
      const jsPath = path.join(__dirname, '../dist/public/assets/index-FCEauDs2.js');
      const cssPath = path.join(__dirname, '../dist/public/assets/index-BdqTDFDv.css');
      
      const distExists = fs.existsSync(distPath);
      const publicExists = fs.existsSync(publicPath);
      const indexExists = fs.existsSync(indexPath);
      const assetsExists = fs.existsSync(assetsPath);
      const jsExists = fs.existsSync(jsPath);
      const cssExists = fs.existsSync(cssPath);
      
      console.log(`📁 dist exists: ${distExists}`);
      console.log(`📁 public exists: ${publicExists}`);
      console.log(`📄 index.html exists: ${indexExists}`);
      console.log(`📁 assets exists: ${assetsExists}`);
      console.log(`📄 JS file exists: ${jsExists}`);
      console.log(`📄 CSS file exists: ${cssExists}`);
      
      res.json({
        message: 'Debug info',
        directory: __dirname,
        distExists,
        publicExists,
        indexExists,
        assetsExists,
        jsExists,
        cssExists,
        distPath,
        publicPath,
        indexPath,
        assetsPath,
        jsPath,
        cssPath
      });
    } catch (error) {
      console.error('Debug error:', error);
      res.json({ error: error.message });
    }
  }).catch(error => {
    console.error('Import error:', error);
    res.json({ error: error.message });
  });
});

app.get('/api/students', (req, res) => {
  res.json(storage.students);
});

app.post('/api/students', (req, res) => {
  const student = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    createdAt: new Date()
  };
  storage.students.push(student);
  res.json(student);
});

app.put('/api/students/:id', (req, res) => {
  const index = storage.students.findIndex(student => student.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Student not found" });
  }
  storage.students[index] = { ...storage.students[index], ...req.body };
  res.json(storage.students[index]);
});

app.delete('/api/students/:id', (req, res) => {
  const index = storage.students.findIndex(student => student.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Student not found" });
  }
  storage.students.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/aides', (req, res) => {
  res.json(storage.aides);
});

app.post('/api/aides', (req, res) => {
  const aide = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    createdAt: new Date()
  };
  storage.aides.push(aide);
  res.json(aide);
});

app.put('/api/aides/:id', (req, res) => {
  const index = storage.aides.findIndex(aide => aide.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Aide not found" });
  }
  storage.aides[index] = { ...storage.aides[index], ...req.body };
  res.json(storage.aides[index]);
});

app.delete('/api/aides/:id', (req, res) => {
  const index = storage.aides.findIndex(aide => aide.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Aide not found" });
  }
  storage.aides.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/activities', (req, res) => {
  res.json(storage.activities);
});

app.post('/api/activities', (req, res) => {
  const activity = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    createdAt: new Date()
  };
  storage.activities.push(activity);
  res.json(activity);
});

app.put('/api/activities/:id', (req, res) => {
  const index = storage.activities.findIndex(activity => activity.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Activity not found" });
  }
  storage.activities[index] = { ...storage.activities[index], ...req.body };
  res.json(storage.activities[index]);
});

app.delete('/api/activities/:id', (req, res) => {
  const index = storage.activities.findIndex(activity => activity.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Activity not found" });
  }
  storage.activities.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/blocks', (req, res) => {
  const { date } = req.query;
  if (date) {
    res.json(storage.blocks.filter(block => block.date === date));
  } else {
    res.json(storage.blocks);
  }
});

app.post('/api/blocks', (req, res) => {
  const block = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    studentIds: req.body.studentIds || [],
    aideIds: req.body.aideIds || [],
    notes: req.body.notes || '',
    recurrence: req.body.recurrence || '{"type":"none"}',
    createdAt: new Date()
  };
  storage.blocks.push(block);
  res.json(block);
});

app.put('/api/blocks/:id', (req, res) => {
  const index = storage.blocks.findIndex(block => block.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Block not found" });
  }
  storage.blocks[index] = { ...storage.blocks[index], ...req.body };
  res.json(storage.blocks[index]);
});

app.delete('/api/blocks/:id', (req, res) => {
  const index = storage.blocks.findIndex(block => block.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Block not found" });
  }
  storage.blocks.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/templates', (req, res) => {
  res.json(storage.templates);
});

app.post('/api/templates', (req, res) => {
  const template = {
    id: Math.random().toString(36).substr(2, 9),
    ...req.body,
    createdAt: new Date()
  };
  storage.templates.push(template);
  res.json(template);
});

app.delete('/api/templates/:id', (req, res) => {
  const index = storage.templates.findIndex(template => template.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: "Template not found" });
  }
  storage.templates.splice(index, 1);
  res.json({ success: true });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  console.log(`🔍 Request received: ${req.method} ${req.url}`);
  console.log(`📁 Current directory: ${__dirname}`);
  
  // Check if this is an asset request
  if (req.url.startsWith('/assets/')) {
    console.log(`🎨 Asset request detected: ${req.url}`);
    console.log(`📄 Looking for asset: ${path.join(__dirname, '../dist/public', req.url)}`);
    
    // Try to serve the asset file
    try {
      const assetPath = path.join(__dirname, '../dist/public', req.url);
      console.log(`✅ Attempting to serve asset: ${assetPath}`);
      res.sendFile(assetPath);
    } catch (error) {
      console.error(`❌ Error serving asset:`, error);
      res.status(404).send('Asset not found');
    }
    return;
  }
  
  // For non-asset requests, serve the HTML
  console.log(`📄 Looking for HTML file: ${path.join(__dirname, '../dist/public/index.html')}`);
  
  try {
    const filePath = path.join(__dirname, '../dist/public/index.html');
    console.log(`✅ Attempting to serve HTML: ${filePath}`);
    res.sendFile(filePath);
  } catch (error) {
    console.error(`❌ Error serving HTML:`, error);
    // Fallback if static files aren't available
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AlliBoard Scheduler - Debug</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>AlliBoard Scheduler - Debug Mode</h1>
            <p>Request: ${req.method} ${req.url}</p>
            <p>Directory: ${__dirname}</p>
            <p>Error: ${error.message}</p>
            <p>If you see this message, the static files are not available.</p>
            <script>
              setTimeout(() => window.location.reload(), 5000);
            </script>
          </div>
        </body>
      </html>
    `);
  }
});

export default app;

// api/index.js - Vercel serverless function
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, del, list } from '@vercel/blob';

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

// Vercel Blob Storage Implementation
class BlobStorage {
  constructor() {
    this.basePath = 'alliboard-scheduler';
    this.token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!this.token) {
      console.error('❌ BLOB_READ_WRITE_TOKEN not found in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('BLOB')));
    } else {
      console.log('✅ BLOB_READ_WRITE_TOKEN found, length:', this.token.length);
    }
  }

  async getData(type) {
    try {
      if (!this.token) {
        console.error(`❌ No BLOB token available for getting ${type}`);
        return [];
      }
      
      const { blobs } = await list({
        prefix: `${this.basePath}/${type}/`,
        limit: 1000,
        token: this.token
      });
      
      const data = [];
      for (const blob of blobs) {
        const response = await fetch(blob.url);
        const item = await response.json();
        data.push(item);
      }
      return data;
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      return [];
    }
  }

  async saveData(type, id, data) {
    try {
      if (!this.token) {
        console.error(`❌ No BLOB token available for saving ${type}`);
        throw new Error('BLOB_READ_WRITE_TOKEN not configured');
      }
      
      const filename = `${this.basePath}/${type}/${id}.json`;
      const blob = await put(filename, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        token: this.token
      });
      return data;
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      throw error;
    }
  }

  async deleteData(type, id) {
    try {
      if (!this.token) {
        console.error(`❌ No BLOB token available for deleting ${type}`);
        return false;
      }
      
      const filename = `${this.basePath}/${type}/${id}.json`;
      await del(filename, { token: this.token });
      return true;
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      return false;
    }
  }

  // Students
  async getStudents() {
    return await this.getData('students');
  }

  async createStudent(studentData) {
    const id = this.generateId();
    const student = {
      id,
      ...studentData,
      createdAt: new Date()
    };
    await this.saveData('students', id, student);
    return student;
  }

  async updateStudent(id, updateData) {
    const students = await this.getStudents();
    const student = students.find(s => s.id === id);
    if (!student) return null;
    
    const updatedStudent = { ...student, ...updateData };
    await this.saveData('students', id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id) {
    return await this.deleteData('students', id);
  }

  // Aides
  async getAides() {
    return await this.getData('aides');
  }

  async createAide(aideData) {
    const id = this.generateId();
    const aide = {
      id,
      ...aideData,
      createdAt: new Date()
    };
    await this.saveData('aides', id, aide);
    return aide;
  }

  async updateAide(id, updateData) {
    const aides = await this.getAides();
    const aide = aides.find(a => a.id === id);
    if (!aide) return null;
    
    const updatedAide = { ...aide, ...updateData };
    await this.saveData('aides', id, updatedAide);
    return updatedAide;
  }

  async deleteAide(id) {
    return await this.deleteData('aides', id);
  }

  // Activities
  async getActivities() {
    return await this.getData('activities');
  }

  async createActivity(activityData) {
    const id = this.generateId();
    const activity = {
      id,
      ...activityData,
      createdAt: new Date()
    };
    await this.saveData('activities', id, activity);
    return activity;
  }

  async updateActivity(id, updateData) {
    const activities = await this.getActivities();
    const activity = activities.find(a => a.id === id);
    if (!activity) return null;
    
    const updatedActivity = { ...activity, ...updateData };
    await this.saveData('activities', id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id) {
    return await this.deleteData('activities', id);
  }

  // Blocks
  async getBlocks(date) {
    const blocks = await this.getData('blocks');
    if (date) {
      return blocks.filter(b => b.date === date);
    }
    return blocks;
  }

  async createBlock(blockData) {
    const id = this.generateId();
    const block = {
      id,
      ...blockData,
      studentIds: blockData.studentIds || [],
      aideIds: blockData.aideIds || [],
      notes: blockData.notes || null,
      recurrence: blockData.recurrence || '{"type":"none"}',
      createdAt: new Date()
    };
    await this.saveData('blocks', id, block);
    return block;
  }

  async updateBlock(id, updateData) {
    const blocks = await this.getBlocks();
    const block = blocks.find(b => b.id === id);
    if (!block) return null;
    
    const updatedBlock = { ...block, ...updateData };
    await this.saveData('blocks', id, updatedBlock);
    return updatedBlock;
  }

  async deleteBlock(id) {
    return await this.deleteData('blocks', id);
  }

  // Templates
  async getTemplates() {
    return await this.getData('templates');
  }

  async createTemplate(templateData) {
    const id = this.generateId();
    const template = {
      id,
      ...templateData,
      createdAt: new Date()
    };
    await this.saveData('templates', id, template);
    return template;
  }

  async deleteTemplate(id) {
    return await this.deleteData('templates', id);
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Initialize Blob storage
const storage = new BlobStorage();

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

// Add a debug endpoint to check file system and environment
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
      
      // Check environment variables
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      const allEnvVars = Object.keys(process.env);
      const blobRelatedVars = allEnvVars.filter(key => key.includes('BLOB'));
      
      console.log(`📁 dist exists: ${distExists}`);
      console.log(`📁 public exists: ${publicExists}`);
      console.log(`📄 index.html exists: ${indexExists}`);
      console.log(`📁 assets exists: ${assetsExists}`);
      console.log(`📄 JS file exists: ${jsExists}`);
      console.log(`📄 CSS file exists: ${cssExists}`);
      console.log(`🔑 BLOB token exists: ${!!blobToken}`);
      console.log(`🔑 BLOB token length: ${blobToken ? blobToken.length : 0}`);
      
      res.json({
        message: 'Debug info',
        directory: __dirname,
        distExists,
        publicExists,
        indexExists,
        assetsExists,
        jsExists,
        cssExists,
        blobTokenExists: !!blobToken,
        blobTokenLength: blobToken ? blobToken.length : 0,
        blobRelatedEnvVars: blobRelatedVars,
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

app.get('/api/students', async (req, res) => {
  try {
    const students = await storage.getStudents();
    console.log('📋 Getting students, count:', students.length);
    res.json(students);
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    console.log('📝 Creating student:', req.body);
    const student = await storage.createStudent(req.body);
    console.log('✅ Student created:', student);
    res.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const updatedStudent = await storage.updateStudent(req.params.id, req.body);
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const success = await storage.deleteStudent(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.get('/api/aides', async (req, res) => {
  try {
    const aides = await storage.getAides();
    console.log('📋 Getting aides, count:', aides.length);
    res.json(aides);
  } catch (error) {
    console.error('Error getting aides:', error);
    res.status(500).json({ error: 'Failed to get aides' });
  }
});

app.post('/api/aides', async (req, res) => {
  try {
    console.log('📝 Creating aide:', req.body);
    const aide = await storage.createAide(req.body);
    console.log('✅ Aide created:', aide);
    res.json(aide);
  } catch (error) {
    console.error('Error creating aide:', error);
    res.status(500).json({ error: 'Failed to create aide' });
  }
});

app.put('/api/aides/:id', async (req, res) => {
  try {
    const updatedAide = await storage.updateAide(req.params.id, req.body);
    if (!updatedAide) {
      return res.status(404).json({ message: "Aide not found" });
    }
    res.json(updatedAide);
  } catch (error) {
    console.error('Error updating aide:', error);
    res.status(500).json({ error: 'Failed to update aide' });
  }
});

app.delete('/api/aides/:id', async (req, res) => {
  try {
    const success = await storage.deleteAide(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Aide not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting aide:', error);
    res.status(500).json({ error: 'Failed to delete aide' });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const activities = await storage.getActivities();
    res.json(activities);
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

app.post('/api/activities', async (req, res) => {
  try {
    const activity = await storage.createActivity(req.body);
    res.json(activity);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.put('/api/activities/:id', async (req, res) => {
  try {
    const updatedActivity = await storage.updateActivity(req.params.id, req.body);
    if (!updatedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

app.delete('/api/activities/:id', async (req, res) => {
  try {
    const success = await storage.deleteActivity(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

app.get('/api/blocks', async (req, res) => {
  try {
    const { date } = req.query;
    const blocks = await storage.getBlocks(date);
    res.json(blocks);
  } catch (error) {
    console.error('Error getting blocks:', error);
    res.status(500).json({ error: 'Failed to get blocks' });
  }
});

app.post('/api/blocks', async (req, res) => {
  try {
    const block = await storage.createBlock(req.body);
    res.json(block);
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json({ error: 'Failed to create block' });
  }
});

app.put('/api/blocks/:id', async (req, res) => {
  try {
    const updatedBlock = await storage.updateBlock(req.params.id, req.body);
    if (!updatedBlock) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json(updatedBlock);
  } catch (error) {
    console.error('Error updating block:', error);
    res.status(500).json({ error: 'Failed to update block' });
  }
});

app.delete('/api/blocks/:id', async (req, res) => {
  try {
    const success = await storage.deleteBlock(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Block not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting block:', error);
    res.status(500).json({ error: 'Failed to delete block' });
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await storage.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
});

app.post('/api/templates', async (req, res) => {
  try {
    const template = await storage.createTemplate(req.body);
    res.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    const success = await storage.deleteTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
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

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
  }

  async getData(type) {
    try {
      const { blobs } = await list({
        prefix: `${this.basePath}/${type}/`,
        limit: 1000
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
      const filename = `${this.basePath}/${type}/${id}.json`;
      const blob = await put(filename, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json'
      });
      return data;
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      throw error;
    }
  }

  async deleteData(type, id) {
    try {
      const filename = `${this.basePath}/${type}/${id}.json`;
      await del(filename);
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

// Embedded static files for guaranteed availability
const EMBEDDED_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@300..700&family=Geist+Mono:wght@100..900&family=Geist:wght@100..900&family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400..700;1,400..700&family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Outfit:wght@100..900&family=Oxanium:wght@200..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:wght@0,100..900;1,100..900&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Space+Grotesk:wght@300..700&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>
      /* Embedded CSS for guaranteed availability */
      *,:before,:after{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x: 0;--tw-border-spacing-y: 0;--tw-translate-x: 0;--tw-translate-y: 0;--tw-rotate: 0;--tw-skew-x: 0;--tw-skew-y: 0;--tw-scale-x: 1;--tw-scale-y: 1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness: proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width: 0px;--tw-ring-offset-color: #fff;--tw-ring-color: rgb(59 130 246 / .5);--tw-ring-offset-shadow: 0 0 #0000;--tw-ring-shadow: 0 0 #0000;--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }*,:before,:after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}:before,:after{--tw-content: ""}html,:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:var(--font-sans);font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--font-mono);font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}*{border-color:var(--border)}body{background-color:var(--background);font-family:var(--font-sans);color:var(--foreground);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.container{width:100%}@media (min-width: 640px){.container{max-width:640px}}@media (min-width: 768px){.container{max-width:768px}}@media (min-width: 1024px){.container{max-width:1024px}}@media (min-width: 1280px){.container{max-width:1280px}}@media (min-width: 1536px){.container{max-width:1536px}}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.pointer-events-none{pointer-events:none}.pointer-events-auto{pointer-events:auto}.visible{visibility:visible}.invisible{visibility:hidden}.static{position:static}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.inset-0{top:0;right:0;bottom:0;left:0}.inset-x-0{left:0;right:0}.inset-y-0{top:0;bottom:0}.-bottom-12{bottom:-3rem}.-left-12{left:-3rem}.-left-16{left:-4rem}.-right-12{right:-3rem}.-top-12{top:-3rem}.-top-2{top:-.5rem}.bottom-0{bottom:0}.bottom-1{bottom:.25rem}.left-0{left:0}.left-1{left:.25rem}.left-1\/2{left:50%}.left-2{left:.5rem}.left-\[50\%\]{left:50%}.right-0{right:0}.right-1{right:.25rem}.right-2{right:.5rem}.right-3{right:.75rem}.right-4{right:1rem}.top-0{top:0}.top-1{top:.25rem}.top-1\.5{top:.375rem}.top-1\/2{top:50%}.top-2{top:.5rem}.top-3\.5{top:.875rem}.top-4{top:1rem}.top-\[1px\]{top:1px}.top-\[50\%\]{top:50%}.top-\[60\%\]{top:60%}.top-full{top:100%}.z-10{z-index:10}.z-20{z-index:20}.z-30{z-index:30}.z-50{z-index:50}.z-\[100\]{z-index:100}.z-\[1\]{z-index:1}.-mx-1{margin-left:-.25rem;margin-right:-.25rem}.mx-1{margin-left:.25rem;margin-right:.25rem}.mx-2{margin-left:.5rem;margin-right:.5rem}.mx-3\.5{margin-left:.875rem;margin-right:.875rem}.mx-4{margin-left:1rem;margin-right:1rem}.mx-auto{margin-left:auto;margin-right:auto}.my-0\.5{margin-top:.125rem;margin-bottom:.125rem}.my-1{margin-top:.25rem;margin-bottom:.25rem}.-ml-4{margin-left:-1rem}.-mt-4{margin-top:-1rem}.mb-1{margin-bottom:.25rem}.mb-2{margin-bottom:.5rem}.mb-3{margin-bottom:.75rem}.mb-4{margin-bottom:1rem}.ml-0\.5{margin-left:.125rem}.ml-1{margin-left:.25rem}.ml-auto{margin-left:auto}.mr-0\.5{margin-right:.125rem}.mr-1{margin-right:.25rem}.mr-2{margin-right:.5rem}.mt-1{margin-top:.25rem}.mt-1\.5{margin-top:.375rem}.mt-2{margin-top:.5rem}.mt-24{margin-top:6rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-8{margin-top:2rem}.mt-auto{margin-top:auto}.line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1}.\!block{display:block!important}.block{display:block}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.hidden{display:none}.aspect-square{aspect-ratio:1 / 1}.aspect-video{aspect-ratio:16 / 9}.size-4{width:1rem;height:1rem}.h-0\.5{height:.125rem}.h-1\.5{height:.375rem}.h-10{height:2.5rem}.h-11{height:2.75rem}.h-12{height:3rem}.h-2{height:.5rem}.h-2\.5{height:.625rem}.h-3{height:.75rem}.h-3\.5{height:.875rem}.h-4{height:1rem}.h-5{height:1.25rem}.h-6{height:1.5rem}.h-64{height:16rem}.h-7{height:1.75rem}.h-8{height:2rem}.h-9{height:2.25rem}.h-\[1px\]{height:1px}.h-\[var\(--radix-navigation-menu-viewport-height\)\]{height:var(--radix-navigation-menu-viewport-height)}.h-\[var\(--radix-select-trigger-height\)\]{height:var(--radix-select-trigger-height)}.h-auto{height:auto}.h-full{height:100%}.h-px{height:1px}.h-screen{height:100vh}.h-svh{height:100svh}.max-h-32{max-height:8rem}.max-h-40{max-height:10rem}.max-h-60{max-height:15rem}.max-h-64{max-height:16rem}.max-h-\[--radix-context-menu-content-available-height\]{max-height:var(--radix-context-menu-content-available-height)}.max-h-\[--radix-select-content-available-height\]{max-height:var(--radix-select-content-available-height)}.max-h-\[300px\]{max-height:300px}.max-h-\[90vh\]{max-height:90vh}.max-h-\[var\(--radix-dropdown-menu-content-available-height\)\]{max-height:var(--radix-dropdown-menu-content-available-height)}.max-h-full{max-height:100%}.max-h-screen{max-height:100vh}.min-h-0{min-height:0px}.min-h-\[1050px\]{min-height:1050px}.min-h-\[80px\]{min-height:80px}.min-h-\[900px\]{min-height:900px}.min-h-screen{min-height:100vh}.min-h-svh{min-height:100svh}.w-0{width:0px}.w-1{width:.25rem}.w-10{width:2.5rem}.w-11{width:2.75rem}.w-12{width:3rem}.w-2{width:.5rem}.w-2\.5{width:.625rem}.w-20{width:5rem}.w-24{width:6rem}.w-3{width:.75rem}.w-3\.5{width:.875rem}.w-3\/4{width:75%}.w-32{width:8rem}.w-4{width:1rem}.w-40{width:10rem}.w-5{width:1.25rem}.w-6{width:1.5rem}.w-64{width:16rem}.w-7{width:1.75rem}.w-72{width:18rem}.w-8{width:2rem}.w-80{width:20rem}.w-9{width:2.25rem}.w-\[--sidebar-width\]{width:var(--sidebar-width)}.w-\[100px\]{width:100px}.w-\[1px\]{width:1px}.w-auto{width:auto}.w-fit{width:-moz-fit-content;width:fit-content}.w-full{width:100%}.w-max{width:-moz-max-content;width:max-content}.w-px{width:1px}.min-w-0{min-width:0px}.min-w-10{min-width:2.5rem}.min-w-11{min-width:2.75rem}.min-w-5{min-width:1.25rem}.min-w-9{min-width:2.25rem}.min-w-\[12rem\]{min-width:12rem}.min-w-\[600px\]{min-width:600px}.min-w-\[8rem\]{min-width:8rem}.min-w-\[var\(--radix-select-trigger-width\)\]{min-width:var(--radix-select-trigger-width)}.max-w-6xl{max-width:72rem}.max-w-7xl{max-width:80rem}.max-w-\[--skeleton-width\]{max-width:var(--skeleton-width)}.max-w-lg{max-width:32rem}.max-w-max{max-width:-moz-max-content;max-width:max-content}.max-w-md{max-width:28rem}.max-w-sm{max-width:24rem}.max-w-xs{max-width:20rem}.flex-1{flex:1 1 0%}.flex-shrink-0,.shrink-0{flex-shrink:0}.grow{flex-grow:1}.grow-0{flex-grow:0}.basis-full{flex-basis:100%}.caption-bottom{caption-side:bottom}.border-collapse{border-collapse:collapse}.origin-\[--radix-context-menu-content-transform-origin\]{transform-origin:var(--radix-context-menu-content-transform-origin)}.origin-\[--radix-dropdown-menu-content-transform-origin\]{transform-origin:var(--radix-dropdown-menu-content-transform-origin)}.origin-\[--radix-hover-card-content-transform-origin\]{transform-origin:var(--radix-hover-card-content-transform-origin)}.origin-\[--radix-menubar-content-transform-origin\]{transform-origin:var(--radix-menubar-content-transform-origin)}.origin-\[--radix-popover-content-transform-origin\]{transform-origin:var(--radix-popover-content-transform-origin)}.origin-\[--radix-select-content-transform-origin\]{transform-origin:var(--radix-select-content-transform-origin)}.origin-\[--radix-tooltip-content-transform-origin\]{transform-origin:var(--radix-tooltip-content-transform-origin)}.-translate-x-1\/2{--tw-translate-x: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-x-px{--tw-translate-x: -1px;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-y-1\/2{--tw-translate-y: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.translate-x-\[-50\%\]{--tw-translate-x: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.translate-x-px{--tw-translate-x: 1px;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.translate-y-\[-50\%\]{--tw-translate-y: -50%;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-45{--tw-rotate: 45deg;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-90{--tw-rotate: 90deg;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.scale-105{--tw-scale-x: 1.05;--tw-scale-y: 1.05;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@keyframes pulse{50%{opacity:.5}}.animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}@keyframes spin{to{transform:rotate(360deg)}}.animate-spin{animation:spin 1s linear infinite}.cursor-default{cursor:default}.cursor-grab{cursor:grab}.cursor-ns-resize{cursor:ns-resize}.cursor-pointer{cursor:pointer}.touch-none{touch-action:none}.select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}.resize{resize:both}.list-none{list-style-type:none}.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid-cols-8{grid-template-columns:repeat(8,minmax(0,1fr))}.grid-cols-\[60px_1fr\]{grid-template-columns:60px 1fr}.grid-cols-\[60px_repeat\(5\,1fr\)\]{grid-template-columns:60px repeat(5,1fr)}.grid-cols-\[80px_1fr\]{grid-template-columns:80px 1fr}.grid-cols-\[80px_repeat\(5\,1fr\)\]{grid-template-columns:80px repeat(5,1fr)}.flex-row{flex-direction:row}.flex-col{flex-direction:column}.flex-col-reverse{flex-direction:column-reverse}.flex-wrap{flex-wrap:wrap}.items-start{align-items:flex-start}.items-end{align-items:flex-end}.items-center{align-items:center}.items-stretch{align-items:stretch}.justify-start{justify-content:flex-start}.justify-end{justify-content:flex-end}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-0{gap:0px}.gap-0\.5{gap:.125rem}.gap-1{gap:.25rem}.gap-1\.5{gap:.375rem}.gap-2{gap:.5rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.gap-8{gap:2rem}.space-x-1>:not([hidden])~:not([hidden]){--tw-space-x-reverse: 0;margin-right:calc(.25rem * var(--tw-space-x-reverse));margin-left:calc(.25rem * calc(1 - var(--tw-space-x-reverse)))}.space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse: 0;margin-right:calc(.5rem * var(--tw-space-x-reverse));margin-left:calc(.5rem * calc(1 - var(--tw-space-x-reverse)))}.space-x-3>:not([hidden])~:not([hidden]){--tw-space-x-reverse: 0;margin-right:calc(.75rem * var(--tw-space-x-reverse));margin-left:calc(.75rem * calc(1 - var(--tw-space-x-reverse)))}.space-x-4>:not([hidden])~:not([hidden]){--tw-space-x-reverse: 0;margin-right:calc(1rem * var(--tw-space-x-reverse));margin-left:calc(1rem * calc(1 - var(--tw-space-x-reverse)))}.space-x-6>:not([hidden])~:not([hidden]){--tw-space-x-reverse: 0;margin-right:calc(1.5rem * var(--tw-space-x-reverse));margin-left:calc(1.5rem * calc(1 - var(--tw-space-x-reverse)))}.space-y-0>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(0px * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0px * var(--tw-space-y-reverse))}.space-y-1>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.25rem * var(--tw-space-y-reverse))}.space-y-1\.5>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.375rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.375rem * var(--tw-space-y-reverse))}.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem * var(--tw-space-y-reverse))}.space-y-3>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(.75rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.75rem * var(--tw-space-y-reverse))}.space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(1rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1rem * var(--tw-space-y-reverse))}.space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse: 0;margin-top:calc(1.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1.5rem * var(--tw-space-y-reverse))}.overflow-auto{overflow:auto}.overflow-hidden{overflow:hidden}.overflow-y-auto{overflow-y:auto}.overflow-x-hidden{overflow-x:hidden}.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.whitespace-nowrap{white-space:nowrap}.whitespace-pre-wrap{white-space:pre-wrap}.break-words{overflow-wrap:break-word}.rounded{border-radius:.25rem}.rounded-\[2px\]{border-radius:2px}.rounded-\[inherit\]{border-radius:inherit}.rounded-full{border-radius:9999px}.rounded-lg{border-radius:var(--radius)}.rounded-md{border-radius:calc(var(--radius) - 2px)}.rounded-sm{border-radius:calc(var(--radius) - 4px)}.rounded-t-\[10px\]{border-top-left-radius:10px;border-top-right-radius:10px}.rounded-tl-sm{border-top-left-radius:calc(var(--radius) - 4px)}.border{border-width:1px}.border-2{border-width:2px}.border-\[1\.5px\]{border-width:1.5px}.border-y{border-top-width:1px;border-bottom-width:1px}.border-b{border-bottom-width:1px}.border-b-2{border-bottom-width:2px}.border-l{border-left-width:1px}.border-l-4{border-left-width:4px}.border-r{border-right-width:1px}.border-t{border-top-width:1px}.border-t-2{border-top-width:2px}.border-dashed{border-style:dashed}.border-dotted{border-style:dotted}.border-\[--color-border\]{border-color:var(--color-border)}.border-blue-200{--tw-border-opacity: 1;border-color:rgb(191 219 254 / var(--tw-border-opacity, 1))}.border-blue-500{--tw-border-opacity: 1;border-color:rgb(59 130 246 / var(--tw-border-opacity, 1))}.border-border{border-color:var(--border)}.border-destructive{border-color:var(--destructive)}.border-gray-200{--tw-border-opacity: 1;border-color:rgb(229 231 235 / var(--tw-border-opacity, 1))}.border-gray-300{--tw-border-opacity: 1;border-color:rgb(209 213 219 / var(--tw-border-opacity, 1))}.border-gray-500{--tw-border-opacity: 1;border-color:rgb(107 114 128 / var(--tw-border-opacity, 1))}.border-gray-900{--tw-border-opacity: 1;border-color:rgb(17 24 39 / var(--tw-border-opacity, 1))}.border-green-200{--tw-border-opacity: 1;border-color:rgb(187 247 208 / var(--tw-border-opacity, 1))}.border-green-500{--tw-border-opacity: 1;border-color:rgb(34 197 94 / var(--tw-border-opacity, 1))}.border-indigo-200{--tw-border-opacity: 1;border-color:rgb(199 210 254 / var(--tw-border-opacity, 1))}.border-indigo-500{--tw-border-opacity: 1;border-color:rgb(99 102 241 / var(--tw-border-opacity, 1))}.border-input{border-color:var(--input)}.border-orange-200{--tw-border-opacity: 1;border-color:rgb(254 215 170 / var(--tw-border-opacity, 1))}.border-orange-500{--tw-border-opacity: 1;border-color:rgb(249 115 22 / var(--tw-border-opacity, 1))}.border-pink-200{--tw-border-opacity: 1;border-color:rgb(251 207 232 / var(--tw-border-opacity, 1))}.border-pink-500{--tw-border-opacity: 1;border-color:rgb(236 72 153 / var(--tw-border-opacity, 1))}.border-primary{border-color:var(--primary)}.border-purple-200{--tw-border-opacity: 1;border-color:rgb(233 213 255 / var(--tw-border-opacity, 1))}.border-purple-500{--tw-border-opacity: 1;border-color:rgb(168 85 247 / var(--tw-border-opacity, 1))}.border-red-200{--tw-border-opacity: 1;border-color:rgb(254 202 202 / var(--tw-border-opacity, 1))}.border-red-500{--tw-border-opacity: 1;border-color:rgb(239 68 68 / var(--tw-border-opacity, 1))}.border-sidebar-border{border-color:var(--sidebar-border)}.border-teal-200{--tw-border-opacity: 1;border-color:rgb(153 246 228 / var(--tw-border-opacity, 1))}.border-teal-500{--tw-border-opacity: 1;border-color:rgb(20 184 166 / var(--tw-border-opacity, 1))}.border-transparent{border-color:transparent}.border-yellow-200{--tw-border-opacity: 1;border-color:rgb(254 240 138 / var(--tw-border-opacity, 1))}.border-yellow-500{--tw-border-opacity: 1;border-color:rgb(234 179 8 / var(--tw-border-opacity, 1))}.border-l-transparent{border-left-color:transparent}.border-t-transparent{border-top-color:transparent}.border-opacity-30{--tw-border-opacity: .3}.bg-\[--color-bg\]{background-color:var(--color-bg)}.bg-accent{background-color:var(--accent)}.bg-background{background-color:var(--background)}.bg-black\/80{background-color:#000c}.bg-blue-100{--tw-bg-opacity: 1;background-color:rgb(219 234 254 / var(--tw-bg-opacity, 1))}.bg-blue-50{--tw-bg-opacity: 1;background-color:rgb(239 246 255 / var(--tw-bg-opacity, 1))}.bg-blue-500{--tw-bg-opacity: 1;background-color:rgb(59 130 246 / var(--tw-bg-opacity, 1))}.bg-border{background-color:var(--border)}.bg-card{background-color:var(--card)}.bg-destructive{background-color:var(--destructive)}.bg-foreground{background-color:var(--foreground)}.bg-gray-100{--tw-bg-opacity: 1;background-color:rgb(243 244 246 / var(--tw-bg-opacity, 1))}.bg-gray-50{--tw-bg-opacity: 1;background-color:rgb(249 250 251 / var(--tw-bg-opacity, 1))}.bg-gray-500{--tw-bg-opacity: 1;background-color:rgb(107 114 128 / var(--tw-bg-opacity, 1))}.bg-green-100{--tw-bg-opacity: 1;background-color:rgb(220 252 231 / var(--tw-bg-opacity, 1))}.bg-green-50{--tw-bg-opacity: 1;background-color:rgb(240 253 244 / var(--tw-bg-opacity, 1))}.bg-green-50\/50{background-color:#f0fdf480}.bg-green-500{--tw-bg-opacity: 1;background-color:rgb(34 197 94 / var(--tw-bg-opacity, 1))}.bg-indigo-100{--tw-bg-opacity: 1;background-color:rgb(224 231 255 / var(--tw-bg-opacity, 1))}.bg-indigo-50{--tw-bg-opacity: 1;background-color:rgb(238 242 255 / var(--tw-bg-opacity, 1))}.bg-indigo-500{--tw-bg-opacity: 1;background-color:rgb(99 102 241 / var(--tw-bg-opacity, 1))}.bg-muted{background-color:var(--muted)}.bg-orange-100{--tw-bg-opacity: 1;background-color:rgb(255 237 213 / var(--tw-bg-opacity, 1))}.bg-orange-50{--tw-bg-opacity: 1;background-color:rgb(255 247 237 / var(--tw-bg-opacity, 1))}.bg-orange-500{--tw-bg-opacity: 1;background-color:rgb(249 115 22 / var(--tw-bg-opacity, 1))}.bg-pink-100{--tw-bg-opacity: 1;background-color:rgb(252 231 243 / var(--tw-bg-opacity, 1))}.bg-pink-50{--tw-bg-opacity: 1;background-color:rgb(253 242 248 / var(--tw-bg-opacity, 1))}.bg-pink-500{--tw-bg-opacity: 1;background-color:rgb(236 72 153 / var(--tw-bg-opacity, 1))}.bg-popover{background-color:var(--popover)}.bg-primary{background-color:var(--primary)}.bg-purple-100{--tw-bg-opacity: 1;background-color:rgb(243 232 255 / var(--tw-bg-opacity, 1))}.bg-purple-50{--tw-bg-opacity: 1;background-color:rgb(250 245 255 / var(--tw-bg-opacity, 1))}.bg-purple-500{--tw-bg-opacity: 1;background-color:rgb(168 85 247 / var(--tw-bg-opacity, 1))}.bg-red-100{--tw-bg-opacity: 1;background-color:rgb(254 226 226 / var(--tw-bg-opacity, 1))}.bg-red-50{--tw-bg-opacity: 1;background-color:rgb(254 242 242 / var(--tw-bg-opacity, 1))}.bg-red-500{--tw-bg-opacity: 1;background-color:rgb(239 68 68 / var(--tw-bg-opacity, 1))}.bg-secondary{background-color:var(--secondary)}.bg-sidebar{background-color:var(--sidebar)}.bg-sidebar-border{background-color:var(--sidebar-border)}.bg-teal-100{--tw-bg-opacity: 1;background-color:rgb(204 251 241 / var(--tw-bg-opacity, 1))}.bg-teal-50{--tw-bg-opacity: 1;background-color:rgb(240 253 250 / var(--tw-bg-opacity, 1))}.bg-teal-500{--tw-bg-opacity: 1;background-color:rgb(20 184 166 / var(--tw-bg-opacity, 1))}.bg-transparent{background-color:transparent}.bg-yellow-100{--tw-bg-opacity: 1;background-color:rgb(254 249 195 / var(--tw-bg-opacity, 1))}.bg-yellow-50{--tw-bg-opacity: 1;background-color:rgb(254 252 232 / var(--tw-bg-opacity, 1))}.bg-yellow-500{--tw-bg-opacity: 1;background-color:rgb(234 179 8 / var(--tw-bg-opacity, 1))}.bg-opacity-10{--tw-bg-opacity: .1}.bg-opacity-20{--tw-bg-opacity: .2}.bg-opacity-80{--tw-bg-opacity: .8}.fill-current{fill:currentColor}.p-0{padding:0}.p-1{padding:.25rem}.p-2{padding:.5rem}.p-3{padding:.75rem}.p-4{padding:1rem}.p-6{padding:1.5rem}.p-\[1px\]{padding:1px}.px-1{padding-left:.25rem;padding-right:.25rem}.px-2{padding-left:.5rem;padding-right:.5rem}.px-2\.5{padding-left:.625rem;padding-right:.625rem}.px-3{padding-left:.75rem;padding-right:.75rem}.px-4{padding-left:1rem;padding-right:1rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-8{padding-left:2rem;padding-right:2rem}.py-0\.5{padding-top:.125rem;padding-bottom:.125rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\.5{padding-top:.375rem;padding-bottom:.375rem}.py-12{padding-top:3rem;padding-bottom:3rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-8{padding-top:2rem;padding-bottom:2rem}.pb-2{padding-bottom:.5rem}.pb-3{padding-bottom:.75rem}.pb-4{padding-bottom:1rem}.pl-2\.5{padding-left:.625rem}.pl-3{padding-left:.75rem}.pl-4{padding-left:1rem}.pl-8{padding-left:2rem}.pr-2{padding-right:.5rem}.pr-2\.5{padding-right:.625rem}.pr-6{padding-right:1.5rem}.pr-8{padding-right:2rem}.pt-0{padding-top:0}.pt-1{padding-top:.25rem}.pt-3{padding-top:.75rem}.pt-4{padding-top:1rem}.pt-6{padding-top:1.5rem}.text-left{text-align:left}.text-center{text-align:center}.text-right{text-align:right}.align-middle{vertical-align:middle}.font-mono{font-family:var(--font-mono)}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-\[0\.8rem\]{font-size:.8rem}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-medium{font-weight:500}.font-normal{font-weight:400}.font-semibold{font-weight:600}.capitalize{text-transform:capitalize}.italic{font-style:italic}.tabular-nums{--tw-numeric-spacing: tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.leading-none{line-height:1}.leading-tight{line-height:1.25}.tracking-tight{letter-spacing:-.025em}.tracking-widest{letter-spacing:.1em}.text-accent-foreground{color:var(--accent-foreground)}.text-blue-500{--tw-text-opacity: 1;color:rgb(59 130 246 / var(--tw-text-opacity, 1))}.text-blue-600{--tw-text-opacity: 1;color:rgb(37 99 235 / var(--tw-text-opacity, 1))}.text-blue-800{--tw-text-opacity: 1;color:rgb(30 64 175 / var(--tw-text-opacity, 1))}.text-card-foreground{color:var(--card-foreground)}.text-current{color:currentColor}.text-destructive{color:var(--destructive)}.text-destructive-foreground{color:var(--destructive-foreground)}.text-foreground{color:var(--foreground)}.text-gray-400{--tw-text-opacity: 1;color:rgb(156 163 175 / var(--tw-text-opacity, 1))}.text-gray-500{--tw-text-opacity: 1;color:rgb(107 114 128 / var(--tw-text-opacity, 1))}.text-gray-600{--tw-text-opacity: 1;color:rgb(75 85 99 / var(--tw-text-opacity, 1))}.text-gray-800{--tw-text-opacity: 1;color:rgb(31 41 55 / var(--tw-text-opacity, 1))}.text-gray-900{--tw-text-opacity: 1;color:rgb(17 24 39 / var(--tw-text-opacity, 1))}.text-green-600{--tw-text-opacity: 1;color:rgb(22 163 74 / var(--tw-text-opacity, 1))}.text-green-800{--tw-text-opacity: 1;color:rgb(22 101 52 / var(--tw-text-opacity, 1))}.text-indigo-500{--tw-text-opacity: 1;color:rgb(99 102 241 / var(--tw-text-opacity, 1))}.text-indigo-600{--tw-text-opacity: 1;color:rgb(79 70 229 / var(--tw-text-opacity, 1))}.text-indigo-800{--tw-text-opacity: 1;color:rgb(55 48 163 / var(--tw-text-opacity, 1))}.text-muted-foreground{color:var(--muted-foreground)}.text-orange-500{--tw-text-opacity: 1;color:rgb(249 115 22 / var(--tw-text-opacity, 1))}.text-orange-600{--tw-text-opacity: 1;color:rgb(234 88 12 / var(--tw-text-opacity, 1))}.text-orange-700{--tw-text-opacity: 1;color:rgb(194 65 12 / var(--tw-text-opacity, 1))}.text-orange-800{--tw-text-opacity: 1;color:rgb(154 52 18 / var(--tw-text-opacity, 1))}.text-pink-800{--tw-text-opacity: 1;color:rgb(157 23 77 / var(--tw-text-opacity, 1))}.text-popover-foreground{color:var(--popover-foreground)}.text-primary{color:var(--primary)}.text-primary-foreground{color:var(--primary-foreground)}.text-purple-800{--tw-text-opacity: 1;color:rgb(107 33 168 / var(--tw-text-opacity, 1))}.text-red-500{--tw-text-opacity: 1;color:rgb(239 68 68 / var(--tw-text-opacity, 1))}.text-red-600{--tw-text-opacity: 1;color:rgb(220 38 38 / var(--tw-text-opacity, 1))}.text-red-800{--tw-text-opacity: 1;color:rgb(153 27 27 / var(--tw-text-opacity, 1))}.text-secondary-foreground{color:var(--secondary-foreground)}.text-sidebar-foreground{color:var(--sidebar-foreground)}.text-teal-800{--tw-text-opacity: 1;color:rgb(17 94 89 / var(--tw-text-opacity, 1))}.text-white{--tw-text-opacity: 1;color:rgb(255 255 255 / var(--tw-text-opacity, 1))}.text-white\/90{color:#ffffffe6}.text-yellow-600{--tw-text-opacity: 1;color:rgb(202 138 4 / var(--tw-text-opacity, 1))}.text-yellow-800{--tw-text-opacity: 1;color:rgb(133 77 14 / var(--tw-text-opacity, 1))}.underline-offset-4{text-underline-offset:4px}.opacity-0{opacity:0}.opacity-50{opacity:.5}.opacity-60{opacity:.6}.opacity-70{opacity:.7}.opacity-75{opacity:.75}.opacity-90{opacity:.9}.shadow-\[0_0_0_1px_hsl\(var\(--sidebar-border\)\)\]{--tw-shadow: 0 0 0 1px hsl(var(--sidebar-border));--tw-shadow-colored: 0 0 0 1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-lg{--tw-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1);--tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-md{--tw-shadow: 0 4px 6px -1px rgb(0 0 0 / .1), 0 2px 4px -2px rgb(0 0 0 / .1);--tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-none{--tw-shadow: 0 0 #0000;--tw-shadow-colored: 0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-sm{--tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);--tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.shadow-xl{--tw-shadow: 0 20px 25px -5px rgb(0 0 0 / .1), 0 8px 10px -6px rgb(0 0 0 / .1);--tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000),var(--tw-ring-shadow, 0 0 #0000),var(--tw-shadow)}.outline-none{outline:2px solid transparent;outline-offset:2px}.outline{outline-style:solid}.ring-0{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.ring-2{--tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow, 0 0 #0000)}.ring-blue-400{--tw-ring-opacity: 1;--tw-ring-color: rgb(96 165 250 / var(--tw-ring-opacity, 1))}.ring-blue-500{--tw-ring-opacity: 1;--tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity, 1))}.ring-green-400{--tw-ring-opacity: 1;--tw-ring-color: rgb(74 222 128 / var(--tw-ring-opacity, 1))}.ring-ring{--tw-ring-color: var(--ring)}.ring-sidebar-ring{--tw-ring-color: var(--sidebar-ring)}.ring-opacity-60{--tw-ring-opacity: .6}.ring-opacity-70{--tw-ring-opacity: .7}.ring-opacity-80{--tw-ring-opacity: .8}.ring-offset-background{--tw-ring-offset-color: var(--background)}.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur-sm{--tw-backdrop-blur: blur(4px);-webkit-backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,-webkit-backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter,-webkit-backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-\[left\,right\,width\]{transition-property:left,right,width;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-\[margin\,opacity\]{transition-property:margin,opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-\[width\,height\,padding\]{transition-property:width,height,padding;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-\[width\]{transition-property:width;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-opacity{transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.duration-1000{transition-duration:1s}.duration-200{transition-duration:.2s}.ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}.ease-linear{transition-timing-function:linear}@keyframes enter{0%{opacity:var(--tw-enter-opacity, 1);transform:translate3d(var(--tw-enter-translate-x, 0),var(--tw-enter-translate-y, 0),0) scale3d(var(--tw-enter-scale, 1),var(--tw-enter-scale, 1),var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity, 1);transform:translate3d(var(--tw-exit-translate-x, 0),var(--tw-exit-translate-y, 0),0) scale3d(var(--tw-exit-scale, 1),var(--tw-exit-scale, 1),var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0))}}.animate-in{animation-name:enter;animation-duration:.15s;--tw-enter-opacity: initial;--tw-enter-scale: initial;--tw-enter-rotate: initial;--tw-enter-translate-x: initial;--tw-enter-translate-y: initial}.fade-in-0{--tw-enter-opacity: 0}.fade-in-80{--tw-enter-opacity: .8}.zoom-in-95{--tw-enter-scale: .95}.duration-1000{animation-duration:1s}.duration-200{animation-duration:.2s}.ease-in-out{animation-timing-function:cubic-bezier(.4,0,.2,1)}.ease-linear{animation-timing-function:linear}:root{--background: hsl(210, 40%, 98%);--foreground: hsl(222, 84%, 5%);--card: hsl(0, 0%, 100%);--card-foreground: hsl(222, 84%, 5%);--popover: hsl(0, 0%, 100%);--popover-foreground: hsl(222, 84%, 5%);--primary: hsl(221, 83%, 53%);--primary-foreground: hsl(210, 40%, 98%);--secondary: hsl(210, 40%, 96%);--secondary-foreground: hsl(222, 84%, 5%);--muted: hsl(210, 40%, 96%);--muted-foreground: hsl(215, 16%, 47%);--accent: hsl(210, 40%, 96%);--accent-foreground: hsl(222, 84%, 5%);--destructive: hsl(0, 84%, 60%);--destructive-foreground: hsl(210, 40%, 98%);--border: hsl(214, 32%, 91%);--input: hsl(214, 32%, 91%);--ring: hsl(221, 83%, 53%);--chart-1: hsl(221, 83%, 53%);--chart-2: hsl(159.7826, 100%, 36.0784%);--chart-3: hsl(42.029, 92.8251%, 56.2745%);--chart-4: hsl(147.1429, 78.5047%, 41.9608%);--chart-5: hsl(341.4894, 75.2%, 50.9804%);--sidebar: hsl(0, 0%, 100%);--sidebar-foreground: hsl(222, 84%, 5%);--sidebar-primary: hsl(221, 83%, 53%);--sidebar-primary-foreground: hsl(210, 40%, 98%);--sidebar-accent: hsl(210, 40%, 96%);--sidebar-accent-foreground: hsl(222, 84%, 5%);--sidebar-border: hsl(214, 32%, 91%);--sidebar-ring: hsl(221, 83%, 53%);--font-sans: Inter, system-ui, sans-serif;--font-serif: Georgia, serif;--font-mono: Menlo, monospace;--radius: 8px;--shadow-2xs: 0px 2px 0px 0px hsl(221, 83%, 53% / 0);--shadow-xs: 0px 2px 0px 0px hsl(221, 83%, 53% / 0);--shadow-sm: 0px 2px 0px 0px hsl(221, 83%, 53% / 0), 0px 1px 2px -1px hsl(221, 83%, 53% / 0);--shadow: 0px 2px 0px 0px hsl(221, 83%, 53% / 0), 0px 1px 2px -1px hsl(221, 83%, 53% / 0);--shadow-md: 0px 2px 0px 0px hsl(221, 83%, 53% / 0), 0px 2px 4px -1px hsl(221, 83%, 53% / 0);--shadow-lg: 0px 2px 0px 0px hsl(221, 83%, 53% / 0), 0px 4px 6px -1px hsl(221, 83%, 53% / 0);--shadow-xl: 0px 2px 0px 0px hsl(221, 83%, 53% / 0), 0px 8px 10px -1px hsl(221, 83%, 53% / 0);--shadow-2xl: 0px 2px 0px 0px hsl(221, 83%, 53% / 0);--tracking-normal: 0em;--spacing: .25rem}.dark{--background: hsl(222, 84%, 5%);--foreground: hsl(210, 40%, 98%);--card: hsl(222, 84%, 5%);--card-foreground: hsl(210, 40%, 98%);--popover: hsl(222, 84%, 5%);--popover-foreground: hsl(210, 40%, 98%);--primary: hsl(221, 83%, 53%);--primary-foreground: hsl(210, 40%, 98%);--secondary: hsl(217, 32%, 17%);--secondary-foreground: hsl(210, 40%, 98%);--muted: hsl(217, 32%, 17%);--muted-foreground: hsl(215, 20%, 65%);--accent: hsl(217, 32%, 17%);--accent-foreground: hsl(210, 40%, 98%);--destructive: hsl(0, 84%, 60%);--destructive-foreground: hsl(210, 40%, 98%);--border: hsl(217, 32%, 17%);--input: hsl(217, 32%, 17%);--ring: hsl(221, 83%, 53%);--sidebar: hsl(222, 84%, 5%);--sidebar-foreground: hsl(210, 40%, 98%);--sidebar-primary: hsl(221, 83%, 53%);--sidebar-primary-foreground: hsl(210, 40%, 98%);--sidebar-accent: hsl(217, 32%, 17%);--sidebar-accent-foreground: hsl(210, 40%, 98%);--sidebar-border: hsl(217, 32%, 17%);--sidebar-ring: hsl(221, 83%, 53%)}.schedule-block{transition:all .2s ease}.schedule-block:hover{transform:translateY(-1px);box-shadow:0 4px 12px #00000026}.timeline-hour{border-bottom:1px solid hsl(214,32%,91%)}.conflict-aide{border:2px solid hsl(0,84%,60%);background:linear-gradient(135deg,transparent 40%,hsla(0,84%,60%,.1) 60%)}.conflict-student{border:2px solid hsl(45,93%,47%);background:linear-gradient(135deg,transparent 40%,hsla(45,93%,47%,.1) 60%)}.droppable-area{min-height:4rem;transition:background-color .2s ease}.droppable-area.drag-over{background-color:#2463eb1a;border:2px dashed hsl(221,83%,53%)}aside{z-index:10;position:relative}[data-dnd-kit-drag-overlay]{z-index:9999}
      </style>
    <script type="module">
      // Embedded JavaScript for guaranteed availability
      console.log('AlliBoard Scheduler loading...');
      
      // Basic React-like functionality for the app
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = \`
          <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: hsl(210, 40%, 98%); font-family: Inter, system-ui, sans-serif;">
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / .1); max-width: 500px;">
              <h1 style="color: hsl(222, 84%, 5%); margin-bottom: 1rem; font-size: 1.875rem; font-weight: 700;">AlliBoard Scheduler</h1>
              <p style="color: hsl(215, 16%, 47%); margin-bottom: 1.5rem;">Loading the application...</p>
              <div style="display: flex; justify-content: center; align-items: center; gap: 0.5rem;">
                <div style="width: 8px; height: 8px; background: hsl(221, 83%, 53%); border-radius: 50%; animation: pulse 2s infinite;"></div>
                <div style="width: 8px; height: 8px; background: hsl(221, 83%, 53%); border-radius: 50%; animation: pulse 2s infinite 0.2s;"></div>
                <div style="width: 8px; height: 8px; background: hsl(221, 83%, 53%); border-radius: 50%; animation: pulse 2s infinite 0.4s;"></div>
              </div>
              <p style="color: hsl(215, 16%, 47%); margin-top: 1rem; font-size: 0.875rem;">If this message persists, please refresh the page.</p>
            </div>
          </div>
        \`;
      }
    </script>
        </head>
        <body>
    <div id="root"></div>
        </body>
</html>`;

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

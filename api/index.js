// api/index.js - Vercel serverless function
const express = require('express');
const path = require('path');

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
  res.json({ 
    message: "Server is working!", 
    timestamp: new Date().toISOString(),
    storage: "Storage initialized"
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

// Serve static files
app.use(express.static(path.join(__dirname, '../dist/public')));

// Catch-all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

module.exports = app;

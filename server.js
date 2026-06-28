const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static assets from the root directory
app.use(express.static(__dirname));

// Initialize default JSON database file
async function initDB() {
  await fs.ensureDir(path.dirname(DB_PATH));
  const exists = await fs.pathExists(DB_PATH);
  if (!exists) {
    const defaultData = {
      admin: { id: 'shreyas', password: 'shreyas123' },
      students: [
        { usn: '1MS17CS001', password: 'password' },
        { usn: '1MS17CS002', password: 'password' }
      ],
      complaints: [],
      profiles: {
        faculty: [
          { id: 'faculty-1', name: 'Faculty 1', initials: 'F1', role: 'Principal', description: 'Leadership & Strategy', photo: '' },
          { id: 'faculty-2', name: 'Faculty 2', initials: 'F2', role: 'Dean', description: 'Academic Affairs', photo: '' },
          { id: 'faculty-3', name: 'Faculty 3', initials: 'F3', role: 'HOD, Engineering', description: 'Department leadership and course strategy', photo: '' },
          { id: 'faculty-4', name: 'Faculty 4', initials: 'F4', role: 'Physical Education', description: 'Health, fitness and sports coordination', photo: '' },
          { id: 'faculty-5', name: 'Faculty 5', initials: 'F5', role: 'Librarian', description: 'Resource services and student support', photo: '' },
          { id: 'faculty-6', name: 'Faculty 6', initials: 'F6', role: 'Student Affairs', description: 'Campus experience and student engagement', photo: '' }
        ],
        teachers: [
          { id: 'teacher-1', name: 'Teacher 1', initials: 'T1', role: 'Mathematics', description: 'Curriculum planning and exam guidance', photo: '' },
          { id: 'teacher-2', name: 'Teacher 2', initials: 'T2', role: 'Physics', description: 'Lab mentoring and concept clarity', photo: '' },
          { id: 'teacher-3', name: 'Teacher 3', initials: 'T3', role: 'Chemistry', description: 'Practical chemistry support and assessment', photo: '' },
          { id: 'teacher-4', name: 'Teacher 4', initials: 'T4', role: 'Computer Science', description: 'Technology projects and coding practice', photo: '' },
          { id: 'teacher-5', name: 'Teacher 5', initials: 'T5', role: 'Electronics', description: 'Hands-on circuits and systems learning', photo: '' },
          { id: 'teacher-6', name: 'Teacher 6', initials: 'T6', role: 'English', description: 'Communication skills and literature support', photo: '' }
        ]
      }
    };
    await fs.writeJson(DB_PATH, defaultData, { spaces: 2 });
  }
}

// Retrieve DB JSON data
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readJson(DB_PATH);
    res.json(data);
  } catch (error) {
    console.error("Error reading database:", error);
    res.status(500).json({ error: 'Failed to read database.' });
  }
});

// Update DB JSON data
app.post('/api/save', async (req, res) => {
  try {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ error: 'Invalid database data.' });
    }
    await fs.writeJson(DB_PATH, updated, { spaces: 2 });
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving to database:", error);
    res.status(500).json({ error: 'Failed to save to database.' });
  }
});

// Start Node Server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 College Complaints Server Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`📁 Database: ${DB_PATH}`);
    console.log(`==================================================\n`);
  });
}).catch(err => {
  console.error("Initialization failed:", err);
});

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_jwt_secret_key_change_in_production'; // Simple secret for local dev

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Serve admin files
app.use('/admin', express.static(path.join(__dirname, '..', 'admin'), {
    index: ['admin.html']
}));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve static files from the parent directory (frontend files)
app.use(express.static(path.join(__dirname, '..'), {
    index: ['index.html']
}));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// API: Upload Image
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the URL for the uploaded file
    res.json({ url: '/uploads/' + req.file.filename });
});

// API: Get all content
app.get('/api/content', (req, res) => {
    db.all("SELECT key, value FROM content", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Convert rows to an object mapping key -> value
        const content = {};
        rows.forEach(row => {
            content[row.key] = row.value;
        });
        res.json(content);
    });
});

// API: Update content
app.put('/api/content', authenticateToken, (req, res) => {
    const data = req.body; // Expects { hero_title: '...', about_title: '...' }
    
    // We update each key sequentially
    const stmt = db.prepare("UPDATE content SET value = ? WHERE key = ?");
    Object.keys(data).forEach(key => {
        stmt.run([data[key], key]);
    });
    stmt.finalize();

    res.json({ message: 'Content updated successfully' });
});

// API: Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        res.json({ auth: true, token: token });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

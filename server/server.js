const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const galleryRoutes = require('./routes/galleryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Permissive CSP for browser extensions and embedded previews
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline' https:; font-src * data:; img-src * data: blob:;"
  );
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/gallery', galleryRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    school: 'Kinder Joy E.M.U.P. School',
    serverTime: new Date()
  });
});

// Serve Frontend Static Files
const staticDir = path.join(__dirname, '..');
app.use(express.static(staticDir));

// Route Fallbacks
app.get('/login', (req, res) => {
  res.sendFile(path.join(staticDir, 'login.html'));
});

app.get('/notices', (req, res) => {
  res.sendFile(path.join(staticDir, 'notices.html'));
});

app.get('/from-the-school', (req, res) => {
  res.redirect('/notices.html');
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🏫 Kinder Joy School Portal Server Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔑 Login: http://localhost:${PORT}/login.html`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin.html`);
  console.log(`📋 Notices Portal: http://localhost:${PORT}/notices.html`);
  console.log(`=================================================`);
});


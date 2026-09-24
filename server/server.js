require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB, getDBType } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: getDBType(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to in-memory MongoDB and seed data
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\nCnykra Server running on http://localhost:${PORT}`);
    console.log('API endpoints available at /api/*\n');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

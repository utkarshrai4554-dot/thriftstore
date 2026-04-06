const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import email routes
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'styleease-email-test',
    version: '1.0.0'
  });
});

// Email routes
app.use('/api', emailRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Email Test Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📧 Email API: http://localhost:${PORT}/api/email-status`);
});

module.exports = app;

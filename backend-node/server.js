/**
 * Express server entry point for Visualequ Node.js backend
 * Handles CORS, JSON parsing, and route mounting
 * Connects authentication and graph management endpoints
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const graphRoutes = require('./routes/graphs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/graphs', graphRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'visualequ-node' });
});

app.listen(PORT, () => {
  console.log(`Visualequ Node.js server running on port ${PORT}`);
});

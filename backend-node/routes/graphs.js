/**
 * Graph Management Routes
 * POST / - Save a new graph configuration
 * GET / - Retrieve all graphs for authenticated user
 * GET /:id - Get specific graph by ID
 * DELETE /:id - Delete a graph
 * All routes require JWT authentication
 */

const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Save graph
router.post('/', async (req, res) => {
  const { name, equations, settings } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO saved_graphs (user_id, name, equations, settings) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, equations, settings, created_at`,
      [userId, name, JSON.stringify(equations), JSON.stringify(settings)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Save graph error:', error);
    res.status(500).json({ error: 'Failed to save graph' });
  }
});

// Get all graphs
router.get('/', async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT id, name, equations, settings, created_at FROM saved_graphs WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch graphs error:', error);
    res.status(500).json({ error: 'Failed to fetch graphs' });
  }
});

// Get specific graph
router.get('/:id', async (req, res) => {
  const userId = req.user.userId;
  const graphId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM saved_graphs WHERE id = $1 AND user_id = $2',
      [graphId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch graph error:', error);
    res.status(500).json({ error: 'Failed to fetch graph' });
  }
});

// Delete graph
router.delete('/:id', async (req, res) => {
  const userId = req.user.userId;
  const graphId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM saved_graphs WHERE id = $1 AND user_id = $2 RETURNING id',
      [graphId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Graph not found' });
    }

    res.json({ message: 'Graph deleted successfully' });
  } catch (error) {
    console.error('Delete graph error:', error);
    res.status(500).json({ error: 'Failed to delete graph' });
  }
});

module.exports = router;

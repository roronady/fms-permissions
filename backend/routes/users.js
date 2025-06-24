import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, runStatement } from '../database/connection.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await runQuery(`
      SELECT id, username, email, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existingUsers = await runQuery(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runStatement(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User created successfully',
      userId: result.id
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    const userId = req.params.id;

    let sql = 'UPDATE users SET username = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [username, email, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += ', password_hash = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    params.push(userId);

    await runStatement(sql, params);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting the last admin
    const adminCount = await runQuery('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const userToDelete = await runQuery('SELECT role FROM users WHERE id = ?', [userId]);

    if (userToDelete[0]?.role === 'admin' && adminCount[0].count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }

    await runStatement('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, runStatement } from '../database/connection.js';
import { authenticateToken, requireAdmin, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', checkPermission('user.view'), async (req, res) => {
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
router.post('/', checkPermission('user.create'), async (req, res) => {
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
router.put('/:id', checkPermission('user.edit'), async (req, res) => {
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
router.delete('/:id', checkPermission('user.delete'), async (req, res) => {
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

// Get all permissions
router.get('/permissions', checkPermission('user.manage_permissions'), async (req, res) => {
  try {
    const permissions = await runQuery(`
      SELECT id, name, description
      FROM permissions
      ORDER BY name
    `);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Get role permissions
router.get('/role-permissions', checkPermission('user.manage_permissions'), async (req, res) => {
  try {
    const roles = ['admin', 'manager', 'user'];
    const rolePermissions = [];
    
    for (const role of roles) {
      const permissions = await runQuery(`
        SELECT p.name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role = ?
        ORDER BY p.name
      `, [role]);
      
      rolePermissions.push({
        role,
        permissions: permissions.map(p => p.name)
      });
    }
    
    res.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
});

// Update role permissions
router.put('/role-permissions', checkPermission('user.manage_permissions'), async (req, res) => {
  try {
    const { rolePermissions } = req.body;
    
    if (!Array.isArray(rolePermissions)) {
      return res.status(400).json({ error: 'Invalid role permissions data' });
    }
    
    // Start a transaction
    await runStatement('BEGIN TRANSACTION');
    
    try {
      // Get all permissions
      const permissions = await runQuery('SELECT id, name FROM permissions');
      const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
      
      // Process each role
      for (const rolePermission of rolePermissions) {
        const { role, permissions } = rolePermission;
        
        // Skip admin role - admins always have all permissions
        if (role === 'admin') continue;
        
        // Delete existing role permissions
        await runStatement('DELETE FROM role_permissions WHERE role = ?', [role]);
        
        // Insert new role permissions
        for (const permissionName of permissions) {
          const permissionId = permissionMap.get(permissionName);
          if (permissionId) {
            await runStatement(
              'INSERT INTO role_permissions (role, permission_id) VALUES (?, ?)',
              [role, permissionId]
            );
          }
        }
      }
      
      // Commit the transaction
      await runStatement('COMMIT');
      
      res.json({ message: 'Role permissions updated successfully' });
    } catch (error) {
      // Rollback the transaction on error
      await runStatement('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
});

// Get user permissions
router.get('/:id/permissions', checkPermission('user.manage_permissions'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user
    const users = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Get permissions for user's role
    const permissions = await runQuery(`
      SELECT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = ?
      ORDER BY p.name
    `, [user.role]);
    
    res.json(permissions.map(p => p.name));
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
});

export default router;
import jwt from 'jsonwebtoken';
import { runQuery } from '../database/connection.js';

// Use environment variable for JWT secret with no fallback
const JWT_SECRET = process.env.JWT_SECRET || 'wms-secret-key-change-in-production';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await runQuery('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = users[0];
    
    // Fetch user permissions based on role
    const permissions = await runQuery(`
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = ?
    `, [req.user.role]);
    
    // Add permissions to user object
    req.user.permissions = permissions.map(p => p.name);
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (req.user.permissions.includes(requiredPermission)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Permission denied', 
      requiredPermission: requiredPermission 
    });
  };
};

// Allow checking multiple permissions (any one of them is sufficient)
export const checkAnyPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const hasPermission = requiredPermissions.some(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (hasPermission) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Permission denied', 
      requiredPermissions: requiredPermissions 
    });
  };
};

// Require all specified permissions
export const checkAllPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (hasAllPermissions) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Permission denied', 
      requiredPermissions: requiredPermissions 
    });
  };
};

export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await runQuery('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    
    if (users.length === 0) {
      return next(new Error('Authentication error'));
    }

    socket.user = users[0];
    
    // Fetch user permissions based on role
    const permissions = await runQuery(`
      SELECT p.name 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = ?
    `, [socket.user.role]);
    
    // Add permissions to user object
    socket.user.permissions = permissions.map(p => p.name);
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

export { JWT_SECRET };
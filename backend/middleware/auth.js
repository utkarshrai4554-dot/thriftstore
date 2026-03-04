const jwt = require('jsonwebtoken');

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
const auth = {
  // Optional authentication - doesn't require user to be logged in
  optional: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  },

  // Required authentication - user must be logged in
  required: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
  },

  // Require admin role
  requireAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin role required.',
        code: 'ADMIN_REQUIRED'
      });
    }
    next();
  },

  // Require seller role
  requireSeller: (req, res, next) => {
    if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
      return res.status(403).json({
        error: 'Access denied. Seller role required.',
        code: 'SELLER_REQUIRED'
      });
    }
    next();
  },

  // Generate JWT token
  generateToken: (user) => {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role || 'user' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  // Verify JWT token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
};

module.exports = auth;

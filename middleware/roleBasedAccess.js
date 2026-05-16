/**
 * Role-Based Access Control Middleware
 * Provides role-based authorization for API endpoints
 */

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource'
        });
      }

      // Check if user has required role
      const userRole = req.user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `User role '${userRole}' is not authorized to access this resource`,
          requiredRoles: allowedRoles
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role-based access error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'Failed to verify user permissions'
      });
    }
  };
};

const requireAdmin = (req, res, next) => {
  return requireRole(['admin'])(req, res, next);
};

const requireManager = (req, res, next) => {
  return requireRole(['admin', 'manager'])(req, res, next);
};

const requireAgent = (req, res, next) => {
  return requireRole(['admin', 'manager', 'agent'])(req, res, next);
};

module.exports = {
  requireRole,
  requireAdmin,
  requireManager,
  requireAgent
};

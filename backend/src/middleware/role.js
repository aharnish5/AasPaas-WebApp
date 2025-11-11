export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role 
      });
    }

    next();
  };
};

export const requireVendor = requireRole('vendor', 'admin');
export const requireCustomer = requireRole('customer', 'admin');
export const requireAdmin = requireRole('admin');


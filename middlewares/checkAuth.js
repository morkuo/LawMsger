async function checkAuth(req, res, next) {
  if (req.role !== -1) return res.status(403).json({ error: 'Permission denied.' });
  next();
}

module.exports = checkAuth;

const express = require('express');
const router = express.Router();

// Products routes placeholder
router.get('/', (req, res) => {
  res.json({
    message: 'Products API endpoint',
    status: 'working'
  });
});

module.exports = router;

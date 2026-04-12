const express = require('express');
const router = express.Router();

// Chat routes placeholder
router.get('/', (req, res) => {
  res.json({
    message: 'Chat API endpoint',
    status: 'working'
  });
});

module.exports = router;

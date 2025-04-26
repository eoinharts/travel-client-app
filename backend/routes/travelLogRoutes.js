const express = require('express');
const router = express.Router();
const travelLogController = require('../controllers/travelLogController');
const auth = require('../middleware/auth');

// Protected: Create a new travel log
router.post('/', auth, travelLogController.createTravelLog);

// Protected: Get all travel logs for the logged‑in user
router.get('/', auth, travelLogController.getTravelLogs);

// Protected: Update a travel log by ID
router.put('/:id', auth, travelLogController.updateTravelLog);

// Protected: Delete a travel log by ID
router.delete('/:id', auth, travelLogController.deleteTravelLog);

module.exports = router;

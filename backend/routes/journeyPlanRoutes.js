const express = require('express');
const router = express.Router();
const journeyPlanController = require('../controllers/journeyPlanController');
const auth = require('../middleware/auth');

// Protected: Create a new journey plan
router.post('/', auth, journeyPlanController.createJourneyPlan);

// Protected: Get all journey plans for the logged‑in user
router.get('/', auth, journeyPlanController.getJourneyPlans);

// Protected: Update a journey plan by ID
router.put('/:id', auth, journeyPlanController.updateJourneyPlan);

// Protected: Delete a journey plan by ID
router.delete('/:id', auth, journeyPlanController.deleteJourneyPlan);

module.exports = router;

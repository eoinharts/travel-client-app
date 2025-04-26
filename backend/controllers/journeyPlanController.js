// backend/controllers/JourneyPlanController.js
const pool = require('../db');

exports.createJourneyPlan = async (req, res) => {
  const {
    journey_plan_name,
    journey_plan_locations = [],
    start_date   = null,
    end_date     = null,
    activities   = [],
    description  = ''
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert main journey_plan
    const [planResult] = await conn.query(
      `INSERT INTO journey_plans
         (user_id, journey_plan_name, start_date, end_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, journey_plan_name, start_date, end_date, description]
    );
    const planId = planResult.insertId;

    // 2. Insert locations
    for (const loc of journey_plan_locations) {
      await conn.query(
        `INSERT INTO journey_plan_locations (journey_plan_id, location)
         VALUES (?, ?)`,
        [planId, loc]
      );
    }

    // 3. Insert activities
    for (const act of activities) {
      await conn.query(
        `INSERT INTO journey_plan_activities (journey_plan_id, activity)
         VALUES (?, ?)`,
        [planId, act]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Journey plan created', id: planId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  } finally {
    conn.release();
  }
};

exports.getJourneyPlans = async (req, res) => {
  try {
    const [plans] = await pool.query(
      `SELECT id, journey_plan_name, start_date, end_date, description
       FROM journey_plans
       WHERE user_id = ?`,
      [req.userId]
    );

    const results = await Promise.all(plans.map(async plan => {
      const [locRows] = await pool.query(
        `SELECT location FROM journey_plan_locations WHERE journey_plan_id = ?`,
        [plan.id]
      );
      const [actRows] = await pool.query(
        `SELECT activity FROM journey_plan_activities WHERE journey_plan_id = ?`,
        [plan.id]
      );
      return {
        ...plan,
        journey_plan_locations: locRows.map(r => r.location),
        activities:             actRows.map(r => r.activity)
      };
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

exports.updateJourneyPlan = async (req, res) => {
  const { id } = req.params;
  const {
    journey_plan_name,
    journey_plan_locations = [],
    start_date   = null,
    end_date     = null,
    activities   = [],
    description  = ''
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update main row
    const [upd] = await conn.query(
      `UPDATE journey_plans
         SET journey_plan_name = ?, start_date = ?, end_date = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [journey_plan_name, start_date, end_date, description, id, req.userId]
    );
    if (upd.affectedRows === 0) {
      throw new Error('Not found or not yours');
    }

    // 2. Refresh locations
    await conn.query(
      `DELETE FROM journey_plan_locations WHERE journey_plan_id = ?`,
      [id]
    );
    for (const loc of journey_plan_locations) {
      await conn.query(
        `INSERT INTO journey_plan_locations (journey_plan_id, location) VALUES (?, ?)`,
        [id, loc]
      );
    }

    // 3. Refresh activities
    await conn.query(
      `DELETE FROM journey_plan_activities WHERE journey_plan_id = ?`,
      [id]
    );
    for (const act of activities) {
      await conn.query(
        `INSERT INTO journey_plan_activities (journey_plan_id, activity) VALUES (?, ?)`,
        [id, act]
      );
    }

    await conn.commit();
    res.json({ message: 'Journey plan updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(400).json({ message: err.message || 'Database error', error: err });
  } finally {
    conn.release();
  }
};

exports.deleteJourneyPlan = async (req, res) => {
  try {
    const [del] = await pool.query(
      `DELETE FROM journey_plans WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );
    if (del.affectedRows === 0) {
      return res.status(404).json({ message: 'Journey plan not found or not yours' });
    }
    // cascade takes care of related rows
    res.json({ message: 'Journey plan deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err });
  }
};

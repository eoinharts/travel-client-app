// backend/controllers/travelLogController.js
const pool = require('../db');

// 1. Create
exports.createTravelLog = async (req, res) => {
  const {
    title,
    description = '',
    start_date = null,
    end_date = null,
    tags = []
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert with NOW() for post_date
    const [insertResult] = await conn.query(
      `INSERT INTO travel_logs
         (user_id, title, description, start_date, end_date, post_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.userId, title, description, start_date, end_date]
    );
    const logId = insertResult.insertId;

    // Insert tags
    if (Array.isArray(tags) && tags.length) {
      await Promise.all(
        tags.map(tag =>
          conn.query(
            `INSERT INTO travel_log_tags (travel_log_id, tag)
             VALUES (?, ?)`,
            [logId, tag]
          )
        )
      );
    }

    // Fetch the freshly-created record
    const [[newLogRow]] = await conn.query(
      `SELECT id, title, description, start_date, end_date, post_date
         FROM travel_logs
        WHERE id = ?`,
      [logId]
    );
    const [tagRows] = await conn.query(
      `SELECT tag FROM travel_log_tags WHERE travel_log_id = ?`,
      [logId]
    );

    await conn.commit();

    // Return full log
    res.status(201).json({
      ...newLogRow,
      tags: tagRows.map(r => r.tag)
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  } finally {
    conn.release();
  }
};

// 2. Read
exports.getTravelLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT id, title, description, start_date, end_date, post_date
         FROM travel_logs
        WHERE user_id = ?`,
      [req.userId]
    );
    const results = await Promise.all(logs.map(async log => {
      const [tagRows] = await pool.query(
        `SELECT tag FROM travel_log_tags WHERE travel_log_id = ?`,
        [log.id]
      );
      return {
        ...log,
        tags: tagRows.map(r => r.tag)
      };
    }));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// 3. Update
exports.updateTravelLog = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description = '',
    start_date = null,
    end_date = null,
    tags = []
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [updateResult] = await conn.query(
      `UPDATE travel_logs
         SET title = ?, description = ?, start_date = ?, end_date = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, start_date, end_date, id, req.userId]
    );
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Not found or not yours' });
    }

    // Refresh tags
    await conn.query(
      `DELETE FROM travel_log_tags WHERE travel_log_id = ?`,
      [id]
    );
    if (Array.isArray(tags) && tags.length) {
      await Promise.all(
        tags.map(tag =>
          conn.query(
            `INSERT INTO travel_log_tags (travel_log_id, tag)
             VALUES (?, ?)`,
            [id, tag]
          )
        )
      );
    }

    await conn.commit();
    res.json({ message: 'Travel log updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  } finally {
    conn.release();
  }
};

// 4. Delete
exports.deleteTravelLog = async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM travel_logs WHERE id = ? AND user_id = ?`,
      [req.params.id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Not found or not yours' });
    }
    res.json({ message: 'Travel log deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

// backend/controllers/travelLogController.js
const pool = require('../db');

exports.createTravelLog = async (req, res) => {
  const {
    title,
    description = '',
    start_date = null,
    end_date   = null,
    tags       = []
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert main travel_log with server-generated post_date
    const [insertResult] = await conn.query(
      `INSERT INTO travel_logs
         (user_id, title, description, start_date, end_date, post_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [req.userId, title, description, start_date, end_date]
    );
    const logId = insertResult.insertId;

    // 2. Insert tags (if any)
    if (Array.isArray(tags) && tags.length) {
      await Promise.all(
        tags.map(tag =>
          conn.query(
            `INSERT INTO travel_log_tags (travel_log_id, tag) VALUES (?, ?)`,
            [logId, tag]
          )
        )
      );
    }

    // 3. Fetch the freshly-created row
    const [[newLogRow]] = await conn.query(
      `SELECT id, title, description, start_date, end_date, post_date
         FROM travel_logs
        WHERE id = ?`,
      [logId]
    );
    // 4. Fetch its tags
    const [tagRows] = await conn.query(
      `SELECT tag FROM travel_log_tags WHERE travel_log_id = ?`,
      [logId]
    );

    await conn.commit();

    // 5. Return the complete record
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

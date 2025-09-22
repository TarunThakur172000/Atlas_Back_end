const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isAdmin } = require("../middleware/auth");

// Add movie
router.post("/", authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO movies (title, description, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, description, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add movie" });
  }
});

// GET /movies/top
router.get("/movies/top", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        u.username AS suggested_by,
        SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
        SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END) AS downvotes,
        (SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END)) AS score,
        COUNT(c.id) AS comment_count
      FROM movies m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN votes v ON v.movie_id = m.id
      LEFT JOIN comments c ON c.movie_id = m.id
      GROUP BY m.id, u.username
      ORDER BY score DESC, upvotes DESC
      LIMIT 5;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch top movies" });
  }
});


// Get all movies with votes count
// routes/movies.js
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
     SELECT 
        m.id,
        m.title,
        m.description,
        u.username AS suggested_by,
        COUNT(CASE WHEN v.vote_type = 1 THEN 1 END) AS upvotes,
        COUNT(CASE WHEN v.vote_type = -1 THEN 1 END) AS downvotes,
        COUNT(c.id) AS comment_count,
        (COUNT(CASE WHEN v.vote_type = 1 THEN 1 END) - 
         COUNT(CASE WHEN v.vote_type = -1 THEN 1 END)) AS net_votes
      FROM movies m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN votes v ON v.movie_id = m.id
      LEFT JOIN comments c ON c.movie_id = m.id
      GROUP BY m.id, u.username
      ORDER BY net_votes DESC, comment_count DESC, m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch movies" });
  }
});


// Delete movie (admin)
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM movies WHERE id=$1", [req.params.id]);
    res.json({ message: "Movie deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;

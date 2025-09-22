const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isAdmin } = require("../middleware/auth");

// GET /comments/all
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.username, m.title AS movie_title  FROM comments c  JOIN users u ON u.id = c.user_id  JOIN movies m ON m.id = c.movie_id ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Add a comment
router.post("/:movieId", authMiddleware, async (req, res) => {
  const { movieId } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ message: "Content is required" });

  try {
    const result = await pool.query(
      "INSERT INTO comments (user_id, movie_id, content) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, movieId, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// Get comments for a movie
router.get("/:movieId", async (req, res) => {
  const { movieId } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.*, u.username 
       FROM comments c 
       JOIN users u ON u.id = c.user_id 
       WHERE movie_id=$1 
       ORDER BY c.created_at DESC`,
      [movieId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Delete a comment (admin only)
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM comments WHERE id=$1", [req.params.id]);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

// Update a comment (user can edit their own
router.put("/:id", authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: "Content is required" });
  try {
    const result = await pool.query(
      "UPDATE comments SET content=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [content, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found or unauthorized" });
    }
    res.json(result.rows[0]);
    } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update comment" });
    }
});

//Delete a comment (user can delete their own)
router.delete("/user/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM comments WHERE id=$1 AND user_id=$2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found or unauthorized" });
    }
    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete comment" });
    }
});



module.exports = router;

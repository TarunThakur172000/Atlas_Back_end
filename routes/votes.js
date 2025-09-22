const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware } = require("../middleware/auth");

// Upvote / Downvote
router.post("/:movieId", authMiddleware, async (req, res) => {
  const { movieId } = req.params;
  const { vote_type } = req.body; // +1 or -1

  if (![1, -1].includes(vote_type)) {
    return res.status(400).json({ message: "vote_type must be +1 or -1" });
  }

  try {
    // Check if user already voted
    const existing = await pool.query(
      "SELECT * FROM votes WHERE user_id=$1 AND movie_id=$2",
      [req.user.id, movieId]
    );

    if (existing.rows.length > 0) {
      // Update existing vote
      await pool.query(
        "UPDATE votes SET vote_type=$1 WHERE user_id=$2 AND movie_id=$3",
        [vote_type, req.user.id, movieId]
      );
    } else {
      // Insert new vote
      await pool.query(
        "INSERT INTO votes (user_id, movie_id, vote_type) VALUES ($1, $2, $3)",
        [req.user.id, movieId, vote_type]
      );
    }

    res.json({ message: "Vote recorded" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Vote failed" });
  }
});

module.exports = router;

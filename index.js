const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: "http://localhost:5173", // your React app URL
}));

app.use(express.json());

const authRoutes = require("./routes/auth");
const movieRoutes = require("./routes/movies");
const voteRoutes = require("./routes/votes");
const commentRoutes = require("./routes/comments");


app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/comments", commentRoutes);
// Test route
app.get("/", (req, res) => {
  res.send("MovieHub Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

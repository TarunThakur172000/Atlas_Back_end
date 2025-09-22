const { Pool } = require("pg");
require("dotenv").config();
 const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // important for Render
});

module.exports = pool;
// pool.query("SELECT NOW()", (err, res) => {
//   if (err) console.error("DB Connection Error:", err);
//   else console.log("DB Connected! Current Time:", res.rows[0]);
//   pool.end();
// });


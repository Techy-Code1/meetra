import pkg from "pg";
const { Pool } = pkg;

let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // required for Neon / remote DB
      },
    });

    // test connection
    const res = await pool.query("SELECT NOW()");
    console.log("PostgreSQL Connected at:", res.rows[0].now);

  } catch (error) {
    console.log("PostgreSQL Connection Failed:", error);
    process.exit(1);
  }
};

export { connectDB, pool };

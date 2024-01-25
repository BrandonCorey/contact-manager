require("dotenv").config();

const { PORT, MONGODB_URI } = process.env;

const PG_CONNECTION = {
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  port: process.env.POSTGRES_PORT,
};

module.exports = {
  PORT,
  MONGODB_URI,
  PG_CONNECTION,
};

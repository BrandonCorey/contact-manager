CREATE TABLE users (
  id serial PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(20) NOT NULL
);

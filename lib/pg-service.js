const dbQuery = require("./db-query");

class PgService {
  constructor(username) {
    this.user = username;
  }

  async auth(username, password) {
    try {
      const result = await dbQuery(
        `SELECT * FROM users WHERE username = $1 AND password = $2`,
        username,
        password,
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

module.exports = PgService;

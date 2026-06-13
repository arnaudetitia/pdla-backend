import database = require("../database");

export class QuestionController {
  public async getAllQuestions() {
    const pool = database.Database.getPool();
    const result = await pool.query(`
        SELECT q.id, q.question, q.annee, q.image, q.musique
        FROM pdla.questions q
        ORDER BY q.id
        `);

    return result.rows;
  }
}

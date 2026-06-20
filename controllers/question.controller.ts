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

  public async insertNewQuestion(question: any) {
    const pool = database.Database.getPool();
    await pool.query({
      text: `
        INSERT INTO pdla.questions(question, annee, image, musique)
        VALUES ($1, $2, $3, $4)
        `,
      values: [
        question.question,
        question.annee,
        question.image,
        question.musique,
      ],
    });
  }

  public async editQuestion(idQuestion: number, question: any) {
    const pool = database.Database.getPool();
    await pool.query({
      text: `
        UPDATE pdla.questions
        SET question = $2,
        annee = $3,
        image = $4, 
        musique = $5
        WHERE id = $1
        `,
      values: [
        idQuestion,
        question.question,
        question.annee,
        question.image,
        question.musique,
      ],
    });
  }
}

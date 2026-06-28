import database = require("../database");

export class PartieController {
  public async getAllParties() {
    const pool = database.Database.getPool();
    const result = await pool.query(`
                SELECT 
                    p.id, 
                    p.nom_partie,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                        'idQuestion', q.id,
                        'question', q.question
                        )
                    ) as liste_questions
                FROM pdla.parties p
                JOIN pdla.questions q ON q.id = ANY(p.ids_questions)
                GROUP BY p.id, p.nom_partie
                `);
    return result.rows;
  }

  public async createNewPartie(partie: any) {
    const pool = database.Database.getPool();
    await pool.query({
      text: `
        INSERT INTO pdla.parties(nom_partie, ids_questions)
        VALUES ($1, $2)
      `,
      values: [partie.nomPartie, partie.idsQuestions],
    });
  }
}

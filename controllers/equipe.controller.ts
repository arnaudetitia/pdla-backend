import database = require("../database");

export class EquipeController {
  public async enregistrerEquipes(equipes: string[]) {
    const pool = database.Database.getPool();
    try {
      await pool.query("BEGIN");
      await pool.query("TRUNCATE TABLE pdla.equipes");

      for (const [index, equipe] of equipes.entries()) {
        await pool.query({
          text: `
                INSERT INTO pdla.equipes(nom_equipe, ordre)
                VALUES ($1, $2)
                `,
          values: [equipe, index + 1],
        });
      }

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  public async getAllEquipes() {
    const pool = database.Database.getPool();
    try {
      const result = await pool.query(
        `
        SELECT e.nom_equipe,e.connected
        FROM pdla.equipes e
        `,
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

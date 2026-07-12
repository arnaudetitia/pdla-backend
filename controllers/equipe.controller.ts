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
                INSERT INTO pdla.equipes(nom_equipe, en_jeu)
                VALUES ($1, $2)
                `,
          values: [equipe, index === 0],
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

  public async connectEquipe(nomEquipe: string) {
    const pool = database.Database.getPool();
    try {
      const result = await pool.query({
        text: `
       UPDATE pdla.equipes
       SET connected = true
       WHERE nom_equipe = $1
        `,
        values: [nomEquipe],
      });
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  public async changerTour() {
    const pool = database.Database.getPool();
    try {
      const result = await pool.query({
        text: `
        WITH maj AS (
        	UPDATE pdla.equipes
        	SET en_jeu = NOT en_jeu
        	RETURNING nom_equipe, en_jeu
        ) 
        SELECT nom_equipe AS equipe_en_jeu
        FROM maj
        WHERE en_jeu
        `,
      });
      return result.rows ? result.rows[0]["equipe_en_jeu"] : "";
    } catch (error) {
      throw error;
    }
  }

  public async getEquipeEnJeu() {
    const pool = database.Database.getPool();
    try {
      const result = await pool.query({
        text: `
        SELECT e.nom_equipe AS equipe_en_jeu
        FROM pdla.equipes e
        WHERE e.en_jeu
        `,
      });
      return result.rows ? result.rows[0]["equipe_en_jeu"] : "";
    } catch (error) {
      throw error;
    }
  }
}

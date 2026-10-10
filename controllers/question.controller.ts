import database = require("../database");
import { ErreurImportFichier } from "../models/erreur-import-fichier.model";
import { CsvReaderUtil } from "../utils/csv-reader.util";
import { CsvPdlaColumns } from "../utils/enums/csv-pdla-columns.enum";
import { SupabaseStorageUtil } from "../utils/supabase-storage.util";

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

  public async uploadMusic(musicName: string, content: Buffer) {
    await SupabaseStorageUtil.uploadMusic(musicName, content);
  }

  public async importQuestions(csvContent: string, doImport: boolean) {
    const records = await CsvReaderUtil.parseRecords(csvContent);
    const erreurs: ErreurImportFichier[] = [];

    const listeChansons = await SupabaseStorageUtil.getAllMusicInBucket();
    for (const [index, record] of records.entries()) {
      if (!record[CsvPdlaColumns.QUESTION]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: "La question est obligatoire.",
        });
      }

      if (!record[CsvPdlaColumns.ANNEE]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: "L'année est obligatoire.",
        });
      }

      if (!record[CsvPdlaColumns.IMAGE]) {
        erreurs.push({
          ligne: index + 1,
          type: "error",
          message: "L'image est obligatoire.",
        });
      }

      if (record[CsvPdlaColumns.MUSIQUE]) {
        if (
          listeChansons.every(
            (extrait) =>
              extrait.localeCompare(record[CsvPdlaColumns.MUSIQUE]) !== 0,
          )
        ) {
          erreurs.push({
            ligne: index + 1,
            type: "warning",
            message: `L'extrait ${record[CsvPdlaColumns.MUSIQUE]}.mp3 n'est pas dans le storage distant`,
          });
        }
      }
    }

    if (doImport && erreurs.length === 0) {
      for (const row of records) {
        const questionVo = {
          question: row[0],
          annee: row[1],
          image: row[2],
          musique: row[3],
        };

        await this.insertNewQuestion(questionVo);
      }
    }

    return erreurs;
  }
}

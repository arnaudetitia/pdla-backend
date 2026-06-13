import express, { Application } from "express";
import cors from "cors";
import { createServer } from "http";
import { QuestionController } from "./controllers/question.controller";

export class App {
  app: Application;
  questionController: QuestionController;
  httpServer: any;
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.questionController = new QuestionController();
    this.config();
    this.routes();
  }

  private config() {
    this.app.use(cors({}));
    this.app.use(express.json());
  }

  private routes(): void {
    this.app.get("/questions", async (req, res) => {
      try {
        const question = await this.questionController.getAllQuestions();
        res.json(
          question.map((q) => {
            return {
              ...q,
              id: Number.parseInt(q.id),
              annee: Number.parseInt(q.annee),
            };
          }),
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des questions:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });
  }

  public listen(port: number): void {
    this.httpServer.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}

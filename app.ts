import express, { Application } from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { QuestionController } from "./controllers/question.controller";
import { ErreurImportFichier } from "./models/erreur-import-fichier.model";
import { PartieController } from "./controllers/partie.controller";
import { EquipeController } from "./controllers/equipe.controller";
import { Server } from "socket.io";

export class App {
  app: Application;
  questionController: QuestionController;
  partieController: PartieController;
  equipeController: EquipeController;
  httpServer: any;
  upload: any;

  io: Server;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.questionController = new QuestionController();
    this.partieController = new PartieController();
    this.equipeController = new EquipeController();
    this.config();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
      },
    });
    this.configureStorage();
    this.routes();
  }

  private config() {
    const allowedOrigins = [
      "https://localhost:4200",
      "https://localhost:4190",
      "https://pdla-remote.onrender.com",
      "https://pdla-host.onrender.com",
    ];
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (process.env.NODE_ENV === "prod") {
            if (origin && allowedOrigins.includes(origin)) callback(null, true);
            else {
              callback(new Error("Interdit"));
            }
          } else {
            callback(null, true);
          }
        },
      }),
    );
    this.app.use(express.json());
  }

  configureStorage() {
    const multer = require("multer");
    const storage = multer.diskStorage({
      destination: function (req: any, file: any, cb: any) {
        cb(
          null,
          path.join(
            __dirname,
            "../../../Projets Angular/pdla-frontend/src/assets/extraits/",
          ),
        );
      },
      filename: function (req: any, file: any, cb: any) {
        cb(null, file.originalname);
      },
    });
    this.upload = multer({ storage: storage });
  }

  private routes(): void {
    // QUESTIONS
    this.app.get("/questions", async (req, res) => {
      try {
        const allQuestions = await this.questionController.getAllQuestions();
        res.json(
          allQuestions.map((q) => {
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

    this.app.post(
      "/questions",
      this.upload.single("musicFile"),
      async (req, res) => {
        try {
          const newQuestion = JSON.parse(req.body.question);
          await this.questionController.insertNewQuestion(newQuestion);
          const allQuestions = await this.questionController.getAllQuestions();
          res.json(
            allQuestions.map((q) => {
              return {
                ...q,
                id: Number.parseInt(q.id),
                annee: Number.parseInt(q.annee),
              };
            }),
          );
        } catch (error) {
          console.error(
            "Erreur lors de la création d'une nouvelle question:",
            error,
          );
          res.status(500).json({ error: "Erreur serveur" });
        }
      },
    );

    this.app.put(
      "/questions/:id",
      this.upload.single("musicFile"),
      async (req, res) => {
        try {
          const idQuestion = Number(req.params.id);
          const editedQuestion = JSON.parse(req.body.question);
          await this.questionController.editQuestion(
            idQuestion,
            editedQuestion,
          );
          const allQuestions = await this.questionController.getAllQuestions();
          res.json(
            allQuestions.map((q) => {
              return {
                ...q,
                id: Number.parseInt(q.id),
                annee: Number.parseInt(q.annee),
              };
            }),
          );
        } catch (error) {
          console.error(
            "Erreur lors de la création d'une nouvelle question:",
            error,
          );
          res.status(500).json({ error: "Erreur serveur" });
        }
      },
    );

    this.app.post("/questions/import", async (req, res) => {
      try {
        const csvContent = req.body.csvFileContent;
        const doImport = req.body.doImport;
        let erreurs: ErreurImportFichier[] = [];
        erreurs = await this.questionController.importQuestions(
          csvContent,
          doImport,
        );
        if (erreurs.length > 0) {
          res.json({ erreurs, questions: [] });
        } else {
          const allQuestions = await this.questionController.getAllQuestions();
          const allQuestionsReturn = allQuestions.map((q) => {
            return {
              ...q,
              id: Number.parseInt(q.id),
              annee: Number.parseInt(q.annee),
            };
          });
          res.json({ erreurs: [], questions: allQuestionsReturn });
        }
      } catch (error) {
        console.error("Erreur lors de l'import des questions:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    // PARTIES
    this.app.get("/parties", async (req, res) => {
      try {
        const allParties = await this.partieController.getAllParties();
        res.json(
          allParties.map((partie) => {
            return {
              id: Number.parseInt(partie.id),
              nom_partie: partie.nom_partie,
              liste_questions: partie.liste_questions,
            };
          }),
        );
      } catch (error) {
        console.error("Erreur lors de la récupération des parties:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.get("/parties/:id", async (req, res) => {
      try {
        const idPartie = Number.parseInt(req.params.id);
        const questionsPartie =
          await this.partieController.getPartieById(idPartie);
        res.json(
          questionsPartie.map((question) => {
            return {
              ...question,
              annee: Number.parseInt(question.annee),
            };
          }),
        );
      } catch (error) {
        console.error("Erreur lors de la récupération de la partie:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.post("/parties", async (req, res) => {
      try {
        const newPartie = JSON.parse(req.body.partie);
        await this.partieController.createNewPartie(newPartie);
        const allParties = await this.partieController.getAllParties();
        res.json(
          allParties.map((partie) => {
            return {
              id: Number.parseInt(partie.id),
              nom_partie: partie.nom_partie,
              liste_questions: partie.liste_questions,
            };
          }),
        );
      } catch (error) {
        console.error("Erreur lors de la création d'une partie:", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/partie/toggle-votes", async (req, res) => {
      try {
        const statusVotes = JSON.parse(req.body.statusVotes);
        this.io.emit("toggle-votes", { statusVotes });
        res.json(true);
      } catch (error) {
        console.error(
          "Erreur lors du déclenchement de l'ouverture des votes:",
          error,
        );
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/partie/fin", async (req, res) => {
      try {
        this.io.emit("partie-termine");
        res.json(true);
      } catch (error) {
        console.error(
          "Erreur lors du déclenchement de la fin d'une partie:",
          error,
        );
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    //EQUIPES
    this.app.get("/equipes", async (req, res) => {
      try {
        const equipes = await this.equipeController.getAllEquipes();
        res.json(equipes);
      } catch (error) {
        console.error("Erreur lors de la récupération des équipes :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.post("/equipes", async (req, res) => {
      try {
        const equipes = JSON.parse(req.body.equipes);
        await this.equipeController.enregistrerEquipes(equipes);
        res.json();
      } catch (error) {
        console.error("Erreur lors de l'enregistrement des équipes :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/equipes/connect", async (req, res) => {
      try {
        const equipe = JSON.parse(req.body.equipe);
        await this.equipeController.connectEquipe(equipe);
        res.json(true);
      } catch (error) {
        console.error("Erreur lors de la connexion de l'équipe :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.get("/equipes/en-jeu", async (req, res) => {
      try {
        const equipeEnJeu = await this.equipeController.getEquipeEnJeu();
        res.json(equipeEnJeu);
      } catch (error) {
        console.error("Erreur lors dedu changement de tour :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/equipes/changer-tour", async (req, res) => {
      try {
        const equipeEnJeu = await this.equipeController.changerTour();
        this.io.emit("nouvelle-equipe-en-jeu", { equipeEnJeu });
        res.json(true);
      } catch (error) {
        console.error("Erreur lors dedu changement de tour :", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    //REPONSE
    this.app.put("/reponse/", async (req, res) => {
      try {
        const annee = JSON.parse(req.body.annee);
        const marge = JSON.parse(req.body.marge);
        this.io.emit("update-reponse", { annee, marge });
        res.json(true);
      } catch (error) {
        console.error("Erreur lors de la confirmation de la réponse", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.put("/reponse/confirm", async (req, res) => {
      try {
        this.io.emit("confirm-reponse");
        res.json(true);
      } catch (error) {
        console.error("Erreur lors de la confirmation de la réponse", error);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    this.app.post("/admin", async (req, res) => {
      if (req.body.mdpAdmin.localeCompare(process.env.ADMIN_PASSWORD) === 0) {
        return res.status(200).json({ success: true });
      }
      return res.status(403).json({ error: "Mot de passe incorrect" });
    });
  }

  public listen(port: number): void {
    this.httpServer.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}

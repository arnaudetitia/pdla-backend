import express, { Application } from "express";
import { createServer } from "http";

export class App {
  app: Application;
  httpServer: any;
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.routes();
  }

  private routes(): void {}

  public listen(port: number): void {
    this.httpServer.listen(port, () => {
      console.log(`🚀 Serveur en classe tournant sur http://localhost:${port}`);
    });
  }
}

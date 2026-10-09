import dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: `environments/environment.${process.env.NODE_ENV}` });

export class SupabaseStorageUtil {
  private static readonly defaultBucket = "pdla-extraits";

  public static async uploadMusic(musicName: string, content: Buffer) {
    const baseName = musicName.trim();
    if (
      !baseName ||
      path.basename(baseName) !== baseName ||
      baseName === "." ||
      baseName === ".."
    ) {
      throw new Error("Nom de fichier MP3 invalide");
    }

    const project = process.env.SUPABASE_PROJECT;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || this.defaultBucket;
    if (!project || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_PROJECT et SUPABASE_SERVICE_ROLE_KEY doivent être configurés",
      );
    }

    const fileName = `${baseName}.mp3`;
    const response = await fetch(
      `https://${project}.supabase.co/storage/v1/object/${encodeURIComponent(bucket)}/${encodeURIComponent(fileName)}`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "audio/mpeg",
          "x-upsert": "true",
        },
        body: new Uint8Array(content),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Échec de l'upload Supabase (${response.status}): ${details}`,
      );
    }
  }
}

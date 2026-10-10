import dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: `environments/environment.${process.env.NODE_ENV}` });

interface SupabaseFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any>;
}

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

  public static async getAllMusicInBucket(): Promise<string[]> {
    const project = process.env.SUPABASE_PROJECT;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || this.defaultBucket;
    if (!project || !serviceRoleKey) {
      throw new Error(
        "SUPABASE_PROJECT et SUPABASE_SERVICE_ROLE_KEY doivent être configurés",
      );
    }

    let allFiles: SupabaseFile[] = [];
    let limit = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://${project}.supabase.co/storage/v1/object/list/${encodeURIComponent(bucket)}`,
        {
          method: "POST",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix: "",
            limit: 100,
            offset: 0,
            sortBy: { column: "name", order: "asc" },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erreur Supabase Storage (${response.status}) : ${errorText}`,
        );
      }

      const files = (await response.json()) as SupabaseFile[];

      if (files && files.length > 0) {
        allFiles = allFiles.concat(files);
        offset += limit;
        if (files.length < limit) {
          hasMore = false; // Fin des pages
        }
      } else {
        hasMore = false;
      }
    }

    return allFiles.map((file) => file.name.replace(".mp3", ""));
  }
}

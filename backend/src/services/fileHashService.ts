// src/services/fileHashService.ts
import * as crypto from "crypto";
import * as fs from "fs/promises";
import { FileHash } from "../models/hashImagesVideos";

export class FileHashService {
  /**
   * Genera un hash SHA-256 para un archivo dado su path
   */
  public async generateFileHash(
    filePath: string,
    fileName: string,
    fileType: "image" | "video"
  ): Promise<FileHash> {
    try {
      // Leer el archivo
      const fileBuffer = await fs.readFile(filePath);

      // Crear hash SHA-256
      const hashSum = crypto.createHash("sha256");
      hashSum.update(fileBuffer);
      const hash = hashSum.digest("hex");

      return {
        hash,
        fileName,
        filePath,
        createdAt: new Date(),
        fileType,
      };
    } catch (error) {
      throw new Error(
        `Error al generar hash para ${fileName}: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
    }
  }

  /**
   * Genera hashes para un array de archivos
   */
  public async generateHashesForFiles(
    files: Array<{
      path: string;
      filename: string;
      type: "image" | "video";
    }>
  ): Promise<FileHash[]> {
    return Promise.all(
      files.map(async (file) =>
        this.generateFileHash(file.path, file.filename, file.type)
      )
    );
  }
}

// src/services/fileHashService.ts
import * as crypto from "crypto";
import axios from "axios";

export interface GeneratedHashInfo {
  hash: string;
  fileName: string;
  fileType: "image" | "video";
}

export class FileHashService {
  public async generateFileHash(
    fileUrl: string,
    originalFileName: string,
    fileType: "image" | "video"
  ): Promise<GeneratedHashInfo> {
    try {
      console.log(
        `[FileHashService] Iniciando hash para: ${originalFileName}, URL: ${fileUrl}`
      );

      console.log(`[FileHashService] Intentando descargar desde: ${fileUrl}`);
      const response = await axios({
        method: "get",
        url: fileUrl,
        responseType: "arraybuffer", // Muy importante para datos binarios
      });
      console.log(
        `[FileHashService] Descarga completada para: ${originalFileName}. Status: ${
          response.status
        }. Tamaño de datos: ${response.data.byteLength || response.data.length}`
      );

      const fileBuffer = Buffer.from(response.data);

      if (!fileBuffer || fileBuffer.length === 0) {
        console.error(
          `[FileHashService] Error: El buffer del archivo descargado está vacío para ${originalFileName}.`
        );
        throw new Error("El buffer del archivo descargado está vacío.");
      }
      console.log(
        `[FileHashService] Buffer creado para ${originalFileName}, tamaño del buffer: ${fileBuffer.length} bytes.`
      );

      const hashSum = crypto.createHash("sha256");
      hashSum.update(fileBuffer);
      const hash = hashSum.digest("hex");
      console.log(
        `[FileHashService] Hash SHA256 generado: ${hash} para ${originalFileName}`
      );

      return {
        hash,
        fileName: originalFileName,
        fileType,
      };
    } catch (error) {
      let errorMessage = "Error desconocido en FileHashService";
      if (axios.isAxiosError(error)) {
        errorMessage = `Error de Axios al descargar ${originalFileName} desde ${fileUrl}: ${error.message}.`;
        if (error.response) {
          errorMessage += ` Status: ${
            error.response.status
          }. Data: ${JSON.stringify(error.response.data)}.`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Error generando hash para ${originalFileName}: ${error.message}`;
      }
      console.error(`[FileHashService] ${errorMessage}`);
      // Re-lanza el error para que la ruta principal lo capture
      throw new Error(
        `Fallo en FileHashService procesando ${originalFileName}: ${errorMessage}`
      );
    }
  }
}

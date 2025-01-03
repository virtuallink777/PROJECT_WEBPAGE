import express from "express";
import upload from "../middleware/upload";

const router = express.Router();

// Ruta para manejar la carga de archivos
const publicacionesUpload = router.post(
  "/upload/:userId",
  upload.array("files"),
  (req, res) => {
    try {
      const userId = req.body.userId;

      if (!req.files) {
        return res.status(400).json({ message: "No se han subido archivos" });
      }

      // Accede a la lista de archivos subidos
      const files = req.files as Express.Multer.File[];

      // Crear un array con las rutas de los archivos
      const filePaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Archivos subidos correctamente",
        files: filePaths,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al subir archivos", error });
    }
  }
);

//   RUTA PARA LOS VIDEOS

const videosUpload = router.post(
  "/upload-videos/:userId",
  upload.array("videos"),
  (req, res) => {
    try {
      const userId = req.params.userId;

      if (!req.files) {
        return res.status(400).json({ message: "No se han subido videos" });
      }

      const files = req.files as Express.Multer.File[];
      const videoPaths = files.map((file) => ({
        url: `/uploads/${userId}/${file.filename}`,
        filename: file.filename,
      }));

      res.status(200).json({
        message: "Videos subidos correctamente",
        files: videoPaths,
      });
    } catch (error) {
      res.status(500).json({ message: "Error al subir videos", error });
    }
  }
);

export { publicacionesUpload, videosUpload };

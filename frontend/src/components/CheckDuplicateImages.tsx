const CheckDuplicateImages = async (images: File[]): Promise<boolean[]> => {
  try {
    const formData = new FormData();

    images.forEach((image) => {
      formData.append("files", image);
    });

    const response = await fetch(
      "http://localhost:4004/api/verify-duplicate-images",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Error al subir las imágenes");
    }

    // Supongamos que la API devuelve un array de booleanos indicando si la imagen es repetida
    const result = await response.json();
    return result.isDuplicateArray; // Un array de true/false
  } catch (error) {
    console.error("Error al verificar imágenes repetidas:", error);
    return [];
  }
};

export default CheckDuplicateImages;

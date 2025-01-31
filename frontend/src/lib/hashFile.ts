export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      if (!event.target?.result) {
        return reject("Error al leer el archivo.");
      }

      const arrayBuffer = event.target.result as ArrayBuffer;
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      resolve(hashHex);
    };

    reader.onerror = () => reject("Error al procesar el archivo.");
    reader.readAsArrayBuffer(file);
  });
}

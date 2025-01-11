import HandleFileChange from "./DownloadPhoto";

interface FormData {
  images: File[];
  fotoPrincipal: File | null;
}

export const FourthBlockPublication = () => {
  return (
    <>
      {/* Subir Fotos */}
      <HandleFileChange onImagesChange={() => {}} />
    </>
  );
};

import { useMediaCounts } from "@/hooks/useFetchMediaCounts";

export const CountImagesVideos: React.FC = () => {
  const { imagesCount, videosCount } = useMediaCounts();

  return (
    <div className="container mx-auto mt-6">
      <div className="text-center">
        <h1 className="text-2xl">
          En estos momentos tienes:
          <span className="ml-2">
            <b className="font-semibold">{imagesCount}</b> imágenes
          </span>
          <span className="ml-2">
            <b className="font-semibold"> {videosCount}</b> videos guardados
          </span>
        </h1>
        <h2 className="mt-4">
          Recuerda que puedes tener máximo 12 imágenes y 4 videos
        </h2>
      </div>
    </div>
  );
};

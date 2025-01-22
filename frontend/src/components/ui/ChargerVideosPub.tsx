import { Video } from "lucide-react";

interface VideosData {
  url: string;
  filename: string;
  _id: string;
}

interface FileChangeProps {
  onVideosChange: (files: VideosData[]) => void;
  videos: VideosData[];
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getVideoUrl = (url: string) => {
  if (url.startsWith("http")) {
    return url;
  }
  return `${API_URL}${url}`;
};

interface VideoItemProps {
  url: string;

  alt: string;
  onRemove: (url: string) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({
  url,

  onRemove,
}) => (
  <div className="relative w-full max-w-[300px] aspect-video border rounded-lg overflow-hidden bg-gray-200 shadow-sm">
    <video
      src={getVideoUrl(url)}
      controls
      className="w-full h-full object-cover"
    />
    <button
      type="button"
      onClick={() => onRemove(url)}
      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors"
    >
      ×
    </button>
  </div>
);

const ChargerVideosPubEdit: React.FC<FileChangeProps> = ({
  onVideosChange,
  videos = [],
}) => {
  const handleRemove = (url: string) => {
    const updatedVideos = videos.filter((video) => video.url !== url);
    onVideosChange(updatedVideos);
  };

  return (
    <div>
      <p className="text-gray-600 mt-6">Total Videos: {videos.length}</p>
      <div className="flex flex-wrap gap-4">
        {videos.map((video) => (
          <VideoItem
            key={video.url}
            url={video.url}
            alt={video.filename}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
};

export default ChargerVideosPubEdit;

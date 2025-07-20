import React from "react";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";

interface ImageCarouselProps {
  images: { url: string }[];
  initialIndex: number;
  onClose: () => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  // Configuración de swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext, // Deslizar a la izquierda -> Siguiente imagen
    onSwipedRight: handlePrev, // Deslizar a la derecha -> Imagen anterior
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      {...swipeHandlers} // Aplica los handlers de swipe
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl bg-red-500 rounded-full w-10 h-10 flex items-center justify-center z-10"
      >
        &times;
      </button>
      <button
        onClick={handlePrev}
        className="absolute left-4 text-white text-2xl bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center z-10"
      >
        &lt;
      </button>
      <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <Image
          src={images[currentIndex].url} // <--- CORREGIDO: Sin el prefijo
          alt={`Image ${currentIndex + 1}`}
          className="object-contain w-full h-full"
          width={1200}
          height={800}
        />
      </div>
      <button
        onClick={handleNext}
        className="absolute right-4 text-white text-2xl bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center z-10"
      >
        &gt;
      </button>
    </div>
  );
};

export default ImageCarousel;

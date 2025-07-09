// SPINNER
export const SimpleSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
    <p className="text-xl text-gray-700">Subiendo la información</p>
  </div>
);

// src/components/FilterBar.tsx
import Cities from "./NavItem"; // Asegúrate de que la ruta sea correcta
import MaxWidthWrapper from "./MaxWidthWrapper";

const FilterBar = () => {
  return (
    <div className="bg-rose-200   border-b border-gray-500 py-3">
      <MaxWidthWrapper>
        <div className="flex justify-center">
          <Cities />
        </div>
      </MaxWidthWrapper>
    </div>
  );
};

export default FilterBar;

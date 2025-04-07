import TopPostsRanking from "@/components/TopPostsRanking";
import React from "react";

const page = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Estadísticas</h2>
      <TopPostsRanking />
    </div>
  );
};

export default page;

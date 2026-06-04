export const getGridClass = (count) => {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count <= 2) return "grid-cols-2 grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-3 grid-rows-2";

  return "grid-cols-4 grid-rows-2";
};

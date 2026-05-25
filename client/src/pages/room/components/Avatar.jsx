import { AVATAR_GRADIENTS } from "../data/roomMockData";

export default function Avatar({
  initials,
  colorIndex = 0,
  className = "h-14 w-14 text-lg",
}) {
  const gradient = AVATAR_GRADIENTS[colorIndex % AVATAR_GRADIENTS.length];

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br ${gradient} font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}

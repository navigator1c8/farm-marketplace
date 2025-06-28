import Icon from "@/components/ui/icon";

interface RatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: "small" | "medium" | "large";
  showCount?: boolean;
}

const RatingDisplay = ({
  rating,
  reviewCount,
  size = "medium",
  showCount = true,
}: RatingDisplayProps) => {
  const starSize = size === "small" ? 12 : size === "large" ? 20 : 16;
  const textSize =
    size === "small" ? "text-xs" : size === "large" ? "text-base" : "text-sm";

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            size={starSize}
            className={`${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className={`font-medium text-gray-700 ${textSize}`}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount && (
        <span className={`text-gray-500 ${textSize}`}>({reviewCount})</span>
      )}
    </div>
  );
};

export default RatingDisplay;

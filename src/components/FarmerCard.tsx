import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import RatingDisplay from "./RatingDisplay";

interface FarmerCardProps {
  farmer: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    reviewCount: number;
    location: string;
    specialties: string[];
    isOrganic: boolean;
    isVerified: boolean;
  };
}

const FarmerCard = ({ farmer }: FarmerCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <img
              src={farmer.avatar}
              alt={farmer.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            {farmer.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <Icon name="Check" size={12} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-montserrat font-semibold text-gray-800">
                {farmer.name}
              </h3>
              {farmer.isOrganic && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Icon name="Leaf" size={12} className="mr-1" />
                  Органик
                </Badge>
              )}
            </div>

            <div className="flex items-center text-gray-600 text-sm mb-2">
              <Icon name="MapPin" size={14} className="mr-1" />
              {farmer.location}
            </div>

            <RatingDisplay
              rating={farmer.rating}
              reviewCount={farmer.reviewCount}
              size="small"
            />

            <div className="flex flex-wrap gap-1 mt-3">
              {farmer.specialties.map((specialty) => (
                <Badge
                  key={specialty}
                  variant="secondary"
                  className="text-xs bg-gray-100 text-gray-700"
                >
                  {specialty}
                </Badge>
              ))}
            </div>

            <Button
              className="w-full mt-4 bg-primary hover:bg-primary-600"
              size="sm"
            >
              Перейти к продуктам
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmerCard;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import RatingDisplay from "./RatingDisplay";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    unit: string;
    farmer: string;
    rating: number;
    reviewCount: number;
    isOrganic: boolean;
    isSeasonal: boolean;
    isPreorder: boolean;
    availableFrom?: string;
    category: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {product.isOrganic && (
            <Badge className="bg-green-500 hover:bg-green-500">
              <Icon name="Leaf" size={12} className="mr-1" />
              Органик
            </Badge>
          )}
          {product.isSeasonal && (
            <Badge className="bg-accent hover:bg-accent">
              <Icon name="Calendar" size={12} className="mr-1" />
              Сезонное
            </Badge>
          )}
          {product.isPreorder && (
            <Badge
              variant="outline"
              className="bg-white border-primary text-primary"
            >
              Предзаказ
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-montserrat font-semibold text-gray-800 mb-2">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-primary">
            {product.price} ₽
            <span className="text-sm text-gray-500 font-normal">
              /{product.unit}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <Icon name="User" size={14} className="mr-1" />
          Фермер: {product.farmer}
        </div>

        <RatingDisplay
          rating={product.rating}
          reviewCount={product.reviewCount}
          size="small"
        />

        {product.isPreorder && product.availableFrom && (
          <div className="flex items-center text-orange-600 text-sm mt-2">
            <Icon name="Clock" size={14} className="mr-1" />
            Доступно с {product.availableFrom}
          </div>
        )}

        <Button
          className="w-full mt-4 bg-primary hover:bg-primary-600"
          disabled={product.isPreorder}
        >
          <Icon name="ShoppingCart" size={16} className="mr-2" />
          {product.isPreorder ? "Предзаказать" : "В корзину"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

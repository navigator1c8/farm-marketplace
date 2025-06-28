import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.getFeaturedProducts();
        if (response.data) {
          setProducts(response.data.products);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
        toast.error('Ошибка загрузки продуктов');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleAddToCart = async (product: Product) => {
    await addToCart(product);
  };

  const formatPrice = (amount: number, unit: string) => {
    return `${amount} ₽/${unit}`;
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Рекомендуемые продукты
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Лучшие продукты от наших фермеров, выбранные специально для вас
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => (
            <Card
              key={product._id}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={product.images[0]?.url || '/placeholder.svg'}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {product.characteristics.isOrganic && (
                    <Badge className="bg-green-500 hover:bg-green-500 text-white">
                      <Icon name="Leaf" className="w-3 h-3 mr-1" />
                      Органик
                    </Badge>
                  )}
                  {product.seasonality.isSeasonalProduct && (
                    <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
                      <Icon name="Calendar" className="w-3 h-3 mr-1" />
                      Сезонное
                    </Badge>
                  )}
                </div>

                {/* Quick view button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button asChild variant="secondary" size="sm">
                    <Link to={`/product/${product._id}`}>
                      <Icon name="Eye" className="w-4 h-4 mr-2" />
                      Подробнее
                    </Link>
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {product.farmer.farmName}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-bold text-primary">
                    {formatPrice(product.price.amount, product.price.unit)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Star" className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {product.rating.average.toFixed(1)}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.availability.inStock}
                >
                  {product.availability.inStock ? (
                    <>
                      <Icon name="ShoppingCart" className="w-4 h-4 mr-2" />
                      В корзину
                    </>
                  ) : (
                    'Нет в наличии'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/catalog">
              Посмотреть все продукты
              <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
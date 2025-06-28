import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { Farmer } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

const FeaturedFarmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedFarmers = async () => {
      try {
        const response = await api.getFeaturedFarmers();
        if (response.data) {
          setFarmers(response.data.farmers);
        }
      } catch (error) {
        console.error('Error fetching featured farmers:', error);
        toast.error('Ошибка загрузки фермеров');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedFarmers();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2 mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Наши лучшие фермеры
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Знакомьтесь с фермерами, которые выращивают качественные продукты
            с заботой о природе и вашем здоровье
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {farmers.map((farmer) => (
            <Card
              key={farmer._id}
              className="hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={farmer.user.avatar || '/placeholder.svg'}
                      alt={farmer.farmName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {farmer.isVerified && (
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                        <Icon name="Check" className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {farmer.farmName}
                      </h3>
                      {farmer.isOrganic && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Icon name="Leaf" className="w-3 h-3 mr-1" />
                          Органик
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <Icon name="MapPin" className="w-4 h-4 mr-1" />
                      {farmer.farmLocation.city}, {farmer.farmLocation.region}
                    </div>

                    <div className="flex items-center mb-3">
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Icon
                            key={index}
                            name="Star"
                            className={`w-4 h-4 ${
                              index < Math.floor(farmer.rating.average)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {farmer.rating.average.toFixed(1)} ({farmer.rating.count})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {farmer.specialties.slice(0, 3).map((specialty) => (
                        <Badge
                          key={specialty}
                          variant="secondary"
                          className="text-xs"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    <Button asChild className="w-full" size="sm">
                      <Link to={`/farmer/${farmer._id}`}>
                        Перейти к продуктам
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/farmers">
              Посмотреть всех фермеров
              <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedFarmers;
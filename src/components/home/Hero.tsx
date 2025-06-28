import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 py-20 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2322C55E" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                <Icon name="Leaf" className="w-3 h-3 mr-1" />
                100% натуральные продукты
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Свежие продукты{' '}
                <span className="text-primary">прямо с фермы</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Заказывайте органические овощи, фрукты, мясо и молочные продукты от
                проверенных фермеров. Доставляем свежесть к вашему столу каждый день.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg px-8 py-6">
                <Link to="/catalog">
                  <Icon name="ShoppingBag" className="w-5 h-5 mr-2" />
                  Начать покупки
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link to="/farmers">
                  <Icon name="Users" className="w-5 h-5 mr-2" />
                  Наши фермеры
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-600">Фермеров</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2000+</div>
                <div className="text-sm text-gray-600">Продуктов</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">50k+</div>
                <div className="text-sm text-gray-600">Довольных клиентов</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Свежие овощи и фрукты"
                className="w-full h-[500px] object-cover"
              />
              
              {/* Floating badges */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 text-green-700 hover:bg-white">
                  <Icon name="Leaf" className="w-3 h-3 mr-1" />
                  Органик
                </Badge>
              </div>
              
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-blue-700 hover:bg-white">
                  <Icon name="Truck" className="w-3 h-3 mr-1" />
                  Быстрая доставка
                </Badge>
              </div>
              
              <div className="absolute bottom-4 left-4">
                <Badge className="bg-white/90 text-orange-700 hover:bg-white">
                  <Icon name="MapPin" className="w-3 h-3 mr-1" />
                  Местные фермеры
                </Badge>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-200 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-green-200 rounded-full opacity-40 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
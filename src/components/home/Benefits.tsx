import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const Benefits = () => {
  const benefits = [
    {
      icon: 'Leaf',
      title: 'Экологически чистые продукты',
      description: 'Все продукты выращены без использования химических удобрений и пестицидов',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: 'MapPin',
      title: 'Местные фермеры',
      description: 'Поддерживаем местных производителей и сокращаем углеродный след',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: 'Clock',
      title: 'Максимальная свежесть',
      description: 'Продукты доставляются в день сбора урожая или производства',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: 'Shield',
      title: 'Гарантия качества',
      description: 'Каждый фермер проходит строгую проверку и сертификацию',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: 'Truck',
      title: 'Быстрая доставка',
      description: 'Доставляем в день заказа или на следующий день',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      icon: 'Heart',
      title: 'Забота о здоровье',
      description: 'Натуральные продукты без консервантов и искусственных добавок',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Почему выбирают нас
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Мы создали платформу, которая объединяет лучших фермеров и заботливых покупателей
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${benefit.bgColor} mb-4`}
                >
                  <Icon
                    name={benefit.icon as any}
                    className={`w-8 h-8 ${benefit.color}`}
                  />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>

                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
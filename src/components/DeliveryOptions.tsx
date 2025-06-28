import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

const DeliveryOptions = () => {
  const options = [
    {
      title: "Экспресс-доставка",
      description: "Доставка в течение 2-4 часов",
      icon: "Zap",
      price: "от 200 ₽",
      features: [
        "Только свежие продукты",
        "SMS уведомления",
        "Контроль температуры",
      ],
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Стандартная доставка",
      description: "Доставка на следующий день",
      icon: "Truck",
      price: "от 100 ₽",
      features: ["Планирование времени", "Эко-упаковка", "Бесплатно от 2000 ₽"],
      color: "text-primary",
      bgColor: "bg-green-50",
    },
    {
      title: "Самовывоз",
      description: "Забирайте в пунктах выдачи",
      icon: "MapPin",
      price: "Бесплатно",
      features: ["50+ точек выдачи", "Круглосуточно", "Скидка 5%"],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-montserrat font-bold text-gray-800 mb-4">
            Варианты доставки
          </h2>
          <p className="text-lg text-gray-600 font-open-sans max-w-2xl mx-auto">
            Выберите удобный способ получения свежих продуктов. Мы заботимся о
            сохранности качества на каждом этапе
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {options.map((option) => (
            <Card
              key={option.title}
              className="hover:shadow-lg transition-shadow duration-300 animate-fade-in"
            >
              <CardContent className="p-6 text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${option.bgColor} mb-4`}
                >
                  <Icon
                    name={option.icon as any}
                    size={32}
                    className={option.color}
                  />
                </div>

                <h3 className="text-xl font-montserrat font-semibold text-gray-800 mb-2">
                  {option.title}
                </h3>

                <p className="text-gray-600 font-open-sans mb-3">
                  {option.description}
                </p>

                <Badge className="mb-4 bg-primary hover:bg-primary">
                  {option.price}
                </Badge>

                <ul className="space-y-2">
                  {option.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <Icon
                        name="Check"
                        size={16}
                        className="text-primary mr-2 flex-shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DeliveryOptions;

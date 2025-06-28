import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-green-100 py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-2xl">
            <h1 className="text-5xl font-montserrat font-bold text-gray-800 mb-6 leading-tight">
              Свежие продукты прямо{" "}
              <span className="text-primary">с фермы</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 font-open-sans">
              Заказывайте органические овощи, фрукты и молочные продукты от
              проверенных фермеров. Доставляем свежесть к вашему столу каждый
              день.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button className="bg-primary hover:bg-primary-600 text-lg px-8 py-3">
                <Icon name="ShoppingBag" className="mr-2" size={20} />
                Начать покупки
              </Button>
              <Button
                variant="outline"
                className="text-lg px-8 py-3 border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Icon name="Users" className="mr-2" size={20} />
                Стать фермером
              </Button>
            </div>

            <div className="flex items-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-gray-600">Фермеров</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2000+</div>
                <div className="text-sm text-gray-600">Продуктов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50k+</div>
                <div className="text-sm text-gray-600">Довольных клиентов</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block flex-1">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Свежие овощи и фрукты"
              className="rounded-2xl shadow-2xl animate-scale-in"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import Icon from "@/components/ui/icon";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Sprout" className="text-white" size={16} />
              </div>
              <h3 className="text-xl font-montserrat font-bold">ФермаМаркет</h3>
            </div>
            <p className="text-gray-400 font-open-sans">
              Свежие продукты прямо с фермы к вашему столу. Поддерживаем местных
              фермеров и заботимся о вашем здоровье.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-montserrat font-semibold mb-4">
              Покупателям
            </h4>
            <ul className="space-y-2 font-open-sans">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Как заказать
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Доставка и оплата
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Возврат товара
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Частые вопросы
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-montserrat font-semibold mb-4">
              Фермерам
            </h4>
            <ul className="space-y-2 font-open-sans">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Стать партнёром
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Требования к продукции
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Сертификация
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Условия сотрудничества
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-montserrat font-semibold mb-4">
              Контакты
            </h4>
            <div className="space-y-3 font-open-sans">
              <div className="flex items-center space-x-3">
                <Icon name="Phone" size={16} className="text-primary" />
                <span className="text-gray-400">8 (800) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="Mail" size={16} className="text-primary" />
                <span className="text-gray-400">info@fermamarket.ru</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="MapPin" size={16} className="text-primary" />
                <span className="text-gray-400">
                  Москва, ул. Фермерская, 123
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 font-open-sans">
            © 2024 ФермаМаркет. Все права защищены.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icon name="Instagram" size={20} />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icon name="Facebook" size={20} />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icon name="Twitter" size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

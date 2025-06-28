import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Icon name="Sprout" className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold">ФермаМаркет</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Свежие продукты прямо с фермы к вашему столу. Поддерживаем местных
              фермеров и заботимся о вашем здоровье.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Icon name="Instagram" className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Icon name="Facebook" className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Icon name="Twitter" className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Icon name="Youtube" className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Покупателям</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/how-to-buy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Как заказать
                </Link>
              </li>
              <li>
                <Link
                  to="/delivery"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Доставка и оплата
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Возврат товара
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Частые вопросы
                </Link>
              </li>
              <li>
                <Link
                  to="/promotions"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Акции и скидки
                </Link>
              </li>
            </ul>
          </div>

          {/* For Farmers */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Фермерам</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/become-partner"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Стать партнёром
                </Link>
              </li>
              <li>
                <Link
                  to="/requirements"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Требования к продукции
                </Link>
              </li>
              <li>
                <Link
                  to="/certification"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Сертификация
                </Link>
              </li>
              <li>
                <Link
                  to="/partnership"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Условия сотрудничества
                </Link>
              </li>
              <li>
                <Link
                  to="/farmer-support"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Поддержка фермеров
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Контакты</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Icon name="Phone" className="h-4 w-4 text-primary" />
                <span className="text-gray-400">8 (800) 123-45-67</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="Mail" className="h-4 w-4 text-primary" />
                <span className="text-gray-400">info@fermamarket.ru</span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="MapPin" className="h-4 w-4 text-primary" />
                <span className="text-gray-400">
                  Москва, ул. Фермерская, 123
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon name="Clock" className="h-4 w-4 text-primary" />
                <span className="text-gray-400">Пн-Вс: 8:00 - 22:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 ФермаМаркет. Все права защищены.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Политика конфиденциальности
            </Link>
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Пользовательское соглашение
            </Link>
            <Link
              to="/cookies"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Использование cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
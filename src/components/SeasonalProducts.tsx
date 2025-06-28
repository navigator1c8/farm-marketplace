import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";
import Icon from "@/components/ui/icon";

const SeasonalProducts = () => {
  const seasons = [
    { name: "Весна", icon: "Flower2", color: "text-green-600", active: false },
    { name: "Лето", icon: "Sun", color: "text-yellow-600", active: true },
    { name: "Осень", icon: "Leaf", color: "text-orange-600", active: false },
    { name: "Зима", icon: "Snowflake", color: "text-blue-600", active: false },
  ];

  const products = [
    {
      id: "1",
      name: "Помидоры черри",
      image:
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
      price: 350,
      unit: "кг",
      farmer: "Михаил Иванов",
      rating: 4.9,
      reviewCount: 45,
      isOrganic: true,
      isSeasonal: true,
      isPreorder: false,
      category: "Овощи",
    },
    {
      id: "2",
      name: "Клубника садовая",
      image:
        "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop",
      price: 450,
      unit: "кг",
      farmer: "Анна Петрова",
      rating: 4.8,
      reviewCount: 67,
      isOrganic: true,
      isSeasonal: true,
      isPreorder: false,
      category: "Ягоды",
    },
    {
      id: "3",
      name: "Арбузы астраханские",
      image:
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop",
      price: 120,
      unit: "кг",
      farmer: "Сергей Козлов",
      rating: 4.7,
      reviewCount: 89,
      isOrganic: false,
      isSeasonal: true,
      isPreorder: true,
      availableFrom: "15 августа",
      category: "Фрукты",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-montserrat font-bold text-gray-800 mb-4">
            Каталог продуктов
          </h2>
          <p className="text-lg text-gray-600 font-open-sans max-w-2xl mx-auto mb-8">
            Свежие органические продукты прямо с фермы
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            Показать больше продуктов
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SeasonalProducts;

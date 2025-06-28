import FarmerCard from "./FarmerCard";

const FeaturedFarmers = () => {
  const farmers = [
    {
      id: "1",
      name: "Михаил Иванов",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      rating: 4.9,
      reviewCount: 127,
      location: "Московская область",
      specialties: ["Овощи", "Зелень", "Ягоды"],
      isOrganic: true,
      isVerified: true,
    },
    {
      id: "2",
      name: "Анна Петрова",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b332752c?w=100&h=100&fit=crop&crop=face",
      rating: 4.8,
      reviewCount: 89,
      location: "Тульская область",
      specialties: ["Молочные продукты", "Мёд"],
      isOrganic: true,
      isVerified: true,
    },
    {
      id: "3",
      name: "Сергей Козлов",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 4.7,
      reviewCount: 156,
      location: "Калужская область",
      specialties: ["Фрукты", "Орехи", "Консервы"],
      isOrganic: false,
      isVerified: true,
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-montserrat font-bold text-gray-800 mb-4">
            Рекомендуемые фермеры
          </h2>
          <p className="text-lg text-gray-600 font-open-sans max-w-2xl mx-auto">
            Знакомьтесь с нашими лучшими фермерами, которые выращивают
            качественные продукты с заботой о природе и вашем здоровье
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedFarmers;

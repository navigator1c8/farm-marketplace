import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";

const OrganicSection = () => {
  const certifications = [
    {
      name: "Органик",
      icon: "Leaf",
      description: "Без химических удобрений и пестицидов",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Без ГМО",
      icon: "Shield",
      description: "Генетически не модифицированные продукты",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Фермерское",
      icon: "Home",
      description: "Выращено на семейных фермах",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      name: "Локальное",
      icon: "MapPin",
      description: "Продукты из вашего региона",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-montserrat font-bold text-gray-800 mb-6">
              Качество, которому можно доверять
            </h2>
            <p className="text-lg text-gray-600 font-open-sans mb-8">
              Все наши фермеры проходят строгую проверку. Мы гарантируем
              качество и безопасность каждого продукта, который попадает к вам
              на стол.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert) => (
                <Card key={cert.name} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${cert.bgColor} mb-3`}
                    >
                      <Icon
                        name={cert.icon as any}
                        size={20}
                        className={cert.color}
                      />
                    </div>
                    <h3 className="font-montserrat font-semibold text-gray-800 mb-1">
                      {cert.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-open-sans">
                      {cert.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="bg-primary hover:bg-primary-600">
              <Icon name="Award" size={16} className="mr-2" />
              Узнать о сертификации
            </Button>
          </div>

          <div className="lg:w-1/2">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Органические продукты"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary hover:bg-primary text-white">
                  <Icon name="Leaf" size={14} className="mr-1" />
                  100% Органик
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganicSection;

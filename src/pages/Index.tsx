import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedFarmers from "@/components/FeaturedFarmers";
import SeasonalProducts from "@/components/SeasonalProducts";
import OrganicSection from "@/components/OrganicSection";
import DeliveryOptions from "@/components/DeliveryOptions";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <SeasonalProducts />
      <Footer />
    </div>
  );
};

export default Index;

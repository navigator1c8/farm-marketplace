import React from 'react';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import FeaturedFarmers from '@/components/home/FeaturedFarmers';
import Benefits from '@/components/home/Benefits';
import DeliveryOptions from '@/components/DeliveryOptions';

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedProducts />
      <Benefits />
      <FeaturedFarmers />
      <DeliveryOptions />
    </div>
  );
};

export default Home;
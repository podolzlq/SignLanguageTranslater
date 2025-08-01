import React, { useRef } from 'react';
import Header from '../components/Header/Header';
import Hero from '../components/Hero/Hero';
import Features from '../components/Features/Features';
import Steps from '../components/Steps/Steps';
import FinalCTA from '../components/FinalCTA/FinalCTA';

const Home = () => {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="App">
      <Header />
      <main>
        <Hero ref={heroRef} onScrollToNext={scrollToFeatures} />
        <Features ref={featuresRef} />
        <Steps />
        <FinalCTA onNavigateToTop={scrollToTop} />
      </main>
    </div>
  );
};

export default Home;
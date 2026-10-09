import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Footer from '../components/landing/Footer';
import { AISection, CTA, Preview, Roles, Security, Why } from '../components/landing/Sections';

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <Hero />
        <Why />
        <Preview />
        <AISection />
        <Roles />
        <Security />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

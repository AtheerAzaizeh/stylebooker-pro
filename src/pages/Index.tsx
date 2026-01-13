import { useState, useRef, lazy, Suspense } from "react";
import { HeroSection } from "@/components/booking/HeroSection";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OurStory } from "@/components/sections/OurStory";
import { Certifications } from "@/components/sections/Certifications";
import { BlogQA } from "@/components/sections/BlogQA";

// Lazy load BookingForm to defer loading the validations library until needed
const BookingForm = lazy(() => import("@/components/booking/BookingForm").then(m => ({ default: m.BookingForm })));

const Index = () => {
  const [showBooking, setShowBooking] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const handleBookClick = () => {
    setShowBooking(true);
    // Scroll to booking form
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header with Logo */}
      <Header onBookClick={handleBookClick} />
      
      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection onBookClick={handleBookClick} compact={showBooking} />
        
        {/* Booking Form */}
        {showBooking && (
          <div ref={bookingRef}>
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            }>
              <BookingForm onClose={() => setShowBooking(false)} />
            </Suspense>
          </div>
        )}

        {/* Our Story Section */}
        <OurStory />

        {/* Certifications Section */}
        <Certifications />

        {/* FAQ / Blog Section */}
        <BlogQA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;

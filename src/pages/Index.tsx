import { useState, useRef, lazy, Suspense } from "react";
import { HeroSection } from "@/components/booking/HeroSection";

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
      <HeroSection onBookClick={handleBookClick} compact={showBooking} />
      
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
    </div>
  );
};

export default Index;

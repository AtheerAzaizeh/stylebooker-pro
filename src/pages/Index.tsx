import { useState, useRef, lazy, Suspense } from "react";
import { HeroSection } from "@/components/booking/HeroSection";

// Lazy load BookingForm - only loaded when user clicks "Book Now"
const BookingForm = lazy(() => 
  import("@/components/booking/BookingForm").then(mod => ({ default: mod.BookingForm }))
);

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
            <div className="p-6 text-center">
              <div className="animate-pulse text-muted-foreground">טוען טופס הזמנה...</div>
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

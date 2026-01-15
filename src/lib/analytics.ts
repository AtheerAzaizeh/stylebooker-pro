/**
 * Google Analytics Integration
 * 
 * Usage:
 * - Import and call trackEvent() for custom events
 * - pageView() is called automatically on route changes
 */

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

// Check if GA is loaded
const isGALoaded = (): boolean => {
  return typeof window !== "undefined" && typeof (window as any).gtag === "function";
};

/**
 * Track a page view
 */
export function pageView(url: string, title?: string) {
  if (!isGALoaded()) return;

  (window as any).gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
    page_title: title,
  });
}

/**
 * Track custom events
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!isGALoaded()) return;

  (window as any).gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Predefined events for the barbershop app
export const analytics = {
  // Booking flow events
  bookingStarted: () => trackEvent("booking_started", "booking"),
  bookingDateSelected: (date: string) => trackEvent("date_selected", "booking", date),
  bookingTimeSelected: (time: string) => trackEvent("time_selected", "booking", time),
  bookingFormSubmitted: () => trackEvent("form_submitted", "booking"),
  bookingCompleted: () => trackEvent("booking_completed", "booking"),
  bookingFailed: (error: string) => trackEvent("booking_failed", "booking", error),

  // SMS verification
  smsRequested: () => trackEvent("sms_requested", "verification"),
  smsVerified: () => trackEvent("sms_verified", "verification"),
  smsFailed: () => trackEvent("sms_failed", "verification"),

  // User engagement
  phoneClicked: () => trackEvent("phone_clicked", "engagement"),
  mapClicked: () => trackEvent("map_clicked", "engagement"),
  returningCustomer: () => trackEvent("returning_customer", "user"),

  // PWA events
  pwaInstalled: () => trackEvent("pwa_installed", "pwa"),
  pushEnabled: () => trackEvent("push_enabled", "pwa"),
  offlineVisit: () => trackEvent("offline_visit", "pwa"),
};

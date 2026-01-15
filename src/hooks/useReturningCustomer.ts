import { useState, useEffect } from "react";

interface CustomerInfo {
  name: string;
  phone: string;
  lastBookingDate?: string;
}

const STORAGE_KEY = "mea-barber-customer";

/**
 * Hook to detect and manage returning customers
 * Saves customer info to localStorage after successful booking
 * Auto-fills form on next visit
 */
export function useReturningCustomer() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  // Load customer info from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CustomerInfo;
        setCustomerInfo(parsed);
        setIsReturning(true);
      }
    } catch (error) {
      console.error("Error loading customer info:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Save customer info after successful booking
   */
  const saveCustomer = (name: string, phone: string) => {
    const info: CustomerInfo = {
      name,
      phone,
      lastBookingDate: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
      setCustomerInfo(info);
      setIsReturning(true);
    } catch (error) {
      console.error("Error saving customer info:", error);
    }
  };

  /**
   * Clear customer info (for logout/privacy)
   */
  const clearCustomer = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomerInfo(null);
    setIsReturning(false);
  };

  /**
   * Get welcome message for returning customers
   */
  const getWelcomeMessage = (): string | null => {
    if (!isReturning || !customerInfo?.name) return null;
    
    const firstName = customerInfo.name.split(" ")[0];
    return `ברוך שובך, ${firstName}! 👋`;
  };

  return {
    customerInfo,
    isReturning,
    saveCustomer,
    clearCustomer,
    getWelcomeMessage,
  };
}

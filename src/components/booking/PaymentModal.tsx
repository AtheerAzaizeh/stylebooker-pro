import { useState, useEffect, useRef } from "react";
import { X, CreditCard, ArrowLeft, Loader2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { BARBERSHOP_CONFIG, PAYPAL_CONFIG } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onSkipPayment: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  onSkipPayment,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [cardFieldsReady, setCardFieldsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const cardFieldsRef = useRef<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const amount = BARBERSHOP_CONFIG.basePrice;

  // Load PayPal SDK with card fields support
  useEffect(() => {
    if (!isOpen) return;

    const loadPayPalSdk = () => {
      // Clean up any existing PayPal script
      const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Delete existing paypal object
      if (window.paypal) {
        delete window.paypal;
      }

      setSdkReady(false);
      setCardFieldsReady(false);
      setLoadError(false);
      buttonsRendered.current = false;

      const script = document.createElement("script");
      // Load PayPal SDK with card-fields component for direct card entry
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}&components=buttons,card-fields&intent=capture`;
      script.async = true;
      script.setAttribute("data-partner-attribution-id", "");

      script.onload = () => {
        console.log("PayPal SDK loaded successfully");
        setSdkReady(true);
        setLoadError(false);
      };

      script.onerror = () => {
        console.error("Failed to load PayPal SDK");
        setLoadError(true);
      };

      document.body.appendChild(script);
    };

    loadPayPalSdk();

    return () => {
      buttonsRendered.current = false;
      cardFieldsRef.current = null;
    };
  }, [isOpen, loadAttempts]);

  // Initialize PayPal Card Fields when SDK is ready
  useEffect(() => {
    if (!sdkReady || !window.paypal || !cardContainerRef.current || buttonsRendered.current) {
      return;
    }

    buttonsRendered.current = true;

    const initCardFields = async () => {
      try {
        // Check if card-fields is available
        if (!window.paypal.CardFields) {
          console.log("Card Fields not available, falling back to buttons");
          setLoadError(true);
          return;
        }

        const cardFields = window.paypal.CardFields({
          createOrder: async () => {
            setIsProcessing(true);
            try {
              const { data, error } = await supabase.functions.invoke("paypal-handler", {
                body: { action: "create", amount, currency: "ILS" },
              });

              if (error) {
                throw new Error(error.message || "Failed to create order");
              }
              
              if (!data?.success) {
                throw new Error(data?.error || "Failed to create order");
              }

              console.log("Order created:", data.orderId);
              return data.orderId;
            } catch (error) {
              console.error("Error creating order:", error);
              toast.error("שגיאה ביצירת ההזמנה");
              setIsProcessing(false);
              throw error;
            }
          },
          onApprove: async (paypalData: any) => {
            try {
              console.log("Payment approved, capturing...", paypalData);
              const { data, error } = await supabase.functions.invoke("paypal-handler", {
                body: { action: "capture", orderId: paypalData.orderID },
              });

              if (error) {
                throw new Error(error.message || "Payment capture failed");
              }
              
              if (data?.success) {
                toast.success("התשלום בוצע בהצלחה!");
                onPaymentSuccess(data.transactionId || paypalData.orderID);
              } else {
                throw new Error(data?.error || "Payment capture failed");
              }
            } catch (error) {
              console.error("Error capturing payment:", error);
              toast.error("שגיאה בביצוע התשלום");
            } finally {
              setIsProcessing(false);
            }
          },
          onError: (err: any) => {
            console.error("PayPal Card Fields error:", err);
            setIsProcessing(false);
            toast.error("שגיאה בתהליך התשלום");
          },
        });

        // Check eligibility for card fields
        if (cardFields.isEligible()) {
          // Clear container
          if (cardContainerRef.current) {
            cardContainerRef.current.innerHTML = "";
          }

          // Create container elements for card fields
          const numberContainer = document.createElement("div");
          numberContainer.id = "card-number-field";
          
          const expiryContainer = document.createElement("div");
          expiryContainer.id = "card-expiry-field";
          
          const cvvContainer = document.createElement("div");
          cvvContainer.id = "card-cvv-field";
          
          const nameContainer = document.createElement("div");
          nameContainer.id = "card-name-field";

          if (cardContainerRef.current) {
            cardContainerRef.current.appendChild(numberContainer);
            cardContainerRef.current.appendChild(expiryContainer);
            cardContainerRef.current.appendChild(cvvContainer);
            cardContainerRef.current.appendChild(nameContainer);
          }

          // Render card fields with styling
          const fieldStyle = {
            input: {
              "font-size": "16px",
              "font-family": "inherit",
              "color": "hsl(var(--foreground))",
              "padding": "12px",
            },
            "input::placeholder": {
              color: "hsl(var(--muted-foreground))",
            },
          };

          await cardFields.NumberField({
            style: fieldStyle,
            placeholder: "מספר כרטיס",
          }).render("#card-number-field");

          await cardFields.ExpiryField({
            style: fieldStyle,
            placeholder: "MM/YY",
          }).render("#card-expiry-field");

          await cardFields.CVVField({
            style: fieldStyle,
            placeholder: "CVV",
          }).render("#card-cvv-field");

          await cardFields.NameField({
            style: fieldStyle,
            placeholder: "שם בעל הכרטיס",
          }).render("#card-name-field");

          cardFieldsRef.current = cardFields;
          setCardFieldsReady(true);
          console.log("Card fields rendered successfully");
        } else {
          console.log("Card fields not eligible");
          setLoadError(true);
        }
      } catch (error) {
        console.error("Error initializing card fields:", error);
        setLoadError(true);
      }
    };

    initCardFields();
  }, [sdkReady, amount, onPaymentSuccess]);

  const handleSubmitPayment = async () => {
    if (!cardFieldsRef.current || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await cardFieldsRef.current.submit();
      console.log("Card payment submitted:", result);
    } catch (error: any) {
      console.error("Card payment error:", error);
      setIsProcessing(false);
      
      // Parse error message
      if (error.message?.includes("INVALID_NUMBER")) {
        toast.error("מספר כרטיס לא תקין");
      } else if (error.message?.includes("INVALID_CVV")) {
        toast.error("CVV לא תקין");
      } else if (error.message?.includes("INVALID_EXPIRY")) {
        toast.error("תאריך תפוגה לא תקין");
      } else {
        toast.error("שגיאה בתשלום, נסה שוב");
      }
    }
  };

  const handleRetryLoad = () => {
    setLoadAttempts((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            תשלום בכרטיס אשראי
          </h3>
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price Display */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">סכום לתשלום</p>
            <p className="text-4xl font-bold text-primary mt-1">₪{amount}</p>
          </div>

          {/* Card Fields Container */}
          <div className="min-h-[200px]">
            {loadError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-3" />
                <p className="text-muted-foreground mb-4">
                  לא ניתן לטעון את מערכת התשלום
                </p>
                <button
                  onClick={handleRetryLoad}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  נסה שוב
                </button>
              </div>
            ) : !sdkReady ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">טוען טופס תשלום...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Card fields will be rendered here */}
                <div 
                  ref={cardContainerRef} 
                  className="space-y-3 [&>div]:border [&>div]:border-border [&>div]:rounded-lg [&>div]:bg-background [&>div]:min-h-[48px]"
                />
                
                {/* Submit Button */}
                {cardFieldsReady && (
                  <button
                    onClick={handleSubmitPayment}
                    disabled={isProcessing}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        מעבד תשלום...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        שלם ₪{amount}
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Skip Payment Option */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={onSkipPayment}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>המשך ללא תשלום מקדים (₪{amount} במקום)</span>
            </button>
          </div>

          {/* Security Info */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>התשלום מאובטח ומוצפן. פרטי הכרטיס לא נשמרים באתר.</span>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
              <p className="font-medium">מעבד תשלום...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
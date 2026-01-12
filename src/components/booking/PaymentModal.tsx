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
  const [loadError, setLoadError] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const buttonsRendered = useRef(false);

  const amount = BARBERSHOP_CONFIG.basePrice;

  // Load PayPal SDK
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
      setLoadError(false);
      buttonsRendered.current = false;

      const script = document.createElement("script");
      // Load PayPal SDK with buttons - enable card funding for direct card payments in popup
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CONFIG.clientId}&currency=${PAYPAL_CONFIG.currency}&intent=capture`;
      script.async = true;

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
    };
  }, [isOpen, loadAttempts]);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalContainerRef.current || buttonsRendered.current) {
      return;
    }

    // Clear container
    paypalContainerRef.current.innerHTML = "";
    buttonsRendered.current = true;

    try {
      window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 48,
        },
        fundingSource: window.paypal.FUNDING.CARD, // Prioritize card payment
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
        onCancel: () => {
          setIsProcessing(false);
          toast.info("התשלום בוטל");
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          setIsProcessing(false);
          toast.error("שגיאה בתהליך התשלום");
        },
      }).render(paypalContainerRef.current);

      // Also render PayPal button as secondary option
      if (paypalContainerRef.current) {
        const paypalButtonContainer = document.createElement("div");
        paypalButtonContainer.style.marginTop = "12px";
        paypalContainerRef.current.appendChild(paypalButtonContainer);

        window.paypal.Buttons({
          style: {
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "paypal",
            height: 48,
          },
          fundingSource: window.paypal.FUNDING.PAYPAL,
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
          onCancel: () => {
            setIsProcessing(false);
            toast.info("התשלום בוטל");
          },
          onError: (err: any) => {
            console.error("PayPal error:", err);
            setIsProcessing(false);
            toast.error("שגיאה בתהליך התשלום");
          },
        }).render(paypalButtonContainer);
      }
    } catch (error) {
      console.error("Error rendering PayPal buttons:", error);
      setLoadError(true);
    }
  }, [sdkReady, amount, onPaymentSuccess]);

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
            תשלום מאובטח
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

          {/* PayPal Buttons Container */}
          <div className="min-h-[150px]">
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
                <p className="text-muted-foreground">טוען אפשרויות תשלום...</p>
              </div>
            ) : (
              <div ref={paypalContainerRef} />
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
            <span>התשלום מאובטח ומוצפן באמצעות PayPal</span>
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
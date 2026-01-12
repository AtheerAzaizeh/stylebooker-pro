import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Lock, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import {
  PayPalScriptProvider,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
} from "@paypal/react-paypal-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BARBERSHOP_CONFIG } from "@/lib/constants";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  onSkipPayment?: () => void; // Made optional to fit both use cases
}

// Styling for the internal iframe inputs from PayPal
const styleObject = {
  input: {
    "font-size": "16px",
    "font-family": "sans-serif",
    color: "#333",
    padding: "0 10px",
    direction: "ltr",
  },
  ".invalid": { color: "#ef4444" },
};

// Internal component to access the cardFields context
const SubmitPayment = ({
  isProcessing,
  setIsProcessing,
}: {
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}) => {
  // Cast to 'any' to avoid type issues with library version mismatches
  const { cardFields } = usePayPalCardFields() as any;

  const handleClick = async () => {
    if (!cardFields) return;
    setIsProcessing(true);

    try {
      // Submitting triggers the createOrder -> onApprove flow defined in the Provider
      await cardFields.submit({ payerName: "Customer" });
    } catch (err) {
      console.error("Submit Error:", err);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className="btn-gold w-full mt-6 h-12 text-lg flex items-center justify-center gap-2 relative overflow-hidden"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>מעבד תשלום...</span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" />
          <span>שלם בבטחה</span>
        </>
      )}
    </button>
  );
};

export function PaymentModal({ isOpen, onClose, onPaymentSuccess, onSkipPayment }: PaymentModalProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const amount = BARBERSHOP_CONFIG.basePrice.toString(); // e.g. "50"

  // Load Client Token when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadError(false);
      const fetchToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("paypal-handler", {
            body: { action: "generate_client_token" },
          });

          if (error || !data?.client_token) {
            console.error("Token Error:", error || "No token returned");
            throw new Error("Failed to load payment system");
          }

          setClientToken(data.client_token);
        } catch (err) {
          console.error(err);
          setLoadError(true);
        }
      };
      fetchToken();
    }
  }, [isOpen]);

  // Handlers for PayPal Provider
  const createOrder = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("paypal-handler", {
        body: { action: "create_order", amount },
      });

      if (error || !data.id) {
        throw new Error("Order creation failed: " + (error?.message || "Unknown error"));
      }
      return data.id;
    } catch (err: any) {
      console.error(err);
      toast.error("שגיאה ביצירת ההזמנה");
      setIsProcessing(false);
      throw err;
    }
  };

  const onApprove = async (data: any) => {
    try {
      const { orderID } = data;
      const { data: captureData, error } = await supabase.functions.invoke("paypal-handler", {
        body: { action: "capture_order", orderID },
      });

      if (error || captureData.status !== "COMPLETED") {
        throw new Error("Capture failed");
      }

      toast.success("תשלום בוצע בהצלחה!");
      onPaymentSuccess(captureData.id);
    } catch (err: any) {
      console.error(err);
      toast.error("שגיאה בביצוע החיוב הסופי");
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error("PayPal Error:", err);
    toast.error("אירעה שגיאה בתהליך התשלום");
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={isProcessing ? undefined : onClose}
      />

      <div className="relative z-10 bg-card rounded-xl shadow-xl w-[95%] max-w-md p-6 border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-xl font-bold">תשלום מאובטח</h3>
          <div className="w-5" /> {/* Spacer */}
        </div>

        <p className="text-center text-muted-foreground mb-6 text-lg">
          סכום לתשלום: <span className="text-foreground font-bold">₪{amount}</span>
        </p>

        {/* Loading / Error State */}
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-3" />
            <p className="text-muted-foreground mb-4">לא ניתן לטעון את מערכת התשלום</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              רענן עמוד
            </button>
          </div>
        ) : !clientToken ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">טוען חיבור מאובטח...</p>
          </div>
        ) : (
          <PayPalScriptProvider
            options={{
              clientId: "AY8kXNbjjksL3UEKHwXOQopaI-kJFsaFyV65QCHBBUgtQ9e6FUk-w8p9gk0t7cZXNsCXzcYC89KIHuO4", // LIVE ID
              components: "card-fields",
              dataClientToken: clientToken,
              currency: "ILS",
              intent: "capture",
            }}
          >
            <PayPalCardFieldsProvider
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
              style={styleObject}
            >
              <div className="space-y-4" dir="rtl">
                <div className="space-y-1">
                  <label className="text-sm font-medium">שם בעל הכרטיס</label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-white">
                    <PayPalNameField className="w-full h-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">מספר כרטיס</label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-white">
                    <PayPalNumberField className="w-full h-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">תוקף</label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-white">
                      <PayPalExpiryField className="w-full h-full" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">CVV</label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-white">
                      <PayPalCVVField className="w-full h-full" />
                    </div>
                  </div>
                </div>

                <SubmitPayment isProcessing={isProcessing} setIsProcessing={setIsProcessing} />

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                  <Lock className="w-3 h-3" />
                  <span>מאובטח ע״י PayPal</span>
                </div>
              </div>
            </PayPalCardFieldsProvider>
          </PayPalScriptProvider>
        )}

        {/* Skip Payment Option (if provided) */}
        {onSkipPayment && !isProcessing && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              onClick={onSkipPayment}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>שלם במזומן במקום</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

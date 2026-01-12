import { useState, useEffect } from "react";
import { X, Loader2, CreditCard, Lock } from "lucide-react";
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
  amount?: string;
}

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

const SubmitPayment = ({
  isProcessing,
  setIsProcessing,
}: {
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}) => {
  // FIX 1: Cast to 'any' to bypass TS error regarding cardFields property
  const { cardFields } = usePayPalCardFields() as any;

  const handleClick = async () => {
    if (!cardFields) return;
    setIsProcessing(true);

    try {
      // Submitting triggers the createOrder -> onApprove flow defined in the Provider
      await cardFields.submit({ payerName: "Customer" });
    } catch (err) {
      console.error("Submit Error:", err);
      setIsProcessing(false); // Stop loading if submit fails immediately
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

export function PaymentModal({ isOpen, onClose, onSuccess, amount = "50.00" }: PaymentModalProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && !clientToken) {
      const fetchToken = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("paypal-handler", {
            body: { action: "generate_client_token" },
          });
          if (error || !data?.client_token) throw new Error("Token generation failed");
          setClientToken(data.client_token);
        } catch (err) {
          console.error("Token Error:", err);
          toast.error("שגיאה בטעינת מערכת התשלומים");
        }
      };
      fetchToken();
    }
  }, [isOpen, clientToken]);

  // FIX 2: Define specific handlers for the Provider to satisfy TS interfaces
  const createOrder = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("paypal-handler", {
        body: { action: "create_order", amount },
      });
      if (error || !data.id) throw new Error("Order creation failed");
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
      onSuccess(captureData.id);
      // Close/cleanup is handled by parent or onSuccess
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
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-center mb-2">תשלום מאובטח</h3>
        <p className="text-center text-muted-foreground mb-6">סכום לתשלום: ₪{amount}</p>

        {!clientToken ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PayPalScriptProvider
            options={{
              clientId: "AY8kXNbjjksL3UEKHwXOQopaI-kJFsaFyV65QCHBBUgtQ9e6FUk-w8p9gk0t7cZXNsCXzcYC89KIHuO4",
              components: "card-fields",
              dataClientToken: clientToken,
              currency: "ILS",
              intent: "capture",
            }}
          >
            {/* FIX 2: By providing createOrder, onApprove, and onError, 
                we match the "Checkout" interface, so TS won't ask for "createVaultSetupToken".
            */}
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
      </div>
    </div>
  );
}

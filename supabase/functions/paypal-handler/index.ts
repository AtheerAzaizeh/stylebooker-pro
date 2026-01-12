import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateOrderRequest {
  amount: number;
  currency?: string;
}

interface CaptureOrderRequest {
  orderId: string;
}

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  // Production PayPal API
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal auth error:", errorText);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

// Create PayPal order
async function createOrder(amount: number, currency: string = "ILS"): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  
  const orderData = {
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount.toFixed(2),
      },
      description: "תשלום עבור תספורת",
    }],
  };

  console.log("Creating PayPal order:", JSON.stringify(orderData));

  // Production PayPal API
  const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal create order error:", errorText);
    throw new Error("Failed to create PayPal order");
  }

  const data = await response.json();
  console.log("PayPal order created:", data.id);
  return data;
}

// Capture PayPal order
async function captureOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();

  console.log("Capturing PayPal order:", orderId);

  // Production PayPal API
  const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("PayPal capture error:", errorText);
    throw new Error("Failed to capture PayPal payment");
  }

  const data = await response.json();
  console.log("PayPal order captured:", data.id, "Status:", data.status);
  return data;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action;

    console.log("PayPal handler action:", action);

    if (action === "create") {
      const { amount, currency } = body as CreateOrderRequest;
      
      if (!amount || amount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid amount" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const order = await createOrder(amount, currency || "ILS");
      
      return new Response(
        JSON.stringify({ success: true, orderId: order.id }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "capture") {
      const { orderId } = body as CaptureOrderRequest;
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: "Missing order ID" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const capture = await captureOrder(orderId);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: capture.status,
          transactionId: capture.purchase_units?.[0]?.payments?.captures?.[0]?.id 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("PayPal handler error:", error);
    return new Response(
      JSON.stringify({ error: "אירעה שגיאה בעיבוד התשלום. אנא נסה שוב." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
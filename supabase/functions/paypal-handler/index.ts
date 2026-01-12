import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET")!;
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox";

const PAYPAL_API = PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getAccessToken() {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!data.access_token) throw new Error("Failed to get PayPal access token");
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderID, amount } = await req.json();
    const accessToken = await getAccessToken();

    // 1. Generate Client Token (Required for Inline Card Fields)
    if (action === "generate_client_token") {
      const response = await fetch(`${PAYPAL_API}/v1/identity/generate-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2. Create Order
    if (action === "create_order") {
      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "ILS",
                value: amount || "50.00", // Default amount or passed from frontend
              },
            },
          ],
        }),
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3. Capture Order
    if (action === "capture_order") {
      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Invalid action: ${action}`);
  } catch (error: any) {
    console.error("PayPal Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

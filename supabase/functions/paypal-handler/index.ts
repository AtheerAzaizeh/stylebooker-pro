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
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error("Missing PayPal Credentials in Supabase Secrets");
  }

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
  if (!data.access_token) {
    console.error("PayPal Token Error:", data);
    throw new Error("Failed to get PayPal access token");
  }
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Parse Body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      throw new Error("Invalid JSON body");
    }

    const { action, orderID, amount } = body;

    console.log(`Received Request: ${action}`, body); // Log for debugging

    if (!action) {
      throw new Error("Missing 'action' field in request body");
    }

    const accessToken = await getAccessToken();

    // 2. Handle Actions

    // --- Generate Client Token ---
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

    // --- Create Order ---
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
                value: amount || "50.00",
              },
            },
          ],
        }),
      });

      const data = await response.json();
      console.log("Order Created:", data);

      if (data.error || data.name === "INVALID_REQUEST") {
        throw new Error("PayPal Create Order Failed: " + JSON.stringify(data));
      }

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // --- Capture Order ---
    if (action === "capture_order") {
      if (!orderID) throw new Error("Missing orderID for capture");

      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Order Captured:", data);

      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default Case
    throw new Error(`Unknown action received: "${action}"`);
  } catch (error: any) {
    console.error("Handler Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, // Return 400 to match user observation
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

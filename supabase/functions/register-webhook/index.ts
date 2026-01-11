import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smsGatewayLogin = Deno.env.get("SMS_GATEWAY_LOGIN");
    const smsGatewayPassword = Deno.env.get("SMS_GATEWAY_PASSWORD");

    if (!smsGatewayLogin || !smsGatewayPassword) {
      throw new Error("Missing SMS Gateway credentials");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const webhookUrl = `${supabaseUrl}/functions/v1/sms-webhook`;

    console.log(`Registering webhook: ${webhookUrl}`);

    const authHeader = "Basic " + btoa(`${smsGatewayLogin}:${smsGatewayPassword}`);

    // Register webhook with SMS Gateway API
    // Docs: https://docs.sms-gate.app/features/webhooks/
    const response = await fetch("https://api.sms-gate.app/3rdparty/v1/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        url: webhookUrl,
        event: "sms:received",
      }),
    });

    const responseText = await response.text();
    console.log(`SMS Gateway response (${response.status}):`, responseText);

    if (!response.ok) {
      throw new Error(`Failed to register webhook: ${responseText}`);
    }

    const result = JSON.parse(responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook registered successfully",
        webhookId: result.id,
        webhookUrl: webhookUrl
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error registering webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

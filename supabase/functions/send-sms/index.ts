import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  phone: string;
  type: "verification" | "booking_confirmation" | "booking_cancelled" | "booking_updated";
  data?: {
    code?: string;
    date?: string;
    time?: string;
    name?: string;
  };
}

// Test account for Google Play Store review
const TEST_PHONE = "0501234567";
const TEST_CODE = "123456";

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = HEBREW_DAYS[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `יום ${dayName} ${day}/${month}`;
}

// SMS types that require admin authentication when called from client
const ADMIN_ONLY_SMS_TYPES = ["booking_cancelled", "booking_updated"];

// Check if the request is from an internal service (edge function to edge function)
function isInternalServiceCall(req: Request): boolean {
  // Internal calls from other edge functions use service role key via supabase.functions.invoke
  // These don't have a Bearer token but are authenticated via the service role
  const authHeader = req.headers.get("Authorization");
  
  // If there's no auth header but the call came from supabase functions invoke,
  // it's an internal call (Supabase automatically handles this)
  if (!authHeader) {
    return false;
  }
  
  // Check if it's a service role call (internal)
  // Service role calls will have the anon key or service key
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  
  // The auth header for internal invoke calls uses the anon key
  if (authHeader === `Bearer ${anonKey}` || authHeader === `Bearer ${supabaseKey}`) {
    return true;
  }
  
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // capcom6 SMS Gateway Cloud API credentials
    const smsGatewayLogin = Deno.env.get("SMS_GATEWAY_LOGIN");
    const smsGatewayPassword = Deno.env.get("SMS_GATEWAY_PASSWORD");

    if (!smsGatewayLogin || !smsGatewayPassword) {
      console.error("Missing SMS Gateway credentials");
      throw new Error("SMS Gateway not configured");
    }

    const { phone, type, data }: SendSmsRequest = await req.json();

    // Access control for client-side calls
    // Verification SMS can be sent by anyone (that's the point of phone verification)
    // Booking confirmations can be sent internally by edge functions
    // Update/Cancel SMS require admin authentication when called from client
    
    const isInternal = isInternalServiceCall(req);
    
    if (!isInternal && ADMIN_ONLY_SMS_TYPES.includes(type)) {
      // This is a client-side call for admin-only SMS types - verify admin
      const authHeader = req.headers.get("Authorization");
      
      if (!authHeader) {
        console.error("Unauthorized attempt to send admin SMS without auth");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.error("Invalid auth token for admin SMS");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!isAdmin) {
        console.error("Non-admin user attempted to send admin SMS:", user.id);
        return new Response(
          JSON.stringify({ error: "Forbidden - Admin only" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Admin SMS access verified for user:", user.id);
    }

    // Validate Israeli phone number format
    if (!phone || !/^05\d{8}$/.test(phone)) {
      throw new Error("Invalid phone number format");
    }

    // Format phone for international (Israel +972)
    const formattedPhone = `+972${phone.slice(1)}`;

    // Generate message based on type
    let message = "";
    switch (type) {
      case "verification":
        // Use fixed code for test account (Google Play Store review)
        const isTestAccount = phone === TEST_PHONE;
        const code = isTestAccount ? TEST_CODE : (data?.code || Math.floor(100000 + Math.random() * 900000).toString());
        message = `קוד האימות שלך הוא: ${code}\nBARBERSHOP by Mohammad Eyad`;
        
        // Delete old codes for this phone
        await supabase
          .from("verification_codes")
          .delete()
          .eq("phone", phone);
        
        // Insert new code with extended expiry for test account (30 days), or 5-minute expiry for normal users
        const expiryTime = isTestAccount ? 30 * 24 * 60 * 60 * 1000 : 5 * 60 * 1000;
        const expiresAt = new Date(Date.now() + expiryTime).toISOString();
        await supabase.from("verification_codes").insert({
          phone,
          code,
          expires_at: expiresAt,
          verified: false,
        });
        
        // Skip SMS for test account
        if (isTestAccount) {
          console.log("Test account detected - skipping actual SMS");
          return new Response(
            JSON.stringify({ 
              success: true, 
              type,
              testAccount: true
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        break;
        
      case "booking_confirmation":
        const formattedDateConfirm = data?.date ? formatDateHebrew(data.date) : data?.date;
        message = `התור שלך אושר!\nתאריך: ${formattedDateConfirm}\nשעה: ${data?.time}\n\nלביטול התור שלח 0 (לפחות 3 שעות לפני התור)\nBARBERSHOP by Mohammad Eyad`;
        break;
        
      case "booking_cancelled":
        const formattedDateCancel = data?.date ? formatDateHebrew(data.date) : data?.date;
        message = `התור שלך בתאריך ${formattedDateCancel} בשעה ${data?.time} בוטל.\nBARBERSHOP by Mohammad Eyad`;
        break;
        
      case "booking_updated":
        const formattedDateUpdate = data?.date ? formatDateHebrew(data.date) : data?.date;
        message = `התור שלך עודכן!\nתאריך: ${formattedDateUpdate}\nשעה: ${data?.time}\nBARBERSHOP by Mohammad Eyad`;
        break;
        
      default:
        throw new Error("Invalid message type");
    }

    console.log(`Sending SMS via capcom6 Gateway to ${formattedPhone}: ${type}`);

    // Send SMS via capcom6 SMS Gateway Cloud API
    // API docs: https://docs.sms-gate.app/integration/api/
    const gatewayUrl = "https://api.sms-gate.app/3rdparty/v1/message";
    
    // Basic Auth header
    const authHeader = "Basic " + btoa(`${smsGatewayLogin}:${smsGatewayPassword}`);

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        textMessage: { text: message },
        phoneNumbers: [formattedPhone],
      }),
    });

    const responseText = await response.text();
    console.log(`capcom6 Gateway response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error("capcom6 Gateway error:", responseText);
      throw new Error("Failed to send SMS via gateway");
    }

    console.log("SMS sent successfully via capcom6 Gateway");

    return new Response(
      JSON.stringify({ 
        success: true, 
        type,
        gateway: "capcom6"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sms function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

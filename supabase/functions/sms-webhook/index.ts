import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatDateHebrew(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = HEBREW_DAYS[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `יום ${dayName} ${day}/${month}`;
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

    // Parse incoming SMS data from capcom6 SMS Gateway
    // Webhook format: https://docs.sms-gate.app/integration/webhooks/
    let from = "";
    let body = "";

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const jsonData = await req.json();
      console.log("Received webhook payload:", JSON.stringify(jsonData));
      
      // capcom6 webhook format for sms:received event
      // { "event": "sms:received", "payload": { "message": "...", "phoneNumber": "..." } }
      if (jsonData.event === "sms:received" && jsonData.payload) {
        from = jsonData.payload.phoneNumber || "";
        body = (jsonData.payload.message || "").trim();
      } else {
        // Fallback for other formats
        from = jsonData.from || jsonData.phone || jsonData.phoneNumber || "";
        body = (jsonData.body || jsonData.message || "").trim();
      }
    } else {
      // Form-urlencoded fallback
      const formData = await req.formData();
      from = formData.get("from") as string || formData.get("phone") as string || "";
      body = ((formData.get("body") || formData.get("message")) as string)?.trim() || "";
    }

    console.log(`Received SMS from ${from}: ${body}`);

    if (!from || !body) {
      console.error("Missing From or Body in webhook");
      return new Response(
        JSON.stringify({ success: false, error: "Missing from or body" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if the message is "0" for cancellation
    if (body !== "0") {
      console.log("Message is not a cancellation request");
      return new Response(
        JSON.stringify({ success: true, message: "Not a cancellation request" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Convert international format back to local (e.g., +972541234567 -> 0541234567)
    let localPhone = from;
    if (from.startsWith("+972")) {
      localPhone = "0" + from.slice(4);
    } else if (from.startsWith("972")) {
      localPhone = "0" + from.slice(3);
    }

    console.log(`Looking for bookings for phone: ${localPhone}`);

    // Find the user's upcoming booking
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_phone", localPhone)
      .gte("booking_date", todayStr)
      .neq("status", "cancelled")
      .order("booking_date", { ascending: true })
      .order("booking_time", { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!bookings || bookings.length === 0) {
      console.log("No upcoming booking found for this phone");
      // Send SMS that no booking was found
      await sendSms(localPhone, "לא נמצא תור פעיל לביטול.\nBARBERSHOP by Mohammad Eyad");
      return new Response(
        JSON.stringify({ success: true, message: "No booking found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const booking = bookings[0];
    console.log(`Found booking: ${booking.id} on ${booking.booking_date} at ${booking.booking_time}`);

    // Check if cancellation is at least 3 hours before the appointment
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}:00`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 3) {
      console.log(`Cancellation too late: only ${hoursUntilBooking.toFixed(1)} hours until booking`);
      await sendSms(
        localPhone,
        `לא ניתן לבטל תור פחות מ-3 שעות לפני המועד.\nהתור שלך ב-${formatDateHebrew(booking.booking_date)} בשעה ${booking.booking_time} נשאר בתוקף.\nBARBERSHOP by Mohammad Eyad`
      );
      return new Response(
        JSON.stringify({ success: false, message: "Cancellation too late" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", booking.id);

    if (deleteError) {
      console.error("Error deleting booking:", deleteError);
      await sendSms(localPhone, "אירעה שגיאה בביטול התור. נסה שוב מאוחר יותר.\nBARBERSHOP by Mohammad Eyad");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to delete booking" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Booking ${booking.id} cancelled successfully via SMS`);

    // Send confirmation SMS
    await sendSms(
      localPhone,
      `התור שלך ב-${formatDateHebrew(booking.booking_date)} בשעה ${booking.booking_time} בוטל בהצלחה.\nBARBERSHOP by Mohammad Eyad`
    );

    return new Response(
      JSON.stringify({ success: true, message: "Booking cancelled" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in sms-webhook function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Helper function to send SMS via capcom6 Gateway
async function sendSms(phone: string, message: string): Promise<void> {
  const smsGatewayLogin = Deno.env.get("SMS_GATEWAY_LOGIN");
  const smsGatewayPassword = Deno.env.get("SMS_GATEWAY_PASSWORD");

  if (!smsGatewayLogin || !smsGatewayPassword) {
    console.error("Missing SMS Gateway credentials for reply");
    return;
  }

  // Format phone for international (Israel +972)
  const formattedPhone = phone.startsWith("+972") 
    ? phone 
    : `+972${phone.slice(1)}`;

  console.log(`Sending SMS via capcom6 Gateway to ${formattedPhone}`);

  const gatewayUrl = "https://api.sms-gate.app/3rdparty/v1/message";
  const authHeader = "Basic " + btoa(`${smsGatewayLogin}:${smsGatewayPassword}`);

  try {
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
    } else {
      console.log("SMS sent successfully via capcom6 Gateway");
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

serve(handler);

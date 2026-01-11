import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminCreateBookingRequest {
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
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

    // Verify admin token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - Admin only" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { customer_name, customer_phone, booking_date, booking_time }: AdminCreateBookingRequest = await req.json();

    console.log(`Admin creating booking: ${booking_date} ${booking_time} for ${customer_name}`);

    // Validate inputs
    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      throw new Error("Missing required fields");
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert([{
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        booking_date,
        booking_time,
        status: "confirmed"
      }])
      .select()
      .single();

    if (bookingError) {
      console.error("Booking error:", bookingError);
      throw new Error("Failed to create booking");
    }

    console.log("Admin booking created:", booking.id);

    // Send confirmation SMS (via central send-sms function so copy stays consistent)
    try {
      const localPhone = customer_phone.trim().startsWith("+972")
        ? `0${customer_phone.trim().slice(4)}`
        : customer_phone.trim();

      await supabase.functions.invoke("send-sms", {
        body: {
          phone: localPhone,
          type: "booking_confirmation",
          data: {
            date: booking_date,
            time: booking_time,
            name: customer_name,
          },
        },
      });

      console.log("Confirmation SMS sent (send-sms)");
    } catch (smsError) {
      console.error("Failed to send confirmation SMS:", smsError);
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-create-booking function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Server-side input validation
const VALIDATION_RULES = {
  customer_name: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[\p{L}\s\-']+$/u, // Letters, spaces, hyphens, apostrophes
  },
  customer_phone: {
    pattern: /^05\d{8}$/, // Israeli mobile format
  },
  booking_date: {
    pattern: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  },
  booking_time: {
    pattern: /^([01]\d|2[0-3]):[0-5]\d$/, // HH:MM 24-hour format
  },
};

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateInput(data: Record<string, string>): ValidationResult {
  const { customer_name, customer_phone, booking_date, booking_time } = data;

  // Validate customer name
  const nameTrimmed = customer_name?.trim();
  if (!nameTrimmed) {
    return { valid: false, error: "שם הלקוח נדרש" };
  }
  if (nameTrimmed.length < VALIDATION_RULES.customer_name.minLength) {
    return { valid: false, error: "שם הלקוח קצר מדי (מינימום 2 תווים)" };
  }
  if (nameTrimmed.length > VALIDATION_RULES.customer_name.maxLength) {
    return { valid: false, error: "שם הלקוח ארוך מדי (מקסימום 100 תווים)" };
  }
  if (!VALIDATION_RULES.customer_name.pattern.test(nameTrimmed)) {
    return { valid: false, error: "שם הלקוח מכיל תווים לא חוקיים" };
  }

  // Validate customer phone
  const phoneTrimmed = customer_phone?.trim();
  if (!phoneTrimmed) {
    return { valid: false, error: "מספר טלפון נדרש" };
  }
  if (!VALIDATION_RULES.customer_phone.pattern.test(phoneTrimmed)) {
    return { valid: false, error: "מספר טלפון לא תקין (פורמט: 05XXXXXXXX)" };
  }

  // Validate booking date
  if (!booking_date) {
    return { valid: false, error: "תאריך נדרש" };
  }
  if (!VALIDATION_RULES.booking_date.pattern.test(booking_date)) {
    return { valid: false, error: "תאריך לא תקין (פורמט: YYYY-MM-DD)" };
  }
  // Additional date validation
  const dateObj = new Date(booking_date + "T00:00:00");
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: "תאריך לא תקין" };
  }

  // Validate booking time
  if (!booking_time) {
    return { valid: false, error: "שעה נדרשת" };
  }
  if (!VALIDATION_RULES.booking_time.pattern.test(booking_time)) {
    return { valid: false, error: "שעה לא תקינה (פורמט: HH:MM)" };
  }

  return { valid: true };
}

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

    // Server-side input validation
    const validation = validateInput({ customer_name, customer_phone, booking_date, booking_time });
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create the booking with validated and sanitized inputs
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
      JSON.stringify({ success: false, error: "אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב מאוחר יותר." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

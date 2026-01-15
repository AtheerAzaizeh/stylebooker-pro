/**
 * send-reminders Edge Function
 * 
 * Scheduled function to send SMS reminders 24 hours before appointments.
 * Should be triggered via pg_cron (hourly) or external scheduler.
 * 
 * Setup pg_cron in Supabase SQL Editor:
 * SELECT cron.schedule('hourly-reminders', '0 * * * *', 
 *   $$SELECT net.http_post(
 *     url:='https://your-project.supabase.co/functions/v1/send-reminders',
 *     headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *   )$$
 * );
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate tomorrow's date range (24 hours from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`Checking for bookings on ${tomorrowStr}`);

    // Find bookings for tomorrow that haven't received reminders
    const { data: bookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", tomorrowStr)
      .eq("status", "confirmed")
      .eq("reminder_sent", false);

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      throw fetchError;
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings need reminders");
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${bookings.length} bookings to remind`);

    let sentCount = 0;
    let failedCount = 0;

    for (const booking of bookings) {
      try {
        // Send reminder SMS
        const { error: smsError } = await supabase.functions.invoke("send-sms", {
          body: {
            phone: booking.customer_phone,
            type: "booking_reminder",
            data: {
              name: booking.customer_name,
              date: booking.booking_date,
              time: booking.booking_time,
            },
          },
        });

        if (smsError) {
          console.error(`SMS failed for booking ${booking.id}:`, smsError);
          failedCount++;
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ reminder_sent: true })
          .eq("id", booking.id);

        if (updateError) {
          console.error(`Failed to mark reminder sent for ${booking.id}:`, updateError);
        }

        sentCount++;
        console.log(`Reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        failedCount++;
      }
    }

    console.log(`Reminders complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        total: bookings.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reminders:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

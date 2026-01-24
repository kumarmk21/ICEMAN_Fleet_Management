import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { origin, destination } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: "Origin and destination are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: "Google Maps API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      const distanceInMeters = element.distance.value;
      const distanceInKm = Math.round(distanceInMeters / 1000);

      // Calculate transit time for reefer trucks (commercial heavy vehicles)
      // Assumptions:
      // - Average truck speed: 50-60 kmph (including traffic, tolls, stops)
      // - Driving hours per day: 10 hours (accounting for driver rest, meals, checkpoints)
      // - Additional buffer: 10% for unforeseen delays

      const avgTruckSpeed = 55; // kmph
      const drivingHoursPerDay = 10;
      const bufferMultiplier = 1.1;

      const estimatedHours = (distanceInKm / avgTruckSpeed) * bufferMultiplier;
      const transitDays = Math.ceil(estimatedHours / drivingHoursPerDay);

      return new Response(
        JSON.stringify({
          distance_km: distanceInKm,
          transit_days: transitDays,
          estimated_hours: Math.round(estimatedHours * 10) / 10
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Unable to calculate distance", details: data }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("EXCHANGE_RATE_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Exchange rate API key not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch rates from exchangerate.host (free API with key)
    const baseResponse = await fetch(
      `https://api.exchangerate.host/live?access_key=${apiKey}&source=USD&currencies=HTG,EUR,CAD,BRL`
    );
    const data = await baseResponse.json();

    if (!data || !data.quotes) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch exchange rates" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const quotes: Record<string, number> = data.quotes;
    const rates: Array<{ base: string; quote: string; rate: number }> = [];

    // USD-based rates
    const usdHtg = quotes["USDHTG"] ?? 135;
    const usdEur = quotes["USDEUR"] ?? 0.92;
    const usdCad = quotes["USDCAD"] ?? 1.39;
    const usdBrl = quotes["USDBRL"] ?? 5.0;

    rates.push({ base: "USD", quote: "HTG", rate: usdHtg });
    rates.push({ base: "HTG", quote: "USD", rate: 1 / usdHtg });
    rates.push({ base: "USD", quote: "EUR", rate: usdEur });
    rates.push({ base: "EUR", quote: "USD", rate: 1 / usdEur });
    rates.push({ base: "USD", quote: "CAD", rate: usdCad });
    rates.push({ base: "CAD", quote: "USD", rate: 1 / usdCad });
    rates.push({ base: "USD", quote: "BRL", rate: usdBrl });
    rates.push({ base: "BRL", quote: "USD", rate: 1 / usdBrl });

    // Cross rates
    rates.push({ base: "EUR", quote: "HTG", rate: usdHtg / usdEur });
    rates.push({ base: "HTG", quote: "EUR", rate: usdEur / usdHtg });
    rates.push({ base: "CAD", quote: "HTG", rate: usdHtg / usdCad });
    rates.push({ base: "HTG", quote: "CAD", rate: usdCad / usdHtg });
    rates.push({ base: "BRL", quote: "HTG", rate: usdHtg / usdBrl });
    rates.push({ base: "HTG", quote: "BRL", rate: usdBrl / usdHtg });
    rates.push({ base: "EUR", quote: "CAD", rate: usdCad / usdEur });
    rates.push({ base: "CAD", quote: "EUR", rate: usdEur / usdCad });
    rates.push({ base: "EUR", quote: "BRL", rate: usdBrl / usdEur });
    rates.push({ base: "BRL", quote: "EUR", rate: usdEur / usdBrl });
    rates.push({ base: "CAD", quote: "BRL", rate: usdBrl / usdCad });
    rates.push({ base: "BRL", quote: "CAD", rate: usdCad / usdBrl });

    // Upsert rates to database
    for (const r of rates) {
      await fetch(`${supabaseUrl}/rest/v1/exchange_rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
          "Prefer": "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          base_currency: r.base,
          quote_currency: r.quote,
          rate: r.rate,
          fetched_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, updated: rates.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type InputTransaction = {
  type?: string;
  amount?: number;
  currency?: string;
  recipient_name?: string | null;
  note?: string | null;
};

type CategoryTotal = {
  category: string;
  total: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  suggestion: string;
};

function classify(transaction: InputTransaction): string {
  const text = `${transaction.recipient_name ?? ""} ${transaction.note ?? ""}`.toLowerCase();
  if (/edh|electric|eau|veolia|camep|gaz|sodigaz|loyer|rent|facture/.test(text)) return "Logement et factures";
  if (/digicel|natcom|phone|internet|access|wimis|canal|nutv/.test(text)) return "Télécom et abonnements";
  if (/school|école|scol|frais/.test(text)) return "Éducation";
  if (/santé|clinique|hôpital|pharmacie|medical/.test(text)) return "Santé";
  if (/food|restaurant|marché|market|course/.test(text)) return "Alimentation";
  return transaction.type === "bill_payment" ? "Factures" : "Autres dépenses";
}

function buildInsights(transactions: InputTransaction[]) {
  const outgoing = transactions.filter((item) =>
    item.type === "send" || item.type === "withdraw" || item.type === "bill_payment",
  );
  const totals = new Map<string, number>();
  for (const transaction of outgoing) {
    const amount = typeof transaction.amount === "number" && Number.isFinite(transaction.amount)
      ? Math.abs(transaction.amount)
      : 0;
    const category = classify(transaction);
    totals.set(category, (totals.get(category) ?? 0) + amount);
  }
  const totalSpent = [...totals.values()].reduce((sum, value) => sum + value, 0);
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const insights: CategoryTotal[] = sorted.map(([category, total]) => ({
    category,
    total: Number(total.toFixed(2)),
    percentage: totalSpent ? Number(((total / totalSpent) * 100).toFixed(1)) : 0,
    trend: "stable",
    suggestion: category === "Logement et factures"
      ? "Regroupez vos échéances et activez des rappels pour éviter les retards."
      : category === "Alimentation"
        ? "Comparez les dépenses de la semaine pour repérer les achats répétitifs."
        : "Suivez cette catégorie chaque semaine pour garder une vue claire de votre budget.",
  }));
  const topCategory = insights[0]?.category ?? "—";
  const recommendations = totalSpent === 0
    ? ["Ajoutez quelques transactions pour recevoir une analyse personnalisée."]
    : [
        `Votre catégorie principale est ${topCategory}. Vérifiez les paiements récurrents associés.`,
        "Fixez une limite mensuelle pour votre catégorie de dépenses la plus importante.",
      ];
  return {
    summary: totalSpent
      ? `Vous avez dépensé ${totalSpent.toFixed(2)} au total sur les transactions analysées.`
      : "Aucune dépense sortante n'a encore été détectée.",
    totalSpent: Number(totalSpent.toFixed(2)),
    topCategory,
    insights,
    recommendations,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json() as { transactions?: InputTransaction[] };
    if (!Array.isArray(body.transactions)) {
      return new Response(JSON.stringify({ error: "Transactions invalides" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const transactions = body.transactions.slice(0, 500);
    return new Response(JSON.stringify(buildInsights(transactions)), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Analyse indisponible" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

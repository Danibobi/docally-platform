// Quiz recommend — non-streaming structured output via tool calling
// deno-lint-ignore-file no-explicit-any
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers } = await req.json();
    const AI_GATEWAY_URL = Deno.env.get("AI_GATEWAY_URL");
    const AI_GATEWAY_API_KEY = Deno.env.get("AI_GATEWAY_API_KEY");
    if (!AI_GATEWAY_URL) throw new Error("AI_GATEWAY_URL is not configured");
    if (!AI_GATEWAY_API_KEY) throw new Error("AI_GATEWAY_API_KEY is not configured");

    const systemPrompt =
      "You are an accessibility strategist. Given a short questionnaire about a website's audience and constraints, return a personalized 3-step roadmap with concrete, actionable items. Keep titles short and descriptions under 25 words.";

    const userMessage = `Quiz answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn a roadmap.`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_roadmap",
              description: "Return a personalized accessibility roadmap.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string" },
                  summary: { type: "string" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        effort: {
                          type: "string",
                          enum: ["Low", "Medium", "High"],
                        },
                      },
                      required: ["title", "description", "effort"],
                    },
                  },
                },
                required: ["headline", "summary", "steps"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "return_roadmap" },
        },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const errorMsg =
        status === 429
          ? "Rate limit reached. Please try again in a moment."
          : status === 402
            ? "AI credits exhausted. Add credits to your AI workspace."
            : "AI gateway error";
      return new Response(JSON.stringify({ error: errorMsg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : null;

    return new Response(JSON.stringify({ roadmap: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("quiz-recommend error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// netlify/functions/ai-tutor.js
// Uses Google Gemini API (free tier) for AI tutoring

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { prompt } = body;
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt" }) };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not set");
    return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY not configured" }) };
  }

  try {
    console.log("Calling Gemini API...");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
        })
      }
    );

    const raw = await res.text();
    console.log("Gemini status:", res.status);
    console.log("Gemini response:", raw.slice(0, 500));

    if (!res.ok) {
      throw new Error("Gemini API error " + res.status + ": " + raw.slice(0, 200));
    }

    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      console.error("Empty text from Gemini. Full response:", raw);
      throw new Error("Empty response from Gemini");
    }

    console.log("Gemini text:", text.slice(0, 200));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };

  } catch (e) {
    console.error("Error:", e.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};

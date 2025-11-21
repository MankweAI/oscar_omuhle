// api/webhook.js
const sessionManager = require("../lib/session-manager");
const brain = require("../lib/agents/brain-agent");

// --- RESPONSE HELPERS ---

/**
 * Sends response to ManyChat (handling Text or Image)
 */
function sendManyChatResponse(res, content, debugInfo = {}) {
  // Check if content is an image object from our Agent
  if (typeof content === "object" && content.type === "image") {
    const messages = [
      {
        type: "image",
        url: content.url,
      },
    ];

    // Add caption as a separate text bubble if needed
    if (content.caption) {
      messages.push({ type: "text", text: content.caption });
    }

    return res.status(200).json({
      version: "v2",
      content: {
        messages: messages,
        quick_replies: [],
      },
      debug_info: debugInfo,
    });
  }

  // Default Text Response
  return res.status(200).json({
    version: "v2",
    content: {
      messages: [{ type: "text", text: content }],
      quick_replies: [],
    },
    debug_info: debugInfo,
  });
}

/**
 * Sends response to WhatsApp Cloud API (handling Text or Image)
 */
function sendWhatsAppResponse(res, content) {
  // Image Response
  if (typeof content === "object" && content.type === "image") {
    // Note: For base64 images in WhatsApp Cloud API, you might need to upload to a URL first
    // or use the Media ID. Assuming the 'url' is accessible or base64 supported by your provider.
    return res.status(200).json({
      messaging_product: "whatsapp",
      to: "placeholder",
      type: "image",
      image: {
        link: content.url,
        caption: content.caption || "",
      },
    });
  }

  // Text Response
  return res.status(200).json({
    messaging_product: "whatsapp",
    to: "placeholder",
    text: { body: content },
  });
}

function detectPayloadFormat(payload) {
  if (payload.subscriber_id) return "manychat";
  if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) return "whatsapp";
  return "unknown";
}

function extractUserData(payload, format) {
  if (format === "manychat") {
    return {
      waId: payload.subscriber_id,
      userMessage: payload.text,
      userName: payload.first_name || "Friend",
    };
  } else {
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    const msg = value?.messages?.[0];
    return {
      waId: msg?.from || payload.contact?.wa_id,
      userMessage: msg?.text?.body || "",
      userName: value?.contacts?.[0]?.profile?.name || "Friend",
    };
  }
}

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).send("OK");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const payload = req.body;
    const format = detectPayloadFormat(payload);

    if (format === "unknown") {
      return res.status(400).json({ error: "Unknown payload format" });
    }

    const { waId, userMessage, userName } = extractUserData(payload, format);

    if (!waId || !userMessage) {
      return res.status(400).json({ error: "Missing ID or Message" });
    }

    // Get/Create Session
    const session = await sessionManager.getSession(waId);
    session.history.push({ role: "user", content: userMessage });

    // Store user name if not present
    if (!session.user_name && userName) {
      session.user_name = userName;
    }

    // Process with Brain
    const responseContent = await brain.processMessage(userMessage, session);

    // Send Response
    if (format === "manychat") {
      return sendManyChatResponse(res, responseContent, {
        intent: session.state.intent,
      });
    } else {
      return sendWhatsAppResponse(res, responseContent);
    }
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

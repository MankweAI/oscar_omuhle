// lib/agents/menu-agent.js
const sessionManager = require("../session-manager");
const { generateTicket } = require("../utils/ticket-generator");

const STAGES = {
  HOME: "HOME",
  SHOW_DETAILS: "SHOW_DETAILS",
  CONFIRM_PURCHASE: "CONFIRM_PURCHASE",
  CAPTURE_NAME: "CAPTURE_NAME", // <--- NEW STEP AFTER PAYMENT
  INVITE_OSCAR: "INVITE_OSCAR",
};

class MenuAgent {
  constructor() {
    this.agentName = "menu_agent";
  }

  async processMessage(userMessage, session) {
    const waId = session.wa_id || session.user_id;

    // Ensure profile exists
    if (!session.user_profile) session.user_profile = {};

    let agentState = session.state.menuAgentState || { stage: STAGES.HOME };
    let response = "";

    const msg = userMessage.trim();
    const msgLower = msg.toLowerCase();

    // ============================================================
    // 1. MAIN MENU (Instant Access - No Onboarding)
    // ============================================================
    if (agentState.stage === STAGES.HOME) {
      // 1️⃣ OLD JOKES (Ticket Sales)
      if (
        msgLower.includes("1") ||
        msgLower.includes("old") ||
        msgLower.includes("bin")
      ) {
        agentState.stage = STAGES.SHOW_DETAILS;
        agentState.selectedShow = "Old Jokes to the Bin";
        agentState.price = "R250";

        response =
          `[Insert Digital Poster: Oscar with Trash Can]\n\n` +
          `🗑️ *Old Jokes Straight to the Bin*\n` +
          `_The Live Recording Special_\n\n` +
          `📍 *Venue:* Joburg Theatre\n` +
          `📅 *Date:* 06 Dec 2025\n` +
          `💰 *Price:* R250 (VIP)\n\n` +
          `👇 *Reply "BOOK" to secure your seat!*`;

        // 2️⃣ BOOK OF LAUGHTER
      } else if (
        msgLower.includes("2") ||
        msgLower.includes("book") ||
        msgLower.includes("laughter")
      ) {
        response =
          `📖 *The Book of Laughter (2025 Tour)*\n\n` +
          `Oscar is writing a new chapter! Cities confirmed so far:\n` +
          `• Cape Town (Oct 2025)\n` +
          `• Durban (Nov 2025)\n` +
          `• PE (Dec 2025)\n\n` +
          `Reply *MENU* to go back.`;

        // 3️⃣ ON THE ROAD
      } else if (
        msgLower.includes("3") ||
        msgLower.includes("road") ||
        msgLower.includes("ermelo")
      ) {
        response =
          `🚐 *Oscar is On The Road!*\n` +
          `Catch the comedy chaos in your town:\n\n` +
          `📍 *Ermelo:* 18 Dec @ Taste Ermelo\n` +
          `📍 *Menlyn:* 05 July @ Fire & Ice\n\n` +
          `_Tickets available at the door or WebTickets._\n` +
          `Reply *MENU* to go back.`;

        // 4️⃣ INVITE OSCAR
      } else if (
        msgLower.includes("4") ||
        msgLower.includes("invite") ||
        msgLower.includes("church")
      ) {
        agentState.stage = STAGES.INVITE_OSCAR;
        response =
          `⛪ *Invite Oscar*\n\n` +
          `We'd love to bless your congregation or corporate event with clean comedy.\n\n` +
          `Please type the *Date* and *Type of Event* (e.g., "Wedding, 12 Dec"):`;

        // 5️⃣ OFFERING TIME
      } else if (
        msgLower.includes("5") ||
        msgLower.includes("offering") ||
        msgLower.includes("bless")
      ) {
        response =
          `🙏 *Offering Time, Blessing Time*\n\n` +
          `Thank you for sowing into this ministry. Your support keeps the jokes clean and the lights on!\n\n` +
          `🏦 *Bank:* FNB\n` +
          `*Acc:* 62000000000\n` +
          `*Ref:* Your Name\n\n` +
          `_May your pockets never run dry!_ 🕊️`;
      } else {
        // Default Greeting
        response = this.getMainMenu();
      }
    }

    // ============================================================
    // 2. SHOW DETAILS -> CONFIRM
    // ============================================================
    else if (agentState.stage === STAGES.SHOW_DETAILS) {
      if (msgLower.includes("book") || msgLower.includes("yes")) {
        agentState.stage = STAGES.CONFIRM_PURCHASE;
        response =
          `Excellent choice! 🎟️\n\n` +
          `You are booking *1x VIP Seat* for *Old Jokes to the Bin*.\n` +
          `Total: R250\n\n` +
          `💳 *[TAP HERE TO PAY SECURELY]*\n` +
          `(For this demo, simply type *"PAID"* to verify)`;
      } else {
        agentState.stage = STAGES.HOME;
        response = this.getMainMenu();
      }
    }

    // ============================================================
    // 3. PAYMENT -> CAPTURE NAME
    // ============================================================
    else if (agentState.stage === STAGES.CONFIRM_PURCHASE) {
      if (msgLower.includes("paid") || msgLower.includes("done")) {
        agentState.stage = STAGES.CAPTURE_NAME;

        response =
          `✅ *Payment Received!* 💸\n\n` +
          `To personalize your VIP Ticket, please tell me your *Name* (and Surname)?`;
      } else {
        response = "Please complete payment (Type 'PAID') or say 'Cancel'.";
        if (msgLower.includes("cancel")) {
          agentState.stage = STAGES.HOME;
          response = this.getMainMenu();
        }
      }
    }

    // ============================================================
    // 4. CAPTURE NAME -> DELIVERY (QR Code)
    // ============================================================
    else if (agentState.stage === STAGES.CAPTURE_NAME) {
      // 1. Capture Name
      const capturedName = msg;
      session.user_profile.name = capturedName;

      // 2. Generate Ticket
      const qrTicketImage = await generateTicket(
        capturedName,
        agentState.selectedShow,
        "VIP Access"
      );

      // 3. Send Image
      const imagePayload = {
        type: "image",
        url: qrTicketImage,
        caption: `Here is your access code, ${capturedName}.\nShow this QR at the door.`,
      };

      // 4. Reset to Home
      agentState.stage = STAGES.HOME;

      session.state.menuAgentState = agentState;
      await sessionManager.updateSession(waId, {
        state: session.state,
        user_profile: session.user_profile,
      });
      return imagePayload;
    }

    // ============================================================
    // OTHER: INVITE OSCAR
    // ============================================================
    else if (agentState.stage === STAGES.INVITE_OSCAR) {
      response = `Got it! I've sent your request for "${userMessage}" to Oscar's real manager. They will email you shortly.`;
      agentState.stage = STAGES.HOME;
      response += "\n\n" + "Reply *MENU* for main options.";
    }

    // Save State
    session.state.menuAgentState = agentState;
    await sessionManager.updateSession(waId, { state: session.state });

    return response;
  }

  getMainMenu() {
    return (
      `👋 *Sawubona Fam!* I'm Lesedi, Oscar's Booking Manager.\n` +
      `How can we serve you today?\n\n` +
      `1️⃣ 🗑️ *Old Jokes into the Bin* (Live Ticket)\n` +
      `2️⃣ 📖 *Book of Laughter* (2025 Tour)\n` +
      `3️⃣ 🚐 *On The Road* (Ermelo / Menlyn)\n` +
      `4️⃣ ⛪ *Invite Oscar* (Church/Corp)\n` +
      `5️⃣ 🙏 *Offering Time* (Blessing Time)`
    );
  }
}

module.exports = new MenuAgent();

// lib/agents/menu-agent.js
const sessionManager = require("../session-manager");
const { generateTicket } = require("../utils/ticket-generator");

const STAGES = {
  HOME: "HOME",
  SHOW_DETAILS: "SHOW_DETAILS", // Option 1 Flow
  CONFIRM_PURCHASE: "CONFIRM_PURCHASE",
  ON_THE_ROAD: "ON_THE_ROAD", // Option 3 Flow
  INVITE_OSCAR: "INVITE_OSCAR", // Option 4 Flow
  OFFERING: "OFFERING", // Option 5 Flow
};

class MenuAgent {
  constructor() {
    this.agentName = "menu_agent";
  }

  async processMessage(userMessage, session) {
    const waId = session.wa_id || session.user_id;
    const userName = session.user_name || "Fam";

    let agentState = session.state.menuAgentState || { stage: STAGES.HOME };
    let response = "";

    const msg = userMessage.trim().toLowerCase();

    // ============================================================
    // 1. MAIN MENU (THE HUB)
    // ============================================================
    if (agentState.stage === STAGES.HOME) {
      // 1️⃣ OLD JOKES (The Ticket Sale)
      if (msg.includes("1") || msg.includes("old") || msg.includes("bin")) {
        agentState.stage = STAGES.SHOW_DETAILS;
        agentState.selectedShow = "Old Jokes to the Bin";
        agentState.price = "R250";

        // Show the Poster & Call to Action
        response =
          `[Insert Digital Poster: Oscar with Trash Can]\n\n` +
          `🗑️ *Old Jokes Straight to the Bin*\n` +
          `_The Live Recording Special_\n\n` +
          `📍 **Venue:** Joburg Theatre\n` +
          `📅 **Date:** 06 Dec 2025\n` +
          `💰 **Price:** R250 (VIP)\n\n` +
          `👇 *Reply "BOOK" to secure your seat!*`;

        // 2️⃣ BOOK OF LAUGHTER (Tour Info)
      } else if (
        msg.includes("2") ||
        msg.includes("book") ||
        msg.includes("laughter")
      ) {
        response =
          `📖 *The Book of Laughter (2025 Tour)*\n\n` +
          `Oscar is writing a new chapter! Cities confirmed so far:\n` +
          `• Cape Town (Oct 2025)\n` +
          `• Durban (Nov 2025)\n` +
          `• PE (Dec 2025)\n\n` +
          `Reply *MENU* to go back.`;

        // 3️⃣ ON THE ROAD (Specific Dates)
      } else if (
        msg.includes("3") ||
        msg.includes("road") ||
        msg.includes("ermelo")
      ) {
        response =
          `🚐 *Oscar is On The Road!* \n` +
          `Catch the comedy chaos in your town:\n\n` +
          `📍 **Ermelo:** 18 Dec @ Taste Ermelo\n` +
          `📍 **Menlyn:** 05 July @ Fire & Ice\n\n` +
          `_Tickets available at the door or WebTickets._\n` +
          `Reply *MENU* to go back.`;

        // 4️⃣ INVITE OSCAR (Bookings)
      } else if (
        msg.includes("4") ||
        msg.includes("invite") ||
        msg.includes("church")
      ) {
        agentState.stage = STAGES.INVITE_OSCAR;
        response =
          `⛪ *Invite Oscar*\n\n` +
          `We'd love to bless your congregation or corporate event with clean comedy.\n\n` +
          `Please type the **Date** and **Type of Event** (e.g., "Wedding, 12 Dec"):`;

        // 5️⃣ OFFERING TIME (Donations)
      } else if (
        msg.includes("5") ||
        msg.includes("offering") ||
        msg.includes("bless")
      ) {
        response =
          `🙏 *Offering Time, Blessing Time*\n\n` +
          `Thank you for sowing into this ministry. Your support keeps the jokes clean and the lights on!\n\n` +
          `🏦 **Bank:** FNB\n` +
          `**Acc:** 62000000000\n` +
          `**Ref:** Your Name\n\n` +
          `_May your pockets never run dry!_ 🕊️`;
      } else {
        // Default Greeting
        response = this.getMainMenu(userName);
      }
    }

    // ============================================================
    // FLOW 1: BUYING TICKET (From Option 1)
    // ============================================================
    else if (agentState.stage === STAGES.SHOW_DETAILS) {
      if (msg.includes("book") || msg.includes("yes")) {
        agentState.stage = STAGES.CONFIRM_PURCHASE;
        response =
          `Excellent choice, ${userName}. 🎟️\n\n` +
          `You are booking **1x VIP Seat** for **Old Jokes to the Bin**.\n` +
          `Total: R250\n\n` +
          `💳 *[TAP HERE TO PAY SECURELY]*\n` +
          `(For this demo, simply type **'PAID'** to verify)`;
      } else {
        agentState.stage = STAGES.HOME;
        response = this.getMainMenu(userName);
      }
    }

    // ============================================================
    // FLOW 1: DELIVERY (QR Code)
    // ============================================================
    else if (agentState.stage === STAGES.CONFIRM_PURCHASE) {
      if (msg.includes("paid") || msg.includes("done")) {
        // Generate Ticket
        const qrTicketImage = await generateTicket(
          userName,
          agentState.selectedShow,
          "VIP Access"
        );

        // Send Image
        const imagePayload = {
          type: "image",
          url: qrTicketImage,
          caption: `✅ *Payment Received!*\n\nHere is your access code, ${userName}.\nShow this QR at the door.`,
        };

        agentState.stage = STAGES.HOME;

        session.state.menuAgentState = agentState;
        await sessionManager.updateSession(waId, { state: session.state });
        return imagePayload;
      } else {
        response = "Please complete payment (Type 'PAID') or say 'Cancel'.";
        if (msg.includes("cancel")) {
          agentState.stage = STAGES.HOME;
          response = this.getMainMenu(userName);
        }
      }
    }

    // ============================================================
    // FLOW 4: INVITE OSCAR (Data Capture)
    // ============================================================
    else if (agentState.stage === STAGES.INVITE_OSCAR) {
      // Capture their input
      response = `Got it! I've sent your request for "${userMessage}" to Oscar's real manager. They will email you shortly.`;
      agentState.stage = STAGES.HOME;
      response += "\n\n" + "Reply *MENU* for main options.";
    }

    // Save State
    session.state.menuAgentState = agentState;
    await sessionManager.updateSession(waId, { state: session.state });

    return response;
  }

  getMainMenu(name) {
    return (
      `👋 *Sawubona ${name}!* I'm Lesedi, Oscar's Booking Manager.\n` +
      `How can we serve you today?\n\n` +
      `1️⃣ 🗑️ *"Old Jokes into the Bin"* (Live Ticket)\n` +
      `2️⃣ 📖 *"Book of Laughter"* (2025 Tour)\n` +
      `3️⃣ 🚐 *On The Road* (Ermelo / Menlyn)\n` +
      `4️⃣ ⛪ *Book Oscar*\n` +
      `5️⃣ 🙏 *Offering Time. Blessing Time** (Blessing Time)`
    );
  }
}

module.exports = new MenuAgent();

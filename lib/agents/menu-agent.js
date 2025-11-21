// lib/agents/menu-agent.js
const sessionManager = require("../session-manager");
const { generateTicket } = require("../utils/ticket-generator");

const STAGES = {
  HOME: "HOME",
  SELECT_SHOW: "SELECT_SHOW", // <--- NEW STEP
  SHOW_DETAILS: "SHOW_DETAILS", // <--- "Poster" Step
  CONFIRM_PURCHASE: "CONFIRM_PURCHASE",
  VIP_CLUB: "VIP_CLUB",
};

class MenuAgent {
  constructor() {
    this.agentName = "menu_agent";
  }

  async processMessage(userMessage, session) {
    const waId = session.wa_id || session.user_id;
    const userName = session.user_name || "Fan";

    let agentState = session.state.menuAgentState || { stage: STAGES.HOME };
    let response = "";

    const msg = userMessage.trim().toLowerCase();

    // ============================================================
    // 1. HOME -> GET TICKETS (GO TO SHOW LIST)
    // ============================================================
    if (agentState.stage === STAGES.HOME) {
      if (msg.includes("1") || msg.includes("ticket")) {
        // Move to Show Selection
        agentState.stage = STAGES.SELECT_SHOW;

        response =
          `🎟️ *Current Shows*\n` +
          `Select a show to view details:\n\n` +
          `1️⃣ **Old Jokes Straight to the Bin**\n(Dec 2025 - Joburg)\n\n` +
          `2️⃣ **The Book of Laughter**\n(2026 Tour - Coming Soon)`;
      } else if (msg.includes("2") || msg.includes("vip")) {
        agentState.stage = STAGES.VIP_CLUB;
        response =
          "✨ *VIP Access*\n\nGet front row priority. Type your **Email Address** to join:";
      } else {
        response = this.getMainMenu(userName);
      }
    }

    // ============================================================
    // 2. SELECT SHOW -> VIEW POSTER (THE HOOK)
    // ============================================================
    else if (agentState.stage === STAGES.SELECT_SHOW) {
      if (msg.includes("1") || msg.includes("old") || msg.includes("bin")) {
        // User Selected "Old Jokes"
        agentState.stage = STAGES.SHOW_DETAILS;
        agentState.selectedShow = "Old Jokes to the Bin";
        agentState.price = "R250";

        // THE "POSTER" & DETAILS (Text Placeholder as requested)
        response =
          `[Insert Digital Poster Image Here]\n\n` +
          `🗑️ *Old Jokes Straight to the Bin*\n` +
          `_Oscar Omuhle's Final Performance of the Classics_\n\n` +
          `📍 **Venue:** Joburg Theatre\n` +
          `📅 **Date:** 06 Dec 2025\n` +
          `💰 **Price:** R250 (VIP)\n\n` +
          `👇 *Reply "BOOK" to secure your seat!*`;
      } else if (msg.includes("2") || msg.includes("book")) {
        response =
          "📖 *The Book of Laughter*\n\nTickets for this tour are not out yet. I'll notify you when they drop! \n\nSelect 1️⃣ for the current show or 0️⃣ for Menu.";
      } else if (msg.includes("0") || msg.includes("back")) {
        agentState.stage = STAGES.HOME;
        response = this.getMainMenu(userName);
      } else {
        response = "Please select a show number (e.g. 1) or type 'Back'.";
      }
    }

    // ============================================================
    // 3. SHOW DETAILS -> PAYMENT PROMPT
    // ============================================================
    else if (agentState.stage === STAGES.SHOW_DETAILS) {
      if (msg.includes("book") || msg.includes("yes") || msg.includes("1")) {
        agentState.stage = STAGES.CONFIRM_PURCHASE;

        response =
          `Excellent choice, ${userName}. 🎟️\n\n` +
          `You are booking **1x VIP Seat** for **${agentState.selectedShow}**.\n` +
          `Total: ${agentState.price}\n\n` +
          `💳 *[TAP HERE TO PAY SECURELY]*\n` +
          `(For this demo, simply type **'PAID'** to verify)`;
      } else {
        // If they don't say book, assume they want to go back
        agentState.stage = STAGES.HOME;
        response = this.getMainMenu(userName);
      }
    }

    // ============================================================
    // 4. PAYMENT -> GENERATED QR TICKET
    // ============================================================
    else if (agentState.stage === STAGES.CONFIRM_PURCHASE) {
      if (msg.includes("paid") || msg.includes("done")) {
        // A. Generate the Code-Drawn Ticket (Gradient + QR)
        const qrTicketImage = await generateTicket(
          userName,
          agentState.selectedShow,
          "VIP Access"
        );

        // B. Send the Ticket Image
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

    // (VIP Logic Unchanged)
    else if (agentState.stage === STAGES.VIP_CLUB) {
      if (msg.includes("@")) {
        response = "Added to VIP list! 📧";
        agentState.stage = STAGES.HOME;
        response += "\n\n" + this.getMainMenu(userName);
      } else {
        response = "Type your email or 'Back'.";
        if (msg.includes("back")) {
          agentState.stage = STAGES.HOME;
          response = this.getMainMenu(userName);
        }
      }
    }

    session.state.menuAgentState = agentState;
    await sessionManager.updateSession(waId, { state: session.state });

    return response;
  }

  getMainMenu(name) {
    return (
      `👋 *Sawubona ${name}!* I'm Lesedi, Oscar's Booking Manager.\n\n` +
      `1️⃣ **Get Tickets** (Upcoming Shows)\n` +
      `2️⃣ **Join VIP Club**`
    );
  }
}

module.exports = new MenuAgent();

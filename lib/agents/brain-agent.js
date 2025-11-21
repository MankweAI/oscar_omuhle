// lib/agents/brain-agent.js
const menuAgent = require("./menu-agent");
const sessionManager = require("../session-manager");

async function processMessage(userMessage, session) {
  const waId = session.wa_id || session.user_id;

  // For the Oscar Demo, we route EVERYONE to the Menu Agent (Lesedi)
  // We skip the complex onboarding checks for now.
  const targetAgent = menuAgent;
  session.state.lastAgent = "menu_agent";

  // Delegate to Lesedi
  const response = await targetAgent.processMessage(userMessage, session);

  // Update session history
  session.history.push({ role: "assistant", content: response });
  await sessionManager.updateSession(waId, {
    history: session.history,
    state: session.state,
  });

  return response;
}

module.exports = {
  processMessage,
  agentName: "brain",
};

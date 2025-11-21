// scripts/test-oscar.js
const axios = require("axios");

// Configuration
const SERVER_URL = "http://localhost:3000/api/webhook";
const TEST_USER_ID = "27820001111"; // Fake Thabo
const TEST_USER_NAME = "Thabo";

// The "Happy Path" Conversation Flow
const scenarios = [
  { label: "1. The Hook", message: "Hi" },
  { label: "2. Interest", message: "1" }, // Selects "Get Tickets"
  { label: "3. Selection", message: "1" }, // Selects "Old Jokes" Show
  { label: "4. Action", message: "Book" }, // Says "Book" after seeing text poster
  { label: "5. Payment", message: "Paid" }, // Simulates Payment
];

async function runTest() {
  console.log("🎭 STARTING OSCAR OMUHLE DEMO SIMULATION 🎭\n");

  for (const step of scenarios) {
    console.log(`\n--- ${step.label} ---`);
    console.log(`Cbommie (User): "${step.message}"`);

    try {
      // Simulate Webhook POST
      const response = await axios.post(SERVER_URL, {
        subscriber_id: TEST_USER_ID,
        first_name: TEST_USER_NAME,
        text: step.message,
        // Mocking ManyChat structure for simplicity
      });

      const messages = response.data.content.messages;

      messages.forEach((msg) => {
        if (msg.type === "text") {
          console.log(
            `Lesedi (Bot):   ${msg.text.replace(/\n/g, "\n                ")}`
          );
        } else if (msg.type === "image") {
          console.log(`Lesedi (Bot):   [IMAGE SENT] 📸`);
          console.log(
            `                URL: ${msg.url.substring(0, 50)}... (Base64 data)`
          );
          if (msg.caption)
            console.log(`                Caption: ${msg.caption}`);
        }
      });

      // Small pause for realism
      await new Promise((r) => setTimeout(r, 1000));
    } catch (error) {
      console.error("❌ Error:", error.message);
      if (error.response) console.error("Server Data:", error.response.data);
    }
  }
  console.log("\n✅ SIMULATION COMPLETE");
}

runTest();


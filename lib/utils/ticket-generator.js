// lib/utils/ticket-generator.js
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");

/**
 * Generates a code-drawn ticket with a gradient background.
 * No external images required.
 */
async function generateTicket(userName, showName, seatType = "General") {
  const width = 800;
  const height = 1200;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Draw The "Vibe" Gradient (Deep Purple to Black)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#4a00e0"); // Header Purple
  gradient.addColorStop(0.5, "#000000"); // Middle Black
  gradient.addColorStop(1, "#1a1a1a"); // Footer Grey
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw "Gold" Border
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 10;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // 3. Header Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 50px Arial";
  ctx.textAlign = "center";
  ctx.fillText("OSCAR OMUHLE LIVE", width / 2, 120);

  ctx.fillStyle = "#FFD700"; // Gold
  ctx.font = "bold 40px Arial";
  ctx.fillText(showName.toUpperCase(), width / 2, 200);

  // 4. Generate & Draw QR Code
  const ticketPayload = JSON.stringify({
    u: userName,
    s: showName,
    d: new Date().toISOString().split("T")[0],
    v: true,
  });

  const qrDataUrl = await QRCode.toDataURL(ticketPayload, {
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  const qrImage = await loadImage(qrDataUrl);

  // White background box for QR
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(width / 2 - 220, 330, 440, 440);
  ctx.drawImage(qrImage, width / 2 - 200, 350, 400, 400);

  // 5. Footer / User Details
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "30px Arial";
  ctx.fillText(`GUEST:`, width / 2, 850);

  ctx.font = "bold 50px Arial";
  ctx.fillText(userName.toUpperCase(), width / 2, 910);

  // "PAID" Stamp
  ctx.fillStyle = "#00FF00"; // Bright Green
  ctx.font = "bold 40px Arial";
  ctx.fillText(`✅ ${seatType.toUpperCase()}`, width / 2, 1000);

  // Return Base64 Image string
  return canvas.toDataURL();
}

module.exports = { generateTicket };

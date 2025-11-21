// lib/utils/asset-loader.js
const fs = require("fs");
const path = require("path");

/**
 * Loads the static marketing poster from the assets folder.
 * Returns a Base64 string ready for WhatsApp.
 */
function getOscarPoster() {
  try {
    // Ensure you have 'oscar_poster.jpg' in an 'assets' folder in your project root
    const posterPath = path.join(process.cwd(), "assets", "oscar_poster.jpg");

    if (fs.existsSync(posterPath)) {
      const imageBuffer = fs.readFileSync(posterPath);
      return `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    } else {
      console.warn("⚠️ Poster image not found at:", posterPath);
      return null;
    }
  } catch (error) {
    console.error("Error loading poster:", error);
    return null;
  }
}

module.exports = { getOscarPoster };


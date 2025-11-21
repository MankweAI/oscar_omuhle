/**
 * Enhanced Session Manager (Demo Safe)
 * guaranteed to return a session even if DB fails.
 */
const { getSupabaseClient } = require("./config/database");

// In-memory cache for active sessions
const sessionCache = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

async function getSession(userId) {
  // 1. Check cache first
  if (sessionCache.has(userId)) {
    return sessionCache.get(userId);
  }

  console.log(`Loading session for user ${userId}`);
  let session = null;

  // 2. Try to load from Database (if configured)
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("wa_id", userId)
      .single();

    if (!error && data) {
      console.log(`Retrieved session from DB for ${userId}`);
      session = {
        ...data.session_data,
        created_at: data.created_at,
        last_updated: data.last_updated,
      };
    }
  } catch (e) {
    // Silent fail - just log warning and proceed to create new session
    console.warn("Session DB load skipped (using memory):", e.message);
  }

  // 3. If no session found (or DB failed), create a fresh one in memory
  if (!session) {
    console.log(`Creating new in-memory session for ${userId}`);
    session = createNewSession(userId);
  }

  // 4. Save to Cache and return
  sessionCache.set(userId, session);
  return session;
}

function createNewSession(userId) {
  return {
    wa_id: userId,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    history: [],
    state: {}, // Critical for the Menu Agent
    user_name: null, // Will be captured from webhook
  };
}

async function updateSession(userId, update) {
  // 1. Update Cache
  const session = await getSession(userId);
  const updatedSession = {
    ...session,
    ...update,
    last_updated: new Date().toISOString(),
  };
  sessionCache.set(userId, updatedSession);

  // 2. Try to Persist to DB (Async - don't wait)
  try {
    const supabase = getSupabaseClient();
    supabase
      .from("chat_sessions")
      .upsert(
        {
          wa_id: userId,
          last_updated: updatedSession.last_updated,
          session_data: updatedSession,
        },
        { onConflict: "wa_id" }
      )
      .then(({ error }) => {
        if (error) console.warn("DB Save failed (ignoring for demo)");
      });
  } catch (e) {
    // Ignore DB errors during demo
  }

  return updatedSession;
}

module.exports = {
  getSession,
  updateSession,
};

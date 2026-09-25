from pathlib import Path

path = Path("admin-mobile/App.tsx")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"session patch failed: {label}")
    text = text.replace(old, new, 1)


replace_once(
    'const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin";\n',
    'const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin";\nconst ADMIN_SESSION_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin-session";\n',
    'session endpoint',
)

replace_once(
    'async function leaderboardApi() {\n',
    '''async function refreshAdminSession(adminToken: string) {
  const response = await fetch(ADMIN_SESSION_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ admin_token: adminToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Sesi admin belum dapat diperbarui.");
  return data;
}

async function leaderboardApi() {
''',
    'refresh helper',
)

replace_once(
    '  const appState = useRef(AppState.currentState);\n',
    '  const appState = useRef(AppState.currentState);\n  const lastSessionTouch = useRef(0);\n',
    'session touch ref',
)

replace_once(
    '  const loadLeaderboard = useCallback(async (silent = false) => {\n',
    '''  const touchAdminSession = useCallback(async (force = false) => {
    if (!token) return false;
    const now = Date.now();
    if (!force && now - lastSessionTouch.current < 6 * 60 * 60 * 1000) return true;
    try {
      await refreshAdminSession(token);
      lastSessionTouch.current = now;
      return true;
    } catch (e) {
      const text = e instanceof Error ? e.message : "Sesi admin belum dapat diperbarui.";
      if (/sesi admin (habis|tidak valid)/i.test(text)) {
        setError("Sesi admin perlu login ulang. Token lama sudah tidak berlaku.");
        await signOutLocal();
      }
      return false;
    }
  }, [signOutLocal, token]);

  useEffect(() => {
    if (!token) return;
    void touchAdminSession(true);
    const keepAlive = setInterval(() => {
      void touchAdminSession(false);
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, [token, touchAdminSession]);

  const loadLeaderboard = useCallback(async (silent = false) => {
''',
    'touch session lifecycle',
)

replace_once(
    '      if (next === "active") {\n        void loadAdmin(true);\n        void loadLeaderboard(true);\n      }\n',
    '      if (next === "active") {\n        void touchAdminSession(true);\n        void loadAdmin(true);\n        void loadLeaderboard(true);\n      }\n',
    'resume session refresh',
)

replace_once(
    '  }, [loadAdmin, loadLeaderboard, token]);\n',
    '  }, [loadAdmin, loadLeaderboard, token, touchAdminSession]);\n',
    'effect dependencies',
)

replace_once(
    '            <Text style={styles.securityText}>Token sesi disimpan terenkripsi di Android Keystore. Password admin tidak disimpan di aplikasi.</Text>\n',
    '            <Text style={styles.securityText}>Token sesi disimpan terenkripsi di Android Keystore, berlaku 30 hari dan diperpanjang otomatis saat aplikasi digunakan. Password admin tidak disimpan.</Text>\n',
    'login security copy',
)

path.write_text(text, encoding="utf-8")
print("Applied long-lived sliding admin session patch to admin-mobile/App.tsx")

from pathlib import Path

path = Path("admin-mobile/App.tsx")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f"notification patch failed: {label}")
    text = text.replace(old, new, 1)


replace_once(
    'const POLL_MS = 12000;\n',
    'const POLL_MS = 3000;\n',
    'fast payment polling',
)

replace_once(
    '  Image,\n  Modal,',
    '  Image,\n  Linking,\n  Modal,',
    'Linking import',
)

replace_once(
    'import * as SecureStore from "expo-secure-store";\n',
    'import * as SecureStore from "expo-secure-store";\nimport * as Notifications from "expo-notifications";\n',
    'expo-notifications import',
)

replace_once(
    'const LOGO = require("./assets/alzava-logo.png");\n',
    '''const LOGO = require("./assets/alzava-logo.png");
const PAYMENT_CHANNEL_ID = "alzava-payments-v2";
const PAYMENT_SOUND = "alzava_payment.wav";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function prepareNotificationChannel() {
  await Notifications.setNotificationChannelAsync(PAYMENT_CHANNEL_ID, {
    name: "Bukti Bayar Masuk",
    description: "Peringatan prioritas tinggi saat peserta mengunggah bukti pembayaran untuk diverifikasi.",
    importance: Notifications.AndroidImportance.MAX,
    sound: PAYMENT_SOUND,
    vibrationPattern: [0, 140, 80, 180, 80, 320],
    lightColor: "#D4AF37",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
    enableVibrate: true,
    showBadge: true,
  });
}

async function notificationPermission(requestIfNeeded = false) {
  await prepareNotificationChannel();
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestIfNeeded) {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted;
}

async function sendPaymentAlert(payment: Payment | undefined, newCount: number, totalPending: number) {
  const title = newCount > 1 ? `💳 ${newCount} Bukti Bayar Masuk` : "💳 Bukti Bayar Masuk";
  const who = payment?.nickname || payment?.payer_name || "Peserta";
  const body = newCount > 1
    ? `${who} dan ${newCount - 1} pembayaran lain menunggu verifikasi. Total antrean: ${totalPending}.`
    : `${who} · ${productLabel(payment?.product_type)} · ${rupiah(payment?.amount)}. Ketuk untuk segera konfirmasi.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: PAYMENT_SOUND,
      color: "#D4AF37",
      badge: totalPending,
      data: {
        payment_id: payment?.id || "",
        screen: "payments",
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      channelId: PAYMENT_CHANNEL_ID,
    },
  });
}
''',
    'notification bootstrap',
)

replace_once(
    '  const [message, setMessage] = useState("");\n',
    '  const [message, setMessage] = useState("");\n  const [notificationGranted, setNotificationGranted] = useState<boolean | null>(null);\n',
    'notification state',
)

replace_once(
    '  useEffect(() => {\n    (async () => {\n      try {\n        const stored = (await SecureStore.getItemAsync(TOKEN_KEY)) || "";\n        if (stored) setToken(stored);\n      } finally {\n        setBooting(false);\n      }\n    })();\n  }, []);\n',
    '''  useEffect(() => {
    (async () => {
      try {
        const stored = (await SecureStore.getItemAsync(TOKEN_KEY)) || "";
        if (stored) setToken(stored);
        const granted = await notificationPermission(false).catch(() => false);
        setNotificationGranted(granted);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      const granted = await notificationPermission(true).catch(() => false);
      setNotificationGranted(granted);
    })();
  }, [token]);
''',
    'permission lifecycle',
)

replace_once(
    '        if (previousPending.current !== null && count > previousPending.current) {\n          Vibration.vibrate([0, 180, 100, 260]);\n          setMessage(`Ada ${count - previousPending.current} pembayaran baru menunggu verifikasi.`);\n        }\n',
    '''        if (previousPending.current !== null && count > previousPending.current) {
          const newCount = count - previousPending.current;
          const newest = pendingList[0] as Payment | undefined;
          Vibration.vibrate([0, 140, 80, 180, 80, 320]);
          setMessage(`Ada ${newCount} bukti pembayaran baru menunggu verifikasi.`);
          void sendPaymentAlert(newest, newCount, count).catch(() => undefined);
        }
''',
    'new payment alert',
)

replace_once(
    '      timer = setInterval(() => {\n        if (appState.current === "active") void loadAdmin(true);\n      }, POLL_MS);\n',
    '      timer = setInterval(() => {\n        void loadAdmin(true);\n      }, POLL_MS);\n',
    'background-friendly polling',
)

replace_once(
    '  async function logout() {\n',
    '''  async function enableNotifications() {
    const granted = await notificationPermission(true).catch(() => false);
    setNotificationGranted(granted);
    if (granted) {
      setMessage("Notifikasi bukti bayar aktif. Suara futuristik ALZAVA siap digunakan.");
      return;
    }
    Alert.alert(
      "Aktifkan notifikasi ALZAVA",
      "Izin notifikasi masih nonaktif. Buka Pengaturan Android, lalu izinkan notifikasi dan suara untuk ALZAVA Battle Point Admin.",
      [
        { text: "Nanti", style: "cancel" },
        { text: "Buka Pengaturan", onPress: () => void Linking.openSettings() },
      ],
    );
  }

  async function testNotificationSound() {
    const granted = await notificationPermission(true).catch(() => false);
    setNotificationGranted(granted);
    if (!granted) {
      await enableNotifications();
      return;
    }
    await sendPaymentAlert({
      id: "test",
      nickname: "Tes Notifikasi",
      product_type: "attempt_credit",
      amount: 5000,
    }, 1, Math.max(1, pending));
    setMessage('Tes notifikasi dikirim. Seharusnya terdengar "Bukti bayar masuk".');
  }

  async function logout() {
''',
    'notification controls',
)

replace_once(
    '              onReject={(payment) => { setRejectPayment(payment); setRejectNote(""); }}\n            />',
    '''              onReject={(payment) => { setRejectPayment(payment); setRejectNote(""); }}
              notificationGranted={notificationGranted === true}
              onEnableNotifications={() => void enableNotifications()}
              onTestNotification={() => void testNotificationSound()}
            />''',
    'PaymentsView props',
)

replace_once(
    '  pending, metrics, filters, filter, setFilter, payments, busy, onRefresh, onProof, onApprove, onReject,\n}: {',
    '  pending, metrics, filters, filter, setFilter, payments, busy, onRefresh, onProof, onApprove, onReject, notificationGranted, onEnableNotifications, onTestNotification,\n}: {',
    'PaymentsView signature',
)

replace_once(
    '  onReject: (payment: Payment) => void;\n}) {',
    '''  onReject: (payment: Payment) => void;
  notificationGranted: boolean;
  onEnableNotifications: () => void;
  onTestNotification: () => void;
}) {''',
    'PaymentsView prop types',
)

replace_once(
    '  return (\n    <>\n      <View style={styles.alertCard}>',
    '''  return (
    <>
      <View style={[styles.notificationCard, notificationGranted ? styles.notificationCardActive : styles.notificationCardWarning]}>
        <View style={styles.notificationBell}><Text style={styles.notificationBellText}>🔔</Text></View>
        <View style={styles.notificationCopy}>
          <Text style={styles.notificationTitle}>{notificationGranted ? "Notifikasi Bukti Bayar Aktif" : "Aktifkan Notifikasi Bukti Bayar"}</Text>
          <Text style={styles.notificationText}>{notificationGranted ? 'Cek dipercepat menjadi sekitar 3 detik dan memakai suara futuristik "Bukti bayar masuk".' : "Izinkan notifikasi Android agar bukti pembayaran baru tidak terlewat."}</Text>
        </View>
        <Pressable onPress={notificationGranted ? onTestNotification : onEnableNotifications} style={[styles.notificationButton, notificationGranted && styles.notificationButtonActive]}>
          <Text style={[styles.notificationButtonText, notificationGranted && styles.notificationButtonTextActive]}>{notificationGranted ? "Tes Bunyi" : "Aktifkan"}</Text>
        </Pressable>
      </View>

      <View style={styles.alertCard}>''',
    'notification card UI',
)

replace_once(
    '  alertCard: { flexDirection: "row", gap: 14, alignItems: "center", borderRadius: 22, padding: 17, backgroundColor: "#111c39", borderWidth: 1, borderColor: "#22d3ee2e", marginBottom: 14 },\n',
    '''  notificationCard: { flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 20, padding: 14, marginBottom: 12, borderWidth: 1 },
  notificationCardActive: { backgroundColor: "#052b22", borderColor: "#34d39955" },
  notificationCardWarning: { backgroundColor: "#2a1c07", borderColor: "#f59e0b55" },
  notificationBell: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff0c" },
  notificationBellText: { fontSize: 21 },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationTitle: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  notificationText: { color: "#94a3b8", fontSize: 10, lineHeight: 15, marginTop: 3 },
  notificationButton: { minHeight: 38, paddingHorizontal: 11, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#f59e0b" },
  notificationButtonActive: { backgroundColor: "#d4af37" },
  notificationButtonText: { color: "#111827", fontSize: 10, fontWeight: "900" },
  notificationButtonTextActive: { color: "#16120a" },
  alertCard: { flexDirection: "row", gap: 14, alignItems: "center", borderRadius: 22, padding: 17, backgroundColor: "#111c39", borderWidth: 1, borderColor: "#22d3ee2e", marginBottom: 14 },
''',
    'notification styles',
)

replace_once(
    '      <Text style={styles.pollText}>Aplikasi mengecek pembayaran baru otomatis setiap 12 detik selama terbuka.</Text>',
    '      <Text style={styles.pollText}>Aplikasi mengecek bukti pembayaran baru otomatis sekitar setiap 3 detik. Saat pembayaran baru terdeteksi, notifikasi prioritas tinggi langsung dibunyikan.</Text>',
    'polling copy',
)

path.write_text(text, encoding="utf-8")
print("Applied fast ALZAVA payment notification patch to admin-mobile/App.tsx")

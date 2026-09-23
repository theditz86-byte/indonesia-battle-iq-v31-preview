import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";

const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin";
const TOKEN_KEY = "alzava-battle-iq.admin-token.v1";
const POLL_MS = 12000;

type Filter = "pending" | "approved" | "rejected" | "all";
type Payment = {
  id: string;
  product_type?: "attempt_credit" | "premium_report";
  nickname?: string;
  province_name?: string;
  regency_name?: string;
  district_name?: string;
  payer_name?: string | null;
  amount?: number;
  status?: "pending" | "approved" | "rejected";
  created_at?: string;
  reviewed_at?: string | null;
  admin_note?: string | null;
};
type Metrics = {
  participants?: number;
  season_completers?: number;
  approved_attempt_sales?: number;
  approved_premium_sales?: number;
  gross_revenue?: number;
  pending_payments?: number;
};

type ProofState = { visible: boolean; uri: string; title: string };

async function api(body: Record<string, unknown>) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Permintaan admin gagal.");
  return data;
}

function rupiah(value?: number) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

function productLabel(type?: string) {
  return type === "premium_report" ? "Laporan Premium" : "Ranked Attempt";
}

function timeLabel(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [proof, setProof] = useState<ProofState>({ visible: false, uri: "", title: "" });
  const [rejectPayment, setRejectPayment] = useState<Payment | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const previousPending = useRef<number | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const stored = (await SecureStore.getItemAsync(TOKEN_KEY)) || "";
        if (stored) setToken(stored);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const signOutLocal = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
    setToken("");
    setPayments([]);
    setMetrics({});
    previousPending.current = null;
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setRefreshing(true);
      setError("");
      try {
        const [listData, metricData, pendingData] = await Promise.all([
          api({ action: "admin_list", admin_token: token, status: filter }),
          api({ action: "admin_metrics", admin_token: token }),
          filter === "pending"
            ? Promise.resolve(null)
            : api({ action: "admin_list", admin_token: token, status: "pending" }),
        ]);
        const list = Array.isArray(listData.payments) ? listData.payments : [];
        setPayments(list);
        setMetrics(metricData.metrics || {});
        const pendingList = filter === "pending" ? list : Array.isArray(pendingData?.payments) ? pendingData.payments : [];
        const count = pendingList.length;
        if (previousPending.current !== null && count > previousPending.current) {
          Vibration.vibrate([0, 180, 100, 260]);
          setMessage(`Ada ${count - previousPending.current} pembayaran baru menunggu verifikasi.`);
        }
        previousPending.current = count;
      } catch (e) {
        const text = e instanceof Error ? e.message : "Data admin belum dapat dimuat.";
        setError(text);
        if (/sesi admin/i.test(text)) await signOutLocal();
      } finally {
        setRefreshing(false);
      }
    },
    [filter, signOutLocal, token],
  );

  useEffect(() => {
    if (!token) return;
    void load(false);
  }, [filter, load, token]);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (appState.current === "active") void load(true);
      }, POLL_MS);
    };
    start();
    const sub = AppState.addEventListener("change", (next) => {
      appState.current = next;
      if (next === "active") void load(true);
    });
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [load, token]);

  async function login() {
    if (!username.trim() || !password) {
      setError("Isi username dan password admin.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await api({ action: "admin_login", username: username.trim(), password });
      const raw = String(data.admin_token || "");
      if (!raw) throw new Error("Token admin tidak diterima.");
      await SecureStore.setItemAsync(TOKEN_KEY, raw);
      setToken(raw);
      setPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login admin gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      if (token) await api({ action: "admin_logout", admin_token: token });
    } catch {}
    await signOutLocal();
  }

  async function openProof(payment: Payment) {
    setBusy(true);
    setError("");
    try {
      const data = await api({ action: "admin_proof", admin_token: token, payment_id: payment.id });
      setProof({
        visible: true,
        uri: `data:${data.proof.mime};base64,${data.proof.base64}`,
        title: `${payment.nickname || "Peserta"} · ${productLabel(payment.product_type)}`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bukti pembayaran belum dapat dibuka.");
    } finally {
      setBusy(false);
    }
  }

  function approve(payment: Payment) {
    const effect = payment.product_type === "premium_report" ? "membuka Premium untuk hasil yang dipilih" : "menambahkan 1 kredit Ranked Attempt";
    Alert.alert("Setujui pembayaran?", `${payment.nickname || "Peserta"}\n${rupiah(payment.amount)}\n\nPersetujuan akan ${effect}.`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Setujui",
        onPress: () => void review(payment, "approved", ""),
      },
    ]);
  }

  async function review(payment: Payment, decision: "approved" | "rejected", note: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api({ action: "admin_review", admin_token: token, payment_id: payment.id, decision, note });
      setMessage(decision === "approved" ? `Pembayaran ${payment.nickname || "peserta"} disetujui.` : `Pembayaran ${payment.nickname || "peserta"} ditolak.`);
      setRejectPayment(null);
      setRejectNote("");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pembayaran belum dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <StatusBar style="light" />
        <Text style={styles.goldLogo}>ALZAVA</Text>
        <Text style={styles.muted}>Menyiapkan Admin…</Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.loginWrap}>
          <View style={styles.brandMark}><Text style={styles.brandA}>A</Text></View>
          <Text style={styles.loginTitle}>ALZAVA Admin</Text>
          <Text style={styles.loginSubtitle}>Verifikasi pembayaran Battle IQ langsung dari HP.</Text>
          <View style={styles.loginCard}>
            <Text style={styles.label}>Username Admin</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="username"
              placeholderTextColor="#64748b"
            />
            <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              style={styles.input}
              placeholder="password admin"
              placeholderTextColor="#64748b"
              onSubmitEditing={() => void login()}
            />
            {!!error && <Text style={styles.errorBox}>{error}</Text>}
            <Pressable disabled={busy} onPress={() => void login()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{busy ? "Memeriksa…" : "Masuk Admin"}</Text>
            </Pressable>
          </View>
          <Text style={styles.securityText}>Token sesi disimpan terenkripsi di Android Keystore. Password tidak disimpan di aplikasi.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pending = Number(metrics.pending_payments ?? (filter === "pending" ? payments.length : 0));
  const filters: Array<[Filter, string]> = [["pending", "Menunggu"], ["approved", "Disetujui"], ["rejected", "Ditolak"], ["all", "Semua"]];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <RNStatusBar backgroundColor="#020817" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(false)} tintColor="#d4af37" colors={["#d4af37"]} />}
      >
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.smallMark}><Text style={styles.smallMarkText}>A</Text></View>
            <View>
              <Text style={styles.headerTitle}>ALZAVA Admin</Text>
              <Text style={styles.headerSub}>Payment Control Center</Text>
            </View>
          </View>
          <Pressable onPress={() => void logout()} style={styles.ghostButton}><Text style={styles.ghostText}>Keluar</Text></Pressable>
        </View>

        <View style={styles.alertCard}>
          <View style={styles.alertBadge}><Text style={styles.alertNumber}>{pending}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{pending > 0 ? "Pembayaran menunggu" : "Antrean bersih"}</Text>
            <Text style={styles.alertText}>{pending > 0 ? "Periksa bukti lalu setujui agar peserta dapat lanjut tanpa menunggu lama." : "Belum ada pembayaran yang perlu diverifikasi."}</Text>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <Metric label="Peserta" value={Number(metrics.participants || 0).toLocaleString("id-ID")} />
          <Metric label="Selesai Tes" value={Number(metrics.season_completers || 0).toLocaleString("id-ID")} />
          <Metric label="Ranked Terjual" value={Number(metrics.approved_attempt_sales || 0).toLocaleString("id-ID")} />
          <Metric label="Premium Terjual" value={Number(metrics.approved_premium_sales || 0).toLocaleString("id-ID")} />
          <Metric label="Pendapatan Gross" value={rupiah(metrics.gross_revenue)} wide />
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.eyebrow}>TRANSAKSI</Text><Text style={styles.sectionTitle}>Konfirmasi Pembayaran</Text></View>
          <Pressable onPress={() => void load(false)} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Muat ulang</Text></Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map(([value, label]) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {!!error && <Text style={styles.errorBox}>{error}</Text>}
        {!!message && <Text style={styles.successBox}>{message}</Text>}

        <View style={styles.list}>
          {payments.length === 0 ? (
            <View style={styles.emptyCard}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>Tidak ada pembayaran</Text><Text style={styles.muted}>Tarik layar ke bawah untuk memperbarui.</Text></View>
          ) : payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentTop}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.nickname}>{payment.nickname || "Peserta"}</Text>
                    <Text style={[styles.productBadge, payment.product_type === "premium_report" ? styles.premiumBadge : styles.rankedBadge]}>{productLabel(payment.product_type)}</Text>
                  </View>
                  <Text style={styles.location}>{[payment.district_name, payment.regency_name, payment.province_name].filter(Boolean).join(" · ") || "Lokasi tidak tersedia"}</Text>
                  <Text style={styles.time}>{timeLabel(payment.created_at)}</Text>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amount}>{rupiah(payment.amount)}</Text>
                  <Text style={styles.payer}>Pembayar: {payment.payer_name || "—"}</Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={[styles.statusBadge, payment.status === "approved" ? styles.statusApproved : payment.status === "rejected" ? styles.statusRejected : styles.statusPending]}>{String(payment.status || "pending").toUpperCase()}</Text>
                {payment.admin_note ? <Text style={styles.note}>Catatan: {payment.admin_note}</Text> : null}
              </View>

              <View style={styles.actionRow}>
                <Pressable disabled={busy} onPress={() => void openProof(payment)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Lihat Bukti</Text></Pressable>
                {payment.status === "pending" && (
                  <>
                    <Pressable disabled={busy} onPress={() => approve(payment)} style={styles.approveButton}><Text style={styles.approveText}>✓ Setujui</Text></Pressable>
                    <Pressable disabled={busy} onPress={() => { setRejectPayment(payment); setRejectNote(""); }} style={styles.rejectButton}><Text style={styles.rejectText}>Tolak</Text></Pressable>
                  </>
                )}
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.pollText}>Aplikasi mengecek pembayaran baru otomatis setiap 12 detik selama terbuka.</Text>
      </ScrollView>

      <Modal visible={proof.visible} transparent animationType="fade" onRequestClose={() => setProof({ visible: false, uri: "", title: "" })}>
        <View style={styles.modalBackdrop}>
          <View style={styles.proofModal}>
            <Text style={styles.modalTitle}>{proof.title}</Text>
            <Image source={{ uri: proof.uri }} resizeMode="contain" style={styles.proofImage} />
            <Pressable onPress={() => setProof({ visible: false, uri: "", title: "" })} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Tutup Bukti</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(rejectPayment)} transparent animationType="slide" onRequestClose={() => setRejectPayment(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rejectModal}>
            <Text style={styles.modalTitle}>Tolak pembayaran?</Text>
            <Text style={styles.modalSub}>{rejectPayment?.nickname || "Peserta"} · {rupiah(rejectPayment?.amount)}</Text>
            <TextInput
              value={rejectNote}
              onChangeText={setRejectNote}
              multiline
              maxLength={300}
              placeholder="Alasan penolakan (opsional)"
              placeholderTextColor="#64748b"
              style={[styles.input, styles.noteInput]}
            />
            <View style={styles.actionRow}>
              <Pressable onPress={() => setRejectPayment(null)} style={[styles.secondaryButton, { flex: 1 }]}><Text style={styles.secondaryText}>Batal</Text></Pressable>
              <Pressable disabled={busy} onPress={() => rejectPayment && void review(rejectPayment, "rejected", rejectNote)} style={[styles.rejectButton, { flex: 1 }]}><Text style={styles.rejectText}>Tolak Pembayaran</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <View style={[styles.metricCard, wide && styles.metricWide]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020817" },
  centerScreen: { flex: 1, backgroundColor: "#020817", alignItems: "center", justifyContent: "center", gap: 8 },
  content: { padding: 16, paddingBottom: 42, backgroundColor: "#020817" },
  loginWrap: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#020817" },
  brandMark: { width: 76, height: 76, borderRadius: 24, alignSelf: "center", alignItems: "center", justifyContent: "center", backgroundColor: "#14110a", borderWidth: 1, borderColor: "#d4af3760", marginBottom: 18 },
  brandA: { color: "#f6cf58", fontSize: 38, fontWeight: "900" },
  goldLogo: { color: "#d4af37", fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  loginTitle: { color: "white", textAlign: "center", fontSize: 32, fontWeight: "900" },
  loginSubtitle: { color: "#94a3b8", textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 21 },
  loginCard: { backgroundColor: "#08162f", borderRadius: 24, borderWidth: 1, borderColor: "#ffffff18", padding: 20 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#ffffff1f", backgroundColor: "#030b1f", color: "white", paddingHorizontal: 14, fontSize: 16 },
  primaryButton: { minHeight: 50, marginTop: 18, borderRadius: 14, backgroundColor: "#6d4aff", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "white", fontWeight: "900", fontSize: 15 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  securityText: { color: "#64748b", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallMark: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#171309", borderWidth: 1, borderColor: "#d4af3750", alignItems: "center", justifyContent: "center" },
  smallMarkText: { color: "#f5cf61", fontWeight: "900", fontSize: 22 },
  headerTitle: { color: "white", fontSize: 19, fontWeight: "900" },
  headerSub: { color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.1, marginTop: 2 },
  ghostButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: "#ffffff1a", backgroundColor: "#ffffff08" },
  ghostText: { color: "#cbd5e1", fontWeight: "700" },
  alertCard: { flexDirection: "row", gap: 14, alignItems: "center", borderRadius: 22, padding: 17, backgroundColor: "#111c39", borderWidth: 1, borderColor: "#22d3ee2e", marginBottom: 14 },
  alertBadge: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#22d3ee18", borderWidth: 1, borderColor: "#22d3ee40" },
  alertNumber: { color: "#67e8f9", fontWeight: "900", fontSize: 25 },
  alertTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  alertText: { color: "#94a3b8", fontSize: 12, lineHeight: 18, marginTop: 3 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  metricCard: { width: "48.5%", borderRadius: 18, padding: 14, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff12" },
  metricWide: { width: "100%", borderColor: "#d4af3735", backgroundColor: "#17140d" },
  metricLabel: { color: "#64748b", fontSize: 11, fontWeight: "700" },
  metricValue: { color: "white", fontSize: 22, fontWeight: "900", marginTop: 5 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  eyebrow: { color: "#67e8f9", fontSize: 10, fontWeight: "900", letterSpacing: 1.7 },
  sectionTitle: { color: "white", fontSize: 23, fontWeight: "900", marginTop: 3 },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#ffffff0b" },
  refreshText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  filterRow: { gap: 8, paddingBottom: 15 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#ffffff18", backgroundColor: "#ffffff08" },
  filterChipActive: { backgroundColor: "#f8fafc", borderColor: "#f8fafc" },
  filterText: { color: "#94a3b8", fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: "#0f172a" },
  errorBox: { color: "#fecdd3", backgroundColor: "#fb71851b", borderWidth: 1, borderColor: "#fb718542", borderRadius: 13, padding: 12, marginTop: 12, lineHeight: 18 },
  successBox: { color: "#bbf7d0", backgroundColor: "#22c55e19", borderWidth: 1, borderColor: "#22c55e40", borderRadius: 13, padding: 12, marginBottom: 12, lineHeight: 18 },
  list: { gap: 12 },
  emptyCard: { padding: 34, borderRadius: 22, alignItems: "center", backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff12" },
  emptyIcon: { color: "#34d399", fontSize: 30, fontWeight: "900" },
  emptyTitle: { color: "white", fontWeight: "900", fontSize: 17, marginTop: 8, marginBottom: 4 },
  muted: { color: "#64748b", fontSize: 12 },
  paymentCard: { borderRadius: 22, padding: 16, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff15" },
  paymentTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 },
  nickname: { color: "white", fontSize: 18, fontWeight: "900" },
  productBadge: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  premiumBadge: { color: "#ddd6fe", backgroundColor: "#8b5cf62b" },
  rankedBadge: { color: "#a5f3fc", backgroundColor: "#06b6d42b" },
  location: { color: "#94a3b8", fontSize: 11, lineHeight: 17, marginTop: 6 },
  time: { color: "#64748b", fontSize: 10, marginTop: 3 },
  amountBox: { alignItems: "flex-end", maxWidth: 132 },
  amount: { color: "#f8fafc", fontWeight: "900", fontSize: 17 },
  payer: { color: "#64748b", fontSize: 10, marginTop: 4, textAlign: "right" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 },
  statusBadge: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: "900" },
  statusPending: { color: "#fde68a", backgroundColor: "#f59e0b24" },
  statusApproved: { color: "#bbf7d0", backgroundColor: "#22c55e24" },
  statusRejected: { color: "#fecdd3", backgroundColor: "#fb718524" },
  note: { color: "#94a3b8", fontSize: 10, flexShrink: 1 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  secondaryButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "#ffffff1f", backgroundColor: "#ffffff08", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: "#e2e8f0", fontSize: 12, fontWeight: "800" },
  approveButton: { minHeight: 42, borderRadius: 12, backgroundColor: "#059669", paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  approveText: { color: "white", fontSize: 12, fontWeight: "900" },
  rejectButton: { minHeight: 42, borderRadius: 12, backgroundColor: "#be123c", paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  rejectText: { color: "white", fontSize: 12, fontWeight: "900" },
  pollText: { color: "#475569", textAlign: "center", fontSize: 10, lineHeight: 16, marginTop: 18 },
  modalBackdrop: { flex: 1, backgroundColor: "#000000d9", padding: 18, justifyContent: "center" },
  proofModal: { maxHeight: "92%", borderRadius: 24, padding: 16, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff20" },
  rejectModal: { borderRadius: 24, padding: 20, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff20" },
  modalTitle: { color: "white", fontSize: 19, fontWeight: "900" },
  modalSub: { color: "#94a3b8", marginTop: 5, marginBottom: 14 },
  proofImage: { width: "100%", height: 520, borderRadius: 16, backgroundColor: "#020817", marginTop: 12 },
  noteInput: { minHeight: 110, textAlignVertical: "top", paddingTop: 13 },
});

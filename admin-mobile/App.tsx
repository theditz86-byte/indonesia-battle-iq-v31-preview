import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SecureStore from "expo-secure-store";

const ADMIN_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-admin";
const PUBLIC_API_URL = "https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-public";
const TOKEN_KEY = "alzava-battle-iq.admin-token.v1";
const POLL_MS = 12000;
const LOGO = require("./assets/alzava-logo.png");

type Filter = "pending" | "approved" | "rejected" | "all";
type AdminTab = "payments" | "ranking";
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
type LeaderboardEntry = {
  participant_public_id?: string;
  nickname?: string;
  avatar_url?: string | null;
  province_name?: string;
  regency_name?: string;
  district_name?: string;
  battle_score?: number;
  correct_count?: number;
  question_count?: number;
  duration_ms?: number;
  national_rank?: number;
  scope_rank?: number;
  iq_estimate?: number;
  high_range_attempted?: boolean;
};
type Season = {
  id?: string;
  season_number?: number;
  label?: string;
  starts_at?: string;
  ends_at?: string;
  status?: string;
};
type ProofState = { visible: boolean; uri: string; title: string };

async function adminApi(body: Record<string, unknown>) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Permintaan admin gagal.");
  return data;
}

async function leaderboardApi() {
  const response = await fetch(PUBLIC_API_URL, { method: "GET" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Peringkat belum dapat dimuat.");
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

function durationLabel(ms?: number) {
  const sec = Math.max(0, Math.round(Number(ms || 0) / 1000));
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${String(rem).padStart(2, "0")}`;
}

function initials(name?: string) {
  return (name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

function rankIcon(rank: number) {
  if (rank === 1) return "🏆";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

export default function App() {
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const tablet = width >= 700;
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<AdminTab>("payments");
  const [filter, setFilter] = useState<Filter>("pending");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({});
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
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
    setEntries([]);
    setSeason(null);
    previousPending.current = null;
  }, []);

  const loadLeaderboard = useCallback(async (silent = false) => {
    if (!silent) setRankingLoading(true);
    try {
      const data = await leaderboardApi();
      const list = Array.isArray(data.entries) ? data.entries.slice(0, 50) : [];
      setEntries(list);
      setSeason(data.season || null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Peringkat belum dapat dimuat.");
    } finally {
      if (!silent) setRankingLoading(false);
    }
  }, []);

  const loadAdmin = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (!silent) setRefreshing(true);
      setError("");
      try {
        const [listData, metricData, pendingData] = await Promise.all([
          adminApi({ action: "admin_list", admin_token: token, status: filter }),
          adminApi({ action: "admin_metrics", admin_token: token }),
          filter === "pending"
            ? Promise.resolve(null)
            : adminApi({ action: "admin_list", admin_token: token, status: "pending" }),
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
        if (!silent) setRefreshing(false);
      }
    },
    [filter, signOutLocal, token],
  );

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAdmin(true), loadLeaderboard(true)]);
    setRefreshing(false);
  }, [loadAdmin, loadLeaderboard]);

  useEffect(() => {
    if (!token) return;
    void loadAdmin(false);
  }, [filter, loadAdmin, token]);

  useEffect(() => {
    if (!token) return;
    void loadLeaderboard(false);
  }, [loadLeaderboard, token]);

  useEffect(() => {
    if (!token) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (appState.current === "active") void loadAdmin(true);
      }, POLL_MS);
    };
    start();
    const sub = AppState.addEventListener("change", (next) => {
      appState.current = next;
      if (next === "active") {
        void loadAdmin(true);
        void loadLeaderboard(true);
      }
    });
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [loadAdmin, loadLeaderboard, token]);

  async function login() {
    if (!username.trim() || !password) {
      setError("Isi username dan password admin.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await adminApi({ action: "admin_login", username: username.trim(), password });
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
      if (token) await adminApi({ action: "admin_logout", admin_token: token });
    } catch {}
    await signOutLocal();
  }

  async function openProof(payment: Payment) {
    setBusy(true);
    setError("");
    try {
      const data = await adminApi({ action: "admin_proof", admin_token: token, payment_id: payment.id });
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
      { text: "Setujui", onPress: () => void review(payment, "approved", "") },
    ]);
  }

  async function review(payment: Payment, decision: "approved" | "rejected", note: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await adminApi({ action: "admin_review", admin_token: token, payment_id: payment.id, decision, note });
      setMessage(decision === "approved" ? `Pembayaran ${payment.nickname || "peserta"} disetujui.` : `Pembayaran ${payment.nickname || "peserta"} ditolak.`);
      setRejectPayment(null);
      setRejectNote("");
      await loadAdmin(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pembayaran belum dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  const pending = Number(metrics.pending_payments ?? (filter === "pending" ? payments.length : 0));
  const top50 = useMemo(
    () => [...entries].sort((a, b) => Number(a.national_rank || a.scope_rank || 999) - Number(b.national_rank || b.scope_rank || 999)).slice(0, 50),
    [entries],
  );
  const podium = top50.slice(0, 3);

  if (booting) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <StatusBar style="light" />
        <Image source={LOGO} style={styles.bootLogo} resizeMode="contain" />
        <Text style={styles.goldLogo}>ALZAVA</Text>
        <Text style={styles.muted}>Menyiapkan Admin…</Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <RNStatusBar backgroundColor="#020817" />
        <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.loginWrap, tablet && styles.tabletCardWidth]}>
            <View style={styles.logoHalo}>
              <Image source={LOGO} style={styles.loginLogo} resizeMode="contain" />
            </View>
            <Text style={styles.loginTitle}>ALZAVA Battle IQ</Text>
            <Text style={styles.loginAdmin}>ADMIN CONTROL</Text>
            <Text style={styles.loginSubtitle}>Konfirmasi pembayaran dan pantau peringkat nasional langsung dari HP.</Text>
            <View style={styles.loginCard}>
              <Text style={styles.label}>Username Admin</Text>
              <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} style={styles.input} placeholder="username" placeholderTextColor="#64748b" />
              <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" style={styles.input} placeholder="password admin" placeholderTextColor="#64748b" onSubmitEditing={() => void login()} />
              {!!error && <Text style={styles.errorBox}>{error}</Text>}
              <Pressable disabled={busy} onPress={() => void login()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, busy && styles.disabled]}>
                <Text style={styles.primaryButtonText}>{busy ? "Memeriksa…" : "Masuk Admin"}</Text>
              </Pressable>
            </View>
            <Text style={styles.securityText}>Token sesi disimpan terenkripsi di Android Keystore. Password admin tidak disimpan di aplikasi.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const filters: Array<[Filter, string]> = [["pending", "Menunggu"], ["approved", "Disetujui"], ["rejected", "Ditolak"], ["all", "Semua"]];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <RNStatusBar backgroundColor="#020817" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: compact ? 12 : 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refreshAll()} tintColor="#d4af37" colors={["#d4af37"]} />}
      >
        <View style={[styles.maxContent, tablet && styles.tabletContent]}>
          <View style={styles.header}>
            <View style={styles.headerBrand}>
              <Image source={LOGO} style={styles.headerLogo} resizeMode="contain" />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.headerTitle}>ALZAVA Battle IQ</Text>
                <Text style={styles.headerSub}>Admin Control Center</Text>
              </View>
            </View>
            <Pressable onPress={() => void logout()} style={styles.ghostButton}><Text style={styles.ghostText}>Keluar</Text></Pressable>
          </View>

          <View style={styles.tabBar}>
            <Pressable onPress={() => setTab("payments")} style={[styles.tabButton, tab === "payments" && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === "payments" && styles.tabTextActive]}>Pembayaran</Text>
              {pending > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pending > 99 ? "99+" : pending}</Text></View>}
            </Pressable>
            <Pressable onPress={() => setTab("ranking")} style={[styles.tabButton, tab === "ranking" && styles.tabButtonActive]}>
              <Text style={[styles.tabText, tab === "ranking" && styles.tabTextActive]}>Peringkat</Text>
            </Pressable>
          </View>

          {!!error && <Text style={styles.errorBox}>{error}</Text>}
          {!!message && <Text style={styles.successBox}>{message}</Text>}

          {tab === "payments" ? (
            <PaymentsView
              pending={pending}
              metrics={metrics}
              filters={filters}
              filter={filter}
              setFilter={setFilter}
              payments={payments}
              busy={busy}
              onRefresh={() => void loadAdmin(false)}
              onProof={(payment) => void openProof(payment)}
              onApprove={approve}
              onReject={(payment) => { setRejectPayment(payment); setRejectNote(""); }}
            />
          ) : (
            <RankingView
              entries={top50}
              podium={podium}
              season={season}
              loading={rankingLoading}
              compact={compact}
              onRefresh={() => void loadLeaderboard(false)}
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={proof.visible} transparent animationType="fade" onRequestClose={() => setProof({ visible: false, uri: "", title: "" })}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.proofModal, tablet && styles.modalTablet]}>
            <Text style={styles.modalTitle}>{proof.title}</Text>
            <Image source={{ uri: proof.uri }} resizeMode="contain" style={[styles.proofImage, { height: Math.min(520, Math.max(300, width * 1.05)) }]} />
            <Pressable onPress={() => setProof({ visible: false, uri: "", title: "" })} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Tutup Bukti</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(rejectPayment)} transparent animationType="slide" onRequestClose={() => setRejectPayment(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.rejectModal, tablet && styles.modalTablet]}>
            <Text style={styles.modalTitle}>Tolak pembayaran?</Text>
            <Text style={styles.modalSub}>{rejectPayment?.nickname || "Peserta"} · {rupiah(rejectPayment?.amount)}</Text>
            <TextInput value={rejectNote} onChangeText={setRejectNote} multiline maxLength={300} placeholder="Alasan penolakan (opsional)" placeholderTextColor="#64748b" style={[styles.input, styles.noteInput]} />
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

function PaymentsView({
  pending, metrics, filters, filter, setFilter, payments, busy, onRefresh, onProof, onApprove, onReject,
}: {
  pending: number;
  metrics: Metrics;
  filters: Array<[Filter, string]>;
  filter: Filter;
  setFilter: (value: Filter) => void;
  payments: Payment[];
  busy: boolean;
  onRefresh: () => void;
  onProof: (payment: Payment) => void;
  onApprove: (payment: Payment) => void;
  onReject: (payment: Payment) => void;
}) {
  return (
    <>
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
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>TRANSAKSI</Text><Text style={styles.sectionTitle}>Konfirmasi Pembayaran</Text></View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}><Text style={styles.refreshText}>↻ Muat ulang</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map(([value, label]) => (
          <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {payments.length === 0 ? (
          <View style={styles.emptyCard}><Text style={styles.emptyIcon}>✓</Text><Text style={styles.emptyTitle}>Tidak ada pembayaran</Text><Text style={styles.muted}>Tarik layar ke bawah untuk memperbarui.</Text></View>
        ) : payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentTop}>
              <View style={{ flex: 1, paddingRight: 10 }}>
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
              <Pressable disabled={busy} onPress={() => onProof(payment)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Lihat Bukti</Text></Pressable>
              {payment.status === "pending" && (
                <>
                  <Pressable disabled={busy} onPress={() => onApprove(payment)} style={styles.approveButton}><Text style={styles.approveText}>✓ Setujui</Text></Pressable>
                  <Pressable disabled={busy} onPress={() => onReject(payment)} style={styles.rejectButton}><Text style={styles.rejectText}>Tolak</Text></Pressable>
                </>
              )}
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.pollText}>Aplikasi mengecek pembayaran baru otomatis setiap 12 detik selama terbuka.</Text>
    </>
  );
}

function RankingView({
  entries, podium, season, loading, compact, onRefresh,
}: {
  entries: LeaderboardEntry[];
  podium: LeaderboardEntry[];
  season: Season | null;
  loading: boolean;
  compact: boolean;
  onRefresh: () => void;
}) {
  const first = podium[0];
  const second = podium[1];
  const third = podium[2];
  return (
    <>
      <View style={styles.rankingHero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrowGold}>NATIONAL LEADERBOARD</Text>
          <Text style={styles.rankingHeroTitle}>Peringkat ALZAVA Battle IQ</Text>
          <Text style={styles.rankingHeroSub}>{season?.label || `Season ${season?.season_number || "Aktif"}`} · Top 50 peserta terverifikasi</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton}><Text style={styles.refreshText}>{loading ? "Memuat…" : "↻ Segarkan"}</Text></Pressable>
      </View>

      {first ? (
        <View style={styles.podiumWrap}>
          <Text style={styles.podiumLabel}>PODIUM NASIONAL</Text>
          <PodiumCard entry={first} rank={1} champion />
          <View style={[styles.podiumRunnerRow, compact && styles.podiumRunnerColumn]}>
            {second && <PodiumCard entry={second} rank={2} />}
            {third && <PodiumCard entry={third} rank={3} />}
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Peringkat belum tersedia</Text><Text style={styles.muted}>Segarkan kembali setelah ada peserta yang menyelesaikan tes.</Text></View>
      )}

      <View style={styles.top50Header}>
        <View><Text style={styles.eyebrow}>KLASEMEN</Text><Text style={styles.sectionTitle}>Top 50 Peserta</Text></View>
        <Text style={styles.top50Count}>{entries.length}/50</Text>
      </View>

      <View style={styles.rankList}>
        {entries.map((entry, index) => {
          const rank = Number(entry.national_rank || entry.scope_rank || index + 1);
          return <RankRow key={entry.participant_public_id || `${entry.nickname}-${rank}`} entry={entry} rank={rank} />;
        })}
      </View>
      <Text style={styles.pollText}>Peringkat bersumber dari leaderboard season aktif dan menampilkan maksimal 50 peserta teratas.</Text>
    </>
  );
}

function PodiumCard({ entry, rank, champion = false }: { entry: LeaderboardEntry; rank: number; champion?: boolean }) {
  return (
    <View style={[styles.podiumCard, champion && styles.podiumChampion]}>
      <View style={[styles.podiumAvatar, champion && styles.podiumAvatarChampion]}>
        {entry.avatar_url ? <Image source={{ uri: entry.avatar_url }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials(entry.nickname)}</Text>}
      </View>
      <Text style={[styles.podiumRank, champion && styles.podiumRankChampion]}>{rankIcon(rank)}</Text>
      <Text numberOfLines={1} style={[styles.podiumName, champion && styles.podiumNameChampion]}>{entry.nickname || "Peserta"}</Text>
      <Text numberOfLines={1} style={styles.podiumLocation}>{entry.regency_name || entry.province_name || "Indonesia"}</Text>
      <View style={styles.podiumStats}>
        <View><Text style={styles.podiumStatLabel}>IQ</Text><Text style={styles.podiumStatValue}>{entry.iq_estimate ?? "—"}</Text></View>
        <View><Text style={styles.podiumStatLabel}>SKOR</Text><Text style={styles.podiumStatValueCyan}>{Number(entry.battle_score || 0).toLocaleString("id-ID")}</Text></View>
      </View>
    </View>
  );
}

function RankRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  return (
    <View style={[styles.rankRow, rank <= 3 && styles.rankRowTop]}>
      <View style={[styles.rankNumberBox, rank === 1 ? styles.rankGold : rank === 2 ? styles.rankSilver : rank === 3 ? styles.rankBronze : null]}>
        <Text style={styles.rankNumberText}>{rank <= 3 ? rankIcon(rank) : rank}</Text>
      </View>
      <View style={styles.rankAvatar}>
        {entry.avatar_url ? <Image source={{ uri: entry.avatar_url }} style={styles.avatarImage} /> : <Text style={styles.rankAvatarText}>{initials(entry.nickname)}</Text>}
      </View>
      <View style={styles.rankIdentity}>
        <Text numberOfLines={1} style={styles.rankName}>{entry.nickname || "Peserta"}</Text>
        <Text numberOfLines={1} style={styles.rankLocation}>{[entry.regency_name, entry.province_name].filter(Boolean).join(" · ") || "Indonesia"}</Text>
      </View>
      <View style={styles.rankIQ}><Text style={styles.rankMiniLabel}>IQ</Text><Text style={styles.rankIQValue}>{entry.iq_estimate ?? "—"}</Text></View>
      <View style={styles.rankScore}><Text style={styles.rankMiniLabel}>SKOR</Text><Text style={styles.rankScoreValue}>{Number(entry.battle_score || 0).toLocaleString("id-ID")}</Text><Text style={styles.rankMeta}>{entry.correct_count ?? 0}/{entry.question_count ?? 0} · {durationLabel(entry.duration_ms)}</Text></View>
    </View>
  );
}

function Metric({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <View style={[styles.metricCard, wide && styles.metricWide]}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#020817" },
  centerScreen: { flex: 1, backgroundColor: "#020817", alignItems: "center", justifyContent: "center", gap: 8 },
  content: { paddingTop: 14, paddingBottom: 48, backgroundColor: "#020817" },
  maxContent: { width: "100%", alignSelf: "center" },
  tabletContent: { maxWidth: 820 },
  loginScroll: { flexGrow: 1, justifyContent: "center", paddingVertical: 30 },
  loginWrap: { width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: 22, justifyContent: "center" },
  tabletCardWidth: { maxWidth: 520 },
  bootLogo: { width: 86, height: 86 },
  logoHalo: { width: 100, height: 100, borderRadius: 32, alignSelf: "center", alignItems: "center", justifyContent: "center", backgroundColor: "#14110a", borderWidth: 1, borderColor: "#d4af3760", marginBottom: 16 },
  loginLogo: { width: 82, height: 82 },
  goldLogo: { color: "#d4af37", fontSize: 22, fontWeight: "900", letterSpacing: 4 },
  loginTitle: { color: "white", textAlign: "center", fontSize: 30, fontWeight: "900" },
  loginAdmin: { color: "#d4af37", textAlign: "center", marginTop: 4, fontSize: 11, fontWeight: "900", letterSpacing: 2.2 },
  loginSubtitle: { color: "#94a3b8", textAlign: "center", marginTop: 9, marginBottom: 24, lineHeight: 21 },
  loginCard: { backgroundColor: "#08162f", borderRadius: 24, borderWidth: 1, borderColor: "#ffffff18", padding: 20 },
  label: { color: "#cbd5e1", fontSize: 13, fontWeight: "700", marginBottom: 7 },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: "#ffffff1f", backgroundColor: "#030b1f", color: "white", paddingHorizontal: 14, fontSize: 16 },
  primaryButton: { minHeight: 50, marginTop: 18, borderRadius: 14, backgroundColor: "#6d4aff", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryButtonText: { color: "white", fontWeight: "900", fontSize: 15 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.55 },
  securityText: { color: "#64748b", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerLogo: { width: 48, height: 48 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  headerSub: { color: "#d4af37", fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 2, fontWeight: "800" },
  ghostButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: "#ffffff1a", backgroundColor: "#ffffff08" },
  ghostText: { color: "#cbd5e1", fontWeight: "700", fontSize: 12 },
  tabBar: { flexDirection: "row", padding: 4, borderRadius: 17, backgroundColor: "#081126", borderWidth: 1, borderColor: "#ffffff12", marginBottom: 16 },
  tabButton: { flex: 1, minHeight: 46, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  tabButtonActive: { backgroundColor: "#f8fafc" },
  tabText: { color: "#94a3b8", fontWeight: "900", fontSize: 13 },
  tabTextActive: { color: "#0f172a" },
  tabBadge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  tabBadgeText: { color: "white", fontSize: 10, fontWeight: "900" },
  alertCard: { flexDirection: "row", gap: 14, alignItems: "center", borderRadius: 22, padding: 17, backgroundColor: "#111c39", borderWidth: 1, borderColor: "#22d3ee2e", marginBottom: 14 },
  alertBadge: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#22d3ee18", borderWidth: 1, borderColor: "#22d3ee40" },
  alertNumber: { color: "#67e8f9", fontWeight: "900", fontSize: 25 },
  alertTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  alertText: { color: "#94a3b8", fontSize: 12, lineHeight: 18, marginTop: 3 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  metricCard: { width: "48%", flexGrow: 1, minWidth: 140, borderRadius: 18, padding: 14, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff12" },
  metricWide: { width: "100%", borderColor: "#d4af3735", backgroundColor: "#17140d" },
  metricLabel: { color: "#64748b", fontSize: 11, fontWeight: "700" },
  metricValue: { color: "white", fontSize: 21, fontWeight: "900", marginTop: 5 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  eyebrow: { color: "#67e8f9", fontSize: 10, fontWeight: "900", letterSpacing: 1.7 },
  eyebrowGold: { color: "#f4d26f", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  sectionTitle: { color: "white", fontSize: 22, fontWeight: "900", marginTop: 3 },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#ffffff0b", borderWidth: 1, borderColor: "#ffffff0d" },
  refreshText: { color: "#cbd5e1", fontSize: 11, fontWeight: "800" },
  filterRow: { gap: 8, paddingBottom: 15 },
  filterChip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "#ffffff18", backgroundColor: "#ffffff08" },
  filterChipActive: { backgroundColor: "#f8fafc", borderColor: "#f8fafc" },
  filterText: { color: "#94a3b8", fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: "#0f172a" },
  errorBox: { color: "#fecdd3", backgroundColor: "#fb71851b", borderWidth: 1, borderColor: "#fb718542", borderRadius: 13, padding: 12, marginBottom: 12, lineHeight: 18 },
  successBox: { color: "#bbf7d0", backgroundColor: "#22c55e19", borderWidth: 1, borderColor: "#22c55e40", borderRadius: 13, padding: 12, marginBottom: 12, lineHeight: 18 },
  list: { gap: 12 },
  emptyCard: { padding: 32, borderRadius: 22, alignItems: "center", backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff12" },
  emptyIcon: { color: "#34d399", fontSize: 30, fontWeight: "900" },
  emptyTitle: { color: "white", fontWeight: "900", fontSize: 17, marginTop: 8, marginBottom: 4 },
  muted: { color: "#64748b", fontSize: 12 },
  paymentCard: { borderRadius: 22, padding: 16, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff15" },
  paymentTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 7 },
  nickname: { color: "white", fontSize: 18, fontWeight: "900" },
  productBadge: { overflow: "hidden", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  premiumBadge: { color: "#ddd6fe", backgroundColor: "#8b5cf62b" },
  rankedBadge: { color: "#a5f3fc", backgroundColor: "#06b6d42b" },
  location: { color: "#94a3b8", fontSize: 11, lineHeight: 17, marginTop: 6 },
  time: { color: "#64748b", fontSize: 10, marginTop: 3 },
  amountBox: { alignItems: "flex-end", maxWidth: 145, marginLeft: "auto" },
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
  rankingHero: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 24, padding: 18, marginBottom: 14, backgroundColor: "#101935", borderWidth: 1, borderColor: "#d4af3738" },
  rankingHeroTitle: { color: "white", fontSize: 23, fontWeight: "900", marginTop: 4 },
  rankingHeroSub: { color: "#94a3b8", fontSize: 12, marginTop: 6 },
  podiumWrap: { borderRadius: 26, padding: 14, backgroundColor: "#07142b", borderWidth: 1, borderColor: "#ffffff13", marginBottom: 22 },
  podiumLabel: { color: "#64748b", textAlign: "center", fontSize: 9, fontWeight: "900", letterSpacing: 2, marginBottom: 10 },
  podiumCard: { flex: 1, minWidth: 0, alignItems: "center", borderRadius: 20, padding: 13, backgroundColor: "#0a1832", borderWidth: 1, borderColor: "#ffffff12" },
  podiumChampion: { marginBottom: 10, paddingVertical: 18, backgroundColor: "#19160d", borderColor: "#d4af3750" },
  podiumRunnerRow: { flexDirection: "row", gap: 10 },
  podiumRunnerColumn: { flexDirection: "column" },
  podiumAvatar: { width: 54, height: 54, borderRadius: 27, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#17233e", borderWidth: 1, borderColor: "#ffffff1c" },
  podiumAvatarChampion: { width: 68, height: 68, borderRadius: 34, borderColor: "#d4af3770" },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: "#f8fafc", fontWeight: "900", fontSize: 16 },
  podiumRank: { fontSize: 20, marginTop: 6 },
  podiumRankChampion: { fontSize: 27 },
  podiumName: { color: "white", fontWeight: "900", fontSize: 14, marginTop: 3, maxWidth: "100%" },
  podiumNameChampion: { fontSize: 19 },
  podiumLocation: { color: "#64748b", fontSize: 10, marginTop: 3, maxWidth: "100%" },
  podiumStats: { flexDirection: "row", gap: 24, marginTop: 10 },
  podiumStatLabel: { color: "#64748b", fontSize: 8, fontWeight: "800", textAlign: "center" },
  podiumStatValue: { color: "#f8fafc", fontSize: 17, fontWeight: "900", textAlign: "center" },
  podiumStatValueCyan: { color: "#67e8f9", fontSize: 17, fontWeight: "900", textAlign: "center" },
  top50Header: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 11 },
  top50Count: { color: "#64748b", fontSize: 11, fontWeight: "800" },
  rankList: { gap: 8 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 9, padding: 11, borderRadius: 18, backgroundColor: "#07142b", borderWidth: 1, borderColor: "#ffffff10" },
  rankRowTop: { borderColor: "#d4af3727" },
  rankNumberBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#111a31" },
  rankGold: { backgroundColor: "#8a641720" },
  rankSilver: { backgroundColor: "#94a3b820" },
  rankBronze: { backgroundColor: "#b4530920" },
  rankNumberText: { color: "#e2e8f0", fontSize: 13, fontWeight: "900" },
  rankAvatar: { width: 38, height: 38, borderRadius: 19, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#15233e", borderWidth: 1, borderColor: "#ffffff12" },
  rankAvatarText: { color: "#dbeafe", fontSize: 11, fontWeight: "900" },
  rankIdentity: { flex: 1, minWidth: 0 },
  rankName: { color: "#f8fafc", fontSize: 13, fontWeight: "900" },
  rankLocation: { color: "#64748b", fontSize: 9, marginTop: 2 },
  rankIQ: { width: 40, alignItems: "center" },
  rankScore: { width: 66, alignItems: "flex-end" },
  rankMiniLabel: { color: "#475569", fontSize: 7, fontWeight: "900" },
  rankIQValue: { color: "#f8fafc", fontSize: 14, fontWeight: "900" },
  rankScoreValue: { color: "#67e8f9", fontSize: 13, fontWeight: "900" },
  rankMeta: { color: "#475569", fontSize: 7.5, marginTop: 1 },
  modalBackdrop: { flex: 1, backgroundColor: "#000000dd", padding: 18, justifyContent: "center" },
  proofModal: { maxHeight: "92%", borderRadius: 24, padding: 16, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff20" },
  rejectModal: { borderRadius: 24, padding: 20, backgroundColor: "#08162f", borderWidth: 1, borderColor: "#ffffff20" },
  modalTablet: { width: "100%", maxWidth: 620, alignSelf: "center" },
  modalTitle: { color: "white", fontSize: 19, fontWeight: "900" },
  modalSub: { color: "#94a3b8", marginTop: 5, marginBottom: 14 },
  proofImage: { width: "100%", borderRadius: 16, backgroundColor: "#020817", marginTop: 12 },
  noteInput: { minHeight: 110, textAlignVertical: "top", paddingTop: 13 },
});
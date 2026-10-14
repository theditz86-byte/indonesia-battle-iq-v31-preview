# ALZAVA Hybrid AI V1 — Setup, Biaya, dan Rollback

## Tujuan
V1 menggabungkan Gemini sebagai AI Online utama, Workers AI sebagai fallback bersyarat, serta WebLLM lokal sebagai mode opsional. Login, session, kuota cloud, pertandingan, dan leaderboard tetap menggunakan sistem yang sudah ada.

## Audit biaya dan batas
- Gemini Free Tier: rate limit per proyek/model, tidak bisa tanpa batas.
- Cloudflare Workers AI Free: 10.000 Neurons/hari per akun, reset 00.00 UTC. Jika akun memakai plan Workers Paid, pemakaian melebihi free allocation dapat ditagih. Pastikan plan sebelum mengaktifkan fallback.
- AI Online ALZAVA V1: tetap 3 pertanyaan per akun/hari dan 120 permintaan global/hari. Jangan ubah batas ini sebelum fallback terbukti aman.
- AI Lokal: tanpa biaya API per percakapan, tetapi perlu HTTPS, WebGPU, unduhan model besar, kemampuan GPU/RAM, dan tidak selalu sekuat Gemini.
- Tidak menggunakan rotasi API keys untuk menghindari ketentuan kuota penyedia.

## Frontend
1. Merge perubahan V1 setelah lulus tes dan build.
2. Jika Cloudflare Pages Git-integrated, konfirmasi Deployment produksi main berhasil. Jika Direct Upload, deploy static export di folder out.
3. Login sebagai peserta: pilih AI Online (default) atau AI Lokal (Beta).
4. AI Lokal hanya mengunduh setelah tombol Unduh & aktifkan AI Lokal ditekan dan dukungan WebGPU terdeteksi. Tidak ada inferensi lokal otomatis.
5. Model WebLLM yang digunakan: Qwen2.5-0.5B-Instruct-q4f16_1-MLC (~945 MB VRAM, kebutuhan unduhan/cache tambahan); pustaka diambil secara lazy-load dari @mlc-ai/web-llm@0.2.85. Perhitungan prompt lokal berjalan di browser.

## Cloudflare Worker — aktivasi manual
1. Pada Cloudflare Workers & Pages → alzava-ai → Edit Code: simpan backup Worker Gemini yang sudah berfungsi.
2. Tempel isi file cloudflare/alzava-ai-worker-hybrid-v1.mjs, kemudian Deploy.
3. Pertahankan secret GEMINI_API_KEY dan GATEWAY_ADMIN_TOKEN. Model default adalah gemini-3-flash-preview.
4. Masuk Settings → Bindings → Add binding → Workers AI dan beri nama AI.
5. Periksa Cloudflare Workers Free dan pemakaian Neurons terlebih dahulu. Tambahkan variable AI_FALLBACK_ENABLED dengan nilai true, lalu Deploy.
6. Periksa endpoint https://alzava-ai.theditz86.workers.dev/health dan pastikan workersAiFallbackReady: true. Tidak ada key yang ditampilkan.
7. Uji AI Online peserta; jika Gemini berhasil respons berlabel gemini. Untuk Gemini 429, 5xx, timeout, atau 400 FAILED_PRECONDITION, fallback berhasil berlabel workers-ai.
8. Worker tidak pernah terbuka tanpa token otorisasi backend Supabase. Jangan menyalin atau menaruh token admin di JavaScript frontend.

## Pengujian wajib
- Endpoint Worker tanpa token ditolak.
- Perhatikan batas 3/hari dan 120 global/hari yang belum diubah. Refresh halaman tidak menambah kuota.
- Gemini sukses normal; fallback hanya ketika diizinkan, binding/flag aktif dan Google error layak fallback.
- Browser non-WebGPU mendapat pesan, mode lokal tidak menimbulkan error global.
- Permintaan lokal tidak dikirim ke Supabase sehingga tidak memotong jatah cloud.
- Pembayaran, game, leaderboard, login tetap bekerja; uji desktop dan ponsel.
- Monitor Cloudflare Workers AI usage; bila berbayar, biaya pemakaian di atas gratis adalah tanggung jawab pemilik akun.

## Rollback
- Matikan flag AI_FALLBACK_ENABLED atau rollback Worker ke versi Gemini sebelumnya melalui Cloudflare Deployments.
- Untuk UI, rollback Cloudflare Pages Deployment ke build sebelumnya.
- Bila metadata provider bermasalah, deploy ulang Edge Function Supabase versi 7 (GitHub sebelum V1). V1 tidak membutuhkan migrasi DB.
- Perubahan tidak mengubah tabel akun, password, kuota, pembiayaan, atau leaderboard.

## Referensi
https://developers.cloudflare.com/workers-ai/platform/pricing/
https://developers.cloudflare.com/workers-ai/configuration/bindings/
https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/
https://ai.google.dev/gemini-api/docs/rate-limits
https://github.com/mlc-ai/web-llm

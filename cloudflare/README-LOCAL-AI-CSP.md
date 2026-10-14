# ALZAVA AI Lokal: perbaikan CSP dan kompatibilitas browser

## Mengapa sebelumnya gagal?
Global CSP ALZAVA membatasi script-src ke 'self' dan connect-src ke Supabase. Ini mencegah WebLLM Web Worker memuat pustaka eksternal serta bobot model. Perbaikan memberi CSP tersendiri khusus file /ai/alzava-local-worker.mjs, dan mempertahankan CSP ketat global untuk aplikasi/login.

Kebijakan Worker hanya memperbolehkan skrip esm.run/jsDelivr dan pengunduhan bobot dari Hugging Face/hf.co/Xet. Worker tetap terpisah dari DOM/localStorage/token akun. Tinjau domain sumber dari pustaka eksternal sebelum meningkatkan versi.

## Cara pengujian di browser
- Gunakan HTTPS, Chrome/Edge desktop terbaru, periksa chrome://gpu -> WebGPU: Hardware accelerated.
- Jika WebGPU tidak tersedia, cek pengaturan akselerasi grafis: chrome://settings/system dan restart browser. Jangan memaksa flags eksperimental demi produksi.
- Tekan tab AI Lokal (Beta), pilih Unduh & aktifkan, gunakan Wi-Fi stabil karena file besar.
- Buka browser DevTools Network/Console jika gagal. Pesan ALZAVA sekarang menampilkan kode seperti LIBRARY_BLOCKED, WEBGPU_UNAVAILABLE, MODEL_DOWNLOAD_FAILED, GPU_LIMIT.
- Jika status tidak pernah selesai, uji dengan WebLLM resmi dan periksa apakah model/WebGPU driver didukung.
- Berpindah ke AI Online tetap tersedia, dengan kuota 3 per akun per hari.

## HP
- Android: Chrome terbaru dan GPU/WebGPU kompatibel diperlukan; tidak semua Android mendukung. Sambungkan ke Wi-Fi, jangan pakai mode hemat data, sisakan penyimpanan dan RAM memadai. Android GPU tertentu dapat mengalami device-lost.
- iPhone: Safari iOS 26+ mendukung WebGPU, tetapi memori/kompatibilitas WebLLM dapat membatasi model. Chrome di iOS menggunakan WebKit; jangan berasumsi model pasti dapat jalan.
- HP yang gagal AI Lokal tetap dapat memakai AI Online (kuota cloud berlaku).
- Model lokal 0.5B umumnya jauh lebih lemah daripada Gemini, jadi tidak boleh diberi label kualitas setara.

## Perlindungan
Tidak mengubah token/login, API Cloudflare atau Supabase, kuota, akun, pembayaran, kompetisi, atau skema database. Tidak menyimpan pertanyaan di server untuk AI Lokal. Perubahan hanya CSP Worker lokal dan pesan diagnostik yang sudah disanitasi.

Referensi:
https://developers.cloudflare.com/pages/configuration/headers/
https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
https://webllm.mlc.ai/docs/user/get_started.html

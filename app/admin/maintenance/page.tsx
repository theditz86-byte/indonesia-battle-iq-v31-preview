"use client"

import { AdminMaintenanceControl } from "@/components/admin-maintenance-control"

export default function AdminMaintenancePage(){
  return <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,.12),transparent_32rem),linear-gradient(180deg,#020817,#07142f)] px-4 py-8 text-white sm:px-6">
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Admin · Operasional</p>
        <h1 className="mt-1 text-3xl font-black">Maintenance</h1>
        <p className="mt-2 text-sm text-slate-400">Kontrol status akses situs peserta dari satu halaman khusus.</p>
      </div>
      <AdminMaintenanceControl/>
    </div>
  </main>
}

"use client"

import { useEffect } from "react"

export default function LegacyRoute() {
  useEffect(() => {
    window.location.replace("/account.html")
  }, [])

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#020817",color:"#f8fbff",fontFamily:"system-ui,sans-serif"}}>
      <p>Memuat Akun Peserta…</p>
    </main>
  )
}

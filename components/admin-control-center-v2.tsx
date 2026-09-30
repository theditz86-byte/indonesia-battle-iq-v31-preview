"use client"

import { useEffect, useState } from "react"
import { BookOpenCheck } from "lucide-react"
import { AdminControlCenter } from "@/components/admin-control-center"

const TOKEN_KEY="battle_admin_token"

export function AdminControlCenterV2(){
  const [show,setShow]=useState(false)
  useEffect(()=>{setShow(window.location.pathname.startsWith("/admin")&&Boolean(window.localStorage.getItem(TOKEN_KEY)))},[])
  return <><AdminControlCenter/>{show&&<a href="/admin/bank-soal/" className="fixed bottom-5 left-4 z-[170] inline-flex items-center gap-2 rounded-2xl border border-cyan-300/25 bg-[#07162b]/95 px-4 py-3 text-xs font-black text-cyan-100 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-300/50 lg:left-[286px]"><BookOpenCheck className="h-4 w-4 text-cyan-300"/>Bank Soal SKD</a>}</>
}

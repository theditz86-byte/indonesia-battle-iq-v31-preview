"use client"

import { useEffect, useState } from "react"
import { Swords } from "lucide-react"
import { PvpArena } from "@/components/pvp-arena"
import { PvpResultBridge } from "@/components/pvp-result-bridge"

export function PvpClientOnly(){
  const [mounted,setMounted]=useState(false)
  useEffect(()=>setMounted(true),[])
  if(!mounted){
    return <div className="grid min-h-screen place-items-center bg-[#020817] text-white"><div className="text-center"><Swords className="mx-auto h-10 w-10 animate-pulse text-cyan-300"/><p className="mt-3 text-sm font-bold text-slate-400">Menyiapkan Lobby PVP…</p></div></div>
  }
  return <><PvpResultBridge/><PvpArena/></>
}

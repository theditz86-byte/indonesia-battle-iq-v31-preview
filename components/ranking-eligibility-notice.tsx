"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { BATTLE_API_URL, getParticipantToken } from "@/lib/battle"

type ResultState={
  result?:{
    attempt_id?:string
    ranking_eligible?:boolean
    integrity_status?:string
    battle_score?:number
  }|null
}

export function RankingEligibilityNotice(){
  const [state,setState]=useState<ResultState|null>(null)
  const [visible,setVisible]=useState(false)

  useEffect(()=>{
    if(!window.location.pathname.startsWith("/result")) return
    const token=getParticipantToken()
    if(!token) return
    const attemptId=new URLSearchParams(window.location.search).get("attempt")
    const body={action:"latest_result",...(attemptId?{attempt_id:attemptId}:{})}
    void fetch(BATTLE_API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Battle-Token":token},
      body:JSON.stringify(body),
      cache:"no-store",
    }).then(async r=>{
      if(!r.ok) return null
      return await r.json().catch(()=>null)
    }).then(payload=>{
      const data=(payload?.data||null) as ResultState|null
      setState(data)
      setVisible(Boolean(data?.result && data.result.ranking_eligible===false))
    }).catch(()=>{})
  },[])

  if(!visible||!state?.result) return null
  const flagged=state.result.integrity_status==="flagged"

  return (
    <div className="fixed left-1/2 top-14 z-[190] w-[min(92vw,720px)] -translate-x-1/2 rounded-2xl border border-amber-300/30 bg-[#17130a]/95 p-4 text-amber-50 shadow-2xl backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/15">
          {flagged?<ShieldAlert className="h-5 w-5 text-amber-300"/>:<AlertTriangle className="h-5 w-5 text-amber-300"/>}
        </div>
        <div>
          <div className="text-sm font-black">Hasil Ranked ini tidak masuk leaderboard</div>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80 sm:text-sm">
            {flagged
              ? "Hasil tetap tersimpan di riwayat, tetapi sistem Fair Play mendeteksi sesi meninggalkan halaman terlalu lama atau pola fokus yang melewati batas."
              : "Hasil tetap tersimpan di riwayat, tetapi percobaan ini tidak memenuhi syarat leaderboard."}
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import ResultShareCard from "@/components/result-share-card"

const avatar="https://efndozplpwyemzgqfnep.supabase.co/storage/v1/object/public/battle-avatars/3cd238c2-234d-4a3c-a1b0-747ebddb839b/profile.png?v=1790252164030"

export default function ShareCardLab(){
  const [mode,setMode]=useState<"ranked"|"rematch"|null>(null)
  useEffect(()=>{setMode(new URLSearchParams(window.location.search).get("mode")==="rematch"?"rematch":"ranked")},[])
  if(!mode)return <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Menyiapkan QA…</main>
  const ranked=mode==="ranked"
  return <main className="min-h-screen bg-slate-950 p-6 text-white">
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-black">Share Card Visual QA Lab</h1>
      <p className="mt-2 text-sm text-slate-400">Temporary internal preview.</p>
      <div className="mt-6">
        <ResultShareCard
          nickname="Aditakaa"
          participantPublicId="3cd238c2-234d-4a3c-a1b0-747ebddb839b"
          battlePoint={ranked?825:895}
          correctCount={ranked?33:50}
          questionCount={ranked?40:55}
          durationMs={ranked?937691:1722000}
          nationalRank={ranked?1:undefined}
          leaderboardTotal={7}
          provinceName="Jawa Timur"
          regencyName="Kab. Sumenep"
          districtName="Kota Sumenep"
          submittedAt="2026-09-21T05:09:00+07:00"
          rankedAttempt={ranked}
          autoOpen
          debugQa
          demoProfile={{avatar_url:avatar,province_code:"35",province_name:"Jawa Timur",regency_name:"Kab. Sumenep",district_name:"Kota Sumenep"}}
        />
      </div>
    </div>
  </main>
}

"use client"

import { useEffect, useRef } from "react"
import { getParticipantToken } from "@/lib/battle"

const INTEGRITY_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-integrity"

async function send(signal:"visibility_leave"|"focus_loss",awayMs:number){
  const token=getParticipantToken()
  if(!token)return
  try{
    await fetch(INTEGRITY_API,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-Battle-Token":token},
      body:JSON.stringify({signal,away_ms:Math.max(0,Math.min(3600000,Math.round(awayMs)))}),
      keepalive:true,
      cache:"no-store",
    })
  }catch{}
}

export function RankedIntegrityMonitor(){
  const hiddenAt=useRef<number|null>(null)
  const blurAt=useRef<number|null>(null)
  const sent=useRef(0)

  useEffect(()=>{
    if(!window.location.pathname.startsWith("/battle-test"))return
    const onVisibility=()=>{
      if(document.visibilityState==="hidden"){
        hiddenAt.current=Date.now()
        blurAt.current=null
        return
      }
      if(hiddenAt.current){
        const away=Date.now()-hiddenAt.current
        hiddenAt.current=null
        blurAt.current=null
        if(away>=5000&&sent.current<4){sent.current++;void send("visibility_leave",away)}
      }
    }
    const onBlur=()=>{
      if(document.visibilityState==="visible"&&hiddenAt.current===null)blurAt.current=Date.now()
    }
    const onFocus=()=>{
      if(hiddenAt.current!==null){blurAt.current=null;return}
      if(blurAt.current){
        const away=Date.now()-blurAt.current
        blurAt.current=null
        if(document.visibilityState==="visible"&&away>=8000&&sent.current<4){sent.current++;void send("focus_loss",away)}
      }
    }
    document.addEventListener("visibilitychange",onVisibility)
    window.addEventListener("blur",onBlur)
    window.addEventListener("focus",onFocus)
    return()=>{
      document.removeEventListener("visibilitychange",onVisibility)
      window.removeEventListener("blur",onBlur)
      window.removeEventListener("focus",onFocus)
    }
  },[])
  return null
}

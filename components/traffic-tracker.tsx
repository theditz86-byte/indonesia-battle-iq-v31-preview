"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const TRAFFIC_API="https://efndozplpwyemzgqfnep.supabase.co/functions/v1/battle-traffic"
const VISITOR_KEY="alzava_anon_visitor"
const SESSION_KEY="alzava_traffic_session"

function uid(){
  if(typeof crypto!=="undefined"&&"randomUUID" in crypto)return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

function deviceType(){
  const ua=navigator.userAgent||""
  if(/ipad|tablet|playbook|silk/i.test(ua))return "tablet"
  if(/mobi|android|iphone|ipod/i.test(ua))return "mobile"
  return "desktop"
}

function safeReferrerHost(){
  try{
    if(!document.referrer)return ""
    const u=new URL(document.referrer)
    if(u.hostname===location.hostname)return ""
    return u.hostname.slice(0,120)
  }catch{return ""}
}

export function TrafficTracker(){
  const pathname=usePathname()

  useEffect(()=>{
    if(!pathname||pathname.startsWith("/admin"))return
    try{
      let visitor=localStorage.getItem(VISITOR_KEY)||""
      if(!visitor){visitor=uid();localStorage.setItem(VISITOR_KEY,visitor)}
      let session=sessionStorage.getItem(SESSION_KEY)||""
      if(!session){session=uid();sessionStorage.setItem(SESSION_KEY,session)}
      const payload={action:"track",visitor_id:visitor,session_id:session,path:pathname,referrer_host:safeReferrerHost(),device:deviceType()}
      void fetch(TRAFFIC_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true,cache:"no-store"}).catch(()=>{})
    }catch{}
  },[pathname])

  return null
}

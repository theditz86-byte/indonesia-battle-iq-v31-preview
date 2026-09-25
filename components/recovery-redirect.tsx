"use client"
import { useEffect } from "react"
export function RecoveryRedirect(){useEffect(()=>{const h=window.location.hash;if(h.includes("access_token=")&&(h.includes("type=magiclink")||h.includes("type=recovery"))){window.location.replace(`/reset-password${h}`)}},[]);return null}

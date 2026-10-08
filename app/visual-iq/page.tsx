import type { Metadata } from "next"
import { VisualIqGame } from "@/components/visual-iq-game"

export const metadata: Metadata = {
  title: "Tes IQ",
  description: "Tes IQ interaktif 30 soal dengan dominasi abstrak/matriks serta penalaran spasial, numerik, dan verbal.",
}

export default function VisualIqPage(){
  return <VisualIqGame />
}

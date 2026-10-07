import type { Metadata } from "next"
import { VisualIqGame } from "@/components/visual-iq-game"

export const metadata: Metadata = {
  title: "Tes IQ Visual",
  description: "Tes figural dan spasial interaktif bergaya game dengan 15 soal visual.",
}

export default function VisualIqPage(){
  return <VisualIqGame />
}

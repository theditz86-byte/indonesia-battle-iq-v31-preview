import type { Metadata } from "next"
import { VisualIqGame } from "@/components/visual-iq-game"

export const metadata: Metadata = {
  title: "Visual IQ",
  description: "Interactive figural and spatial challenge by ALZAVA Battle Point.",
}

export default function VisualIqPage(){
  return <VisualIqGame />
}

import Image from "next/image"
import {
  Badge,
  Benefits,
  Brand,
  CloseButton,
  Description,
  Headline,
  PrimaryCta,
  ScoreCard,
  SecondaryCta,
} from "./parts"

type Props = { onStart: () => void; onDismiss: () => void }

export function MobileSheet({ onStart, onDismiss }: Props) {
  return (
    <div
      className="relative max-h-[94vh] overflow-y-auto overflow-x-hidden rounded-[28px] border-2 border-[rgba(80,140,255,.85)] px-5 pb-6 pt-5 shadow-[0_30px_100px_rgba(0,0,0,.7),0_0_40px_rgba(37,99,235,.35)]"
      style={{
        background:
          "radial-gradient(420px 360px at 85% 22%, rgba(255,170,40,.3), transparent 65%), radial-gradient(400px 400px at 30% 40%, rgba(40,90,255,.3), transparent 65%), linear-gradient(160deg, #040a1f 0%, #0a1a55 55%, #140f38 100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <Brand compact />
        <CloseButton onClick={onDismiss} className="h-11 w-11 shrink-0" />
      </div>

      <Badge className="mt-5 h-9 px-4 text-[11px]" />

      <div className="relative mt-3 h-[300px]">
        <Image
          src="/qb-webp/aditaka-quick-battle.webp"
          alt="Host ALZAVA Battle Point"
          width={1024}
          height={1536}
          className="pointer-events-none absolute -right-6 bottom-0 h-[330px] w-auto max-w-none"
          style={{ filter: "drop-shadow(0 0 22px rgba(255,190,30,.3))" }}
        />
        <Headline className="relative text-[38px] leading-[0.92]" />
        <span className="absolute left-0 top-[150px] whitespace-nowrap text-2xl font-black text-cyan-300/30" aria-hidden="true">
          SKD · CASN · BUMN
        </span>
      </div>

      <Description className="relative mt-3 text-[15px] leading-[1.5]" />

      <Benefits className="mt-5 grid grid-cols-2 gap-3" cardClass="h-[112px] px-2" textClass="text-[14px]" />

      <ScoreCard className="mx-auto mt-5 w-[260px] scale-[0.92] [transform:rotate(3deg)]" />

      <PrimaryCta onClick={onStart} className="mt-6 min-h-[62px] w-full rounded-[24px] text-[20px]" />
      <SecondaryCta onClick={onDismiss} className="mx-auto mt-4 block h-12 w-[80%] text-[16px]" />
    </div>
  )
}

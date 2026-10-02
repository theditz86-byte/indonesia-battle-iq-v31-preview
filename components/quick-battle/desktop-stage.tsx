import Image from "next/image"
import { RockForeground, SceneArt } from "./scene-art"
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
  Tagline,
} from "./parts"

export const STAGE_W = 1380
export const STAGE_H = 940

type Props = { onStart: () => void; onDismiss: () => void }

export function DesktopStage({ onStart, onDismiss }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-[32px] border-2 border-[rgba(80,140,255,.85)] shadow-[0_35px_120px_rgba(0,0,0,.65),0_0_55px_rgba(37,99,235,.35)]"
      style={{
        width: STAGE_W,
        height: STAGE_H,
        background:
          "radial-gradient(900px 700px at 88% 38%, rgba(255,170,40,.28), transparent 60%), radial-gradient(700px 600px at 55% 45%, rgba(40,90,255,.35), transparent 65%), radial-gradient(500px 400px at 85% 10%, rgba(139,61,255,.25), transparent 70%), linear-gradient(100deg, #040a1f 0%, #07123a 40%, #0a1a55 62%, #1a1440 85%, #060a1e 100%)",
      }}
    >
      <SceneArt />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: 640,
          top: 800,
          width: 460,
          height: 110,
          background:
            "radial-gradient(closest-side, rgba(255,200,70,.7), rgba(60,140,255,.35) 60%, transparent 100%)",
        }}
      />

      <Image
        src="/qb-webp/aditaka-quick-battle.webp"
        alt="Host ALZAVA Battle Point"
        width={1024}
        height={1536}
        priority
        className="pointer-events-none absolute"
        style={{
          left: 604,
          top: 98,
          width: 534,
          height: 802,
          filter:
            "drop-shadow(0 0 3px rgba(255,214,90,.95)) drop-shadow(0 0 14px rgba(255,190,50,.85)) drop-shadow(0 0 38px rgba(255,170,30,.6)) drop-shadow(0 18px 26px rgba(0,0,0,.65))",
        }}
      />

      <div className="absolute left-[46px] top-[30px]"><Brand /></div>
      <CloseButton onClick={onDismiss} className="absolute right-4 top-4 h-[86px] w-[86px]" />
      <Badge className="absolute left-[60px] top-[115px] h-[50px] px-[26px] text-[18px]" />
      <Headline className="absolute left-[54px] top-[172px] w-[660px] text-[88px] leading-[0.9]" />
      <Description className="absolute left-[60px] top-[420px] w-[470px] text-[20px] leading-[1.35]" />
      <Benefits className="absolute left-[57px] top-[531px] grid grid-cols-4 gap-[14px]" cardClass="h-[143px] w-[124px] px-1" textClass="text-[16px]" />
      <ScoreCard className="absolute left-[1076px] top-[388px] w-[256px] [transform:perspective(900px)_rotateY(-16deg)_rotateZ(7deg)]" />
      <RockForeground />
      <Tagline className="absolute left-[925px] top-[722px] w-[400px] text-[34px] [transform:rotate(-5deg)]" />

      <PrimaryCta
        onClick={onStart}
        className="absolute left-[47px] top-[697px] h-[88px] w-[625px] rounded-[30px] text-[32px]"
      />

      <SecondaryCta
        onClick={onDismiss}
        className="absolute left-[80px] top-[820px] h-[64px] w-[560px] text-[24px]"
      />
    </div>
  )
}

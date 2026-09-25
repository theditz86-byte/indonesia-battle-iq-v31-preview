from pathlib import Path
import re

p = Path('components/result-share-card.tsx')
s = p.read_text()

pattern = r'''function smallPanel\(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,title:string,value:string,accent="#22d3ee"\)\{.*?\n\}\n\nasync function buildCard'''
replacement = '''function smallPanel(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,title:string,value:string,accent="#22d3ee"){
  const h=170,cut=18
  const path=new Path2D()
  path.moveTo(x+cut,y);path.lineTo(x+w-cut,y);path.lineTo(x+w,y+cut);path.lineTo(x+w,y+h-cut);path.lineTo(x+w-cut,y+h);path.lineTo(x+cut,y+h);path.lineTo(x,y+h-cut);path.lineTo(x,y+cut);path.closePath()

  const g=ctx.createLinearGradient(x,y,x+w,y+h)
  g.addColorStop(0,"rgba(5,20,47,.97)")
  g.addColorStop(.55,"rgba(4,13,34,.95)")
  g.addColorStop(1,"rgba(3,8,24,.98)")
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=19;ctx.fillStyle=g;ctx.fill(path);ctx.restore()
  ctx.strokeStyle=accent+"dd";ctx.lineWidth=2.6;ctx.stroke(path)

  ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle=accent;ctx.lineWidth=1.4
  const inset=9,ic=13
  ctx.beginPath()
  ctx.moveTo(x+inset+ic,y+inset);ctx.lineTo(x+w-inset-ic,y+inset);ctx.lineTo(x+w-inset,y+inset+ic)
  ctx.moveTo(x+w-inset,y+h-inset-ic);ctx.lineTo(x+w-inset-ic,y+h-inset);ctx.lineTo(x+inset+ic,y+h-inset);ctx.lineTo(x+inset,y+h-inset-ic)
  ctx.stroke();ctx.restore()

  ctx.globalAlpha=.95;ctx.fillStyle=accent
  ctx.fillRect(x+24,y+24,38,2);ctx.fillRect(x+w-62,y+24,38,2);ctx.fillRect(x+w/2-30,y+23,60,3)
  ctx.globalAlpha=1
  ctx.beginPath();ctx.arc(x+w/2,y+24,8,0,Math.PI*2);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke()
  ctx.beginPath();ctx.arc(x+w/2,y+24,3,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill()

  ctx.textAlign="center"
  const valueSize=fit(ctx,value,w-28,42,23)
  ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=12;ctx.fillStyle="#f8fafc";ctx.font=`900 ${valueSize}px Arial,sans-serif`;ctx.fillText(value,x+w/2,y+90);ctx.restore()
  ctx.fillStyle="#cbd5e1";ctx.font="800 17px Arial,sans-serif";ctx.fillText(title.toUpperCase(),x+w/2,y+122)

  const bar=ctx.createLinearGradient(x+40,y,x+w-40,y)
  bar.addColorStop(0,"rgba(255,255,255,0)");bar.addColorStop(.5,accent);bar.addColorStop(1,"rgba(255,255,255,0)")
  ctx.fillStyle=bar;ctx.fillRect(x+38,y+143,w-76,3)
  ctx.globalAlpha=.7;ctx.fillStyle=accent;ctx.fillRect(x+21,y+h-17,30,2);ctx.fillRect(x+w-51,y+h-17,30,2);ctx.globalAlpha=1
}

async function buildCard'''

ns,n = re.subn(pattern,replacement,s,flags=re.S)
if n != 1:
    raise SystemExit(f'smallPanel replacement count={n}')
ns = ns.replace('const w=230,gap=18,start=53,y=1240','const w=232,gap=16,start=52,y=1218')
p.write_text(ns)

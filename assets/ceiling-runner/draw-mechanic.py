"""Generate the original article schematic, not a gameplay screenshot."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).with_name("mechanic.jpg")
I = Image.new('RGB',(1200,560),'#0a1e2c')
D = ImageDraw.Draw(I)
F = Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc")
font = lambda size: ImageFont.truetype(str(F),size,index=0)
def write(x,y,s,size=42,color="#effcff"):
    D.text((x,y),s,font=font(size),fill=color,anchor="lt")
def line_arrow(points,color="#90f7d7", width=7):
    D.line(points,fill=color,width=width,joint="curve")
    import math
    ax,ay=points[-2]; bx,by=points[-1]; th=math.atan2(by-ay,bx-ax)
    t=17
    D.polygon([(bx,by),(round(bx-t*math.cos(th+.53)),round(by-t*math.sin(th+.53))), (round(bx-t*math.cos(th-.53)),round(by-t*math.sin(th-.53)))],fill=color)
def diamond(x,y,r,color):
    D.polygon([(x-r,y),(x,y-r),(x+r,y),(x,y+r)],fill=color)
def bot(x,y,up=False):
    c='#98f7d1'; d='#1d4d55'
    D.rounded_rectangle((x-26,y-16,x+26,y+16),radius=4,fill=c)
    D.rounded_rectangle((x-17,y-9,x+17,y+7),radius=3,fill=d)
    D.rectangle((x+4,y-6,x+14,y+2),fill='#d8fff2')
    dy=-15 if up else 14
    for dx in [-16,16]:D.ellipse((x+dx-6,y+dy-6,x+dx+6,y+dy+6),fill=c)
write(70,45,"床から天井へ、重力で乗り換え",57)
D.rounded_rectangle((70,134,1130,416),radius=24,fill="#142e41",outline="#537687",width=4)
D.line([(86,175),(1114,175)],fill="#9eb9c8",width=5)
D.line([(86,374),(1114,374)],fill="#9eb9c8",width=5)
write(1000,191,"天井",48,"#c4e2ef");write(1047,309,"床",48,"#c4e2ef")
bot(230,345)
arr = [(264,345),(396,345),(450,319),(500,268),(550,216),(585,205),(650,205)]
line_arrow(arr)
bot(694,205,True)
diamond(882,205,15,"#94f7d3");diamond(882,205,7,"#174653")
D.rounded_rectangle((665,301,961,371),radius=7,fill="#89602f",outline="#f3bc7b",width=4)
for i in range(693,917,26): D.line([(i,358),(i+49,312)],fill="#f3bc7b",width=7)
p = "タップで反転   →   障害物の上を通過"
write(70,454,p,49,color="#a2f7d9")
I.save(OUT,optimize=True,quality=84,progressive=True)

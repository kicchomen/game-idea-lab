from PIL import Image, ImageDraw, ImageFont
W,H=1200,510
im=Image.new('RGB',(W,H),'#101921'); d=ImageDraw.Draw(im)
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
def text(x,y,s,z,c='#f7f3e8'): d.text((x,y),s,font=ImageFont.truetype(FONT,z,index=0),fill=c,anchor='lm')
mint='#abf5cb'
for i,(title,desc) in enumerate([('先に垂直噴射','台まで飛べる時間を稼ぐ'),('左傾き ＋ 噴射','右への流れを抑える'),('傾きを離す','水平に戻り、真上へ噴射'),('緑の台に着陸','速度を落とし、両脚を置く')]):
    y=14+i*123
    d.rounded_rectangle((20,y,1180,y+113),24,fill='#192b3b',outline='#425466',width=3)
    d.ellipse((57,y+18,135,y+96),fill=mint)
    text(84,y+56,str(i+1),47,'#101921'); text(170,y+36,title,45); text(174,y+81,desc,37,'#c7d7e3')
im.save('assets/lunar-lander/guide.jpg',quality=86,optimize=True)

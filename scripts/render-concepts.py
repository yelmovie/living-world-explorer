"""Render five deterministic 12s concept animations with Pillow + local FFmpeg.
Run: python scripts/render-concepts.py --ffmpeg <ffmpeg.exe>
Camera: static, eye-level, wide infographic; three 4s cuts; final layout holds.
All graphics are original or existing project illustrations. No network calls.
"""
import argparse, math, subprocess, json, wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/concepts'; OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS=960,540,24
INK='#213f30'; GREEN='#416d4b'; GOLD='#dfb85f'; CREAM='#fffbed'
FONT=Path('C:/Windows/Fonts/malgunbd.ttf')
def font(s): return ImageFont.truetype(str(FONT),s)
def txt(d,xy,t,s=28,fill=INK,anchor='mm'): d.text(xy,t,font=font(s),fill=fill,anchor=anchor)
def card(d,box): d.rounded_rectangle(box,22,fill=CREAM,outline='#b0c39c',width=3)
def smooth(p): return (1-math.cos(math.pi*max(0,min(1,p))))/2
def art(im,name,box):
    p=ROOT/f'public/assets/specimen-{name}.webp'
    with Image.open(p) as source:a=source.convert('RGBA')
    a.thumbnail((box[2]-box[0],box[3]-box[1]))
    im.paste(a,(int((box[0]+box[2]-a.width)/2),int((box[1]+box[3]-a.height)/2)),a)
    a.close()
def arrow(d,x1,y1,x2,y2,p=1):
    x=x1+(x2-x1)*p;y=y1+(y2-y1)*p;d.line((x1,y1,x,y),fill=GOLD,width=7)
    if p>.9:d.polygon([(x,y),(x-14,y-10),(x-14,y+10)],fill=GOLD)
def bacteria(d,x,y,p=0):
    for i in range(5):
        xx=x+(i%3-1)*65;yy=y+(i//3-.5)*64+math.sin(p+i)*5
        if i%2:d.rounded_rectangle((xx-25,yy-12,xx+25,yy+12),12,fill='#85b8a0',outline=GREEN,width=3)
        else:d.ellipse((xx-18,yy-18,xx+18,yy+18),fill='#a9ca86',outline=GREEN,width=3)
def leaves(d,x,y,p):
    for i in range(9):
        r=1-p*.65;xx=x+(i%3-1)*45;yy=y+(i//3-1)*38
        d.ellipse((xx-26*r,yy-13*r,xx+26*r,yy+13*r),fill='#bd995e',outline='#8a6b37',width=2)
def yogurt(d,x,y,level=1):
    d.rounded_rectangle((x-52,y-70,x+52,y+68),12,fill='#dde7cd',outline=GREEN,width=4)
    d.rectangle((x-46,y+53-112*level,x+46,y+56),fill='#fffdf8')
    d.rounded_rectangle((x-59,y-80,x+59,y-59),8,fill=GOLD)
    txt(d,(x,y+15),'요구르트',18)
def bread(d,x,y,p=1):
    size=70+p*30;d.rounded_rectangle((x-size,y-40-p*25,x+size,y+45),35,fill='#deb673',outline='#9d743e',width=3)
    for i in range(3):d.arc((x-65+i*48,y-35-p*17,x-25+i*48,y+15),180,330,fill='#a47a41',width=4)

DATA={
 'M1':('균류의 특징',['버섯과 곰팡이는 균류예요.','버섯의 주름 · 곰팡이의 가는 실을 관찰해요.','생김새와 발견 장소를 함께 기록해요.']),
 'M2':('물 한 방울 속 생물',['연못의 물 한 방울에도 작은 생물이 있어요.','해캄은 길게 이어지고, 짚신벌레는 위치가 달라져요.','같은 시야의 서로 다른 시점을 비교해요.']),
 'M3':('근거로 설명하는 세균',['세균은 아주 작고 여러 모양이 있어요.','흙 · 물 · 생물의 몸 등 여러 곳에서 발견돼요.','모양 자료와 장소 자료를 구별해 설명에 연결해요.']),
 'M4':('생물의 작용과 생활',['먹으려던 빵의 곰팡이는 음식 변질을 일으켜요.','균류와 세균은 낙엽의 물질을 분해하는 데 관여해요.','상황과 영향을 함께 살펴봐요.']),
 'M5':('생명과학의 이용',['우유에 특정 세균의 작용을 이용해 요구르트를 만들어요.','효모는 균류예요. 그 작용으로 빵 반죽이 부풀어요.','재료 → 생물의 작용 → 결과를 연결해 설명해요.'])}

def frame(stage,t):
    cut=min(2,int(t//4));p=smooth(min(1,(t%4)/2.6));im=Image.new('RGB',(W,H),'#e9efdf');d=ImageDraw.Draw(im)
    d.rounded_rectangle((22,18,938,522),28,fill='#f6f6e8',outline='#c6d2b5',width=2)
    txt(d,(46,48),'모아의 발견 연구소',17,anchor='lm');txt(d,(914,48),f'{stage[1]} / 5 · 개념 한 컷',17,anchor='rm')
    txt(d,(480,92),DATA[stage][0],32)
    if stage=='M1':
        for j,(name,label) in enumerate([('mushroom','버섯'),('mold','곰팡이')]):
            x=255+j*450;card(d,(x-178,135,x+178,393));art(im,name,(x-162,145,x+162,345));txt(d,(x,367),label,27)
        if cut>0:
            for x,y in [(255,244),(674,233)]:
                r=30+p*24;d.ellipse((x-r,y-r,x+r,y+r),outline=GOLD,width=7)
        if cut==2:
            txt(d,(255,411),'모양 + 발견 장소',24);txt(d,(705,411),'함께 기록해요',24)
    elif stage=='M2':
        if cut==0:
            d.ellipse((270,147,690,389),fill='#b8d9d0',outline=GREEN,width=4)
            for i in range(3):d.line((320+i*45,320,340+i*45,215,365+i*45,285),fill=GREEN,width=7)
            x=655-110*p;d.ellipse((x-18,220+100*p,x+18,256+100*p),fill='#75aaa5');txt(d,(480,410),'채집 → 확대 관찰',25)
        else:
            for j in range(2):
                x=255+j*450;card(d,(x-185,141,x+185,395))
                if cut==1:
                    art(im,'spirogyra' if j==0 else 'paramecium',(x-162,153,x+162,340));txt(d,(x,368),'해캄' if j==0 else '짚신벌레',25)
                else:
                    d.line((x-148,289,x+148,289),fill='#d3ddc7',width=2)
                    xx=x-90+j*150;d.ellipse((xx-24,240,xx+24,276),fill='#86b2a2',outline=GREEN,width=3);txt(d,(x,368),'A · 이전' if j==0 else 'B · 이후',25)
            if cut==2:arrow(d,418,250,545,250,p)
    elif stage=='M3':
        if cut==0:
            card(d,(220,139,740,390));bacteria(d,480,250,t);txt(d,(480,363),'둥근 모양 · 막대 모양',26)
        elif cut==1:
            for j,label in enumerate(['흙','물','생물의 몸']):
                x=190+j*290;card(d,(x-120,156,x+120,380));bacteria(d,x,251,t+j);txt(d,(x,351),label,26)
        else:
            card(d,(70,155,360,388));txt(d,(215,211),'장소 조사 자료',26);txt(d,(215,280),'흙 · 물 · 몸',27);txt(d,(215,327),'발견 기록',25)
            arrow(d,380,270,561,270,p);card(d,(585,155,889,388));txt(d,(737,218),'근거 있는 설명',26);txt(d,(737,292),'여러 곳에 살아요',25)
    elif stage=='M4':
        for j,label in enumerate(['먹으려던 빵','숲의 낙엽']):
            x=255+j*450;card(d,(x-183,145,x+183,392));txt(d,(x,175),label,25)
            if j==0:
                bread(d,x,280)
                if cut in [0,2]:
                    for k in range(6):
                        xx=x-65+(k%3)*48;yy=255+(k//3)*36;r=4+p*12;d.ellipse((xx-r,yy-r,xx+r,yy+r),fill='#6a8b68')
            else:leaves(d,x,280,p if cut>0 else 0)
            txt(d,(x,368),'변질 · 먹지 않아요' if j==0 else '분해 · 물질의 변화',23)
        if cut==2:txt(d,(480,413),'같은 이름만으로 좋고 나쁨을 정하지 않아요',23)
    else:
        labels=['우유','특정 세균의 작용','요구르트'] if cut!=1 else ['빵 반죽','효모의 작용','부푼 반죽']
        for j,label in enumerate(labels):
            x=175+j*305;card(d,(x-128,150,x+128,391));txt(d,(x,364),label,22)
            if j==0:
                if cut==1:bread(d,x,264,.05)
                else:
                    d.rounded_rectangle((x-42,196,x+42,316),8,fill='#fffdf8',outline=GREEN,width=3);txt(d,(x,265),'우유',23)
            elif j==1:
                if cut==1:
                    for k in range(3):d.ellipse((x-51+k*30,230,x-12+k*30,287),fill='#c6b8a1',outline=GREEN,width=2)
                else:bacteria(d,x,265,t)
            elif cut==1:bread(d,x,264,p)
            else:yogurt(d,x,265,p)
        arrow(d,309,264,345,264,p);arrow(d,614,264,651,264,p)
        if cut==2:txt(d,(480,412),'재료 → 생물의 작용 → 결과',24)
    d.rounded_rectangle((46,440,914,501),16,fill=INK);txt(d,(480,471),DATA[stage][1][cut],25,'#fffbed')
    for i in range(3):d.rounded_rectangle((390+i*65,515,441+i*65,519),2,fill=GREEN if i<=cut else '#ccd7bf')
    return im

def main():
    a=argparse.ArgumentParser();a.add_argument('--ffmpeg',required=True);a.add_argument('--preview-only',action='store_true');args=a.parse_args()
    tmp=ROOT/'.tmp/concept-render';tmp.mkdir(parents=True,exist_ok=True)
    if args.preview_only:
        sheet=Image.new('RGB',(960,5*180),'white')
        for row,stage in enumerate(DATA):
            for i,t in enumerate([2.8,6.8,10.8]):
                still=frame(stage,t);sheet.paste(still.resize((320,180)),(i*320,row*180));still.close()
        sheet.save(tmp/'storyboard.webp');return
    # A quiet, original three-note bed. No spoken narration; burned-in captions work muted.
    rate=44100;seconds=12;signal=np.zeros(rate*seconds,dtype=np.float64)
    for start,hz in [(0,261.63),(4,329.63),(8,392)]:
        t=np.arange(int(rate*2.3))/rate;env=np.minimum(1,t/.06)*np.exp(-t*1.7)
        sound=(np.sin(2*np.pi*hz*t)+.25*np.sin(2*np.pi*hz*2*t))*env*.035
        offset=int(start*rate);signal[offset:offset+len(sound)]+=sound
    bed=tmp/'bed.wav'
    with wave.open(str(bed),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate);out.writeframes((signal*32767).astype('<i2').tobytes())
    sheet=Image.new('RGB',(960,5*180),'white')
    for row,stage in enumerate(DATA):
        raw=tmp/f'{stage}-silent.mp4'
        command=[args.ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','960x540','-r',str(FPS),'-i','-','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','23','-pix_fmt','yuv420p',str(raw)]
        proc=subprocess.Popen(command,stdin=subprocess.PIPE)
        try:
            for n in range(12*FPS):
                still=frame(stage,n/FPS);proc.stdin.write(still.tobytes());still.close()
        finally:proc.stdin.close()
        if proc.wait():raise RuntimeError(stage)
        subprocess.run([args.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(raw),'-i',str(bed),'-c:v','copy','-c:a','aac','-b:a','64k','-movflags','+faststart','-shortest',str(OUT/f'{stage}.mp4')],check=True)
        frame(stage,2).save(OUT/f'{stage}.webp',quality=86)
        vtt='WEBVTT\n\n'+''.join(f'{i+1}\n00:00:{i*4:02d}.000 --> 00:00:{(i+1)*4:02d}.000\n{text}\n\n' for i,text in enumerate(DATA[stage][1]))
        (OUT/f'{stage}.vtt').write_text(vtt,encoding='utf-8')
        for i,t in enumerate([2.8,6.8,10.8]):sheet.paste(frame(stage,t).resize((320,180)),(i*320,row*180))
        print(stage, (OUT/f'{stage}.mp4').stat().st_size,flush=True)
    sheet.save(tmp/'storyboard.webp');(OUT/'manifest.json').write_text(json.dumps({k:{'duration':12,'size':[960,540],'fps':FPS,'captions':v[1]} for k,v in DATA.items()},ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':main()

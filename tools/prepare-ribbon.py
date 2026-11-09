"""Optional developer asset pipeline. Requires requirements-assets.txt.
After running: npm run assets:phase1
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,cv2,json,shutil
import argparse
parser=argparse.ArgumentParser(description='Prepare ribbon image sizes and a registered SVG silhouette; no website HTML edits.')
parser.add_argument('--source',type=Path,default=Path(__file__).resolve().parent/'assets/zahlfix-z-primary-transparent.png')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/brand';out.mkdir(exist_ok=True)
im=Image.open(args.source).convert('RGBA');a=np.array(im)
mask=(a[:,:,3]>96).astype('uint8')*255
cs,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); c=max(cs,key=cv2.contourArea)
x,y,w,h=cv2.boundingRect(c);pad=round(max(w,h)*.025);side=max(w,h)+2*pad
cx=x+w/2;cy=y+h/2;box=(round(cx-side/2),round(cy-side/2),round(cx+side/2),round(cy+side/2));crop=im.crop(box)
# Remove isolated alpha specks, preserving antialiasing at the main ribbon boundary.
m=np.zeros(mask.shape,np.uint8);cv2.drawContours(m,[c],-1,255,-1);m=cv2.dilate(m,np.ones((5,5),np.uint8))
a[:,:,3]=np.where(m,a[:,:,3],0)
crop=Image.fromarray(a).crop(box)
exports=[]
for size in [96,192,384,768]:
 v=crop.resize((size,size),Image.Resampling.LANCZOS)
 # Deliberate optical sharpening of smaller exports, not a new design or relighting.
 if size<=192:
  alpha=v.getchannel('A');v=v.filter(ImageFilter.UnsharpMask(radius=.55,percent=110,threshold=4));v.putalpha(alpha)
 f=out/f'zahlfix-ribbon-{size}.webp';v.save(f,'WEBP',quality=94,method=6)
 exports.append({'file':f.name,'width':size,'bytes':f.stat().st_size})
crop.resize((384,384),Image.Resampling.LANCZOS).save(out/'zahlfix-ribbon-fallback.png',optimize=True)
# A true vector contour, registered to the exact square crop used for raster delivery.
c=cv2.approxPolyDP(c,.7,True)[:,0,:]
pts=[((float(px)-box[0])/side*120,(float(py)-box[1])/side*120) for px,py in c]
path='M'+' L'.join(f'{px:.3f} {py:.3f}' for px,py in pts)+' Z'
# Inradius at the canonical pivot is conservative: all points in this disk are inside the outline.
norm=np.zeros((1200,1200),np.uint8)
cv2.fillPoly(norm,[np.round(np.array(pts)*10).astype(np.int32)],255)
dist=cv2.distanceTransform(norm,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
safe=float(dist[600,600]/10)*.96
assert safe>3,(safe,box)
(root/'public/assets/v6/phase1-brand.js').write_text('// R4: silhouette registered to the user-supplied ribbon master.\n'+f'export const Z_PATH = {json.dumps(path)};\nexport const Z_SAFE_RADIUS = {safe:.5f};\n')
(out/'zahlfix-ribbon-silhouette.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path fill="#C39438" d="{path}"/></svg>')
meta={'source':'User-supplied zahlfix-z-primary-transparent.png','sourceSize':im.size,'crop':box,'canonicalViewBox':[0,0,120,120],'pivot':[60,60],'safeRadius':safe,'treatment':'Original supplied artwork; isolated alpha-speck removal, shared crop, high-quality resizing and small-size optical sharpening. No generative redraw or invented 3D relighting.','exports':exports}
(out/'ribbon-manifest.json').write_text(json.dumps(meta,indent=2))
print(json.dumps(meta,indent=2))

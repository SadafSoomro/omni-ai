export const EMPTY_CROP = {top:0,bottom:0,left:0,right:0};

export function filterPixels(data, width, height, mode) {
  if (mode === 'original') return data;
  const gray = new Uint8Array(width * height);
  const histogram = new Uint32Array(256);
  for (let p=0;p<gray.length;p++) {const i=p*4;gray[p]=Math.round(.299*data[i]+.587*data[i+1]+.114*data[i+2]);histogram[gray[p]]++;}
  let low=0,high=255,count=0;
  for(let i=0;i<256;i++){count+=histogram[i];if(count>=gray.length*.02){low=i;break;}}
  count=0;for(let i=255;i>=0;i--){count+=histogram[i];if(count>=gray.length*.02){high=i;break;}}
  low=Math.min(low,60);high=Math.max(high,200);
  const range=high-low;
  let integral;
  if(mode==='bw'){
    integral=new Float64Array((width+1)*(height+1));
    for(let y=1;y<=height;y++){let sum=0;for(let x=1;x<=width;x++){sum+=gray[(y-1)*width+x-1];integral[y*(width+1)+x]=integral[(y-1)*(width+1)+x]+sum;}}
  }
  const radius=Math.max(8,Math.round(Math.min(width,height)/45));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,i=p*4;
    if(mode==='bw'){
      const x0=Math.max(0,x-radius),x1=Math.min(width,x+radius+1),y0=Math.max(0,y-radius),y1=Math.min(height,y+radius+1),stride=width+1;
      const mean=(integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0])/((x1-x0)*(y1-y0));
      data[i]=data[i+1]=data[i+2]=gray[p]<mean-Math.max(8,mean*.08)?0:255;
    }else if(mode==='gray'){data[i]=data[i+1]=data[i+2]=gray[p];}
    else {for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,(data[i+c]-low)*255/range));}
    data[i+3]=255;
  }
  return data;
}

export function loadScanImage(source) {
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('This image could not be opened. Use JPG, PNG or WebP.'));image.src=source;});
}

export async function prepareScanFile(file) {
  if(!file.type.startsWith('image/') || /\.(svg|gif)$/i.test(file.name))throw new Error(`${file.name}: choose a JPG, PNG, WebP or another still photo.`);
  if(file.size>20*1024*1024)throw new Error(`${file.name}: images must be 20 MB or smaller.`);
  const url=URL.createObjectURL(file);
  try {
    const image=await loadScanImage(url);
    const scale=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',.95);
  }finally{URL.revokeObjectURL(url);}
}

export async function renderScan(source,{crop=EMPTY_CROP,rotation=0,filter='auto'}={}) {
  const image=await loadScanImage(source);
  const left=Math.max(0,Math.min(45,Number(crop.left)||0)),right=Math.max(0,Math.min(45,Number(crop.right)||0));
  const top=Math.max(0,Math.min(45,Number(crop.top)||0)),bottom=Math.max(0,Math.min(45,Number(crop.bottom)||0));
  const sx=Math.round(image.naturalWidth*left/100),sy=Math.round(image.naturalHeight*top/100);
  const sw=Math.max(1,Math.round(image.naturalWidth*(100-left-right)/100)),sh=Math.max(1,Math.round(image.naturalHeight*(100-top-bottom)/100));
  const angle=((Math.round(rotation/90)*90)%360+360)%360;
  const canvas=document.createElement('canvas');canvas.width=angle%180?sh:sw;canvas.height=angle%180?sw:sh;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(angle*Math.PI/180);
  // Source crop dimensions stay unchanged when rotating, avoiding distortion/clipping.
  ctx.drawImage(image,sx,sy,sw,sh,-sw/2,-sh/2,sw,sh);ctx.setTransform(1,0,0,1,0,0);
  const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);filterPixels(pixels.data,canvas.width,canvas.height,filter);ctx.putImageData(pixels,0,0);
  return {currentUrl:canvas.toDataURL('image/jpeg',.94),width:canvas.width,height:canvas.height};
}

export async function detectDocumentCrop(source) {
  const image=await loadScanImage(source);const scale=Math.min(1,480/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),rows=new Uint32Array(canvas.height),cols=new Uint32Array(canvas.width);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(Math.min(data[i],data[i+1],data[i+2])>185){rows[y]++;cols[x]++;}}
  const ys=[...rows.keys()].filter(y=>rows[y]>canvas.width*.2),xs=[...cols.keys()].filter(x=>cols[x]>canvas.height*.2);
  if(!ys.length||!xs.length)throw new Error('No clear paper border found. Adjust the margins manually.');
  const x0=Math.max(0,xs[0]-2),x1=Math.min(canvas.width,xs.at(-1)+3),y0=Math.max(0,ys[0]-2),y1=Math.min(canvas.height,ys.at(-1)+3);
  if((x1-x0)*(y1-y0)<canvas.width*canvas.height*.15)throw new Error('No clear paper border found. Adjust the margins manually.');
  return {left:Math.min(45,100*x0/canvas.width),right:Math.min(45,100*(canvas.width-x1)/canvas.width),top:Math.min(45,100*y0/canvas.height),bottom:Math.min(45,100*(canvas.height-y1)/canvas.height)};
}

export function a4Crop(width,height) {
  const ratio=210/297;
  if(width/height>ratio){const margin=(1-height*ratio/width)*50;return {...EMPTY_CROP,left:margin,right:margin};}
  const margin=(1-width/ratio/height)*50;return {...EMPTY_CROP,top:margin,bottom:margin};
}

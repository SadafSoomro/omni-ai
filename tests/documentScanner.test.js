import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPixels,a4Crop} from '../src/services/documentScanner.js';

test('scan enhancement preserves a white sheet and produces valid grayscale',()=>{
 const white=new Uint8ClampedArray(8*8*4).fill(255);filterPixels(white,8,8,'auto');assert.ok(white.every(value=>value===255));
 const pixel=new Uint8ClampedArray([200,100,50,255]);filterPixels(pixel,1,1,'gray');assert.equal(pixel[0],pixel[1]);assert.equal(pixel[1],pixel[2]);assert.equal(pixel[3],255);
});
test('adaptive document threshold keeps ink black and shaded paper white',()=>{
 const width=80,height=80,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const value=x>=35&&x<39&&y>10&&y<65?20:150+Math.round(x*.9),i=(y*width+x)*4;data.set([value,value,value,255],i);}
 filterPixels(data,width,height,'bw');assert.equal(data[(30*width+36)*4],0);assert.equal(data[(30*width+10)*4],255);assert.equal(data[(30*width+65)*4],255);
});
test('original filter leaves image bytes intact and A4 crop uses actual dimensions',()=>{
 const pixels=new Uint8ClampedArray([30,70,100,255]);assert.deepEqual(filterPixels(pixels,1,1,'original'),pixels);
 for(const [width,height] of [[1600,1000],[1000,1800]]){const crop=a4Crop(width,height),w=width*(1-(crop.left+crop.right)/100),h=height*(1-(crop.top+crop.bottom)/100);assert.ok(Math.abs(w/h-210/297)<1e-10);}
});

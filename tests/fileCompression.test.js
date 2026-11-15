import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import JSZip from 'jszip';
import {compressArchive} from '../src/services/fileCompression.js';

test('ZIP recompression shrinks stored entries and preserves every original byte and filename',async()=>{
 const zip=new JSZip();const text='Resume and document content.\n'.repeat(5000),binary=randomBytes(2048);
 zip.file('folder/resume.txt',text);zip.file('image.bin',binary);zip.comment='Archive comment';
 const original=await zip.generateAsync({type:'uint8array',compression:'STORE'});
 const result=await compressArchive(new File([original],'documents.zip',{type:'application/zip'}));
 assert.ok(result.reduced);assert.ok(result.blob.size<original.length*.1);assert.equal(result.name,'documents.zip');
 const restored=await JSZip.loadAsync(await result.blob.arrayBuffer(),{checkCRC32:true});
 assert.equal(await restored.file('folder/resume.txt').async('string'),text);
 assert.deepEqual(Buffer.from(await restored.file('image.bin').async('uint8array')),binary);assert.equal(restored.comment,'Archive comment');
});
test('generic file compression produces a correctly named ZIP with lossless recovery',async()=>{
 const content='A readable document.\n'.repeat(5000);const result=await compressArchive(new File([content],'notes.txt'));
 assert.equal(result.name,'notes.txt.zip');assert.ok(result.reduced);
 const restored=await JSZip.loadAsync(await result.blob.arrayBuffer());assert.equal(await restored.file('notes.txt').async('string'),content);
});
test('incompressible files are kept intact instead of sliced or mislabeled',async()=>{
 const bytes=randomBytes(2000),file=new File([bytes],'random.bin');const result=await compressArchive(file);
 assert.equal(result.reduced,false);assert.equal(result.blob,file);assert.equal(result.name,file.name);assert.deepEqual(Buffer.from(await result.blob.arrayBuffer()),bytes);
});
test('Office ZIP packages keep their format and exact internal XML',async()=>{
 const zip=new JSZip();const xml='<document>'+'Text paragraph. '.repeat(3000)+'</document>';zip.file('word/document.xml',xml);
 const original=await zip.generateAsync({type:'uint8array',compression:'STORE'});const result=await compressArchive(new File([original],'resume.docx',{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
 assert.ok(result.reduced);assert.equal(result.name,'resume.docx');assert.equal(result.blob.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 const restored=await JSZip.loadAsync(await result.blob.arrayBuffer(),{checkCRC32:true});assert.equal(await restored.file('word/document.xml').async('string'),xml);
});
test('broken archives and oversized files fail rather than generating corrupt downloads',async()=>{
 await assert.rejects(compressArchive(new File(['not a ZIP'],'broken.zip')));
 await assert.rejects(compressArchive({size:101*1024*1024}),/100 MB/);
});

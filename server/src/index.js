import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { score, splitChunks, terms } from './search.js';

const app=express(), PORT=process.env.PORT||8787;
const DATA_DIR=path.resolve('data'), DB_FILE=path.join(DATA_DIR,'workspace.json');
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024,files:12}});
app.use(cors({origin:['http://localhost:5173','http://127.0.0.1:5173']}));
app.use(express.json({limit:'2mb'}));
let db={documents:[],chunks:[]};
await fs.mkdir(DATA_DIR,{recursive:true});
try{db=JSON.parse(await fs.readFile(DB_FILE,'utf8'));}catch{await persist();}
async function persist(){await fs.writeFile(DB_FILE,JSON.stringify(db,null,2));}
async function extract(file){
 const ext=path.extname(file.originalname).toLowerCase();
 if(['.txt','.md','.json','.log'].includes(ext))return[{text:file.buffer.toString('utf8'),locationPrefix:'Section'}];
 if(ext==='.pdf'){const parsed=await pdf(file.buffer);return parsed.text.split('\f').map((text,i)=>({text,locationPrefix:'Page '+(i+1)})).filter(p=>p.text.trim());}
 if(ext==='.docx'){const result=await mammoth.extractRawText({buffer:file.buffer});return[{text:result.value,locationPrefix:'Section'}];}
 if(ext==='.xlsx'||ext==='.xls'){const book=XLSX.read(file.buffer,{type:'buffer',cellDates:true});return book.SheetNames.flatMap(name=>{const rows=XLSX.utils.sheet_to_json(book.Sheets[name],{header:1,defval:''});return rows.map((row,i)=>({text:row.map((v,j)=>`${rows[0]?.[j]||'Column '+(j+1)}: ${String(v)}`).join(' | '),locationPrefix:'Sheet '+name+', row'})).filter(r=>r.text.trim());});}
 if(ext==='.csv'){const rows=parseCsv(file.buffer.toString('utf8'),{relax_quotes:true,skip_empty_lines:true});const headers=rows[0]||[];return rows.slice(1).map(row=>({text:row.map((v,j)=>`${headers[j]||'Column '+(j+1)}: ${v}`).join(' | '),locationPrefix:'Row'}));}
 throw new Error('Unsupported file type: '+(ext||'unknown')+'. Use PDF, DOCX, XLSX, XLS, CSV, TXT, MD, JSON, or LOG.');
}
app.get('/api/health',(_req,res)=>res.json({ok:true,name:'ProofStack API',version:'0.1.0',documents:db.documents.length,chunks:db.chunks.length}));
app.get('/api/documents',(_req,res)=>res.json(db.documents.map(({id,name,type,size,createdAt,chunkCount})=>({id,name,type,size,createdAt,chunkCount}))));
app.post('/api/documents',upload.array('files'),async(req,res)=>{
 try{const files=req.files||[];if(!files.length)return res.status(400).json({error:'Choose at least one file.'});const added=[];
 for(const file of files){const id=randomUUID(),pages=await extract(file);const doc={id,name:file.originalname,type:path.extname(file.originalname).slice(1).toUpperCase(),size:file.size,createdAt:new Date().toISOString(),chunkCount:0};
 const chunks=pages.flatMap((p,i)=>splitChunks(p.text,{documentId:id,name:doc.name,locationPrefix:p.locationPrefix||'Section '+(i+1)}));doc.chunkCount=chunks.length;db.documents.push(doc);db.chunks.push(...chunks);added.push(doc);}
 await persist();res.status(201).json({documents:added,totalChunks:added.reduce((n,d)=>n+d.chunkCount,0)});
 }catch(e){res.status(422).json({error:e.message||'Could not process file.'});}
});
app.delete('/api/documents/:id',async(req,res)=>{const before=db.documents.length;db.documents=db.documents.filter(d=>d.id!==req.params.id);db.chunks=db.chunks.filter(c=>c.documentId!==req.params.id);if(db.documents.length===before)return res.status(404).json({error:'Document not found.'});await persist();res.json({ok:true});});
app.post('/api/query',(req,res)=>{const question=String(req.body?.question||'').trim();if(question.length<4)return res.status(400).json({error:'Ask a more specific question (at least 4 characters).'});const ranked=db.chunks.map(c=>({...c,score:score(question,c.content)})).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,6);
 const sources=ranked.map((c,i)=>({citation:'[S'+(i+1)+']',document:c.documentName,location:c.location,excerpt:c.content.slice(0,420),relevance:Math.round(Math.min(1,c.score/(ranked[0]?.score||1))*100)}));
 const tokens=terms(question),coverage=tokens.length?Math.round(new Set(ranked.flatMap(r=>terms(r.content))).size/new Set(tokens).size*100):0;
 res.json({question,answer:ranked.length?'Here are the strongest matching passages from your workspace. This release uses transparent, extractive retrieval rather than generating unsupported claims. Read the cited excerpts before relying on a conclusion.':'No matching evidence was found in the current workspace. Add relevant documents or try different wording.',sources,coverage:Math.min(100,coverage),mode:'extractive',notice:'A match is not proof that a claim is true. Verify the original source and context.'});});
app.get('/api/overview',(_req,res)=>{const byType={};db.documents.forEach(d=>byType[d.type]=(byType[d.type]||0)+1);res.json({documents:db.documents.length,evidenceUnits:db.chunks.length,types:byType,storage:'local'});});
app.listen(PORT,()=>console.log('ProofStack API listening on http://localhost:'+PORT));
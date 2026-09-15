import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

dotenv.config();
const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 5000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bharatforge' });
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/msword'];
    cb(null, allowed.includes(file.mimetype));
  }
});
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

async function initDb(){
  await pool.query(schema);
  const p = await pool.query('SELECT id FROM projects LIMIT 1');
  if (!p.rowCount) {
    const project = await pool.query("INSERT INTO projects(code,name,location,progress) VALUES ('BF-01','BharatForge Integrated Power Project','Uttar Pradesh',74) RETURNING id");
    const pid = project.rows[0].id;
    await pool.query(`INSERT INTO activities(id,project_id,name,planned_progress,actual_progress,risk,status,planned_finish,forecast_finish) VALUES
      ('A103',$1,'Compressor Foundation',88,65,'HIGH','DELAYED','2026-09-15','2026-09-19'),
      ('A221',$1,'Main Piping Installation',85,48,'HIGH','DELAYED','2026-09-20','2026-09-25'),
      ('A417',$1,'Electrical Works',80,72,'MEDIUM','ON TRACK','2026-09-25','2026-09-25'),
      ('A508',$1,'Structural Steel Erection',70,69,'LOW','ON TRACK','2026-09-30','2026-09-30'),
      ('A612',$1,'Cooling Water System',60,43,'MEDIUM','AT RISK','2026-10-05','2026-10-09')`,[pid]);
    await pool.query(`INSERT INTO field_reports(id,activity_id,description,reported_progress,evidence,submitted_by,verification_status) VALUES
      ('FR-1023','A103','Reinforcement work is 65% complete',65,'Site photo + daily log','Ravi Kumar','VERIFIED'),
      ('FR-1031','A103','Steel shortage has slowed the work',62,'Material shortage note','Amit Singh','PENDING'),
      ('FR-1102','A221','Piping installation reached 85%',85,'Inspection checklist','Neha Verma','PENDING')`);
    await pool.query(`INSERT INTO verification_queue(report_id,confidence,reason) VALUES ('FR-1031','LOW','Material data inconsistent'),('FR-1102','MEDIUM','Supporting evidence missing')`);
  }
}

app.get('/api/health', async (_req,res)=>{ try { await pool.query('SELECT 1'); res.json({ok:true,database:'connected'}); } catch(e){res.status(500).json({ok:false,error:e.message});} });
app.get('/api/dashboard', async (_req,res)=>{
  try {
    const stats = await pool.query(`SELECT COUNT(*)::int total, COUNT(*) FILTER(WHERE status='ON TRACK')::int on_track, COUNT(*) FILTER(WHERE status='DELAYED')::int delayed, COUNT(*) FILTER(WHERE risk IN ('HIGH','MEDIUM') AND actual_progress < planned_progress)::int needs_review FROM activities`);
    const progress = await pool.query(`SELECT COALESCE(AVG(planned_progress),0)::numeric(5,2) planned, COALESCE(AVG(actual_progress),0)::numeric(5,2) actual FROM activities`);
    const critical = await pool.query(`SELECT id,name,risk,actual_progress FROM activities WHERE risk IN ('HIGH','MEDIUM') ORDER BY CASE risk WHEN 'HIGH' THEN 1 ELSE 2 END, actual_progress ASC LIMIT 8`);
    res.json({stats:stats.rows[0],progress:progress.rows[0],critical:critical.rows});
  } catch(e){res.status(500).json({error:e.message});}
});
app.get('/api/projects', async (_req,res)=>{ try { const r=await pool.query('SELECT * FROM projects ORDER BY id'); res.json(r.rows); } catch(e){res.status(500).json({error:e.message});} });
app.post('/api/projects', async (req,res)=>{ try { const {code,name,location='India'}=req.body; const r=await pool.query('INSERT INTO projects(code,name,location) VALUES($1,$2,$3) RETURNING *',[code,name,location]); res.status(201).json(r.rows[0]); } catch(e){res.status(400).json({error:e.message});} });
app.get('/api/activities', async (req,res)=>{ try { const q=String(req.query.q||'').trim(); const status=req.query.status; const r=await pool.query(`SELECT a.*,p.name project_name FROM activities a JOIN projects p ON p.id=a.project_id WHERE ($1='' OR a.id ILIKE '%'||$1||'%' OR a.name ILIKE '%'||$1||'%') AND ($2='' OR a.status=$2) ORDER BY a.created_at DESC`,[q,status||'']); res.json(r.rows); } catch(e){res.status(500).json({error:e.message});} });
app.get('/api/activities/:id', async (req,res)=>{ try { const a=await pool.query('SELECT a.*,p.name project_name FROM activities a JOIN projects p ON p.id=a.project_id WHERE a.id=$1',[req.params.id]); if(!a.rowCount)return res.status(404).json({error:'Activity not found'}); const reports=await pool.query('SELECT * FROM field_reports WHERE activity_id=$1 ORDER BY created_at DESC',[req.params.id]); res.json({...a.rows[0],reports:reports.rows}); } catch(e){res.status(500).json({error:e.message});} });
app.patch('/api/activities/:id/progress', async (req,res)=>{ try { const progress=Math.max(0,Math.min(100,Number(req.body.progress))); const r=await pool.query(`UPDATE activities SET actual_progress=$1,status=CASE WHEN $1>=planned_progress THEN 'ON TRACK' WHEN planned_progress-$1>=15 THEN 'DELAYED' ELSE 'AT RISK' END,updated_at=NOW() WHERE id=$2 RETURNING *`,[progress,req.params.id]); if(!r.rowCount)return res.status(404).json({error:'Activity not found'}); res.json(r.rows[0]); } catch(e){res.status(400).json({error:e.message});} });
app.get('/api/reports', async (_req,res)=>{ try { const r=await pool.query(`SELECT f.*,a.name activity_name FROM field_reports f JOIN activities a ON a.id=f.activity_id ORDER BY f.created_at DESC`); res.json(r.rows); } catch(e){res.status(500).json({error:e.message});} });
app.post('/api/reports', async (req,res)=>{ const client=await pool.connect(); try { await client.query('BEGIN'); const {activity_id,description,reported_progress,evidence='',submitted_by='Site Engineer'}=req.body; const id='FR-'+Date.now().toString().slice(-8); const r=await client.query(`INSERT INTO field_reports(id,activity_id,description,reported_progress,evidence,submitted_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[id,activity_id,description,reported_progress,evidence,submitted_by]); const gap=await client.query('SELECT planned_progress,actual_progress FROM activities WHERE id=$1',[activity_id]); const confidence=Math.abs(Number(reported_progress)-Number(gap.rows[0]?.actual_progress||0))>=20?'LOW':'MEDIUM'; await client.query('INSERT INTO verification_queue(report_id,confidence,reason) VALUES($1,$2,$3)',[id,confidence,confidence==='LOW'?'Reported progress differs materially from the current activity progress':'Supporting evidence should be reviewed']); await client.query('COMMIT'); res.status(201).json(r.rows[0]); } catch(e){await client.query('ROLLBACK');res.status(400).json({error:e.message});} finally{client.release();} });

app.get('/api/documents', async (req,res)=>{
  try {
    const type = String(req.query.type||'').trim();
    const q = String(req.query.q||'').trim();
    const r = await pool.query(`
      SELECT d.*, a.name activity_name
      FROM worker_documents d
      LEFT JOIN activities a ON a.id=d.activity_id
      WHERE ($1='' OR d.document_type=$1)
        AND ($2='' OR d.worker_name ILIKE '%'||$2||'%' OR d.original_name ILIKE '%'||$2||'%' OR COALESCE(a.name,'') ILIKE '%'||$2||'%')
      ORDER BY d.uploaded_at DESC`, [type,q]);
    res.json(r.rows);
  } catch(e){res.status(500).json({error:e.message});}
});

app.post('/api/documents', upload.single('file'), async (req,res)=>{
  try {
    if (!req.file) return res.status(400).json({error:'Please upload a PDF, image, or Word document.'});
    const {activity_id='', worker_name, document_type, document_date, notes=''} = req.body;
    if (!worker_name || !document_type || !document_date) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({error:'Worker name, document type and document date are required.'});
    }
    if (!['DPR','SITE_DIARY'].includes(document_type)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({error:'Invalid document type.'});
    }
    const r = await pool.query(`INSERT INTO worker_documents
      (activity_id,worker_name,document_type,document_date,notes,original_name,stored_name,mime_type,file_size)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [activity_id || null, worker_name.trim(), document_type, document_date, notes, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size]);
    res.status(201).json(r.rows[0]);
  } catch(e){
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({error:e.message});
  }
});

app.get('/api/documents/:id/download', async (req,res)=>{
  try {
    const r = await pool.query('SELECT * FROM worker_documents WHERE id=$1',[req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:'Document not found'});
    const doc=r.rows[0], file=path.join(uploadDir,doc.stored_name);
    if(!fs.existsSync(file)) return res.status(404).json({error:'Stored file is missing'});
    res.download(file, doc.original_name);
  } catch(e){res.status(500).json({error:e.message});}
});

app.delete('/api/documents/:id', async (req,res)=>{
  try {
    const r=await pool.query('DELETE FROM worker_documents WHERE id=$1 RETURNING *',[req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:'Document not found'});
    const file=path.join(uploadDir,r.rows[0].stored_name);
    if(fs.existsSync(file)) fs.unlinkSync(file);
    res.json({ok:true});
  } catch(e){res.status(400).json({error:e.message});}
});

app.get('/api/verification', async (_req,res)=>{ try { const r=await pool.query(`SELECT v.*,f.activity_id,f.description,f.reported_progress,f.evidence,a.name activity_name,a.actual_progress previous_progress FROM verification_queue v JOIN field_reports f ON f.id=v.report_id JOIN activities a ON a.id=f.activity_id WHERE v.decision='PENDING' ORDER BY v.id`); res.json(r.rows); } catch(e){res.status(500).json({error:e.message});} });
app.patch('/api/verification/:id', async (req,res)=>{ const client=await pool.connect(); try { await client.query('BEGIN'); const {decision}=req.body; const v=await client.query('UPDATE verification_queue SET decision=$1,reviewed_at=NOW() WHERE id=$2 RETURNING *',[decision,req.params.id]); if(!v.rowCount) throw new Error('Verification item not found'); await client.query('UPDATE field_reports SET verification_status=$1 WHERE id=$2',[decision==='CONFIRM'?'VERIFIED':'REJECTED',v.rows[0].report_id]); if(decision==='CONFIRM') await client.query(`UPDATE activities a SET actual_progress=f.reported_progress,status=CASE WHEN f.reported_progress>=a.planned_progress THEN 'ON TRACK' WHEN a.planned_progress-f.reported_progress>=15 THEN 'DELAYED' ELSE 'AT RISK' END,updated_at=NOW() FROM field_reports f WHERE f.id=$1 AND a.id=f.activity_id`,[v.rows[0].report_id]); await client.query('COMMIT'); res.json(v.rows[0]); } catch(e){await client.query('ROLLBACK');res.status(400).json({error:e.message});} finally{client.release();} });

initDb().then(()=>app.listen(port,()=>console.log(`BharatForge API running on http://localhost:${port}`))).catch(e=>{console.error('Database initialization failed:',e);process.exit(1)});

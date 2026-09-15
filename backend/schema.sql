CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(160),
  progress NUMERIC(5,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(30) PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  planned_progress NUMERIC(5,2) DEFAULT 0,
  actual_progress NUMERIC(5,2) DEFAULT 0,
  risk VARCHAR(20) DEFAULT 'LOW',
  status VARCHAR(30) DEFAULT 'ON TRACK',
  planned_finish DATE,
  forecast_finish DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS field_reports (
  id VARCHAR(40) PRIMARY KEY,
  activity_id VARCHAR(30) REFERENCES activities(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reported_progress NUMERIC(5,2) NOT NULL,
  evidence TEXT,
  submitted_by VARCHAR(120) DEFAULT 'Site Engineer',
  verification_status VARCHAR(30) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS verification_queue (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(40) UNIQUE REFERENCES field_reports(id) ON DELETE CASCADE,
  confidence VARCHAR(20) DEFAULT 'MEDIUM',
  reason TEXT,
  decision VARCHAR(20) DEFAULT 'PENDING',
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS worker_documents (
  id SERIAL PRIMARY KEY,
  activity_id VARCHAR(30) REFERENCES activities(id) ON DELETE SET NULL,
  worker_name VARCHAR(120) NOT NULL,
  document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('DPR','SITE_DIARY')),
  document_date DATE NOT NULL,
  notes TEXT,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(120),
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_worker_documents_activity ON worker_documents(activity_id);
CREATE INDEX IF NOT EXISTS idx_worker_documents_date ON worker_documents(document_date DESC);

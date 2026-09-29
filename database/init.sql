CREATE TABLE IF NOT EXISTS relic_item (
  id INTEGER PRIMARY KEY,
  relic_code TEXT,
  name TEXT,
  era TEXT,
  material TEXT,
  collection_level TEXT,
  storage_location TEXT,
  current_condition TEXT
);

CREATE TABLE IF NOT EXISTS damage_record (
  id INTEGER PRIMARY KEY,
  relic_id TEXT,
  damage_type TEXT,
  position_desc TEXT,
  severity TEXT,
  discovered_by TEXT,
  discovered_at TEXT,
  image_url TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS restoration_plan (
  id INTEGER PRIMARY KEY,
  relic_id TEXT,
  damage_record_id TEXT,
  plan_title TEXT,
  method TEXT,
  risk_assessment TEXT,
  approval_status TEXT,
  owner_id TEXT,
  revision_no INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS restoration_step (
  id INTEGER PRIMARY KEY,
  plan_id TEXT,
  step_order TEXT,
  technique TEXT,
  material_used TEXT,
  operator_id TEXT,
  step_status TEXT,
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS image_version (
  id INTEGER PRIMARY KEY,
  relic_id TEXT,
  plan_id TEXT,
  version_no TEXT,
  image_type TEXT,
  file_path TEXT,
  capture_at TEXT,
  note TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  created_at TEXT
);

-- 离线批次：平板现场记录（修复步骤、材料用量、影像版本），回馆后按批次号 + 方案基线修订号归并。
CREATE TABLE IF NOT EXISTS offline_batch (
  id INTEGER PRIMARY KEY,
  batch_no TEXT UNIQUE,
  plan_id INTEGER,
  device_id TEXT,
  operator_id INTEGER,
  base_revision_no INTEGER,
  base_plan TEXT,
  plan_patch TEXT,
  steps TEXT,
  images TEXT,
  status TEXT,
  attempts INTEGER DEFAULT 0,
  result_id INTEGER,
  last_error TEXT,
  captured_at TEXT,
  received_at TEXT
);

-- 归并冲突：双方改动各留一份（central_value / offline_value），未处理完阻止方案归档。
CREATE TABLE IF NOT EXISTS merge_conflict (
  id INTEGER PRIMARY KEY,
  batch_no TEXT,
  plan_id INTEGER,
  conflict_type TEXT,
  field_name TEXT,
  target_id INTEGER,
  base_value TEXT,
  central_value TEXT,
  offline_value TEXT,
  status TEXT,
  resolution TEXT,
  resolved_by INTEGER,
  resolved_at TEXT,
  created_at TEXT
);

-- 归并结果：重传沿用首次结果（retransmit 由接口标记）。
CREATE TABLE IF NOT EXISTS merge_result (
  id INTEGER PRIMARY KEY,
  batch_no TEXT,
  plan_id INTEGER,
  base_revision_no INTEGER,
  merged_revision_no INTEGER,
  status TEXT,
  applied_fields TEXT,
  applied_step_ids TEXT,
  applied_image_versions TEXT,
  held_step_count INTEGER DEFAULT 0,
  held_image_count INTEGER DEFAULT 0,
  plan_archivable INTEGER,

  created_at TEXT
);

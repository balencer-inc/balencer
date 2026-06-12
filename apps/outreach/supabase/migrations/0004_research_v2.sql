-- =====================================================================
-- Research v2: ベースリスト × HP分析方式への転換
-- =====================================================================
-- - campaigns に data_sources（情報源設定）を追加
-- - prospects に dx_score / data_source を追加（ソート/フィルタ用）
-- - research_runs テーブル新設（4段階進捗管理）
-- =====================================================================

-- キャンペーンの情報源設定（複数同時利用可）
-- 例: [{"type":"gbiz"}, {"type":"ranking_site","urls":["https://..."]}, {"type":"csv","filename":"..."}]
alter table campaigns
  add column if not exists data_sources jsonb default '[]'::jsonb;

-- prospects: DX未導入スコアと、どの情報源から来たかをトップレベルに
alter table prospects
  add column if not exists dx_score numeric;

alter table prospects
  add column if not exists data_source text check (data_source in ('gbiz','csv','ranking_site','manual'));

-- DXスコア順ソートのためのインデックス
create index if not exists prospects_dx_score_idx
  on prospects (campaign_id, dx_score desc nulls last);

-- リサーチ実行の進捗管理
create table if not exists research_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  stage text not null check (stage in ('seeds','scraping','heuristics','ai','done','failed')),
  seeds_count int default 0,
  scraped_count int default 0,
  judged_count int default 0,
  inserted_count int default 0,
  error_message text,
  meta jsonb default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists research_runs_campaign_idx
  on research_runs (campaign_id, started_at desc);

alter table research_runs enable row level security;
create policy "org_isolation_all" on research_runs for all using (true) with check (true);

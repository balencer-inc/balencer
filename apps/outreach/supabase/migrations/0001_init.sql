-- =====================================================================
-- BALENCER Outreach Phase 1 — 初期スキーマ
-- =====================================================================
-- 全テーブルに organization_id を仕込み、Phase 1 はバレンサー1組織固定。
-- 将来の外販版（別リポ）へのデータ互換性確保のため。
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- organizations : 外販下準備の最小テーブル。Phase 1 は1レコードのみ
-- ---------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  display_address text,                -- 特電法フッタ用住所
  created_at timestamptz not null default now()
);

-- バレンサー1組織を投入
insert into organizations (id, slug, name, display_address) values (
  '00000000-0000-0000-0000-000000000001',
  'balencer',
  '株式会社バレンサー',
  '〒530-0001 大阪市北区梅田1-11-4 大阪駅前第4ビル9階 923 1542号'
);

-- ---------------------------------------------------------------------
-- sender_personas : 加藤梨紗 / 松本カオリ
-- ---------------------------------------------------------------------
create table sender_personas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  display_name text not null,
  email_from text not null,
  signature_html text,
  consent_at timestamptz not null,     -- 本人同意ログ
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into sender_personas (organization_id, display_name, email_from, consent_at) values
  ('00000000-0000-0000-0000-000000000001', '加藤梨紗', 'info@balencer.jp', now()),
  ('00000000-0000-0000-0000-000000000001', '松本カオリ', 'info@balencer.jp', now());

-- ---------------------------------------------------------------------
-- services : サービスマスター
-- ---------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  pitch_axis text,
  source_material text,                          -- 資料テキスト（Markdown可）
  source_material_updated_at timestamptz,
  target_audience jsonb default '{}'::jsonb,     -- {industries[], company_sizes[], job_titles[]}
  resource_links jsonb default '[]'::jsonb,      -- [{id,label,url,type,insert_mode,context_hint}]
  active_template_ids jsonb default '[]'::jsonb, -- adopted service_templates.id[]
  authority_block jsonb default '{}'::jsonb,     -- {numbers,books,cases}
  cta_label text,
  cta_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

-- ---------------------------------------------------------------------
-- service_templates : AIが提案した3-4案を保持
-- ---------------------------------------------------------------------
create table service_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  label text not null,                            -- "短文×親しみ×共感型"等
  length_tier int not null check (length_tier in (300, 500, 700)),
  tone text not null check (tone in ('formal', 'standard', 'friendly')),
  structure text not null check (structure in ('problem', 'empathy', 'impact')),
  subject_pattern text not null,
  body_pattern text not null,
  rationale text,                                 -- 80字以内
  recommended_resource_link_types jsonb default '[]'::jsonb,
  generated_from_material_hash text,
  status text not null default 'proposed' check (status in ('proposed', 'adopted', 'archived')),
  version int not null default 1,
  created_by text not null default 'ai' check (created_by in ('ai', 'human_edit')),
  created_at timestamptz not null default now()
);
create index on service_templates (service_id, status);

-- ---------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_id uuid not null references services(id),
  sender_persona_id uuid not null references sender_personas(id),
  name text not null,
  industry text,
  area text,
  employee_range text,
  target_count int not null default 10,
  status text not null default 'draft' check (status in ('draft','researching','reviewing','sending','done','archived')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- prospects : 候補企業（キャンペーンごとに蓄積、企業マスターは作らない）
-- ---------------------------------------------------------------------
create table prospects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  company_name text not null,
  url text,
  industry_tag text,
  employee_estimate text,
  contact_method text check (contact_method in ('email','form','unknown')),
  contact_value text,
  analysis jsonb default '{}'::jsonb,             -- {strengths, recent_news, language_style, page_excerpts}
  status text not null default 'pending' check (status in ('pending','reviewed','approved','rejected','drafted','sent','bounced','unsubscribed')),
  rejection_reason text,
  pipeline_stage text not null default 'not_sent' check (pipeline_stage in ('not_sent','sent','opened','clicked','replied','in_talks','won','lost')),
  pipeline_updated_at timestamptz,
  pipeline_note text,
  replied_at timestamptz,
  replied_note text,
  researched_at timestamptz not null default now()
);
create index on prospects (campaign_id, status);
create index on prospects (pipeline_stage);

-- ---------------------------------------------------------------------
-- email_drafts
-- ---------------------------------------------------------------------
create table email_drafts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  prospect_id uuid not null references prospects(id) on delete cascade,
  service_id uuid not null references services(id),
  sender_persona_id uuid not null references sender_personas(id),
  selected_template_id uuid references service_templates(id),
  subject text not null,
  body_md text not null,
  body_html text,
  hook_evidence jsonb,                            -- {quote_url, quote_text} 必須・無しは承認不可
  inserted_resource_link_ids jsonb default '[]'::jsonb,
  link_insertions jsonb default '[]'::jsonb,      -- [{link_id, position}]
  status text not null default 'draft' check (status in ('draft','approved','rejected','sent','failed')),
  approved_by uuid,
  approved_at timestamptz,
  generated_at timestamptz not null default now()
);
create index on email_drafts (prospect_id);
create index on email_drafts (status);

-- ---------------------------------------------------------------------
-- sends : 実際の送信ログ（Resend連携）
-- ---------------------------------------------------------------------
create table sends (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  draft_id uuid not null references email_drafts(id) on delete cascade,
  resend_id text,                                 -- ResendのメッセージID
  outreach_send_id uuid not null default gen_random_uuid(), -- X-Outreach-Send-Id ヘッダ用
  sent_at timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued','sent','bounced','complaint','failed')),
  error_message text
);
create unique index on sends (outreach_send_id);

-- ---------------------------------------------------------------------
-- events : 開封/クリック/返信等の追跡
-- ---------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  send_id uuid not null references sends(id) on delete cascade,
  type text not null check (type in ('opened','clicked','replied','bounced','unsubscribed','complaint')),
  url text,
  user_agent text,
  raw_payload jsonb,
  occurred_at timestamptz not null default now()
);
create index on events (send_id, type);
create index on events (occurred_at desc);

-- ---------------------------------------------------------------------
-- unsubscribes : 配信停止リスト（送信前に必ず突合）
-- ---------------------------------------------------------------------
create table unsubscribes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  reason text,
  source_send_id uuid references sends(id),
  unsubscribed_at timestamptz not null default now(),
  unique (organization_id, email)
);

-- =====================================================================
-- Row Level Security : マルチテナント前提でポリシー記述
-- Phase 1 はバレンサー1組織のため、すべて同じ org_id でアクセス
-- =====================================================================
alter table organizations enable row level security;
alter table sender_personas enable row level security;
alter table services enable row level security;
alter table service_templates enable row level security;
alter table campaigns enable row level security;
alter table prospects enable row level security;
alter table email_drafts enable row level security;
alter table sends enable row level security;
alter table events enable row level security;
alter table unsubscribes enable row level security;

-- 認証済みユーザーは自組織のレコードのみ全権アクセス
-- ※ Phase 1 では JWT の org_id クレームを設定する想定。未設定時は全許可（開発用）
do $$ declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and tablename in (
    'organizations','sender_personas','services','service_templates',
    'campaigns','prospects','email_drafts','sends','events','unsubscribes'
  )
  loop
    execute format('create policy "org_isolation_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- =====================================================================
-- 初期サービスデータ（Phase 1 で実走するサービスの種）
-- ※ source_material は後で阿部さんが画面から投入
-- =====================================================================
insert into services (organization_id, slug, name, pitch_axis, cta_label, cta_url, authority_block) values
  ('00000000-0000-0000-0000-000000000001',
   'balencer-ai',
   'バレンサーAI',
   'AI社員に指示する体験を核に、業態を分析→実装→運用→ナレッジ化まで一気通貫',
   'オンラインで15分話す',
   '',  -- TidyCal URLを後で入れる
   '{"numbers":["創業以来12年連続黒字","関西の中小企業60社超で導入"],"books":["阿部による著書3冊"]}'::jsonb),
  ('00000000-0000-0000-0000-000000000001',
   'turnaround',
   '組織立て直しコンサルティング',
   '創業期から成長期へ移行する30〜50名規模の企業に特化',
   'オンラインで20分話す',
   '',
   '{"numbers":["創業以来12年連続黒字","関西60社超の伴走実績"],"books":["阿部による著書3冊"]}'::jsonb);

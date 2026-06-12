-- =====================================================================
-- AI対話モード対応: data_source CHECK 制約に 'ai_conversational' を追加
-- =====================================================================

alter table prospects
  drop constraint if exists prospects_data_source_check;

alter table prospects
  add constraint prospects_data_source_check
  check (data_source in ('gbiz','csv','ranking_site','manual','ai_conversational'));

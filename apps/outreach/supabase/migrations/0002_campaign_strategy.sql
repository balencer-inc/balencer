-- =====================================================================
-- T11: campaigns に target_strategy を追加
-- リサーチエージェントが戦略ごとに検索手法を変えるためのカラム
-- =====================================================================

alter table campaigns
  add column if not exists target_strategy text default 'regional_premium'
    check (target_strategy in ('enterprise_tokyo','regional_premium','ma_candidate','industry_focus','from_csv'));

-- 既存レコードの埋め戻し
update campaigns set target_strategy = 'regional_premium' where target_strategy is null;

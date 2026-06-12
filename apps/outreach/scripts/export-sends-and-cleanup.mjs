// Outreach DB: 送信履歴CSV吐き出し + 古いキャンペーン削除
//
// 使い方:
//   cd apps/outreach
//   node scripts/export-sends-and-cleanup.mjs               # dry-run: 件数表示+CSV書き出しのみ
//   node scripts/export-sends-and-cleanup.mjs --execute     # 実削除実行
//
// 動作:
//   1. sends テーブルから全送信履歴を取得 → CSV出力(Desktop)
//   2. dry-run: 2026-05-26 00:00 JST より前のcampaignsの件数を表示
//   3. --execute: 上記campaignsを削除(CASCADEで prospects/drafts/sends/events も消える)

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, '..', '.env.local');

// .env.local を簡易パース
const env = {};
for (const line of readFileSync(ENV_PATH, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL or SERVICE_KEY missing in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');

// JST 2026-05-26 00:00:00 = UTC 2026-05-25 15:00:00
const CUTOFF_UTC = '2026-05-25T15:00:00Z';
const CUTOFF_LABEL = '2026-05-26 00:00 JST';

console.log(`mode: ${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}`);
console.log(`cutoff: ${CUTOFF_LABEL} (UTC ${CUTOFF_UTC}) より前を対象`);
console.log('');

// ============================================================
// 1. sends 全件CSVエクスポート
// ============================================================
console.log('=== Step 1: sends 全件CSV吐き出し ===');

// sends → draft → (prospect → campaign), service, sender_persona の経路で取得
const { data: sends, error: sendsErr } = await sb
  .from('sends')
  .select(`
    id,
    sent_at,
    status,
    error_message,
    draft:draft_id (
      subject,
      prospect:prospect_id (
        company_name, url, industry_tag, employee_estimate, contact_method, contact_value,
        pipeline_stage, replied_at,
        campaign:campaign_id ( name )
      ),
      service:service_id ( name ),
      sender_persona:sender_persona_id ( display_name, email_from )
    )
  `)
  .order('sent_at', { ascending: true });

if (sendsErr) {
  console.error('sends fetch error:', sendsErr);
  process.exit(1);
}

console.log(`  取得: ${sends.length}件`);

// CSV化
const headers = [
  'sent_at_utc', 'status', 'company_name', 'url', 'industry_tag', 'employee_estimate',
  'contact_method', 'contact_value', 'pipeline_stage', 'replied_at',
  'subject', 'campaign_name', 'service_name',
  'sender_name', 'sender_email', 'error_message',
];

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const lines = [headers.join(',')];
for (const r of sends) {
  const p = r.draft?.prospect;
  lines.push([
    r.sent_at || '',
    r.status || '',
    p?.company_name || '',
    p?.url || '',
    p?.industry_tag || '',
    p?.employee_estimate || '',
    p?.contact_method || '',
    p?.contact_value || '',
    p?.pipeline_stage || '',
    p?.replied_at || '',
    r.draft?.subject || '',
    p?.campaign?.name || '',
    r.draft?.service?.name || '',
    r.draft?.sender_persona?.display_name || '',
    r.draft?.sender_persona?.email_from || '',
    r.error_message || '',
  ].map(csvEscape).join(','));
}

const csvPath = `${process.env.HOME}/Desktop/営業リスト/送信履歴/sends-export-${new Date().toISOString().slice(0,10)}.csv`;
execSync(`mkdir -p "${process.env.HOME}/Desktop/営業リスト/送信履歴"`);
writeFileSync(csvPath, lines.join('\n'), 'utf-8');
console.log(`  -> ${csvPath}`);

// ============================================================
// 2. 削除対象カウント
// ============================================================
console.log('');
console.log('=== Step 2: 削除対象カウント (campaigns) ===');

const { count: oldCampaignCount, error: countErr } = await sb
  .from('campaigns')
  .select('*', { count: 'exact', head: true })
  .lt('created_at', CUTOFF_UTC);

if (countErr) {
  console.error('count error:', countErr);
  process.exit(1);
}

const { count: keepCampaignCount } = await sb
  .from('campaigns')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', CUTOFF_UTC);

console.log(`  削除対象 campaigns: ${oldCampaignCount}件 (created_at < ${CUTOFF_LABEL})`);
console.log(`  保持 campaigns:     ${keepCampaignCount}件 (created_at >= ${CUTOFF_LABEL})`);

// 各子テーブルの参考件数
const tables = ['prospects', 'email_drafts', 'sends', 'events'];
console.log('');
console.log('  ★ CASCADE で連動削除される子テーブル件数(参考):');
for (const t of tables) {
  const { count: total } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(`    ${t}: 全${total}件 (古いcampaign配下のレコードが自動削除される)`);
}

// 削除対象のcampaign一覧を最大20件表示
console.log('');
console.log('  削除対象 campaigns サンプル(最大10件):');
const { data: oldCampaigns } = await sb
  .from('campaigns')
  .select('id, name, created_at')
  .lt('created_at', CUTOFF_UTC)
  .order('created_at', { ascending: false })
  .limit(10);
for (const c of oldCampaigns || []) {
  console.log(`    [${c.created_at.slice(0,10)}] ${c.name} (id:${c.id.slice(0,8)})`);
}

console.log('');
console.log('  保持 campaigns サンプル(最大10件):');
const { data: keepCampaigns } = await sb
  .from('campaigns')
  .select('id, name, created_at')
  .gte('created_at', CUTOFF_UTC)
  .order('created_at', { ascending: false })
  .limit(10);
for (const c of keepCampaigns || []) {
  console.log(`    [${c.created_at.slice(0,10)}] ${c.name} (id:${c.id.slice(0,8)})`);
}

// ============================================================
// 3. 実削除 (--execute 時のみ)
// ============================================================
if (!EXECUTE) {
  console.log('');
  console.log('=== DRY-RUN 完了 ===');
  console.log('実削除するには: node scripts/export-sends-and-cleanup.mjs --execute');
  process.exit(0);
}

console.log('');
console.log('=== Step 3: 実削除 EXECUTE ===');
const { error: deleteErr, count: deletedCount } = await sb
  .from('campaigns')
  .delete({ count: 'exact' })
  .lt('created_at', CUTOFF_UTC);

if (deleteErr) {
  console.error('DELETE error:', deleteErr);
  process.exit(1);
}

console.log(`  削除完了: ${deletedCount} campaigns (CASCADEで子テーブルも削除)`);

// 削除後の確認
console.log('');
console.log('=== 削除後確認 ===');
for (const t of ['campaigns', 'prospects', 'email_drafts', 'sends', 'events']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  console.log(`  ${t}: 残${count}件`);
}

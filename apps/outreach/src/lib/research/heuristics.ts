/**
 * HP HTMLから DX 未導入度のシグナルを機械的に抽出
 *
 * 全てAIを使わない決定論的処理。スコア加算で 0-100 を作る。
 */

export interface HpSignals {
  copyright_year?: number;
  has_viewport: boolean;
  form_style: "modern" | "legacy" | "unknown";
  has_gtm_or_ga4: boolean;
  is_https: boolean;
  saas_badges: string[];
  fax_or_phone_only: boolean;
  recruit_mentions_dx: boolean;
  last_modified_year?: number;
  last_news_date?: string;
  founded_year?: number;
}

export interface SignalEvaluation {
  dx_signal_score: number; // 0-100目安、大きいほど「DX未導入」っぽい
  signals: HpSignals;
  signal_notes: string[]; // 加点理由の人間可読ログ
}

const SAAS_BADGES_REGEX =
  /salesforce|hubspot|kintone|sansan|freee|moneyforward|slack|microsoft\s*teams|notion|zendesk|intercom|marketo|pardot/i;

const FAX_ONLY_REGEX =
  /お問い合わせ[\s\S]{0,80}(?:FAX|fax)のみ|電話のみ受付|お電話のみ|お問い合わせは(?:電話|FAX)/;

const RECRUIT_DX_REGEX = /DX|デジタル(?:トランスフォーメーション|変革)|IT人材|エンジニア募集|プログラマー|デジタル化推進/;

/**
 * Firecrawl で取得した HP情報からシグナル抽出
 * @param rawHtml — できれば取得しておく。なければ markdown のみで部分判定
 * @param markdown — 必須
 * @param url — 判定用
 * @param lastModifiedHeader — HEADレスポンスの Last-Modified（任意）
 */
export function evaluateHpSignals(input: {
  url: string;
  markdown: string;
  rawHtml?: string;
  lastModifiedHeader?: string;
  recruitPageContent?: string; // /recruit や /career のページ内容（任意）
}): SignalEvaluation {
  const notes: string[] = [];
  let score = 0;
  const signals: HpSignals = {
    has_viewport: false,
    form_style: "unknown",
    has_gtm_or_ga4: false,
    is_https: input.url.startsWith("https://"),
    saas_badges: [],
    fax_or_phone_only: false,
    recruit_mentions_dx: false,
  };

  const html = input.rawHtml || "";
  const md = input.markdown || "";
  const combined = html + "\n" + md;

  // 1. HTTPS
  if (!signals.is_https) {
    score += 20;
    notes.push("http のみ（未対応）: +20");
  }

  // 2. footer 著作権年
  const copyrightMatch = combined.match(
    /(?:©|copyright|&copy;)[^0-9]{0,30}(\d{4})(?:\s*[-~−〜−–]\s*(\d{4}))?/i
  );
  if (copyrightMatch) {
    const lastYear = parseInt(copyrightMatch[2] || copyrightMatch[1], 10);
    signals.copyright_year = lastYear;
    const currentYear = new Date().getFullYear();
    const diff = currentYear - lastYear;
    if (diff >= 5) {
      score += 20;
      notes.push(`copyright ${lastYear} (5年以上前): +20`);
    } else if (diff >= 3) {
      score += 10;
      notes.push(`copyright ${lastYear} (3-4年前): +10`);
    }
  }

  // 3. viewport meta
  if (html) {
    signals.has_viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    if (!signals.has_viewport) {
      score += 15;
      notes.push("viewport meta なし: +15");
    }
  }

  // 4. form 構造
  if (html) {
    const formMatch = html.match(/<form[^>]*action=["']([^"']+)["']/i);
    if (formMatch) {
      const action = formMatch[1].toLowerCase();
      if (action.startsWith("mailto:")) {
        signals.form_style = "legacy";
        score += 10;
        notes.push("form action=mailto: +10");
      } else if (action.endsWith(".php") || action.endsWith(".cgi") || action.endsWith(".asp")) {
        signals.form_style = "legacy";
        score += 10;
        notes.push("form action=.php/.cgi/.asp: +10");
      } else {
        signals.form_style = "modern";
      }
    }
  }

  // 5. GTM / GA4
  signals.has_gtm_or_ga4 = /googletagmanager\.com|gtag\(|G-[A-Z0-9]{8,}/i.test(combined);
  if (!signals.has_gtm_or_ga4) {
    score += 5;
    notes.push("GTM/GA4 なし: +5");
  }

  // 6. SaaS バッジ言及
  const saasMatches = combined.match(new RegExp(SAAS_BADGES_REGEX.source, "gi"));
  if (saasMatches) {
    signals.saas_badges = Array.from(new Set(saasMatches.map((s) => s.toLowerCase())));
    score -= 15;
    notes.push(`SaaS言及 (${signals.saas_badges.join(",")}): -15`);
  }

  // 7. FAX/電話のみ表記
  if (FAX_ONLY_REGEX.test(combined)) {
    signals.fax_or_phone_only = true;
    score += 15;
    notes.push("FAX/電話のみ受付: +15");
  }

  // 8. 採用ページ DX 言及
  if (input.recruitPageContent) {
    signals.recruit_mentions_dx = RECRUIT_DX_REGEX.test(input.recruitPageContent);
    if (!signals.recruit_mentions_dx) {
      score += 5;
      notes.push("採用ページにDX/IT言及なし: +5");
    }
  }

  // 9. Last-Modified ヘッダ
  if (input.lastModifiedHeader) {
    const lmDate = new Date(input.lastModifiedHeader);
    if (!isNaN(lmDate.getTime())) {
      signals.last_modified_year = lmDate.getFullYear();
      const diff = (Date.now() - lmDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
      if (diff >= 1) {
        score += 5;
        notes.push(`Last-Modified ${lmDate.getFullYear()} (1年以上前): +5`);
      }
    }
  }

  // 10. ブログ/お知らせ最終更新日（markdown内の日付パターン）
  const dateMatches = md.match(/\b20\d{2}[-\/年\.](?:0?[1-9]|1[0-2])[-\/月\.](?:[0-3]?\d)/g) || [];
  if (dateMatches.length > 0) {
    const latestDate = dateMatches
      .map((s) => parseLooseDate(s))
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (latestDate) {
      signals.last_news_date = latestDate.toISOString().slice(0, 10);
      const monthsDiff = (Date.now() - latestDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
      if (monthsDiff >= 12) {
        score += 10;
        notes.push(`最新お知らせ ${signals.last_news_date} (1年以上前): +10`);
      }
    }
  }

  // 11. 創業年（参考情報、スコアには直接寄与しない）
  const foundedMatch = md.match(/(?:創業|設立|創立)[\s\S]{0,30}(\d{4})\s*年/);
  if (foundedMatch) {
    signals.founded_year = parseInt(foundedMatch[1], 10);
  }

  return {
    dx_signal_score: Math.max(0, Math.min(100, score)),
    signals,
    signal_notes: notes,
  };
}

/** "2024-12-31" / "2024/12/31" / "2024年12月31日" 等を Date に */
function parseLooseDate(s: string): Date | null {
  const m = s.match(/(20\d{2})[-\/年\.](0?\d|1[0-2])[-\/月\.]([0-3]?\d)/);
  if (!m) return null;
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  return isNaN(d.getTime()) ? null : d;
}

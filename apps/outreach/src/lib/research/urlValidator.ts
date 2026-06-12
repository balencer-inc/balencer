/**
 * URL存在チェック・ホスト名検証・ブロックドメイン判定。
 * 既存 agent.ts の検証ロジックを切り出して再利用可能に。
 */

/** AI捏造URL対策・スパムリスト系を弾く */
export const BLOCKED_DOMAINS = [
  "relay.town",
  "batonz.jp",
  "tranbi.com",
  "ma-cp.com",
  "nihon-ma.co.jp",
  "smbc-ma.co.jp",
  "speedanswer.com",
  "rikunabi.com",
  "mynavi.jp",
  "doda.jp",
  "wantedly.com",
  "indeed.com",
  "en-japan.com",
  "type.jp",
  "openwork.jp",
  "vorkers.com",
];

export const BLOCKED_PATHS = /\/(entrustments|case_|anonymous|listings|case-\d|jobs?|recruit|career|wanted)\b/i;

/** 「A社」「○○社」「仮称」等の匿名社名パターン */
export const ANONYMOUS_NAME_PATTERN =
  /^(株式会社\s*)?[A-Z]{1,3}社|^(株式会社\s*)?[○○●]+|^仮称|案件番号|案件 ?[#No.]/i;

/** URL文字列からホスト名を正規化（www. を除去・小文字化）。失敗時は null */
export function normalizeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** ホスト名がブロックリストに該当するか */
export function isBlockedHost(host: string): boolean {
  return BLOCKED_DOMAINS.some((d) => host === d || host.endsWith("." + d));
}

/** URL全体（path含む）がブロック対象か */
export function isBlockedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (isBlockedHost(host)) return true;
    if (BLOCKED_PATHS.test(u.pathname)) return true;
    return false;
  } catch {
    return true;
  }
}

/** 社名が匿名・伏字パターンか */
export function isAnonymousName(name: string): boolean {
  return ANONYMOUS_NAME_PATTERN.test(name);
}

/** HEAD/GET で URL の存在をチェック。タイムアウト6秒 */
export async function checkUrlAlive(url: string): Promise<{ alive: boolean; reason?: string }> {
  if (!url || !url.startsWith("http")) return { alive: false, reason: "URL不正" };

  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
      headers: { "User-Agent": ua },
    });
    // 405=HEAD不許可だが存在、403=Bot弾きだが存在の可能性
    if (headRes.ok || headRes.status === 405 || headRes.status === 403) {
      return { alive: true };
    }
    // 404/5xx なら GET で再チェック（HEAD未対応サイト用）
    if (headRes.status === 404 || headRes.status >= 500) {
      try {
        const getRes = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(6000),
          redirect: "follow",
          headers: { "User-Agent": ua },
        });
        if (getRes.ok) return { alive: true };
        return { alive: false, reason: `HTTP ${getRes.status}` };
      } catch {
        return { alive: false, reason: `HTTP ${headRes.status}` };
      }
    }
    return { alive: false, reason: `HTTP ${headRes.status}` };
  } catch (e) {
    return { alive: false, reason: e instanceof Error ? e.message.slice(0, 40) : "fetch失敗" };
  }
}

/** 複数URLを並列に存在チェック */
export async function checkUrlsAlive<T extends { url: string }>(
  items: T[]
): Promise<Array<{ item: T; alive: boolean; reason?: string }>> {
  return await Promise.all(
    items.map(async (item) => {
      const res = await checkUrlAlive(item.url);
      return { item, ...res };
    })
  );
}

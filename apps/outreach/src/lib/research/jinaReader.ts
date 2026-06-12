/**
 * Jina Reader クライアント（HP本文取得・LLM最適化マークダウン）
 *
 * - エンドポイント: https://r.jina.ai/{URL}
 * - 認証: Authorization: Bearer {JINA_API_KEY}（無料登録で 200 RPM）
 *   未設定でも動く（20 RPM 制限）
 * - JS実行: デフォルトでブラウザレンダリング有効
 * - 出力: LLM向けに最適化された markdown
 *
 * Firecrawl /scrape の代替。コスト $0。
 */

const JINA_BASE = "https://r.jina.ai";

export interface JinaScrapeResult {
  url: string;
  markdown: string;
  rawHtml?: string;
  title?: string;
  description?: string;
  lastModified?: string;
}

export interface JinaScrapeOptions {
  /** true なら markdown に加えて HTML も取得（メアド mailto: 抽出用） */
  includeHtml?: boolean;
  /** true なら本文だけでなくページ全体を取得 */
  fullPage?: boolean;
}

/**
 * 単一URLをスクレイプ。Firecrawl と同等の形で返す。
 * - markdown は r.jina.ai から取得
 * - HTML は別途 fetch で取得（mailto: リンク抽出のため必須）
 */
export async function jinaReaderScrape(
  url: string,
  options: JinaScrapeOptions = {}
): Promise<JinaScrapeResult | null> {
  const apiKey = process.env.JINA_API_KEY;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  // ページ全体（ナビゲーション・フッタ含む）を取得したい場合
  if (options.fullPage) headers["X-Retain-Images"] = "none";
  else headers["X-Retain-Images"] = "none"; // 画像は不要

  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.error(`[jina.scrape] HTTP ${res.status} for ${url}`);
      return null;
    }
    const json = await res.json();
    const data = json.data || {};

    let rawHtml: string | undefined;
    if (options.includeHtml) {
      // Jina は markdown 中心だが、HTML 形式も取れる
      rawHtml = await fetchRawHtml(url);
    }

    return {
      url,
      markdown: data.content || "",
      rawHtml,
      title: data.title,
      description: data.description,
      lastModified: data.publishedTime || data.lastModified,
    };
  } catch (e) {
    console.error("[jina.scrape]", url, e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Raw HTML を別途 fetch で取得。
 * - mailto: リンクや難読化メアドの抽出用
 * - 失敗しても markdown 取得は別経路なので影響なし
 */
async function fetchRawHtml(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    // 100KB 上限（メモリ・トークン節約）
    return html.slice(0, 100 * 1024);
  } catch {
    return undefined;
  }
}

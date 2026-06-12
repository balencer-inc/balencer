/**
 * メール本文の組み立て。
 * - Markdown -> HTML（簡易変換）
 * - 特電法フッタを自動付与
 * - 配信停止リンクを自動付与
 * - List-Unsubscribe ヘッダ用の URL を返す
 */

import crypto from "node:crypto";

interface BuildEmailInput {
  bodyMd: string;
  organizationName: string;
  organizationAddress: string | null;
  senderEmail: string;
  outreachSendId: string;
  recipientEmail: string;
}

export interface BuiltEmail {
  html: string;
  text: string;
  unsubscribeUrl: string;
  listUnsubscribeHeader: string;
}

const BASE_URL =
  process.env.OUTREACH_BASE_URL || "http://localhost:3100";
const SECRET = process.env.TRACKING_SECRET || "phase1-dev-secret";

export function buildUnsubscribeToken(email: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(email);
  return hmac.digest("hex").slice(0, 24);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = buildUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function buildEmail(input: BuildEmailInput): BuiltEmail {
  const token = buildUnsubscribeToken(input.recipientEmail);
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(
    input.recipientEmail
  )}&token=${token}`;

  // 特電法フッタ + 配信停止リンク
  const legalFooter = `

----------------------------
本メールは特定電子メール法に基づき、公開されている問い合わせ用アドレスへお送りしています。
発信元: ${input.organizationName}
所在地: ${input.organizationAddress || "（住所未設定）"}
メール: ${input.senderEmail}

今後のご案内を希望されない場合は下記より配信停止をお願いいたします:
${unsubscribeUrl}`;

  const textBody = input.bodyMd + legalFooter;
  const htmlBody = mdToHtml(input.bodyMd) + mdToHtml(legalFooter);

  // RFC 8058 List-Unsubscribe ヘッダ
  const listUnsubscribeHeader = `<${unsubscribeUrl}>, <mailto:${input.senderEmail}?subject=unsubscribe>`;

  return {
    html: htmlBody,
    text: textBody,
    unsubscribeUrl,
    listUnsubscribeHeader,
  };
}

/**
 * 軽量Markdown→HTML変換（外部依存なし）
 * Phase 1ではこれで十分。複雑なMD要素は使わない前提
 */
function mdToHtml(md: string): string {
  let html = md
    // エスケープ
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // **bold**
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // *italic*
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, "<em>$1</em>");
  // [link](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#0066cc;text-decoration:underline">$1</a>'
  );
  // bare URL -> link
  html = html.replace(
    /(?<!["=>])(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#0066cc;text-decoration:underline">$1</a>'
  );
  // 改行を <br> に
  html = html.replace(/\n/g, "<br>\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="font-family:'Noto Sans JP','Hiragino Sans',sans-serif;font-size:14.5px;line-height:1.85;color:#1a1a1a;max-width:640px;margin:0;padding:24px;background:#ffffff">
${html}
</body>
</html>`;
}

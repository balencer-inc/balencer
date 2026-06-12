import { Resend } from "resend";

// ドメインごとに別Resendアカウント(別APIキー)を使う設計
// - balencer.jp 系 → RESEND_API_KEY (メイン)
// - tsugiandpartners.jp 系 → RESEND_API_KEY_TSUGI (TSUGI用)
// 必要に応じて他ドメイン追加可能

const _clients = new Map<string, Resend>();

function resolveApiKey(emailFrom: string): { key: string; bucket: string } {
  const domain = (emailFrom.split("@")[1] || "").toLowerCase();

  if (domain.endsWith("tsugiandpartners.jp")) {
    const key = process.env.RESEND_API_KEY_TSUGI || process.env.RESEND_API_KEY;
    return { key: key!, bucket: "tsugi" };
  }

  // balencer.jp 系 (デフォルト)
  return { key: process.env.RESEND_API_KEY!, bucket: "balencer" };
}

/**
 * 差出人メアドのドメインに応じた Resend クライアントを返す
 */
export function getResendForDomain(emailFrom: string): Resend {
  const { key, bucket } = resolveApiKey(emailFrom);
  if (!_clients.has(bucket)) {
    _clients.set(bucket, new Resend(key));
  }
  return _clients.get(bucket)!;
}

/**
 * 後方互換: デフォルト(balencer.jp)の Resend クライアント
 */
export function getResend(): Resend {
  return getResendForDomain("info@balencer.jp");
}

import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropic() {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return _client;
}

// 環境変数で上書き可能（Vercel側で MODEL_HEAVY を設定すれば差し替え可能）
// 注意: 2026-05-24 時点で "claude-opus-4-7" は Anthropic API で 400 invalid_request_error
// を返すため、heavy も sonnet にフォールバック。Opus を試すときは Vercel で MODEL_HEAVY を設定。
export const MODELS = {
  default: (process.env.MODEL_DEFAULT || "claude-sonnet-4-6") as string,
  heavy: (process.env.MODEL_HEAVY || "claude-sonnet-4-6") as string,
  fast: (process.env.MODEL_FAST || "claude-haiku-4-5-20251001") as string,
};

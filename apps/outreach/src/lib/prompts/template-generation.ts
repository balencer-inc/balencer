/**
 * サービス資料テキスト → 営業メールテンプレ 3〜4案 を生成するプロンプト。
 *
 * 設計方針:
 * - length (300/500/700) × tone (formal/standard/friendly) × structure (problem/empathy/impact)
 *   の 3×3×3 = 27 通りから 3〜4案だけを AI が選ぶ
 * - 各案は「なぜこの読者にこの組み合わせが効くか」を 80字以内で説明
 * - 本文テンプレに必ず {{company_name}} {{hook_evidence}} {{recipient_role}} を残す
 * - 数字インパクト型を選ぶ場合は資料テキスト内の数字のみ引用（捏造禁止）
 */

export interface TemplateGenerationInput {
  serviceName: string;
  servicePitchAxis: string | null;
  sourceMaterial: string;
  targetAudience: {
    industries?: string[];
    company_sizes?: string[];
    job_titles?: string[];
  };
  authorityBlock?: {
    numbers?: string[];
    books?: string[];
    cases?: string[];
  };
  ctaLabel?: string | null;
  existingAdoptedTemplates?: Array<{
    label: string;
    length_tier: number;
    tone: string;
    structure: string;
  }>;
}

export interface GeneratedProposal {
  label: string;
  length_tier: 300 | 500 | 700;
  tone: "formal" | "standard" | "friendly";
  structure: "problem" | "empathy" | "impact";
  rationale: string;
  subject_pattern: string;
  body_pattern: string;
  recommended_resource_link_types: Array<"slide" | "notion" | "pdf" | "web">;
}

export interface TemplateGenerationOutput {
  proposals: GeneratedProposal[];
  selection_reasoning: string;
}

export function buildTemplateGenerationPrompt(input: TemplateGenerationInput) {
  const audienceStr = [
    input.targetAudience.industries?.length
      ? `業種: ${input.targetAudience.industries.join("/")}`
      : null,
    input.targetAudience.company_sizes?.length
      ? `規模: ${input.targetAudience.company_sizes.join("/")}`
      : null,
    input.targetAudience.job_titles?.length
      ? `読者の職位: ${input.targetAudience.job_titles.join("/")}`
      : null,
  ]
    .filter(Boolean)
    .join(" / ") || "（指定なし、汎用設計）";

  const authorityStr = [
    input.authorityBlock?.numbers?.length
      ? `数字: ${input.authorityBlock.numbers.join(" / ")}`
      : null,
    input.authorityBlock?.books?.length
      ? `著書: ${input.authorityBlock.books.join(" / ")}`
      : null,
    input.authorityBlock?.cases?.length
      ? `事例: ${input.authorityBlock.cases.join(" / ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n") || "（設定なし）";

  const existingStr =
    input.existingAdoptedTemplates && input.existingAdoptedTemplates.length > 0
      ? input.existingAdoptedTemplates
          .map(
            (t) =>
              `- ${t.label} (${t.length_tier}字×${t.tone}×${t.structure})`
          )
          .join("\n")
      : "（なし、新規生成）";

  const system = `あなたはB2B営業メール構成設計者です。バレンサー（中小企業の経営改善を分析→実装→運用→ナレッジ化まで一気通貫で支援する大阪の企業）の代理として、サービス資料を読み込み、想定読者に最も刺さる文章構造を3〜4案だけ提案します。

【厳守ルール】
1. 「長さ × トーン × 構成」の3軸で 3×3×3=27通りある組み合わせから、3〜4案だけを選ぶ。全パターンは出さない
2. 各案の length_tier (300/500/700)、tone (formal/standard/friendly)、structure (problem/empathy/impact) は必ず**異なる組み合わせ**にする
3. rationale は「なぜこの読者にこの組み合わせが効くか」を 80字以内で具体的に
4. subject_pattern は40字以内、絵文字なし、誤認誘発の "Re:" "Fwd:" 等の偽装禁止
5. body_pattern は length_tier±10% に収め、本文中に必ず以下のプレースホルダを残す:
   - {{company_name}} … 受信先企業名
   - {{hook_evidence}} … HPから抽出したフック1文（差し込まれる側で本物の引用が入る）
   - {{recipient_role}} … 受信者の役職
6. 数字インパクト型 (structure='impact') を選ぶ場合、本文中の数字は**資料テキスト内に出てくる数字のみ**を引用すること。捏造厳禁
7. recommended_resource_link_types は ["slide","notion","pdf","web"] から、その構成タイプに自然に挿入できる形式を選ぶ
8. CTA の文言は ${input.ctaLabel ? `「${input.ctaLabel}」` : "「オンラインで15分話す」"} を本文末尾に必ず含める
9. selection_reasoning は「なぜこの3〜4案に絞ったか」を全体根拠として200字以内で説明

【出力フォーマット】
有効なJSONのみを返してください。前後の説明・コードフェンス・コメント不要:
{
  "proposals": [
    {
      "label": "string (15字以内、人間可読、例: '短文×親しみ×共感型')",
      "length_tier": 300 | 500 | 700,
      "tone": "formal" | "standard" | "friendly",
      "structure": "problem" | "empathy" | "impact",
      "rationale": "string (80字以内)",
      "subject_pattern": "string (40字以内)",
      "body_pattern": "string (length_tier±10%)",
      "recommended_resource_link_types": ["slide" | "notion" | "pdf" | "web", ...]
    }
  ],
  "selection_reasoning": "string (200字以内)"
}`;

  const user = `【サービス情報】
名称: ${input.serviceName}
訴求軸: ${input.servicePitchAxis || "（未設定）"}

【想定読者】
${audienceStr}

【権威性データ（本文に織り込む素材）】
${authorityStr}

【既に採用中のテンプレ（差別化のため避けたい組み合わせ）】
${existingStr}

【サービス資料テキスト（このサービスの中身を理解するための一次資料）】
${input.sourceMaterial}

上記を踏まえて、想定読者に最も刺さる3〜4案を生成してください。`;

  return { system, user };
}

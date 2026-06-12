/**
 * 採用済み候補 × 採用テンプレ → メール下書きを生成するプロンプト。
 *
 * 1社1テンプレで1下書きを作る。
 * - メール送信用: subject + body
 * - フォーム送信用: form_fields（会社名/お名前/メール/件名/本文 等を分離）
 *
 * 厳守:
 * - フックは必ず prospect.analysis.page_excerpts のどれかから引用
 * - hook_evidence (quote_url + quote_text) を必ず返す
 */

export interface DraftPromptInput {
  serviceName: string;
  authorityBlock: {
    numbers?: string[];
    books?: string[];
    cases?: string[];
  };
  ctaLabel: string | null;
  ctaUrl: string | null;
  resourceLinks: Array<{
    id: string;
    label: string;
    url: string;
    type: string;
    insert_mode: "always" | "optional";
    context_hint?: string;
  }>;
  template: {
    label: string;
    length_tier: number;
    tone: string;
    structure: string;
    subject_pattern: string;
    body_pattern: string;
  };
  sender: {
    display_name: string;
    email_from: string;
    signature_html: string | null;
  };
  organization: {
    name: string;
    display_address: string | null;
  };
  prospect: {
    company_name: string;
    url: string;
    industry_tag: string;
    employee_estimate: string;
    contact_method: string;
    analysis: {
      strengths?: string[];
      recent_news?: string;
      language_style?: string;
      page_excerpts?: Array<{ url: string; text: string; why_picked: string }>;
    };
  };
}

export interface GeneratedDraft {
  subject: string;
  body_md: string;
  hook_evidence: { quote_url: string; quote_text: string };
  inserted_resource_link_ids: string[];
  // フォーム用の各フィールド向け整形
  form_fields: {
    company_name: string;           // バレンサー側の会社名
    sender_name: string;            // 差出人氏名
    sender_email: string;           // 差出人メアド
    sender_phone?: string;          // 任意（持ってないので空）
    subject: string;                // 件名
    body_plain: string;             // プレーンテキスト本文（フォーム用、Markdown装飾なし）
  };
}

export function buildDraftPrompt(input: DraftPromptInput) {
  const excerpts = input.prospect.analysis.page_excerpts || [];
  const strengthsStr = (input.prospect.analysis.strengths || []).join(" / ") || "（不明）";
  const authStr = [
    input.authorityBlock.numbers?.length
      ? `数字: ${input.authorityBlock.numbers.join(" / ")}`
      : null,
    input.authorityBlock.books?.length ? `著書: ${input.authorityBlock.books.join(" / ")}` : null,
    input.authorityBlock.cases?.length ? `事例: ${input.authorityBlock.cases.join(" / ")}` : null,
  ]
    .filter(Boolean)
    .join(" / ") || "（設定なし）";

  const linksAlways = input.resourceLinks.filter((l) => l.insert_mode === "always");
  const linksOptional = input.resourceLinks.filter((l) => l.insert_mode === "optional");

  const linksStr =
    input.resourceLinks.length === 0
      ? "（設定なし）"
      : [
          ...linksAlways.map((l) => `[ALWAYS] ${l.label}: ${l.url}${l.context_hint ? ` // ${l.context_hint}` : ""} (id=${l.id})`),
          ...linksOptional.map((l) => `[OPTIONAL] ${l.label}: ${l.url}${l.context_hint ? ` // ${l.context_hint}` : ""} (id=${l.id})`),
        ].join("\n");

  const excerptsStr =
    excerpts.length === 0
      ? "（HPのフック候補が抽出されていない。一般的な業界文脈で書く）"
      : excerpts
          .map((e, i) => `[#${i + 1}] "${e.text}" (出典: ${e.url}) / 採用理由: ${e.why_picked}`)
          .join("\n");

  const system = `あなたは ${input.organization.name} の営業担当として、見込み企業に送るパーソナライズメールを生成するエージェントです。

【あなたの「中の人」設定 — これを絶対に守ること】
- **差出人は ${input.sender.display_name} 本人**。本文では「私」として書く。例: 「私、株式会社バレンサーの ${input.sender.display_name} と申します」
- **代表 阿部 については本文中で「弊社代表 阿部」「代表 阿部による著書」等、三人称として言及する**。決して「私 阿部」「私たち阿部チーム」とは書かない
- **資料テキストは弊社の情報源**で、阿部に関する経歴等が含まれていても、本文の主語は ${input.sender.display_name} のまま
- **署名は本文末尾に必ず付与する**: 差出人名・会社名・住所・メアドの順。下の【署名フォーマット】に従う

【署名フォーマット（本文末尾にそのまま含める）】
${
  input.sender.signature_html
    ? `差出人本人が設定した署名をそのまま使ってください:
\`\`\`
${input.sender.signature_html}
\`\`\``
    : `\`\`\`
----------------------------
${input.sender.display_name}
${input.organization.name}
${input.organization.display_address || "（住所未設定）"}
${input.sender.email_from}
\`\`\``
}

【最重要：body_pattern は完成済みのテンプレート本文です】
- 下に提示される body_pattern は **そのまま使う完成本文** です。**【】で囲まれた部分のみ各社のフックに合わせて生成**し、それ以外の文字列は **一字一句変更してはいけません**（句読点、改行、空行、絵文字、署名すべて）
- 【】の指示文と記号（【】そのもの）は、生成された文章で **完全に置き換え** ます。【】記号や指示文を本文に残してはいけません
- {{company_name}} のプレースホルダは送信先企業の正式社名に置換します
- subject は subject_pattern を **そのまま使ってください**（変更禁止、{{}}があれば値を置換するだけ）

【守るべき絶対ルール】
1. **フックの引用厳守**: 【冒頭フック段落】部分の生成時、提供される「page_excerpts」の中から1つを選び、その実文言をそのまま引用する。捏造禁止
2. **hook_evidence**: 必ず使った引用の url と text を hook_evidence として返す（無いと承認されない）
3. **絵文字禁止**
4. **誤認誘発禁止**: 件名に "Re:" "Fwd:" は使わない（subject_pattern にあれば話は別）
5. **【】部分の生成のみがあなたの仕事**: テンプレ本体の文章（自社紹介、ベネフィット箇条書き、補助金案内、CTA、署名など）は完成済みなので絶対に書き換えない
6. **段落間の空行を保持**: body_pattern の改行・空行構造をそのまま保つ
7. **特電法フッタ・配信停止リンク**は別途自動付与されるので本文には含めない
8. **フォーム送信用** に form_fields も生成する：body_md のプレーンテキスト版（Markdown装飾削除、URL生文字列、改行・空行をそのまま保持）。署名は本文末尾に含めたまま

【出力フォーマット】
有効なJSONのみを返してください。前後の説明・コードフェンス不要:
{
  "subject": "string (40字以内)",
  "body_md": "string (Markdown、length_tier±10%)",
  "hook_evidence": {
    "quote_url": "string (page_excerptsから採用したURL)",
    "quote_text": "string (page_excerptsから採用した文言)"
  },
  "inserted_resource_link_ids": ["string", ...],
  "form_fields": {
    "company_name": "${input.organization.name}",
    "sender_name": "${input.sender.display_name}",
    "sender_email": "${input.sender.email_from}",
    "sender_phone": "",
    "subject": "string (件名と同じでよい)",
    "body_plain": "string (プレーンテキスト本文、改行保持、Markdown装飾削除)"
  }
}`;

  const user = `【売り込むサービス】
${input.serviceName}

【権威性ブロック】
${authStr}

【CTA】
ラベル: ${input.ctaLabel || "（未設定）"}
URL: ${input.ctaUrl || "（未設定）"}

【リソースリンク】
${linksStr}

【採用テンプレ】
ラベル: ${input.template.label}
長さ: ${input.template.length_tier} 字
トーン: ${input.template.tone}
構成: ${input.template.structure}

件名テンプレ:
${input.template.subject_pattern}

本文テンプレ:
${input.template.body_pattern}

【差出人】
${input.sender.display_name} <${input.sender.email_from}>

【送信先企業】
社名: ${input.prospect.company_name}
URL: ${input.prospect.url}
業種: ${input.prospect.industry_tag}
規模: ${input.prospect.employee_estimate}
接触手段: ${input.prospect.contact_method}

【企業の特徴】
${strengthsStr}

【HPから抽出されたフック候補（このどれか1つを必ず本文で引用）】
${excerptsStr}

## あなたの仕事

上記 body_pattern の **【】部分のみ** ${input.prospect.company_name} 様のフック（page_excerpts）と note 情報に合わせて生成してください。
- body_pattern のそれ以外の文章（自社紹介、3点ベネフィット、補助金案内、CTA、署名）は **一字一句変更せずそのまま** 使ってください
- {{company_name}} は ${input.prospect.company_name} に置換してください
- 件名は subject_pattern 「${input.template.subject_pattern}」を **そのまま** 使ってください
- 段落間の空行を保持してください`;

  return { system, user };
}

import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/build";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  if (!email || !token) {
    return NextResponse.json({ ok: false, error: "missing params" }, { status: 400 });
  }

  let valid = false;
  try {
    valid = verifyUnsubscribeToken(email, token);
  } catch {
    valid = false;
  }
  if (!valid) {
    return new NextResponse(unsubscribePage({ email, status: "invalid" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 400,
    });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("unsubscribes").upsert(
    {
      organization_id: ORG_ID,
      email,
      reason: "user_clicked",
    },
    { onConflict: "organization_id,email" }
  );

  if (error) {
    return new NextResponse(unsubscribePage({ email, status: "error" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
    });
  }

  // 関連 prospects のステータスも更新
  await supabase
    .from("prospects")
    .update({ status: "unsubscribed", pipeline_stage: "lost" })
    .eq("contact_value", email);

  return new NextResponse(unsubscribePage({ email, status: "success" }), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// List-Unsubscribe-Post: One-Click 対応（POSTでも処理）
export async function POST(req: NextRequest) {
  return GET(req);
}

function unsubscribePage({ email, status }: { email: string; status: string }) {
  const heading =
    status === "success"
      ? "配信を停止しました"
      : status === "invalid"
      ? "リンクが無効です"
      : "エラーが発生しました";
  const body =
    status === "success"
      ? `今後、<strong>${escapeHtml(email)}</strong> 宛にバレンサーからの営業メールが送信されることはありません。ご対応ありがとうございました。`
      : status === "invalid"
      ? "このリンクは正しくないか、有効期限切れの可能性があります。お手数ですが直接 info@balencer.jp までご連絡ください。"
      : "システムエラーが発生しました。お手数ですが info@balencer.jp までご連絡ください。";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${heading} | BALENCER</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:'Noto Sans JP',sans-serif;background:#F7F7F5;color:#1a1a1a;margin:0;padding:48px 24px;display:flex;justify-content:center}
  .box{max-width:520px;background:#fff;border:1px solid #E6E7EA;border-radius:14px;padding:40px 32px}
  h1{font-family:'Poppins',sans-serif;font-weight:500;font-size:22px;margin:0 0 16px}
  p{font-size:14px;line-height:1.8;color:#3A3838}
  .sig{margin-top:32px;padding-top:20px;border-top:1px solid #E6E7EA;font-size:11px;color:#7a8089}
</style>
</head>
<body>
<div class="box">
<h1>${heading}</h1>
<p>${body}</p>
<div class="sig">株式会社バレンサー / info@balencer.jp</div>
</div>
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

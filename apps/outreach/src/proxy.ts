import { NextRequest, NextResponse } from "next/server";

/**
 * シンプルな BASIC 認証ミドルウェア。
 * - メンバー全員が同じ ID/パスワードでログイン（Phase 1 PoC）
 * - 環境変数 OUTREACH_BASIC_USER / OUTREACH_BASIC_PASS が両方とも設定されている時のみ有効
 *   未設定なら認証スキップ（ローカル開発用）
 * - /api/webhook/resend と /api/unsubscribe は認証スキップ（外部から叩かれる）
 */
export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 認証スキップ対象
  if (
    pathname.startsWith("/api/webhook") ||
    pathname.startsWith("/api/unsubscribe") ||
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const expectedUser = process.env.OUTREACH_BASIC_USER;
  const expectedPass = process.env.OUTREACH_BASIC_PASS;
  if (!expectedUser || !expectedPass) {
    // 未設定なら認証スキップ
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Basic ")) {
    return unauthorized();
  }

  try {
    const base64 = authHeader.slice("Basic ".length);
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const [user, pass] = decoded.split(":");
    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next();
    }
  } catch {
    // fall through
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="BALENCER Outreach"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

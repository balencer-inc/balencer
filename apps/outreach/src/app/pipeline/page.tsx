import { redirect } from "next/navigation";

// 進捗ページは 2026-05-26 に廃止、送信済み画面に統合
// 既存リンク/ブックマークからのアクセスは送信済みにリダイレクト
export default function PipelinePage() {
  redirect("/sends");
}

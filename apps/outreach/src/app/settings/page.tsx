import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SenderPersonasEditor } from "./SenderPersonasEditor";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: senders } = await supabase
    .from("sender_personas")
    .select("*")
    .order("display_name");

  return (
    <div className="px-10 py-10 max-w-[1080px]">
      <div className="balencer-script text-[24px] text-muted">settings</div>
      <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">設定</h1>

      <div className="mt-10">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-muted" />
          <h2 className="font-en text-[18px] font-medium">差出人ペルソナ</h2>
        </div>
        <p className="text-[12.5px] text-ink-2 leading-relaxed max-w-[620px]">
          メールの差出人として使う実在メンバー。署名情報・電話番号・本人同意のログをここで管理。
          メール末尾の署名と CTA直前の文言に反映されます。
        </p>

        <SenderPersonasEditor senders={senders || []} />
      </div>
    </div>
  );
}

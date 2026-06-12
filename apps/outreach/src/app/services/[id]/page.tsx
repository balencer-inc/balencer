import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ArrowLeft, Package } from "lucide-react";
import { ServiceDetailTabs } from "./_components/ServiceDetailTabs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: service, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !service) {
    notFound();
  }

  const { data: templates } = await supabase
    .from("service_templates")
    .select("*")
    .eq("service_id", id)
    .in("status", ["proposed", "adopted"])
    .order("created_at", { ascending: false });

  return (
    <div className="px-10 py-10 max-w-[1200px]">
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-[12px] font-en font-medium text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> サービス一覧
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-ink text-accent flex items-center justify-center shrink-0">
          <Package className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-en text-[28px] font-medium tracking-[-.01em]">{service.name}</h1>
            <code className="text-[11px] text-muted bg-gray-50 px-2 py-1 rounded font-mono">{service.slug}</code>
          </div>
          {service.pitch_axis && (
            <p className="mt-2 text-[13.5px] text-ink-2 leading-relaxed">{service.pitch_axis}</p>
          )}
        </div>
      </div>

      <ServiceDetailTabs service={service} templates={templates || []} />
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BasicInfoTab } from "./BasicInfoTab";
import { MaterialTab } from "./MaterialTab";
import { TemplatesTab } from "./TemplatesTab";
import { ResourcesTab } from "./ResourcesTab";

type TabKey = "basic" | "material" | "templates" | "resources";

interface Props {
  service: any;
  templates: any[];
}

export function ServiceDetailTabs({ service, templates }: Props) {
  const [tab, setTab] = useState<TabKey>("basic");

  const proposedCount = templates.filter((t) => t.status === "proposed").length;
  const adoptedCount = templates.filter((t) => t.status === "adopted").length;
  const resourceCount = (service.resource_links || []).length;
  const hasCta = !!service.cta_url;
  const hasAuthority =
    (service.authority_block?.numbers?.length || 0) +
      (service.authority_block?.books?.length || 0) +
      (service.authority_block?.cases?.length || 0) >
    0;
  const basicComplete = hasCta && hasAuthority;

  const tabs: { key: TabKey; label: string; badge?: string }[] = [
    { key: "basic", label: "基本情報", badge: basicComplete ? "✓" : hasCta || hasAuthority ? "一部" : "未設定" },
    { key: "material", label: "資料テキスト", badge: service.source_material ? "✓" : "未投入" },
    { key: "templates", label: "テンプレ候補", badge: adoptedCount > 0 ? `採用${adoptedCount}` : proposedCount > 0 ? `提案${proposedCount}` : "未生成" },
    { key: "resources", label: "リソースリンク", badge: resourceCount > 0 ? `${resourceCount}件` : "未設定" },
  ];

  return (
    <div className="mt-10">
      {/* タブナビ */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-3 text-[13.5px] font-en font-medium transition-colors relative -mb-px border-b-2",
              tab === t.key
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t.label}
            {t.badge && (
              <span
                className={cn(
                  "ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono",
                  tab === t.key ? "bg-ink text-accent" : "bg-gray-100 text-muted"
                )}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="mt-8">
        {tab === "basic" && <BasicInfoTab service={service} />}
        {tab === "material" && <MaterialTab service={service} />}
        {tab === "templates" && <TemplatesTab service={service} templates={templates} />}
        {tab === "resources" && <ResourcesTab service={service} />}
      </div>
    </div>
  );
}

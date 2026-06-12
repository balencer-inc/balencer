"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Building2,
  PenLine,
  Send,
  Package,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useServices } from "@/hooks/useServices";

const workspaceItems = [
  { label: "ダッシュボード", icon: LayoutDashboard, href: "/" },
  { label: "新規作成", icon: Megaphone, href: "/campaigns" },
  { label: "下書き", icon: PenLine, href: "/drafts" },
  { label: "送信済み", icon: Send, href: "/sends" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { services } = useServices();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[240px] flex-col bg-sidebar-bg text-sidebar-text">
      <Link href="/" className="px-6 pt-7 pb-5 block hover:opacity-90 transition-opacity">
        <div className="font-en font-medium text-[18px] tracking-[.02em] text-white">
          BALENCER<span className="text-accent">.</span>
        </div>
        <div className="font-script text-[16px] text-accent -mt-1">outreach</div>
      </Link>

      <nav className="flex-1 px-4 pb-4 flex flex-col gap-5 overflow-y-auto">
        {/* Workspace */}
        <div>
          <div className="px-2 pb-2 text-[10px] uppercase tracking-[.18em] font-en font-medium text-sidebar-text/60">
            Workspace
          </div>
          <ul className="flex flex-col gap-[2px]">
            {workspaceItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-normal transition-colors",
                    isActive(item.href)
                      ? "bg-sidebar-active text-white"
                      : "hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services with inline list */}
        <div>
          <div className="px-2 pb-2 text-[10px] uppercase tracking-[.18em] font-en font-medium text-sidebar-text/60 flex items-center justify-between">
            <span>Services</span>
            <Link
              href="/services"
              className="text-sidebar-text/60 hover:text-white"
              title="サービス一覧"
            >
              <Package className="w-3 h-3" />
            </Link>
          </div>
          <ul className="flex flex-col gap-[1px]">
            <li>
              <Link
                href="/services"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-normal transition-colors",
                  pathname === "/services"
                    ? "bg-sidebar-active text-white"
                    : "hover:bg-white/5 hover:text-white"
                )}
              >
                <Package className="h-3.5 w-3.5 shrink-0" />
                サービス一覧
              </Link>
            </li>
            {services.map((s) => {
              const active = pathname === `/services/${s.id}`;
              const adoptedCount = (s.active_template_ids || []).length;
              return (
                <li key={s.id}>
                  <Link
                    href={`/services/${s.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md pl-7 pr-2.5 py-1.5 text-[12px] transition-colors",
                      active
                        ? "bg-sidebar-active text-white"
                        : "text-sidebar-text/90 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="truncate flex-1">{s.name}</span>
                    {adoptedCount > 0 && (
                      <span className="text-[9.5px] font-mono px-1 py-px rounded bg-white/10 text-accent shrink-0">
                        {adoptedCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/services"
                className="flex items-center gap-2 rounded-md pl-7 pr-2.5 py-1.5 text-[11px] text-sidebar-text/60 hover:text-white hover:bg-white/5"
              >
                <Plus className="w-3 h-3" />
                新規追加
              </Link>
            </li>
          </ul>
        </div>

        {/* Settings */}
        <div>
          <div className="px-2 pb-2 text-[10px] uppercase tracking-[.18em] font-en font-medium text-sidebar-text/60">
            Settings
          </div>
          <ul className="flex flex-col gap-[2px]">
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-normal transition-colors",
                  isActive("/settings")
                    ? "bg-sidebar-active text-white"
                    : "hover:bg-white/5 hover:text-white"
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                設定
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="border-t border-white/5 px-5 py-4 text-[11px] leading-relaxed text-sidebar-text/70">
        <div className="text-white font-normal text-[13px]">阿部 貴之</div>
        Owner / 承認権限
      </div>
    </aside>
  );
}

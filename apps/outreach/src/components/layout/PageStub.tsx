import Link from "next/link";

interface PageStubProps {
  eyebrow: string;
  title: string;
  desc: string;
  next: string;
}

export function PageStub({ eyebrow, title, desc, next }: PageStubProps) {
  return (
    <div className="px-10 py-10 max-w-[960px]">
      <div className="balencer-script text-[24px] text-muted">{eyebrow}</div>
      <h1 className="font-en text-[32px] font-medium tracking-[-.01em]">{title}</h1>
      <p className="mt-3 text-[13px] text-ink-2 max-w-[620px] leading-relaxed">{desc}</p>

      <div className="mt-8 bg-card border border-border rounded-xl p-8">
        <div className="text-[10px] uppercase tracking-[.16em] font-en font-medium text-muted">
          coming next
        </div>
        <div className="mt-2 font-en text-[18px] font-medium">{next}</div>
        <p className="mt-3 text-[12.5px] text-ink-2 leading-relaxed">
          実装計画は{" "}
          <code className="text-[12px] bg-gray-50 px-1.5 py-0.5 rounded font-mono">
            ~/.claude/plans/url-notion-url-curried-wolf.md
          </code>{" "}
          を参照。
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-[12px] font-en font-medium text-ink-2 hover:text-ink"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}

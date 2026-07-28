const PROFILE_URL = "https://balencer-brand-profile.vercel.app";

export default function Home() {
  return (
    <main className="hub">
      <header className="hubHeader">
        <span className="hubWordmark">BALENCER</span>
        <span className="hubTagline">for loved ones.</span>
      </header>

      <section className="hubIntro">
        <p className="eyebrow">PRESENTATION LIBRARY</p>
        <h1>目的に合わせて、<br />ふたつの会社案内を。</h1>
        <p>
          世界観を伝える会社案内と、商談で具体的な対話を進める資料。
          <br className="desktopOnly" />
          相手と場面に合わせて、必要な方を直接共有できます。
        </p>
      </section>

      <nav className="hubChoices" aria-label="資料を選ぶ">
        <a
          className="hubChoice profileChoice"
          href={PROFILE_URL}
          target="_blank"
          rel="noreferrer"
        >
          <span className="choiceNumber">01</span>
          <span className="choiceMeta">COMPANY PROFILE</span>
          <strong>世界観から、<br />バレンサーを知る。</strong>
          <span className="choiceDescription">
            事前送付・採用・パートナー紹介に
          </span>
          <span className="choiceAction">会社案内をひらく ↗</span>
        </a>

        <a className="hubChoice businessChoice" href="/business">
          <span className="choiceNumber">02</span>
          <span className="choiceMeta">BUSINESS &amp; SERVICE</span>
          <strong>具体から、<br />対話を始める。</strong>
          <span className="choiceDescription">
            商談・オンライン会議・料金説明に
          </span>
          <span className="choiceAction">商談資料をひらく →</span>
        </a>
      </nav>

      <footer className="hubFooter">
        <span>株式会社バレンサー</span>
        <span>BALENCER Inc.</span>
      </footer>
    </main>
  );
}

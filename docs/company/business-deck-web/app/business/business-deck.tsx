"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  { src: "/slides/01-cover.png", title: "表紙" },
  { src: "/slides/02-who-we-are.png", title: "バレンサーの全体像" },
  { src: "/slides/03-when-to-call-us.png", title: "どんなときに相談できるか" },
  { src: "/slides/04-positioning.png", title: "他社との違い" },
  { src: "/slides/05-case-scope.png", title: "支援の実像" },
  { src: "/slides/06-ways-to-work-together.png", title: "関わり方と料金" },
  { src: "/slides/07-projects-budget.png", title: "プロジェクトと参考価格" },
  { src: "/slides/08-first-90-days.png", title: "最初の90日" },
  { src: "/slides/09-lets-talk.png", title: "初回相談" },
] as const;

type Direction = "next" | "prev";
type TurningPage = { index: number; direction: Direction } | null;

export default function BusinessDeck() {
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState<TurningPage>(null);
  const [overview, setOverview] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = useCallback(
    (nextIndex: number, forcedDirection?: Direction) => {
      if (turning || nextIndex === index || nextIndex < 0 || nextIndex >= slides.length) {
        return;
      }

      const direction = forcedDirection ?? (nextIndex > index ? "next" : "prev");
      setTurning({ index, direction });
      setIndex(nextIndex);
      window.history.replaceState(null, "", `?slide=${nextIndex + 1}`);

      if (turnTimer.current) clearTimeout(turnTimer.current);
      turnTimer.current = setTimeout(() => setTurning(null), 720);
    },
    [index, turning],
  );

  const next = useCallback(() => goTo(index + 1, "next"), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, "prev"), [goTo, index]);

  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("slide"));
    if (requested >= 1 && requested <= slides.length) setIndex(requested - 1);

    slides.forEach(({ src }) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prev();
      }
      if (event.key === "Home") goTo(0, "prev");
      if (event.key === "End") goTo(slides.length - 1, "next");
      if (event.key.toLowerCase() === "o") setOverview((value) => !value);
      if (event.key === "Escape") setOverview(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, next, prev]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (overview || wheelLock.current || Math.abs(event.deltaY) < 22) return;
      event.preventDefault();
      wheelLock.current = true;
      event.deltaY > 0 ? next() : prev();
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 760);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [next, overview, prev]);

  useEffect(
    () => () => {
      if (turnTimer.current) clearTimeout(turnTimer.current);
    },
    [],
  );

  const requestFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  };

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      dx < 0 ? next() : prev();
    }
  };

  return (
    <main className="deckShell">
      <header className="deckHeader">
        <a className="deckBrand" href="/" aria-label="資料選択へ戻る">
          BALENCER
        </a>
        <span className="deckTitle">BUSINESS &amp; SERVICE OVERVIEW</span>
        <div className="deckHeaderActions">
          <a
            href="https://balencer-brand-profile.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            COMPANY PROFILE ↗
          </a>
          <button onClick={() => setOverview(true)} type="button">
            ALL SLIDES
          </button>
        </div>
      </header>

      <section
        className="deckViewport"
        aria-live="polite"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="bookStage">
          <div className="pageEdge pageEdgeTwo" aria-hidden="true" />
          <div className="pageEdge pageEdgeOne" aria-hidden="true" />

          <figure className="slidePage currentPage">
            <img
              src={slides[index].src}
              alt={`${index + 1}ページ目：${slides[index].title}`}
              draggable={false}
            />
          </figure>

          {turning && (
            <figure
              className={`slidePage turningPage ${
                turning.direction === "next" ? "turnForward" : "turnBackward"
              }`}
              aria-hidden="true"
            >
              <img src={slides[turning.index].src} alt="" draggable={false} />
              <span className="turnShadow" />
            </figure>
          )}

          <button
            className="pageHit pageHitPrev"
            onClick={prev}
            disabled={index === 0}
            aria-label="前のページ"
            type="button"
          />
          <button
            className="pageHit pageHitNext"
            onClick={next}
            disabled={index === slides.length - 1}
            aria-label="次のページ"
            type="button"
          />
        </div>
      </section>

      <footer className="deckControls">
        <button onClick={prev} disabled={index === 0} aria-label="前のページ" type="button">
          ←
        </button>
        <div className="deckProgress" aria-label={`${index + 1} / ${slides.length}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div className="progressTrack">
            <i style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
          </div>
          <span>{String(slides.length).padStart(2, "0")}</span>
        </div>
        <button
          onClick={next}
          disabled={index === slides.length - 1}
          aria-label="次のページ"
          type="button"
        >
          →
        </button>
        <button className="fullscreenButton" onClick={requestFullscreen} type="button">
          FULLSCREEN
        </button>
      </footer>

      <p className="deckHint">SWIPE / SCROLL / ARROW KEY</p>

      {overview && (
        <div className="overview" role="dialog" aria-modal="true" aria-label="全スライド">
          <header>
            <div>
              <span>ALL SLIDES</span>
              <strong>全9ページ</strong>
            </div>
            <button onClick={() => setOverview(false)} type="button" aria-label="閉じる">
              CLOSE ×
            </button>
          </header>
          <div className="overviewGrid">
            {slides.map((slide, slideIndex) => (
              <button
                className={slideIndex === index ? "isActive" : ""}
                key={slide.src}
                onClick={() => {
                  setOverview(false);
                  if (slideIndex !== index) {
                    window.setTimeout(() => goTo(slideIndex), 40);
                  }
                }}
                type="button"
              >
                <img src={slide.src} alt="" />
                <span>
                  {String(slideIndex + 1).padStart(2, "0")} / {slide.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

const slideCount = 14;
const slides = Array.from(
  { length: slideCount },
  (_, i) => `./slides/slide-${String(i + 1).padStart(2, "0")}.png`,
);

const reader = document.querySelector(".reader");
const book = document.querySelector(".book");
const overview = document.querySelector(".overview");
const overviewGrid = document.querySelector(".overview-grid");
const controls = document.querySelector(".controls");
const topbar = document.querySelector(".topbar");
const currentLabel = document.querySelector(".pagination b");
const progress = document.querySelector(".progress span");
const prevButtons = document.querySelectorAll(".prev-button, .tap-zone--prev");
const nextButtons = document.querySelectorAll(".next-button, .tap-zone--next");
let current = 0;
let wheelLocked = false;
let touchStartX = null;
let controlsTimer = null;

slides.forEach((src, index) => {
  const page = document.createElement("figure");
  page.className = "page";
  page.innerHTML = `<img src="${src}" alt="BALENCER Brand Profile ${index + 1}ページ" draggable="false"><span class="page-shade"></span>`;
  book.appendChild(page);

  const thumb = document.createElement("button");
  thumb.innerHTML = `<img src="${src}" alt="${index + 1}ページへ移動" loading="lazy"><span>${String(index + 1).padStart(2, "0")}</span>`;
  thumb.addEventListener("click", () => {
    goTo(index);
    overview.hidden = true;
  });
  overviewGrid.appendChild(thumb);
});

const pages = [...document.querySelectorAll(".page")];
const thumbs = [...overviewGrid.querySelectorAll("button")];

function update() {
  pages.forEach((page, index) => {
    const state = index < current ? "past" : index === current ? "current" : "future";
    page.className = `page page--${state}`;
    page.style.zIndex = slideCount - Math.abs(index - current);
    page.setAttribute("aria-hidden", String(index !== current));
  });
  thumbs.forEach((thumb, index) => thumb.classList.toggle("is-current", index === current));
  currentLabel.textContent = String(current + 1).padStart(2, "0");
  progress.style.transform = `scaleX(${(current + 1) / slideCount})`;
  prevButtons.forEach((button) => (button.disabled = current === 0));
  nextButtons.forEach((button) => (button.disabled = current === slideCount - 1));
  revealControls();
}

function goTo(index) {
  current = Math.max(0, Math.min(slideCount - 1, index));
  update();
}

function revealControls() {
  controls.classList.add("is-visible");
  topbar.classList.add("is-visible");
  clearTimeout(controlsTimer);
  controlsTimer = setTimeout(() => {
    if (!overview.hidden) return;
    controls.classList.remove("is-visible");
    topbar.classList.remove("is-visible");
  }, 2600);
}

prevButtons.forEach((button) => button.addEventListener("click", () => goTo(current - 1)));
nextButtons.forEach((button) => button.addEventListener("click", () => goTo(current + 1)));
document.querySelector(".home-button")?.addEventListener("click", () => {
  overview.hidden = true;
  goTo(0);
});
document.querySelector(".index-button").addEventListener("click", () => {
  overview.hidden = false;
  revealControls();
});
document.querySelector(".close-button").addEventListener("click", () => {
  overview.hidden = true;
});
document.querySelector(".full-button").addEventListener("click", async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  else await document.exitFullscreen?.();
});

reader.addEventListener("mousemove", revealControls);
reader.addEventListener(
  "wheel",
  (event) => {
    revealControls();
    if (!overview.hidden || wheelLocked || Math.abs(event.deltaY) < 18) return;
    wheelLocked = true;
    goTo(current + (event.deltaY > 0 ? 1 : -1));
    setTimeout(() => (wheelLocked = false), 760);
  },
  { passive: true },
);
reader.addEventListener("touchstart", (event) => {
  touchStartX = event.touches[0]?.clientX ?? null;
  revealControls();
}, { passive: true });
reader.addEventListener("touchend", (event) => {
  if (touchStartX === null) return;
  const distance = touchStartX - (event.changedTouches[0]?.clientX ?? 0);
  if (Math.abs(distance) > 45) goTo(current + (distance > 0 ? 1 : -1));
  touchStartX = null;
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    overview.hidden = true;
    return;
  }
  if (!overview.hidden) return;
  if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(event.key)) {
    event.preventDefault();
    goTo(current + 1);
  }
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    goTo(current - 1);
  }
  if (event.key === "Home") goTo(0);
  if (event.key === "End") goTo(slideCount - 1);
});

update();

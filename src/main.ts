import "./style.css";

const DEFAULT_TEXT = "ようこそ";
const DEFAULT_COLOR = "#ffffff";
const DEFAULT_SIZE = 440; // px
const SPEED_PX_PER_SEC = 220;

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="settings-screen" id="settingsScreen">
    <div class="settings-card">
      <h1>電光掲示板</h1>

      <label class="field">
        表示する文字（絵文字もOK）
        <textarea id="messageInput" maxlength="200" placeholder="ここに文字を入力してください"></textarea>
      </label>

      <div class="field-row">
        <label class="field">
          文字の色
          <input type="color" id="colorInput" value="${DEFAULT_COLOR}" />
        </label>
        <label class="field">
          文字の大きさ
          <div class="range-with-value">
            <input type="range" id="sizeInput" min="20" max="600" step="5" value="${DEFAULT_SIZE}" />
            <span id="sizeValue">${DEFAULT_SIZE}px</span>
          </div>
        </label>
      </div>

      <div class="field">
        プレビュー
        <div class="preview-box">
          <span id="previewText"></span>
        </div>
      </div>

      <button id="showButton">表示する</button>
      <p class="hint">表示中は画面をタップして✕ボタンで戻れます</p>
    </div>
  </div>

  <div class="display-screen" id="displayScreen" hidden>
    <div class="marquee-track">
      <span id="marqueeText"></span>
    </div>
    <button id="closeButton" aria-label="閉じる">✕</button>
  </div>
`;

const settingsScreen = document.querySelector<HTMLDivElement>("#settingsScreen")!;
const displayScreen = document.querySelector<HTMLDivElement>("#displayScreen")!;
const messageInput = document.querySelector<HTMLTextAreaElement>("#messageInput")!;
const colorInput = document.querySelector<HTMLInputElement>("#colorInput")!;
const sizeInput = document.querySelector<HTMLInputElement>("#sizeInput")!;
const sizeValue = document.querySelector<HTMLSpanElement>("#sizeValue")!;
const previewText = document.querySelector<HTMLSpanElement>("#previewText")!;
const showButton = document.querySelector<HTMLButtonElement>("#showButton")!;
const closeButton = document.querySelector<HTMLButtonElement>("#closeButton")!;
const marqueeText = document.querySelector<HTMLSpanElement>("#marqueeText")!;

messageInput.value = DEFAULT_TEXT;

let currentAnimation: Animation | null = null;

function updatePreview(): void {
  const text = messageInput.value.trim() || DEFAULT_TEXT;
  previewText.textContent = text;
  previewText.style.color = colorInput.value;
  previewText.style.fontSize = `${Math.min(Number(sizeInput.value), 40)}px`;
}

function updateSizeLabel(): void {
  sizeValue.textContent = `${sizeInput.value}px`;
}

messageInput.addEventListener("input", updatePreview);
colorInput.addEventListener("input", updatePreview);
sizeInput.addEventListener("input", () => {
  updateSizeLabel();
  updatePreview();
});

updateSizeLabel();
updatePreview();

function startMarquee(): void {
  const text = messageInput.value.trim() || DEFAULT_TEXT;
  const color = colorInput.value;
  const size = Number(sizeInput.value);

  marqueeText.textContent = text;
  marqueeText.style.color = color;
  marqueeText.style.fontSize = `${size}px`;

  currentAnimation?.cancel();

  const textWidth = marqueeText.offsetWidth;
  const viewportWidth = window.innerWidth;
  const startX = viewportWidth;
  const endX = -textWidth;
  const distance = startX - endX;
  const durationMs = (distance / SPEED_PX_PER_SEC) * 1000;

  currentAnimation = marqueeText.animate(
    [
      { transform: `translate(${startX}px, -50%)` },
      { transform: `translate(${endX}px, -50%)` },
    ],
    {
      duration: durationMs,
      iterations: Infinity,
      easing: "linear",
    },
  );
}

async function openDisplay(): Promise<void> {
  settingsScreen.hidden = true;
  displayScreen.hidden = false;

  try {
    await displayScreen.requestFullscreen?.();
  } catch {
    // Fullscreen API未対応環境（iOS Safari等）ではCSS固定表示のみで代替する
  }

  startMarquee();
}

async function closeDisplay(): Promise<void> {
  currentAnimation?.cancel();
  currentAnimation = null;

  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch {
      // 無視
    }
  }

  displayScreen.hidden = true;
  settingsScreen.hidden = false;
}

showButton.addEventListener("click", () => {
  void openDisplay();
});

closeButton.addEventListener("click", () => {
  void closeDisplay();
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && !displayScreen.hidden) {
    void closeDisplay();
  }
});

window.addEventListener("resize", () => {
  if (!displayScreen.hidden) {
    startMarquee();
  }
});

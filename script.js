/* =========================================================
   定数
========================================================= */

// volume
const BGM_VOLUME_NORMAL = 1.0;
const BGM_VOLUME_COMPLETE = 0.6;
const SE_VOLUME = 0.6;

// CSV
const DADARE_CSV = "dadare.csv";

// BGM playlist
const bgmTracks = [
  { src: "audio/troimerei.mp3", title: "トロイメライ", composer: "R. Schumann" },
  { src: "audio/nocturne_op9_no2.mp3", title: "ノクターン 第2番 Op.9-2", composer: "F. Chopin" },
  { src: "audio/clair_de_lune.mp3", title: "月の光", composer: "C. Debussy" },
  { src: "audio/pavane.mp3", title: "亡き王女のためのパヴァーヌ", composer: "M. Ravel" },
  { src: "audio/la_fille_aux_cheveux_de_lin.mp3", title: "亜麻色の髪の乙女", composer: "C. Debussy" },
  { src: "audio/gymnopedie_no1.mp3", title: "ジムノペディ 第1番", composer: "E. Satie" },
  { src: "audio/intermezzo_op118_2.mp3", title: "間奏曲 Op.118-2", composer: "J. Brahms" },
  { src: "audio/reverie.mp3", title: "夢", composer: "C. Debussy" },
  { src: "audio/prelude_op28_4.mp3", title: "前奏曲 第4番 Op.28-4", composer: "F. Chopin" },
  { src: "audio/air_on_g_string.mp3", title: "G線上のアリア", composer: "J. S. Bach" },
  { src: "audio/moonlight_1st.mp3", title: "月光 第1楽章", composer: "L. van Beethoven" },
  { src: "audio/consolation.mp3", title: "コンソレーション", composer: "F. Liszt" }
];

/* =========================================================
   DOM / Audio 変数
========================================================= */

let button, dadareDisplay, remainText, completeOverlay;
let bgmTitle, bgmComposer;

const bgmAudio = new Audio();
const seAudio = new Audio("audio/complete.mp3");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser;

/* Spectrum */
let canvas, ctx, bufferLength, dataArray;

/* =========================================================
   状態管理
========================================================= */

let dadareList = [];
let remaining = [];
let isFirst = true;

let bgmOrder = [];
let bgmIndex = 0;

/* =========================================================
   Utility
========================================================= */

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* =========================================================
   CSV load
========================================================= */

async function loadDadareFromCSV() {
  const res = await fetch(DADARE_CSV);
  const text = await res.text();

  dadareList = text
    .replace(/\uFEFF/g, "")
    .split(/\r?\n/)
    .flatMap(line => line.split(","))
    .map(s => s.trim())
    .filter(Boolean);

  remaining = [...dadareList];
  remainText.textContent = remaining.length;
}

/* =========================================================
   BGM
========================================================= */

function startBGM() {
  bgmOrder = [...bgmTracks];
  shuffle(bgmOrder);
  bgmIndex = 0;
  playCurrentTrack();
  drawSpectrum();
}

function playCurrentTrack() {
  const track = bgmOrder[bgmIndex];
  bgmAudio.src = track.src;
  bgmAudio.volume = BGM_VOLUME_NORMAL;
  bgmAudio.play();

  bgmTitle.textContent = track.title;
  bgmComposer.textContent = track.composer;
}

function setupBGM() {
  bgmAudio.loop = false;
  bgmAudio.addEventListener("ended", () => {
    bgmIndex = (bgmIndex + 1) % bgmOrder.length;
    playCurrentTrack();
  });

  seAudio.volume = SE_VOLUME;

  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128;

  const source = audioCtx.createMediaElementSource(bgmAudio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

/* =========================================================
   Spectrum
========================================================= */

function initSpectrum() {
  canvas = document.getElementById("spectrum");
  ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.offsetHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
}

function drawSpectrum() {
  requestAnimationFrame(drawSpectrum);

  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const barCount = 60;
  const step = Math.floor(bufferLength / barCount);

  const maxWidth = canvas.width * 1.6;
  const barSpacing = maxWidth / (barCount * 1.3);
  const barWidth = barSpacing * 0.5;

  const centerX = canvas.width / 2;
  const bottomMargin = 10;

  const time = performance.now() * 0.001;

  ctx.fillStyle = "rgba(211,211,211,0.6)";

  // 中央バー
  const centerValue = dataArray[0];
  const centerHeight =
    (centerValue / 255) * canvas.height *
    (0.85 + Math.sin(time) * 0.05);

  ctx.fillRect(
    centerX - barWidth / 2,
    canvas.height - centerHeight - bottomMargin,
    barWidth,
    centerHeight
  );

  for (let i = 1; i <= barCount; i++) {
    const value = dataArray[i * step] || 0;
    const height =
      (value / 255) * canvas.height *
      (0.85 + Math.sin(time + i * 0.3) * 0.05);

    const x = i * barSpacing;

    ctx.fillRect(
      centerX + x,
      canvas.height - height - bottomMargin,
      barWidth,
      height
    );

    ctx.fillRect(
      centerX - x - barWidth,
      canvas.height - height - bottomMargin,
      barWidth,
      height
    );
  }
}

/* =========================================================
   gacha
========================================================= */

function drawDadare() {
  if (remaining.length === 0) return;

  const index = Math.floor(Math.random() * remaining.length);
  const result = remaining.splice(index, 1)[0];

  dadareDisplay.innerHTML = `<span>${result}</span>`;
  remainText.textContent = remaining.length;

  if (remaining.length === 0) complete();
}

/* =========================================================
   complete
========================================================= */

function complete() {
  bgmAudio.volume = BGM_VOLUME_COMPLETE;

  seAudio.currentTime = 0;
  seAudio.volume = 0;

  setTimeout(() => {
    seAudio.play();

    const fadeIn = setInterval(() => {
      seAudio.volume = Math.min(seAudio.volume + 0.05, SE_VOLUME);
      if (seAudio.volume >= SE_VOLUME) clearInterval(fadeIn);
    }, 20);

    setTimeout(() => {
      const fadeOut = setInterval(() => {
        seAudio.volume = Math.max(seAudio.volume - 0.05, 0);
        if (seAudio.volume <= 0) clearInterval(fadeOut);
      }, 20);
    }, 800);

  }, 100);

  completeOverlay.classList.add("show");
}

/* =========================================================
   button
========================================================= */

function setupButton() {
  button.addEventListener("click", async () => {
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    if (isFirst) {
      startBGM();
      button.textContent = "もっと見る";
      isFirst = false;
    }

    drawDadare();
  });
}

/* =========================================================
   初期化（エントリポイント）
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  // DOM
  button = document.getElementById("gachaButton");
  dadareDisplay = document.getElementById("display");
  remainText = document.getElementById("counter");
  completeOverlay = document.getElementById("completeOverlay");
  bgmTitle = document.getElementById("bgmTitle");
  bgmComposer = document.getElementById("bgmComposer");

  setupBGM();
  initSpectrum();
  await loadDadareFromCSV();
  setupButton();
});

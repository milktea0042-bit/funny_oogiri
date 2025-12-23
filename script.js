

// 音量（プログラム内部制御）
const BGM_VOLUME_NORMAL = 1.0;
const BGM_VOLUME_COMPLETE = 0.6;
const SE_VOLUME = 0.6;

// CSV ファイル名
const DADARE_CSV = "dadare.csv";

// BGM プレイリスト
const bgmTracks = [
  { src: "audio/troimerei.mp3", title: "トロイメライ", composer: "Schumann, R." },
  { src: "audio/nocturne_op9_no2.mp3", title: "ノクターン 第2番 Op.9-2", composer: "Chopin, F." },
  { src: "audio/clair_de_lune.mp3", title: "月の光", composer: "Debussy, C." },
  { src: "audio/pavane.mp3", title: "亡き王女のためのパヴァーヌ", composer: "Ravel, M." },
  { src: "audio/la_fille_aux_cheveux_de_lin.mp3", title: "亜麻色の髪の乙女", composer: "Debussy, C." },

  { src: "audio/gymnopedie_no1.mp3", title: "ジムノペディ 第1番", composer: "Satie, E." },
  { src: "audio/intermezzo_op118_2.mp3", title: "間奏曲 Op.118-2", composer: "Brahms, J." },
  { src: "audio/reverie.mp3", title: "夢", composer: "Debussy, C." },
  { src: "audio/prelude_op28_4.mp3", title: "前奏曲 第4番 Op.28-4", composer: "Chopin, F." },
  { src: "audio/air_on_g_string.mp3", title: "G線上のアリア", composer: "Bach, J.S." },
  { src: "audio/moonlight_1st.mp3", title: "月光 第1楽章", composer: "Beethoven, L." },
  { src: "audio/consolation.mp3", title: "コンソレーション", composer: "Liszt, F." }
];

/* ---------- DOM ---------- */

const button = document.getElementById("gachaButton");
const dadareText = document.getElementById("display");
const remainText = document.getElementById("counter");
const completeOverlay = document.getElementById("completeOverlay");

const bgmTitle = document.getElementById("bgmTitle");
const bgmComposer = document.getElementById("bgmComposer");


/* ---------- Audio ---------- */

const bgmAudio = new Audio();
bgmAudio.loop = false;
bgmAudio.volume = BGM_VOLUME_NORMAL;

const seAudio = new Audio("audio/complete.mp3");
seAudio.volume = SE_VOLUME;

/* Web Audio API */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const bgmSource = audioCtx.createMediaElementSource(bgmAudio);
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 128;

bgmSource.connect(analyser);
analyser.connect(audioCtx.destination);

/* ---------- Spectrum ---------- */

let canvas, ctx, bufferLength, dataArray;

document.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("spectrum");
  ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = canvas.offsetHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
});

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

  const phaseOffset = 3;
  const time = performance.now() * 0.001;

// 中央バー（左右と同一仕様）
  const centerValue = dataArray[0];
  const centerHeight =
    (centerValue / 255) * canvas.height *
    (0.85 + Math.sin(time) * 0.05);

  ctx.fillStyle = "rgba(211, 211, 211, 0.6)";
  ctx.fillRect(
    centerX - barWidth / 2,
    canvas.height - centerHeight - bottomMargin,
    barWidth,
    centerHeight
  );

  for (let i = 1; i <= barCount; i++) {
    const rightIndex = i * step;
    const leftIndex = Math.min(
      (i + phaseOffset) * step,
      bufferLength - 1
    );

    const rightValue = dataArray[rightIndex];
    const leftValue  = dataArray[leftIndex];

    const rightHeight =
      (rightValue / 255) * canvas.height *
      (0.85 + Math.sin(time + i * 0.3) * 0.05);

    const leftHeight =
      (leftValue / 255) * canvas.height *
      (0.85 + Math.sin(time + i * 0.3 + 0.2) * 0.05);

    const xOffset = i * barSpacing;

    // 右
    ctx.fillRect(
      centerX + xOffset,
      canvas.height - rightHeight - bottomMargin,
      barWidth,
      rightHeight
    );

    // 左
    ctx.fillRect(
      centerX - xOffset - barWidth,
      canvas.height - leftHeight - bottomMargin,
      barWidth,
      leftHeight
    );
  }
}




/* ---------- 状態管理 ---------- */

let dadareList = [];
let remaining = [];
let isFirst = true;

let bgmOrder = [];
let bgmIndex = 0;

/* ---------- ユーティリティ ---------- */

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/* ---------- CSV 読み込み ---------- */

async function loadDadare() {
  const res = await fetch(DADARE_CSV);
  const text = await res.text();

  dadareList = text
    .replace(/\uFEFF/g, "")          // BOM除去
    .split(/\r?\n/)                  // 行で分割
    .flatMap(line => line.split(","))// カンマで展開
    .map(s => s.trim())              // 空白除去
    .filter(s => s.length > 0);      // 空要素除去

  remaining = [...dadareList];
  remainText.textContent = remaining.length;
}


/* ---------- BGM ---------- */

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

bgmAudio.addEventListener("ended", () => {
  bgmIndex = (bgmIndex + 1) % bgmOrder.length;
  playCurrentTrack();
});

/* ---------- ガチャ ---------- */

function drawDadare() {

  if (remaining.length === 0) return;

  const index = Math.floor(Math.random() * remaining.length);
  const result = remaining.splice(index, 1)[0];

  dadareText.innerHTML = `<span>${result}</span>`;
  remainText.textContent = remaining.length;

  if (remaining.length === 0) {
    complete();
  }
}

/* ---------- コンプリート ---------- */

function complete() {
  bgmAudio.volume = BGM_VOLUME_COMPLETE;
  analyser.smoothingTimeConstant = 0.9;
  

  // SE：0.1秒ディレイ + フェード
  seAudio.currentTime = 0;
  seAudio.volume = 0;
  setTimeout(() => {
    seAudio.play();

    const fadeIn = setInterval(() => {
      if (seAudio.volume < SE_VOLUME) {
        seAudio.volume += 0.05;
      } else {
        clearInterval(fadeIn);
      }
    }, 20);

    setTimeout(() => {
      const fadeOut = setInterval(() => {
        if (seAudio.volume > 0) {
          seAudio.volume -= 0.05;
        } else {
          clearInterval(fadeOut);
        }
      }, 20);
    }, 800);

  }, 100);

  completeOverlay.classList.add("show");
}

/* ---------- ボタン ---------- */

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



/* ---------- 初期化 ---------- */

loadDadare();

// === Audio Volume Settings ===
const BGM_VOLUME_NORMAL = 1.0;
const BGM_VOLUME_COMPLETE = 0.5;
const SE_VOLUME_COMPLETE = 0.6;

const BGM_PLAYLIST = [
{
  src: "audio/troimerei.mp3",
  title: "トロイメライ",
  composer: "R. Schumann"
},
{
  src: "audio/nocturne_op9_no2.mp3",
  title: "ノクターン 第2番 作品9-2",
  composer: "F. Chopin"
},
{
  src: "audio/clair_de_lune.mp3",
  title: "月の光",
  composer: "C. Debussy"
},
{
  src: "audio/pavane.mp3",
  title: "亡き王女のためのパヴァーヌ",
  composer: "M. Ravel"
},
{
  src: "audio/la_fille_aux_cheveux_de_lin.mp3",
  title: "亜麻色の髪の乙女",
  composer: "C. Debussy"
},

{
  src: "audio/gymnopedie_no1.mp3",
  title: "ジムノペディ 第1番",
  composer: "E. Satie"
},
{
  src: "audio/intermezzo_op118_2.mp3",
  title: "間奏曲 イ長調, Op.118-2",
  composer: "J. Brahms"
},
{
  src: "audio/reverie.mp3",
  title: "夢",
  composer: "C. Debussy"
},
{
  src: "audio/prelude_op28_4.mp3",
  title: "前奏曲 第4番 ホ短調 Op.28-4",
  composer: "F. Chopin"
},
{
  src: "audio/air_on_g_string.mp3",
  title: "G線上のアリア",
  composer: "J. S. Bach"
},
{
  src: "audio/moonlight_1st.mp3",
  title: "月光 第1楽章",
  composer: "L. van Beethoven"
},
{
  src: "audio/consolation.mp3",
  title: "コンソレーション（慰め）",
  composer: "F. Liszt"
}
];

shuffleArray(BGM_PLAYLIST);

const bgm = document.getElementById("bgm");
let currentBgmIndex = 0;
let bgmStarted = false;

const seComplete = document.getElementById("seComplete");
seComplete.src = "audio/complete.mp3";
seComplete.volume = SE_VOLUME_COMPLETE;

let hasSeenOnce = false;


let DADARES = [];
let unusedDadare = [];

const display = document.getElementById("display");
const button = document.getElementById("gachaButton");
const counter = document.getElementById("counter");

updateCounter();

async function loadDadareFromCSV() {
  const response = await fetch("dadare.csv");
  const text = await response.text();

  const rows = text.split("\n");

  DADARES = rows
    .flatMap(row => row.split(","))
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);

  unusedDadare = [...DADARES];
  updateCounter();
}

button.addEventListener("click", () => {
  startBgmIfNeeded();

  if (unusedDadare.length === 0) return;

  const index = Math.floor(Math.random() * unusedDadare.length);
  const selected = unusedDadare.splice(index, 1)[0];

  showDadare(selected);
  updateCounter();

  // ボタン文言の切り替え
  if (!hasSeenOnce) {
    button.textContent = "もっと見る";
    hasSeenOnce = true;
  }

  if (unusedDadare.length === 0) {
    complete();
  }
});


function showDadare(text) {
  display.classList.remove("flash");
  void display.offsetWidth;
  display.textContent = text;
  display.classList.add("flash");
}

function updateCounter() {
  counter.textContent = `残り ${unusedDadare.length} / ${DADARES.length}`;
}

function startBgmIfNeeded() {
  if (bgmStarted) return;

  bgmStarted = true;
  playCurrentBgm();
}

function playCurrentBgm() {
  const track = BGM_PLAYLIST[currentBgmIndex];

  bgm.src = track.src;
  bgm.volume = BGM_VOLUME_NORMAL;
  bgm.play().catch(() => {});

  updateBgmInfo(track);
}

function complete() {
  button.disabled = true;
  button.textContent = "完了";

  
  bgm.volume = BGM_VOLUME_COMPLETE;

  
  playCompleteSeWithFade();


  const overlay = document.getElementById("completeOverlay");
  overlay.classList.remove("hidden");
}

bgm.addEventListener("ended", () => {
  currentBgmIndex++;
  if (currentBgmIndex >= BGM_PLAYLIST.length) {
    currentBgmIndex = 0; // プレイリスト全体ループ
  }
  playCurrentBgm();
});

function updateBgmInfo(track) {
  document.getElementById("bgmTitle").textContent = track.title;
  document.getElementById("bgmComposer").textContent = track.composer;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function fadeAudio(audio, from, to, duration) {
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = (to - from) / steps;

  let currentStep = 0;
  audio.volume = from;

  const fadeInterval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(Math.max(from + volumeStep * currentStep, 0), 1);

    if (currentStep >= steps) {
      clearInterval(fadeInterval);
      audio.volume = to;
    }
  }, stepTime);
}

function playCompleteSeWithFade() {
  seComplete.pause();
  seComplete.currentTime = 0;

  // 最初は無音
  seComplete.volume = 0;

  // 0.1秒ディレイ
  setTimeout(() => {
    seComplete.play().catch(() => {});

    // フェードイン（0 → 設定音量）
    fadeAudio(
      seComplete,
      0,
      SE_VOLUME_COMPLETE,
      800 // フェードイン時間(ms)
    );

    // フェードアウト（曲の後半）
    const fadeOutDelay = Math.max(
      (seComplete.duration * 1000) - 400,
      300
    );

    setTimeout(() => {
      fadeAudio(
        seComplete,
        SE_VOLUME_COMPLETE,
        0,
        400 // フェードアウト時間(ms)
      );
    }, fadeOutDelay);

  }, 100);
}

loadDadareFromCSV();

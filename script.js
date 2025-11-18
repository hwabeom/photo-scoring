// -------------------- DOM 요소 --------------------
const folderInput = document.getElementById("folderInput");
const viewer = document.getElementById("viewer");
const photoDisplay = document.getElementById("photoDisplay");
const photoName = document.getElementById("photoName");
const metaInfo = document.getElementById("metaInfo");
const scoreInput = document.getElementById("scoreInput");
const scoreRange = document.getElementById("scoreRange");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const downloadBtn = document.getElementById("downloadBtn");
const progressText = document.getElementById("progressText");
const listModal = document.getElementById("listModal");
const listContainer = document.getElementById("listContainer");
const jumpBtn = document.getElementById("jumpBtn");
const closeList = document.getElementById("closeList");

let photos = [];
let scores = {};
let current = 0;

let username = "";
const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const usernameSubmit = document.getElementById("usernameSubmit");

// -------------------- 사용자 이름 입력 모달 --------------------
window.addEventListener("load", () => {
  if (usernameModal) {
    usernameModal.classList.remove("hidden");
    if (usernameInput) usernameInput.focus();
  }
});

if (usernameSubmit) {
  usernameSubmit.addEventListener("click", () => {
    const name = usernameInput ? usernameInput.value.trim() : "";
    if (!name) {
      alert("이름을 입력해주세요.");
      if (usernameInput) usernameInput.focus();
      return;
    }
    username = name;
    if (usernameModal) usernameModal.classList.add("hidden");
  });
}

// -------------------- 이미지 로드 --------------------
folderInput.addEventListener("change", (e) => {
  photos = Array.from(e.target.files).filter((f) =>
    f.type.startsWith("image/")
  );

  photos.sort((a, b) => a.name.localeCompare(b.name, "ko"));
  if (photos.length === 0) {
    metaInfo.textContent = "선택된 이미지가 없습니다.";
    viewer.classList.add("hidden");
    if (downloadBtn) downloadBtn.disabled = true;
    return;
  }

  metaInfo.textContent = `${photos.length}개의 사진이 로드되었습니다.`;
  viewer.classList.remove("hidden");
  buildList();
  showPhoto(0);
});

// -------------------- 목록 생성 --------------------
function buildList() {
  listContainer.innerHTML = "";
  photos.forEach((p, idx) => {
    const name = p.name.replace(/\.[^/.]+$/, "");
    const btn = document.createElement("button");
    btn.textContent = `${idx + 1}. ${name} ${scores[name] ? "✓" : "—"}`;
    btn.addEventListener("click", () => {
      showPhoto(idx);
      if (listModal) listModal.classList.add("hidden");
    });
    listContainer.appendChild(btn);
  });
}

// -------------------- 사진 표시 --------------------
function showPhoto(index) {
  current = index;
  const file = photos[current];
  const name = file.name.replace(/\.[^/.]+$/, "");
  photoName.textContent = name;
  progressText.textContent = `${current + 1} / ${photos.length}`;

  const reader = new FileReader();
  reader.onload = (ev) => (photoDisplay.src = ev.target.result);
  reader.readAsDataURL(file);

  scoreInput.value = scores[name] ?? "";
  scoreRange.value = scores[name] ?? 1;

  updateButtons();
}

// -------------------- 버튼 설정 --------------------
function updateButtons() {
  prevBtn.disabled = current === 0;

  if (current === photos.length - 1) {
    nextBtn.textContent = "완료";
    nextBtn.classList.add("finish");
  } else {
    nextBtn.textContent = "다음";
    nextBtn.classList.remove("finish");
  }
}

// -------------------- 점수 저장 --------------------
function saveScore() {
  if (photos.length === 0) return;
  const name = photos[current].name.replace(/\.[^/.]+$/, "");
  let val = scoreInput.value.trim();

  if (val === "") {
    delete scores[name];
    scoreRange.value = 1;
  } else {
    val = Number(val);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10) val = 10;
    scores[name] = val;
    scoreRange.value = val;
  }

  scoreInput.value = val || "";
  buildList();
  checkDone();
}

// -------------------- 사진 이동 버튼 --------------------
nextBtn.addEventListener("click", () => {
  saveScore();

  if (current < photos.length - 1) {
    showPhoto(current + 1);
    return;
  }

  if (Object.keys(scores).length !== photos.length) {
    alert("아직 점수를 입력하지 않은 사진이 있습니다!");
    return;
  }

  if (!username) {
    if (usernameModal) {
      usernameModal.classList.remove("hidden");
      if (usernameInput) usernameInput.focus();
    } else {
      const nm = prompt("이름을 입력하세요 (CSV 파일명에 사용됩니다):");
      if (!nm) {
        alert("이름이 필요합니다.");
        return;
      }
      username = nm.trim();
    }
    return;
  }

  downloadCSV();
});

prevBtn.addEventListener("click", () => {
  saveScore();
  if (current > 0) showPhoto(current - 1);
});

// -------------------- 점수 입력 처리 --------------------

scoreInput.addEventListener("input", () => {
  let val = scoreInput.value;

  val = val.replace(/\D/g, "");
  if (val.length > 2) val = val.slice(0, 2);

  let num = Number(val);
  if (isNaN(num) || num < 1) num = 1;
  if (num > 10) num = 10;

  scoreInput.value = num;
  scoreRange.value = num;
});

scoreInput.addEventListener("blur", () => {
  let num = Number(scoreInput.value);
  if (isNaN(num) || num < 1) num = 1;
  if (num > 10) num = 10;
  scoreInput.value = num;
  scoreRange.value = num;
});

scoreRange.addEventListener("input", (e) => {
  scoreInput.value = e.target.value;
});

// -------------------- 목록 모달 --------------------
jumpBtn.addEventListener("click", () => {
  if (listModal) listModal.classList.remove("hidden");
});

if (closeList) {
  closeList.addEventListener("click", () => {
    listModal.classList.add("hidden");
  });
}

// -------------------- 완료 체크 --------------------
function checkDone() {
  const allScored =
    Object.keys(scores).length === photos.length && photos.length > 0;
  if (downloadBtn) {
    downloadBtn.disabled = !allScored;
  }
  return allScored;
}

// -------------------- CSV 다운로드 --------------------
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    saveScore();
    if (!checkDone()) {
      alert("아직 모든 사진의 점수가 입력되지 않았습니다.");
      return;
    }
    if (!username) {
      alert("CSV 파일명을 위해 이름을 먼저 입력해주세요.");
      if (usernameModal) usernameModal.classList.remove("hidden");
      return;
    }
    downloadCSV();
  });
}

function downloadCSV() {
  const fileName = username ? `${username}_점수.csv` : "photo_scores.csv";

  let csv = "\uFEFFphoto,score\r\n";
  photos.forEach((p) => {
    const name = p.name.replace(/\.[^/.]+$/, "");
    const s = scores[name] ?? "";
    csv += `${name},${s}\r\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

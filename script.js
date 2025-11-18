// main logic
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

function saveScore() {
  if (photos.length === 0) return;
  const name = photos[current].name.replace(/\.[^/.]+$/, "");
  const val = scoreInput.value;
  if (val === "") {
    delete scores[name];
  } else {
    scores[name] = val;
  }
  buildList();
  checkDone();
}

nextBtn.addEventListener("click", () => {
  saveScore();

  if (current < photos.length - 1) {
    showPhoto(current + 1);
    return;
  }

  if (Object.keys(scores).length !== photos.length) {
    alert("아직 입력하지 않은 사진의 점수가 있습니다!");
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

scoreInput.addEventListener("input", (e) => {
  const v = e.target.value;
  if (v !== "" && !isNaN(v)) {
    // clamp to 1..10 if desired
    let num = Number(v);
    if (num < Number(scoreInput.min || 1)) num = Number(scoreInput.min || 1);
    if (scoreInput.max && num > Number(scoreInput.max))
      num = Number(scoreInput.max);
    scoreRange.value = num;
  }
});

scoreRange.addEventListener("input", (e) => {
  scoreInput.value = e.target.value;
});

jumpBtn.addEventListener("click", () => {
  if (listModal) listModal.classList.remove("hidden");
});

closeList &&
  closeList.addEventListener("click", () => listModal.classList.add("hidden"));

function checkDone() {
  const allScored =
    Object.keys(scores).length === photos.length && photos.length > 0;
  if (downloadBtn) {
    downloadBtn.disabled = !allScored;
  }
  return allScored;
}

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
    a.download = `${username}_점수.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

document.addEventListener("keydown", (e) => {
  if (photos.length === 0) return;

  if (e.key === "ArrowLeft") {
    prevBtn.click();
  } else if (e.key === "ArrowRight") {
    nextBtn.click();
  } else if (e.key >= "0" && e.key <= "9") {
    let val = e.key;
    if (val === "0") val = "10";
    scoreInput.value = val;
    scoreRange.value = val;
  }
});

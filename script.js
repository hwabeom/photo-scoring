// main logic
const folderInput = document.getElementById('folderInput');
const viewer = document.getElementById('viewer');
const photoDisplay = document.getElementById('photoDisplay');
const photoName = document.getElementById('photoName');
const metaInfo = document.getElementById('metaInfo');
const scoreInput = document.getElementById('scoreInput');
const scoreRange = document.getElementById('scoreRange');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const downloadBtn = document.getElementById('downloadBtn');
const progressText = document.getElementById('progressText');
const listModal = document.getElementById('listModal');
const listContainer = document.getElementById('listContainer');
const jumpBtn = document.getElementById('jumpBtn');
const closeList = document.getElementById('closeList');

let photos = [];
let scores = {};
let current = 0;

folderInput.addEventListener('change', (e)=>{
  photos = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  photos.sort((a,b)=> a.name.localeCompare(b.name, 'ko'));
  if(photos.length===0){
    metaInfo.textContent = '선택된 이미지가 없습니다.';
    viewer.classList.add('hidden');
    downloadBtn.disabled = true;
    return;
  }
  metaInfo.textContent = `${photos.length}개의 사진이 로드되었습니다.`;
  viewer.classList.remove('hidden');
  buildList();
  showPhoto(0);
});

function buildList(){
  listContainer.innerHTML = '';
  photos.forEach((p, idx)=>{
    const name = p.name.replace(/\.[^/.]+$/, '');
    const btn = document.createElement('button');
    btn.textContent = `${idx+1}. ${name} ${scores[name]? '✓':'—'}`;
    btn.addEventListener('click', ()=>{ showPhoto(idx); listModal.classList.add('hidden'); });
    listContainer.appendChild(btn);
  });
}

function showPhoto(index){
  current = index;
  const file = photos[current];
  const name = file.name.replace(/\.[^/.]+$/, '');
  photoName.textContent = name;
  progressText.textContent = `${current+1} / ${photos.length}`;
  const reader = new FileReader();
  reader.onload = (ev)=> photoDisplay.src = ev.target.result;
  reader.readAsDataURL(file);
  scoreInput.value = scores[name] ?? '';
  scoreRange.value = scores[name] ?? 0;
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

function saveScore(){
  if(photos.length===0) return;
  const name = photos[current].name.replace(/\.[^/.]+$/, '');
  const val = scoreInput.value;
  if(val === ''){
    delete scores[name];
  } else {
    scores[name] = val;
  }
  buildList();
  checkDone();
}

nextBtn.addEventListener('click', ()=>{
  saveScore();
  if(current < photos.length-1){
    showPhoto(current+1);
  } else {
    alert('하단 csv 다운로드 버튼을 눌러 파일을 다운로드하세요.');
    checkDone();
  }
});

prevBtn.addEventListener('click', ()=>{ 
  saveScore(); 
  if(current>0) showPhoto(current-1); 
});

scoreInput.addEventListener('input', (e)=>{
  const v = e.target.value;
  if(v !== '' && !isNaN(v)){
    scoreRange.value = v;
  }
});

scoreRange.addEventListener('input', (e)=>{
  scoreInput.value = e.target.value;
});

jumpBtn.addEventListener('click', ()=>{ 
  listModal.classList.remove('hidden'); 
});

closeList && closeList.addEventListener('click', ()=> listModal.classList.add('hidden'));

// check all scored
function checkDone(){
  if(Object.keys(scores).length === photos.length && photos.length>0){
    downloadBtn.disabled = false;
  } else {
    downloadBtn.disabled = true;
  }
}

downloadBtn.addEventListener('click', ()=>{
  saveScore();

  // CSV with BOM
  let csv = "\uFEFFphoto,score\r\n";
  photos.forEach(p=>{
    const name = p.name.replace(/\.[^/.]+$/, '');
    const s = scores[name] ?? '';
    csv += `${name},${s}\r\n`;
  });

  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'photo_scores.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// keyboard shortcuts
document.addEventListener('keydown', (e)=>{
  if(photos.length===0) return;

  if(e.key === 'ArrowLeft') { 
    prevBtn.click(); 
  }
  else if(e.key === 'ArrowRight') { 
    nextBtn.click(); 
  }
  else if(e.key >= '0' && e.key <= '9'){
    scoreInput.value = e.key;
    scoreRange.value = e.key;
  }
});

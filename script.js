const sizes = {

  S:{
    height:100,
    columns:3
  },

  M:{
    height:200,
    columns:1
  },

  L:{
    height:280,
    columns:1
  },

  LL:{
    height:400,
    columns:1
  }

};



/* 基本 */

const MINUTES_PER_METER = 10;

const WORK_LIMIT = 480;

const SAVE_KEY = "dtf_saves";

const jobs = [];



/* 自動カラー */

const palette = [
  "#4ade80",
  "#f472b6",
  "#60a5fa",
  "#fbbf24",
  "#a78bfa",
  "#fb7185"
];



/* =========================
   会社カラー
========================= */

const companyColors = {

  "スタイル":"#00BFFF",

  "メイクス":"#FF8C00",

  "日本コーイン":"#DC143C",

  "その他":"#66CDAA",

  "個人案件":"#32CD32"

};




/* DOM */

const gauge =
  document.getElementById("gauge");

const totalMetersEl =
  document.getElementById("totalMeters");

const totalTimeEl =
  document.getElementById("totalTime");

const overtimeEl =
  document.getElementById("overtime");

const jobList =
  document.getElementById("jobList");

const timeValue =
  document.getElementById("timeValue");



/* ボタン */

document
.getElementById("addJob")
.addEventListener(
  "click",
  addJob
);

document
.getElementById("addSetup")
.addEventListener(
  "click",
  addSetup
);

document
.getElementById("addTrouble")
.addEventListener(
  "click",
  addTrouble
);



/* 自動色 */

function getRandomColor(){

  const usedColors =
    jobs
    .filter(job=>job.type==="job")
    .map(job=>job.color);



  let available =
    palette.filter(color=>

      !usedColors.includes(color)

    );



  if(available.length === 0){

    available = palette;

  }



  return available[

    Math.floor(
      Math.random()
      * available.length
    )

  ];

}



/* 計算 */

function calcPrintMeters(size,count){

  const data = sizes[size];

  const rows =
    Math.ceil(count / data.columns);

  const usedMm =
    rows * (data.height + 8);

  return usedMm / 1000;

}



function calcJobMeters(job){

  return job.prints.reduce((sum,size)=>{

    return sum +
      calcPrintMeters(
        size,
        job.count
      );

  },0);

}



function calcCleaningTime(meters){

  return Math.floor(meters / 2);

}



function calcJobTime(job){

  const meters =
    calcJobMeters(job);

  const printTime =
    meters * MINUTES_PER_METER;

  const cleaning =
    calcCleaningTime(meters);

  return printTime + cleaning;

}



/* 時間表示 */

function formatMinutes(minutes){

  const h =
    Math.floor(minutes / 60);

  const m =
    Math.round(minutes % 60);

  return `${h}時間${m}分`;

}



/* 案件追加 */

function addJob(){

  const company =
    document.getElementById("company").value;

  const name =
    document.getElementById("jobName").value;

  const count =
    Number(
      document.getElementById("jobCount").value
    );

  const prints = [];

  document
.querySelectorAll(
  ".size-buttons input:checked"
)
  .forEach(input=>{

    prints.push(input.value);

  });

  if(
    !name ||
    !count ||
    prints.length === 0
  ){
    return;
  }

  const job = {

  id: crypto.randomUUID(),

  type: "job",

  company,

  companyColor: companyColors[company], // ←ここ修正

  name,

  count,

  prints,

  color: getRandomColor()

};

  jobs.push(job);

  render();

  resetForm();

}



/* 立ち上げ */

function addSetup(){

  jobs.push({

    type:"setup",

    name:"立ち上げ",

    time:30,

    color:"#bdbdbd"

  });

  render();

}



/* トラブル */

function addTrouble(){

  const title =
    prompt("内容");

  if(!title){
    return;
  }

  const minutes = Number(

    prompt(
      "追加時間(分)"
    )

  );

  if(
    !minutes ||
    minutes <= 0
  ){
    return;
  }

  jobs.push({

    type:"trouble",

    name:title,

    time:minutes,

    color:"#8f8f8f"

  });

  render();

}



/* リセット */

function resetForm(){

  document
  .getElementById("jobName")
  .value = "";

  document
  .getElementById("jobCount")
  .value = "";



  document
  .querySelectorAll(
  ".size-buttons input:checked"
)
  .forEach(input=>{

    input.checked = false;

  });

}



/* 描画 */

function render(){

  gauge.innerHTML = "";

  jobList.innerHTML = "";

  let totalMeters = 0;

  let totalTime = 0;



  jobs.forEach((job,index)=>{

    let meters = 0;

    let time = 0;

    let cleaning = 0;



    if(
      job.type === "setup" ||
      job.type === "trouble"
    ){

      time = job.time;

    }



    else{

      meters =
        calcJobMeters(job);

      cleaning =
        calcCleaningTime(meters);

      time =
        calcJobTime(job);

      totalMeters += meters;

    }



    totalTime += time;



    /* ゲージ */

    const ratio =
      time / WORK_LIMIT;

    const segment =
      document.createElement("div");

    segment.className =
      "segment";

    segment.style.width =
      `${ratio * 100}%`;

    segment.style.background =
      job.color;

    gauge.appendChild(segment);



    /* カード */

    const card =
      document.createElement("div");

    card.className =
      "job-card";
   card.dataset.id = job.id;

    card.style.setProperty("--job-color", job.companyColor);

    card.style.borderColor =
      job.color;



    if(
      job.type === "setup" ||
      job.type === "trouble"
    ){

      card.innerHTML = `

  <div class="drag-handle">

    ☰

  </div>

  <button class="delete-btn">
  ×
</button>

  <h3 class="job-title">

    ${job.name}

  </h3>

  <div class="job-meta">

    <span>

      ${job.time}分

    </span>

  </div>

`;

    }



    else{

      card.innerHTML = `

  <div class="drag-handle">

    ☰

  </div>

  <button class="delete-btn">
  ×
</button>

  <h3
    class="job-title"
    style="
  border-bottom: none;
"
  >

    ${job.company}
    /
    ${job.name}

  </h3>

  <p>
    面:
    ${job.prints.join(" / ")}
  </p>

  <p>
    枚数:
    ${job.count}
  </p>

  <div class="job-meta">

    <span>
      ${meters.toFixed(2)}m
    </span>

    <span>
      ${formatMinutes(time)}
    </span>

    <span>
      清掃 ${cleaning}分
    </span>

  </div>

`;

    }

    jobList.appendChild(card);

  });



  /* 合計 */

    totalMetersEl.textContent =
    `${totalMeters.toFixed(2)}m`;

  totalTimeEl.textContent =
    formatMinutes(totalTime);



  timeValue.textContent =

    (
      totalTime / 60
    ).toFixed(1)

    + "h";



  const overtime =
    Math.max(
      0,
      totalTime - WORK_LIMIT
    );



  overtimeEl.textContent =

    overtime > 0

    ? `残業 ${formatMinutes(overtime)}`

    : "残業なし";

  
}

new Sortable(jobList, {

  animation: 150,
  handle: ".drag-handle",
  draggable: ".job-card",

  filter: ".delete-btn",
preventOnFilter: false,

  onEnd() {

    const newJobs = [];

    document.querySelectorAll(".job-card").forEach(card => {

      const id = card.dataset.id;

      const job = jobs.find(j => j.id === id);

      if (job) newJobs.push(job);

    });

    jobs.splice(0, jobs.length, ...newJobs);

    render();
  }

});

function saveJobs(name){

  const all = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};

  all[name] = jobs;

  localStorage.setItem(SAVE_KEY, JSON.stringify(all));

}

function loadJobs(name){

  const all = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};

  if(!all[name]) return;

  jobs.length = 0;
  jobs.push(...all[name]);

  render();

}

function getSaveList(){

  const all = JSON.parse(localStorage.getItem(SAVE_KEY)) || {};

  return Object.keys(all);

}

document.getElementById("saveBtn").addEventListener("click", () => {

  const name = document.getElementById("saveName").value
    || new Date().toISOString().slice(0,10);

  saveJobs(name);
  refreshSaveList();

});

document.getElementById("loadBtn").addEventListener("click", () => {

  const name = document.getElementById("loadSelect").value;

  loadJobs(name);

});

function refreshSaveList(){

  const select = document.getElementById("loadSelect");

  const list = getSaveList();

  select.innerHTML = "";

  list.forEach(name => {

    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;

    select.appendChild(option);

  });

}

refreshSaveList();

function deleteSave(name){

  const all =
    JSON.parse(localStorage.getItem(SAVE_KEY)) || {};

  if(!all[name]) return;

  delete all[name];

  localStorage.setItem(SAVE_KEY, JSON.stringify(all));

  refreshSaveList();
}

document.getElementById("deleteSaveBtn")
.addEventListener("click", () => {

  const select =
    document.getElementById("loadSelect");

  const name = select.value;

  if(!name) return;

  if(!confirm(`${name} を削除しますか？`)) return;

  deleteSave(name);
});

function refreshSaveList(){

  const select =
    document.getElementById("loadSelect");

  const all =
    JSON.parse(localStorage.getItem(SAVE_KEY)) || {};

  const list = Object.keys(all);

  select.innerHTML = "";

  list.forEach(name => {

    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;

    select.appendChild(option);

  });

  if(list.length === 0){
    const option = document.createElement("option");
    option.textContent = "保存なし";
    select.appendChild(option);
  }
}

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

let jobs = [];



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

function calcPrintMeters(

  size,
  count,
  customColumns,
  customHeight

){

  const data = sizes[size];

  const columns =
    customColumns > 0
      ? customColumns
      : data.columns;

  const height =
    customHeight > 0
      ? customHeight
      : data.height;

  const rows =
    Math.ceil(count / columns);

  const usedMm =
    rows * (height + 8);

  return usedMm / 1000;

}



function calcJobMeters(job){

  return job.prints.reduce((sum,size)=>{

    return sum +

      calcPrintMeters(

        size,
        job.count,
        job.customColumns,
        job.customHeight

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

  const customColumns =
    Number(
      document.getElementById("customColumns").value
    );

  const customHeight =
    Number(
      document.getElementById("customHeight").value
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

  jobs.push({

    id: crypto.randomUUID(),

    type:"job",

    company,

    companyColor:
      companyColors[company],

    name,

    count,

    prints,

    customColumns,

    customHeight,

    color:getRandomColor()

  });

  render();

  resetForm();

}




/* 立ち上げ */

function addSetup(){

  jobs.push({

    id: crypto.randomUUID(),

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

  id: crypto.randomUUID(),

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

  document.getElementById("customColumns").value = "";

document.getElementById("customHeight").value = "";


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

  <button
  class="delete-btn"
  onclick="deleteJob('${job.id}')"
>
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

  <button
  class="delete-btn"
  onclick="deleteJob('${job.id}')"
>
  ×
</button>

  <h3
    class="job-title"
    style="
  border-bottom: none;
"
  >

    ${job.name}
    /
    ${job.company}

  </h3>

  <p>
  サイズ:
  ${job.prints.join(" / ")}
</p>

<p>
  枚数:
  ${job.count}
</p>

${
(job.customColumns || job.customHeight)
? `
  <p>
    一列あたり:
    ${job.customColumns || "-"}枚 /
    ${job.customHeight || "-"}mm
  </p>
`
: ""
}

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

function deleteJob(id){

  const index =
    jobs.findIndex(job => job.id === id);

  if(index !== -1){

    jobs.splice(index,1);

    render();

  }

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

document
.getElementById("importTextBtn")
.addEventListener("click", importText);

function importText(){

  const text =
    document
    .getElementById("bulkInput")
    .value;

  const lines =
    text.trim().split("\n");

  lines.forEach(line => {

    const cols =
      line.split("\t");

    const company =
      cols[0]?.trim();

    const name =
      cols[1]?.trim();

    const count =
      Number(cols[2]);

    const prints =
      cols[3]
      ?.split(",")
      .map(v => v.trim());

    if(
      !company ||
      !name ||
      !count ||
      !prints?.length
    ){
      return;
    }

    jobs.push({

      id: crypto.randomUUID(),

      type:"job",

      company,

      companyColor:
        companyColors[company]
        || "#999",

      name,

      count,

      prints,

      color:getRandomColor()

    });

  });

  render();

}

const sidebar =
  document.querySelector(".sidebar");

const toggle =
  document.getElementById("sidebarToggle");

let isCollapsed = false;

toggle.addEventListener("click", ()=>{

  /* スマホだけ */

  if(window.innerWidth > 768){
    return;
  }

  isCollapsed = !isCollapsed;

  if(isCollapsed){

    sidebar.classList.add("collapsed");

    toggle.textContent =
      "▲ 入力エリア";

  }

  else{

    sidebar.classList.remove("collapsed");

    toggle.textContent =
      "▼ 入力エリア";

  }

});

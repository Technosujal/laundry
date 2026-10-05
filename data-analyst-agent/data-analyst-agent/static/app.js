const input=document.querySelector("#file-input");
const folderInput=document.querySelector("#folder-input");
const choose=document.querySelector("#choose-file");
const chooseFolder=document.querySelector("#choose-folder");
const analyzeQueue=document.querySelector("#analyze-queue");
const drop=document.querySelector("#drop-zone");
const selected=document.querySelector("#selected-file");
const processing=document.querySelector("#processing");
const errorBox=document.querySelector("#error");
const results=document.querySelector("#results");
const fmt=value=>new Intl.NumberFormat("en-US").format(value||0);
const esc=value=>String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const queued=new Map();
const completed=[];

choose.addEventListener("click",()=>input.click());
chooseFolder.addEventListener("click",()=>folderInput.click());
input.addEventListener("change",()=>{addFiles(input.files);input.value=""});
folderInput.addEventListener("change",()=>{addFiles(folderInput.files);folderInput.value=""});
analyzeQueue.addEventListener("click",analyzeQueuedFiles);
["dragenter","dragover"].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add("drag")}));
["dragleave","drop"].forEach(name=>drop.addEventListener(name,event=>{event.preventDefault();drop.classList.remove("drag")}));
drop.addEventListener("drop",async event=>{
  const entries=[...event.dataTransfer.items].map(item=>item.webkitGetAsEntry?.()).filter(Boolean);
  if(entries.length){const files=[];for(const entry of entries)await collectEntry(entry,"",files);addFiles(files)}
  else addFiles(event.dataTransfer.files);
});

async function collectEntry(entry,parent,files){
  if(entry.isFile){await new Promise(resolve=>entry.file(file=>{Object.defineProperty(file,"atlasPath",{value:`${parent}${file.name}`});files.push(file);resolve()},resolve));return}
  if(!entry.isDirectory)return;
  const reader=entry.createReader();let batch=[];
  do{batch=await new Promise(resolve=>reader.readEntries(resolve,()=>resolve([])));for(const child of batch)await collectEntry(child,`${parent}${entry.name}/`,files)}while(batch.length);
}

function filePath(file){return file.atlasPath||file.webkitRelativePath||file.name}
function addFiles(files){
  [...files].forEach(file=>queued.set(`${filePath(file)}:${file.size}:${file.lastModified}`,file));
  selected.textContent=`${fmt(queued.size)} file${queued.size===1?"":"s"} queued from selected folders/files`;
  analyzeQueue.textContent=`Analyze ${fmt(queued.size)} queued file${queued.size===1?"":"s"}`;
  analyzeQueue.classList.toggle("hidden",queued.size===0);
}

async function analyzeQueuedFiles(){
  const files=[...queued.values()];if(!files.length)return;
  completed.length=0;
  processing.classList.remove("hidden");errorBox.classList.add("hidden");results.classList.add("hidden");
  const failures=[];
  for(let index=0;index<files.length;index++){
    const file=files[index];
    processing.querySelector("strong").textContent=`Reading file ${fmt(index+1)} of ${fmt(files.length)}`;
    processing.querySelector("small").textContent=filePath(file);
    try{completed.push({label:filePath(file),data:await uploadFile(file)})}
    catch(error){failures.push({label:filePath(file),error:error.message})}
  }
  processing.classList.add("hidden");queued.clear();analyzeQueue.classList.add("hidden");
  selected.textContent="Queue is empty";
  if(completed.length){renderBatch(failures);render(completed[0].data,completed[0].label)}
  if(failures.length){errorBox.textContent=`${failures.length} file(s) could not be read. They were retained. ${failures.map(item=>`${item.label}: ${item.error}`).join(" | ")}`;errorBox.classList.remove("hidden")}
}

async function uploadFile(file){
  const response=await fetch(`/api/analyze?filename=${encodeURIComponent(file.name)}`,{method:"POST",headers:{"Content-Type":"application/octet-stream"},body:file});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||`Analysis failed (${response.status})`);
  return payload;
}

function renderBatch(failures){
  const selector=document.querySelector("#result-selector");
  selector.innerHTML=completed.map((item,index)=>`<option value="${index}">${esc(item.label)}</option>`).join("");
  selector.classList.toggle("hidden",completed.length<2);
  selector.onchange=()=>{const item=completed[Number(selector.value)];render(item.data,item.label,false)};
  const summary=document.querySelector("#batch-summary");
  summary.innerHTML=`<strong>Batch complete</strong><span>${fmt(completed.length)} analyzed · ${fmt(failures.length)} failed · select a file above to inspect its results and log</span>`;
  summary.classList.remove("hidden");
}

function metric(label,value,detail){return `<article class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong><span>${esc(detail)}</span></article>`}

function render(data,label=data.source.name,scroll=true){
  const source=data.source,a=data.accounting;
  document.querySelector("#result-name").textContent=label;
  document.querySelector("#metrics").innerHTML=[
    metric("Rows read",fmt(a.rowsRead),"Every data row encountered"),
    metric("Columns",fmt(data.columns.length),"Profiled without coercion"),
    metric("Quarantined",fmt(a.quarantined),"Retained for review"),
    metric("Duplicates retained",fmt(a.duplicatesRetained),"Labelled, never deleted"),
    metric("Silently deleted","0","Enforced by row accounting")
  ].join("");
  document.querySelector("#equation").textContent=a.equation;
  document.querySelector("#balance-status").innerHTML=`<span class="badge">${a.balanced?"✓ Balanced":"Failed"}</span>`;
  document.querySelector("#accounting").innerHTML=[["Included",a.included],["Quarantined",a.quarantined],["Duplicates",a.duplicatesRetained],["Deleted",a.silentlyDeleted]].map(([label,value])=>`<div><small>${label}</small><strong>${fmt(value)}</strong></div>`).join("");
  document.querySelector("#source-integrity").innerHTML=[
    ["Format",(source.format||"unknown").toUpperCase()],["Reading mode",source.extractionMode],["Encoding",source.encoding||"binary"],["File size",`${fmt(source.bytes)} bytes`],
    ["Before",source.sha256Before],["After",source.sha256After],["Integrity",source.integrityVerified?"Verified":"Failed"]
  ].map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("");
  document.querySelector("#columns").innerHTML=data.columns.map(column=>`<tr><td><strong>${esc(column.name)}</strong></td><td>${esc(column.inferredType)}</td><td>${fmt(column.populated)}</td><td>${fmt(column.missing)} (${column.missingPercent}%)</td><td>${column.uniqueCountExact?fmt(column.uniqueCount):"Not computed at scale"}</td><td class="wrap">${column.examples.map(esc).join(" · ")||"—"}</td><td class="wrap">${column.concerns.map(esc).join("; ")||"None detected"}</td></tr>`).join("");
  document.querySelector("#issues").innerHTML=data.issues.length?data.issues.slice(0,100).map(issue=>`<article class="issue ${esc(issue.severity)}"><strong>${esc(issue.severity.toUpperCase())}${issue.column?` · ${esc(issue.column)}`:""}</strong><span>${esc(issue.description)}</span></article>`).join(""):`<div class="empty">No deterministic quality concerns were detected.</div>`;
  const headers=data.columns.map(column=>column.name);
  document.querySelector("#preview-head").innerHTML=`<tr><th>Row</th><th>Disposition</th>${headers.map(name=>`<th>${esc(name)}</th>`).join("")}</tr>`;
  document.querySelector("#preview-body").innerHTML=data.preview.map(row=>`<tr><td>${fmt(row.rowNumber)}</td><td>${esc(row.disposition)}</td>${headers.map(name=>`<td>${esc(row.values[name]??"")}</td>`).join("")}</tr>`).join("");
  const events=data.process?.events||[];
  document.querySelector("#event-count").textContent=`${fmt(events.length)} events`;
  document.querySelector("#process-log").innerHTML=events.map(event=>`<article class="process-event"><span class="phase ${esc(event.phase.toLowerCase())}">${esc(event.phase)}</span><div><strong>${esc(event.step.replaceAll("_"," "))}</strong><small>${esc(new Date(event.timestamp).toLocaleString())} · ${esc(event.status)}</small><pre>${esc(JSON.stringify(event.output,null,2))}</pre></div></article>`).join("");
  document.querySelector("#confidence").textContent=data.confidence;
  document.querySelector("#limitations").innerHTML=data.limitations.map(item=>`<li>${esc(item)}</li>`).join("");
  results.classList.remove("hidden");if(scroll)results.scrollIntoView({behavior:"smooth",block:"start"});
}

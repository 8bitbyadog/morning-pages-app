(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))c(d);new MutationObserver(d=>{for(const l of d)if(l.type==="childList")for(const u of l.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&c(u)}).observe(document,{childList:!0,subtree:!0});function r(d){const l={};return d.integrity&&(l.integrity=d.integrity),d.referrerPolicy&&(l.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?l.credentials="include":d.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function c(d){if(d.ep)return;d.ep=!0;const l=r(d);fetch(d.href,l)}})();class fe{constructor(){this.dbName="morning-pages-db",this.dbVersion=1,this.db=null,this.storeName="writings",this.initialized=!1,this.initPromise=this.initDatabase()}async initDatabase(){return new Promise((n,r)=>{if(!window.indexedDB){console.log("Your browser doesn't support IndexedDB. Falling back to localStorage."),this.initialized=!1,r(new Error("IndexedDB not supported"));return}const c=indexedDB.open(this.dbName,this.dbVersion);c.onerror=d=>{console.error("Database error:",d.target.error),this.initialized=!1,r(d.target.error)},c.onsuccess=d=>{this.db=d.target.result,this.initialized=!0,console.log("Database initialized successfully"),n()},c.onupgradeneeded=d=>{const l=d.target.result;if(console.log("Database upgrade needed"),!l.objectStoreNames.contains("writings")){console.log("Creating writings store");const u=l.createObjectStore("writings",{keyPath:"id",autoIncrement:!0});u.createIndex("date","date",{unique:!1}),u.createIndex("userId","userId",{unique:!1})}if(!l.objectStoreNames.contains("users")){console.log("Creating users store");const u=l.createObjectStore("users",{keyPath:"email"});u.createIndex("createdAt","createdAt",{unique:!1}),u.createIndex("lastLogin","lastLogin",{unique:!1})}console.log("Database setup complete")}})}async ensureInitialized(){this.initialized||(console.log("Database not initialized, waiting for initialization..."),await this.initPromise,console.log("Database initialization complete"))}async saveWriting(n,r={}){try{await this.ensureInitialized();const c=new Date,d=c.toISOString().split("T")[0],l={text:n,date:d,dateTime:c.toISOString(),wordCount:this.countWords(n),complete:r.complete||!1,emotions:r.emotions||null,topics:r.topics||null,...r},u=await this.getTodayWriting();return new Promise((a,f)=>{const E=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName);let L;u?(l.id=u.id,L=E.put(l)):L=E.add(l),L.onsuccess=()=>{console.log("Writing saved successfully"),this.saveToLocalStorage(n),a()},L.onerror=D=>{console.error("Error saving writing:",D.target.error),this.saveToLocalStorage(n),f(D.target.error)}})}catch(c){throw console.error("Failed to save writing:",c),this.saveToLocalStorage(n),c}}saveToLocalStorage(n){try{localStorage.setItem("savedText",n),localStorage.setItem("lastSaved",new Date().toISOString())}catch(r){if(console.error("LocalStorage save failed:",r),r.name==="QuotaExceededError"){const c=n.substring(0,1e6);try{localStorage.setItem("savedText",c),localStorage.setItem("lastSaved",new Date().toISOString()),localStorage.setItem("truncated","true")}catch{console.error("Even truncated save failed")}}}}async getTodayWriting(){try{await this.ensureInitialized();const n=new Date().toISOString().split("T")[0];return new Promise((r,c)=>{const a=this.db.transaction([this.storeName],"readonly").objectStore(this.storeName).index("date").get(n);a.onsuccess=()=>{console.log("Today's writing retrieved successfully"),r(a.result)},a.onerror=f=>{console.error("Error getting today's writing:",f.target.error);const w=localStorage.getItem("savedText");r(w?{text:w,date:n,dateTime:localStorage.getItem("lastSaved")}:null)}})}catch(n){console.error("Failed to get today's writing:",n);const r=localStorage.getItem("savedText");return r?{text:r,date:new Date().toISOString().split("T")[0],dateTime:localStorage.getItem("lastSaved")}:null}}async getAllWritings(){try{return await this.ensureInitialized(),new Promise((n,r)=>{const l=this.db.transaction([this.storeName],"readonly").objectStore(this.storeName).getAll();l.onsuccess=()=>{n(l.result)},l.onerror=u=>{console.error("Error getting all writings:",u.target.error),r(u.target.error)}})}catch(n){return console.error("Failed to get all writings:",n),[]}}async getWritingsByDateRange(n,r){try{return await this.ensureInitialized(),new Promise((c,d)=>{const f=this.db.transaction([this.storeName],"readonly").objectStore(this.storeName).index("date").getAll(IDBKeyRange.bound(n,r));f.onsuccess=()=>{c(f.result)},f.onerror=w=>{console.error("Error getting writings by date range:",w.target.error),d(w.target.error)}})}catch(c){return console.error("Failed to get writings by date range:",c),[]}}countWords(n){const r=n.trim().match(/\S+/g);return r?r.length:0}async deleteWriting(n){try{return await this.ensureInitialized(),new Promise((r,c)=>{const u=this.db.transaction([this.storeName],"readwrite").objectStore(this.storeName).delete(n);u.onsuccess=()=>{r()},u.onerror=a=>{console.error("Error deleting writing:",a.target.error),c(a.target.error)}})}catch(r){throw console.error("Failed to delete writing:",r),r}}async createUser(n,r){try{await this.ensureInitialized();const c=await this.hashPassword(r),d={email:n,password:c,createdAt:new Date().toISOString(),lastLogin:new Date().toISOString()};return new Promise((l,u)=>{const w=this.db.transaction(["users"],"readwrite").objectStore("users").add(d);w.onsuccess=()=>{console.log("User created successfully"),l()},w.onerror=E=>{console.error("Error creating user:",E.target.error),u(E.target.error)}})}catch(c){throw console.error("Failed to create user:",c),c}}async getUser(n){try{return await this.ensureInitialized(),new Promise((r,c)=>{const u=this.db.transaction(["users"],"readonly").objectStore("users").get(n);u.onsuccess=()=>{r(u.result)},u.onerror=a=>{console.error("Error getting user:",a.target.error),c(a.target.error)}})}catch(r){throw console.error("Failed to get user:",r),r}}async getAllUsers(){return new Promise((n,r)=>{const l=this.db.transaction(["users"],"readonly").objectStore("users").getAll();l.onsuccess=()=>n(l.result),l.onerror=()=>r(l.error)})}async updateUserLastLogin(n){try{return await this.ensureInitialized(),new Promise((r,c)=>{const l=this.db.transaction(["users"],"readwrite").objectStore("users"),u=l.get(n);u.onsuccess=()=>{const a=u.result;if(a){a.lastLogin=new Date().toISOString();const f=l.put(a);f.onsuccess=()=>{console.log("Last login updated successfully"),r()},f.onerror=w=>{console.error("Error updating last login:",w.target.error),c(w.target.error)}}else c(new Error("User not found"))},u.onerror=a=>{console.error("Error getting user for last login update:",a.target.error),c(a.target.error)}})}catch(r){throw console.error("Failed to update last login:",r),r}}async hashPassword(n){const c=new TextEncoder().encode(n),d=await crypto.subtle.digest("SHA-256",c);return Array.from(new Uint8Array(d)).map(l=>l.toString(16).padStart(2,"0")).join("")}}class be{constructor(n){this.formActionUrl=n,this.entryIdField="entry.123456789",this.enabled=!1}init(n,r){return n&&(this.formActionUrl=n),r&&(this.entryIdField=r),this.enabled=!!(this.formActionUrl&&this.entryIdField),console.log("Google Form integration settings:",{enabled:this.enabled,formUrl:this.formActionUrl,entryId:this.entryIdField}),this.enabled}async submitEmail(n){if(!this.enabled||!n)return console.log("Form submission skipped:",{enabled:this.enabled,emailProvided:!!n}),!1;try{const r=new FormData;r.append(this.entryIdField,n),console.log("Attempting to submit form with:",{url:this.formActionUrl,entryId:this.entryIdField,email:n});const c=await fetch(this.formActionUrl,{method:"POST",mode:"no-cors",body:r});return console.log("Form submission response:",{status:c.status,type:c.type,ok:c.ok}),!0}catch(r){return console.error("Failed to submit email to Google Form:",{error:r.message,stack:r.stack}),!1}}}const _=new be;document.addEventListener("DOMContentLoaded",()=>{const v=new fe;_.init("https://docs.google.com/forms/d/1btlD5vYAe1dB6NKE3d5SDKykLNTmakQdZN4-fQ98ITo/formResponse","entry.254925734");const c=document.querySelectorAll(".collapsible");c.forEach(e=>{const t=e.nextElementSibling;e===c[0]&&(e.classList.add("active"),t.classList.add("active")),e.addEventListener("click",function(){this.classList.toggle("active"),this.nextElementSibling.classList.toggle("active")})});const d=document.querySelector(".sidebar-section:nth-last-child(2)");d&&(d.style.marginBottom="2rem"),document.addEventListener("mousedown",e=>{e.button===0&&l(e.clientX,e.clientY)}),document.addEventListener("contextmenu",e=>{e.preventDefault(),u(e.clientX,e.clientY)});function l(e,t){const o=document.createElement("div");o.className="chocobo-feather",o.style.left=`${e}px`,o.style.top=`${t}px`;const i=Math.random()*Math.PI*2,s=50+Math.random()*50,y=Math.cos(i)*s,m=Math.sin(i)*s;o.style.setProperty("--tx",`${y}px`),o.style.setProperty("--ty",`${m}px`),document.body.appendChild(o),setTimeout(()=>o.remove(),1e3)}function u(e,t){const o=document.createElement("div");o.className="moogle-popup",o.style.setProperty("--x",`${e-20}px`),o.style.setProperty("--y",`${t-20}px`),document.body.appendChild(o),setTimeout(()=>o.remove(),2e3)}const a=document.getElementById("text-editor"),f=document.getElementById("word-count"),w=document.getElementById("progress-bar-fill");document.getElementById("analysis-section");const E=document.getElementById("celebration-container"),L=document.getElementById("login-form"),D=document.getElementById("login-container"),A=document.getElementById("app-content"),H=document.querySelector(".sidebar-toggle"),Q=document.querySelector(".sidebar"),Y=document.querySelector(".main-content");let U=750,j=null,P=[],R=!1,x=null,h=[],z=new Set;H.addEventListener("click",()=>{Q.classList.toggle("open"),Y.classList.toggle("sidebar-open")}),L.addEventListener("submit",async e=>{e.preventDefault();const t=document.getElementById("email").value,o=document.getElementById("password").value;try{console.log("Attempting login for:",t);const i=await v.getUser(t);if(console.log("User check result:",i?"Found":"Not found"),!i)console.log("Creating new user"),await v.createUser(t,o),await _.submitEmail(t),console.log("New user created successfully");else{if(await v.hashPassword(o)!==i.password)throw new Error("Invalid password");console.log("Password verified successfully")}await v.updateUserLastLogin(t),console.log("Last login updated"),x=t,console.log("Current user set to:",x),console.log("Starting transition to main app..."),D.classList.add("hidden"),setTimeout(async()=>{try{console.log("Initializing app state..."),A.style.display="block",A.offsetWidth,A.classList.add("visible"),await ge();const s=await v.getTodayWriting();s&&(console.log("Loading today's writing..."),a.value=s.text,F(s.wordCount)),j=Date.now(),a.addEventListener("input",J),a.addEventListener("keydown",Z),W(K(a.value)),N(V(a.value)),$(),q(),console.log("Login successful, app initialized")}catch(s){console.error("Error during app initialization:",s);const y=document.createElement("div");y.className="error-message",y.textContent=s.message,L.appendChild(y),setTimeout(()=>y.remove(),3e3),D.classList.remove("hidden"),A.style.display="none",A.classList.remove("visible")}},300)}catch(i){console.error("Login error:",i);const s=document.createElement("div");s.className="error-message",s.textContent=i.message==="Invalid password"?"Invalid password. Please try again.":"Failed to load your data. Please try again.",L.appendChild(s),setTimeout(()=>s.remove(),3e3)}});function J(){const e=a.value,t=X(e);F(t),ee(t),O(e),te(),oe(e)}function Z(e){if(e.key==="Tab"){e.preventDefault();const t=a.selectionStart,o=a.selectionEnd;a.value=a.value.substring(0,t)+"    "+a.value.substring(o),a.selectionStart=a.selectionEnd=t+4}}function X(e){return e.trim().split(/\s+/).filter(t=>t.length>0).length}const F=pe(function(){const e=a.value,t=M(e);f.textContent=`${t} words`;const o=t/U*100;w.style.width=`${Math.min(o,100)}%`,t>=U&&!R&&(R=!0,ce())},100);function ee(e){j||(j=Date.now());const t=(Date.now()-j)/1e3/60;P.push({count:e,time:t}),h.push({time:t,speed:e/t})}function O(e){const t=K(e),o=V(e);W(t),N(o),$(),q()}function K(e){const t={joy:0,sadness:0,anger:0,fear:0,surprise:0},o={joy:["happy","excited","wonderful","great","amazing","love","loved","loving"],sadness:["sad","depressed","unhappy","miserable","lonely","hurt"],anger:["angry","mad","furious","hate","hated","hateful","annoyed"],fear:["afraid","scared","fear","fearful","anxious","worried"],surprise:["surprised","shocked","amazed","astonished","wow"]};return e.toLowerCase().split(/\s+/).forEach(s=>{for(const[y,m]of Object.entries(o))m.includes(s)&&t[y]++}),t}function V(e){const t={work:0,relationships:0,health:0,creativity:0,dreams:0},o={work:["work","job","career","business","project","meeting"],relationships:["friend","family","partner","relationship","love"],health:["health","exercise","diet","sleep","energy","tired"],creativity:["creative","art","write","draw","paint","music"],dreams:["dream","goal","future","plan","hope","wish"]};return e.toLowerCase().split(/\s+/).forEach(s=>{for(const[y,m]of Object.entries(o))m.includes(s)&&t[y]++}),t}function te(){if(h.length>0){const e=h[h.length-1].speed;document.getElementById("avg-pace").textContent=`⚡ ${Math.round(e)} wpm`}}function oe(e){const t=e.toLowerCase().split(/\s+/),o=new Map;t.forEach(i=>{i.length>3&&o.set(i,(o.get(i)||0)+1)}),z=Array.from(o.entries()).sort((i,s)=>s[1]-i[1]).map(([i,s])=>({word:i,frequency:s}))}function G(e,t=1){return{joy:`rgba(255, 215, 0, ${t})`,sadness:`rgba(100, 149, 237, ${t})`,anger:`rgba(255, 99, 71, ${t})`,fear:`rgba(147, 112, 219, ${t})`,surprise:`rgba(32, 178, 170, ${t})`}[e]||`rgba(52, 152, 219, ${t})`}function W(e){const t=Object.values(e).reduce((i,s)=>i+s,0),o=Object.entries(e).map(([i,s])=>({emotion:i,count:s,percentage:t>0?s/t*100:0}));se(o,"emotions-chart")}function N(e){const t=Object.values(e).reduce((i,s)=>i+s,0),o=Object.entries(e).map(([i,s])=>({topic:i,count:s,percentage:t>0?s/t*100:0}));ne(o,"topics-chart")}function $(){if(h.length<2)return;const e=h.map(t=>({time:t.time,wordsPerMinute:t.speed}));re(e,"speed-graph")}function re(e,t){const i=document.getElementById(t).getContext("2d"),s=getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim(),y=getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim(),m=getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim();window.speedChart&&window.speedChart.destroy();const I=e.map(C=>`${Math.round(C.time)}m`),T=e.map(C=>C.wordsPerMinute);window.speedChart=new Chart(i,{type:"line",data:{labels:I,datasets:[{label:"Words Per Minute",data:T,borderColor:s,backgroundColor:"rgba(0, 255, 157, 0.1)",borderWidth:2,pointRadius:4,pointBackgroundColor:s,tension:.4,fill:!0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{title:{display:!0,text:"Writing Speed Over Time",font:{size:16,color:y}},tooltip:{callbacks:{label:function(C){return`${C.parsed.y} words/min`}}},legend:{display:!1}},scales:{x:{title:{display:!0,text:"Time Elapsed (minutes)",font:{size:12,color:m}},grid:{display:!1}},y:{title:{display:!0,text:"Words Per Minute",font:{size:12,color:m}},beginAtZero:!0,suggestedMax:40,grid:{color:"rgba(255, 255, 255, 0.05)"}}},animation:{duration:1e3}}})}function se(e,t){const i=document.getElementById(t).getContext("2d"),s=getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim(),y=getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim();window.emotionsChart&&window.emotionsChart.destroy();const m=e.sort((p,k)=>k.percentage-p.percentage),I=m.map(p=>p.emotion),T=m.map(p=>p.percentage),C=m.map(p=>G(p.emotion,.7)),g=m.map(p=>G(p.emotion,1));window.emotionsChart=new Chart(i,{type:"bar",data:{labels:I,datasets:[{label:"Emotional Tone",data:T,backgroundColor:C,borderColor:g,borderWidth:1}]},options:{responsive:!0,maintainAspectRatio:!1,indexAxis:"y",plugins:{title:{display:!0,text:"Emotional Tone Analysis",font:{size:16,color:s}},tooltip:{callbacks:{label:function(p){return`${p.parsed.x}%`}}},legend:{display:!1}},scales:{x:{beginAtZero:!0,max:100,title:{display:!0,text:"Percentage (%)",font:{size:12,color:y}}},y:{grid:{display:!1}}},animation:{duration:500}}})}function ne(e,t){const i=document.getElementById(t).getContext("2d"),s=getComputedStyle(document.documentElement).getPropertyValue("--accent-color").trim(),y=getComputedStyle(document.documentElement).getPropertyValue("--accent-color-2").trim(),m=getComputedStyle(document.documentElement).getPropertyValue("--accent-color-3").trim(),I=getComputedStyle(document.documentElement).getPropertyValue("--accent-color-4").trim(),T=getComputedStyle(document.documentElement).getPropertyValue("--accent-color-5").trim(),C=getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim(),g=getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim();window.topicsChart&&window.topicsChart.destroy();const p=e.sort((S,we)=>we.percentage-S.percentage),k=p.map(S=>S.topic),b=p.map(S=>S.percentage);window.topicsChart=new Chart(i,{type:"doughnut",data:{labels:k,datasets:[{data:b,backgroundColor:[s,y,m,I,T],borderWidth:1}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{title:{display:!0,text:"Topic Distribution",font:{size:16,color:C}},tooltip:{callbacks:{label:function(S){return`${S.label}: ${S.parsed}%`}}},legend:{position:"right",labels:{boxWidth:12,padding:10,font:{size:11,color:g}}}},animation:{animateRotate:!0,animateScale:!0}}})}const ae=["the","and","that","have","for","not","with","you","this","but","his","from","they","she","her","will","what","all","would","there","their","when","who","make","can","like","time","just","him","know","take","into","year","your","good"];function ie(e,t){d3.select(t).html("");const o=e.toLowerCase().replace(/[^\w\s]/g,"").split(/\s+/).filter(g=>g.length>3&&!ae.includes(g)),i={};o.forEach(g=>{i[g]=(i[g]||0)+1});const s=Object.entries(i).map(([g,p])=>({text:g,size:p})).filter(g=>g.size>1).sort((g,p)=>p.size-g.size).slice(0,50),y=d3.scaleLog().domain([Math.min(...s.map(g=>g.size)),Math.max(...s.map(g=>g.size))]).range([10,60]),m=d3.select(t).node().getBoundingClientRect().width,I=300;d3.layout.cloud().size([m,I]).words(s).padding(5).rotate(()=>0).fontSize(g=>y(g.size)).spiral("archimedean").on("end",C).start();function C(g){const k=d3.select(t).append("svg").attr("width",m).attr("height",I).attr("class","word-cloud").append("g").attr("transform",`translate(${m/2},${I/2})`).selectAll("text").data(g).enter().append("text").style("font-size",b=>`${b.size}px`).style("fill",(b,S)=>d3.schemeCategory10[S%10]).attr("text-anchor","middle").attr("transform",b=>`translate(${b.x},${b.y})`).attr("class","word-cloud-word").style("opacity",0).text(b=>b.text);k.transition().duration(500).delay((b,S)=>S*20).style("opacity",1),k.append("title").text(b=>`${b.text}: ${b.size} occurrences`)}}function q(){const e=document.getElementById("keyword-cloud");if(e.innerHTML="",!a.value.trim()){e.innerHTML='<div class="keyword-tag">Start writing to see your most used words</div>';return}B(o=>{ie(o,e)},500)(a.value)}function ce(){E.classList.add("show"),le(),setTimeout(()=>{E.classList.remove("show")},5e3)}function le(){for(let e=0;e<50;e++){const t=document.createElement("div");t.className="confetti",t.style.left=`${Math.random()*100}%`,t.style.animationDelay=`${Math.random()*3}s`,E.appendChild(t)}}async function de(){if(x)try{const e={wordHistory:P,writingSpeedData:h,keywords:Array.from(z),emotions:window.emotionsChart?window.emotionsChart.data:null,topics:window.topicsChart?window.topicsChart.data:null};await v.saveWriting(a.value,e)}catch(e){console.error("Failed to save progress:",e),localStorage.setItem(`morning-pages-${x}`,JSON.stringify({text:a.value,wordCount:M(a.value),timestamp:Date.now(),wordHistory:P,writingSpeedData:h,keywords:Array.from(z)}))}}async function ue(){if(!x){console.log("No current user, skipping progress load");return}try{console.log("Loading progress for user:",x);const e=await v.getTodayWriting();if(e){console.log("Found today's writing, updating editor..."),a.value=e.text,P=e.wordHistory||[],h=e.writingSpeedData||[],z=new Set(e.keywords||[]);const t=e.wordCount||M(e.text);if(F(t),e.emotions&&W(e.emotions),e.topics&&N(e.topics),h.length>0){const o=h[h.length-1].speed;document.getElementById("avg-pace").textContent=`⚡ ${Math.round(o)} wpm`}e.text.trim()&&O(e.text)}else console.log("No writing found for today")}catch(e){console.error("Failed to load progress:",e);try{const t=localStorage.getItem(`morning-pages-${x}`);if(t){console.log("Found progress in localStorage, restoring...");const o=JSON.parse(t);a.value=o.text,P=o.wordHistory||[],h=o.writingSpeedData||[],z=new Set(o.keywords||[]),F(o.wordCount),O(o.text)}else console.log("No saved progress found in localStorage")}catch(t){throw console.error("Failed to load from localStorage:",t),new Error("Failed to load your saved data")}}}async function ge(){try{if(console.log("Starting to load user data..."),!x)throw console.error("No current user found"),new Error("No user logged in");console.log("Loading progress for user:",x),await ue(),console.log("Initializing UI elements..."),a.value.trim()&&(console.log("Analyzing existing text..."),O(a.value)),console.log("User data loaded successfully")}catch(e){throw console.error("Failed to load user data:",e),e}}const me=B(async function(e){if(x)try{const t={wordHistory:P,writingSpeedData:h,keywords:Array.from(z),emotions:window.emotionsChart?window.emotionsChart.data:null,topics:window.topicsChart?window.topicsChart.data:null};await v.saveWriting(e,t)}catch(t){console.error("Failed to autosave:",t),localStorage.setItem(`morning-pages-${x}`,JSON.stringify({text:e,wordCount:M(e),timestamp:Date.now(),wordHistory:P,writingSpeedData:h,keywords:Array.from(z)}))}},1e3);setInterval(de,3e4);function pe(e,t){let o;return function(){const i=arguments,s=this;o||(e.apply(s,i),o=!0,setTimeout(()=>o=!1,t))}}function B(e,t){let o;return function(...i){clearTimeout(o),o=setTimeout(()=>e.apply(this,i),t)}}class ye{constructor(){this.worker=null,this.isAnalyzing=!1,this.queue=[],this.initWorker(),this.emotionKeywords={happy:["happy","joy","excited","glad","pleased","delight","smile","laugh"],sad:["sad","unhappy","depressed","miserable","sorrow","cry","tears"],angry:["angry","mad","furious","rage","upset","annoyed","irritated"],anxious:["anxious","worry","nervous","stress","tense","afraid","fear"],calm:["calm","peaceful","relaxed","tranquil","serene","quiet"],grateful:["grateful","thankful","appreciate","thanks","blessed"]},this.topicKeywords={work:["work","job","office","project","boss","career","meeting"],family:["family","mom","dad","parent","child","son","daughter","wife","husband"],health:["health","exercise","workout","gym","diet","eat","food","sleep"],creative:["write","create","idea","design","art","music","book","story"],future:["future","plan","goal","dream","hope","wish"]}}initWorker(){window.Worker&&(this.worker=new Worker("text-analysis-worker.js"),this.worker.onmessage=t=>{const{emotions:o,topics:i}=t.data,s=this.queue.shift();s&&s(o,i),this.isAnalyzing=!1,this.processQueue()})}analyzeText(t,o){this.queue.push(o),this.isAnalyzing||this.processQueue()}processQueue(){this.queue.length===0||this.isAnalyzing||(this.isAnalyzing=!0,this.worker.postMessage({text,emotionKeywords:this.emotionKeywords,topicKeywords:this.topicKeywords}))}}const he=new ye;function M(e){const t=e.trim().match(/\S+/g);return t?t.length:0}a.addEventListener("input",function(){const e=this.value;F(),me(e),he.analyzeText(e,(t,o)=>{W(t),N(o),$(),q()})})});

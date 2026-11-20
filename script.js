const STORE = { users: "cf_users", items: "cf_items", claims: "cf_claims", session: "cf_session", resetLog: "cf_admin_reset_log" };
const CATEGORIES = ["Electronics","ID Cards","Books & Notes","Bags","Keys","Clothing","Accessories","Sports","Other"];
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
let currentItemId = null;

function read(key, fallback=[]) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function users(){ return read(STORE.users); }
function items(){ return read(STORE.items); }
function claims(){ return read(STORE.claims); }
function session(){ return read(STORE.session, null); }
function me(){ const s=session(); return s ? users().find(u=>u.id===s.id) || null : null; }
function id(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function toast(message, error=false){const el=$("#toast");el.textContent=message;el.classList.remove("hidden","error");if(error)el.classList.add("error");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),3200);}
function seed(){
  const existingUsers = users();
  if(!existingUsers.length){write(STORE.users,[{id:"admin-1",name:"Campus Admin",email:"aryantiwari1234r@gmail.com",phone:"",password:"@88582332",role:"admin"}]);}
  else {
    const oldAdmin = existingUsers.find(u=>u.role==="admin" && (u.email==="admin@campusfind.local" || u.id==="admin-1"));
    if(oldAdmin){oldAdmin.email="aryantiwari1234r@gmail.com";oldAdmin.password="@88582332";oldAdmin.role="admin";write(STORE.users,existingUsers);}
  }
  if(!items().length){
    const now=new Date().toISOString().slice(0,10);
    write(STORE.items,[
      {id:"sample-1",userId:"admin-1",type:"found",title:"Wireless earbuds case",description:"White earbuds case found near the central library. Please describe the brand and any identifying marks to claim it.",category:"Electronics",location:"Central Library",date:now,image:"",status:"open",created:Date.now()-100000},
      {id:"sample-2",userId:"admin-1",type:"lost",title:"Blue college backpack",description:"Navy blue backpack with a small keychain attached. Last seen near Block B classrooms.",category:"Bags",location:"Block B",date:now,image:"",status:"open",created:Date.now()-200000},
      {id:"sample-3",userId:"admin-1",type:"found",title:"Engineering mathematics notebook",description:"A ruled notebook with handwritten mathematics notes. Found after the afternoon lecture.",category:"Books & Notes",location:"Lecture Hall 2",date:now,image:"",status:"open",created:Date.now()-300000}
    ]);
  }
}
function setView(name){
  const target=name==="my-items"?"my-itemsView":name+"View";
  $$(".view").forEach(v=>v.classList.add("hidden"));
  const el=$("#"+target); if(el)el.classList.remove("hidden");
  const u=me();
  $$(".auth-link").forEach(x=>x.classList.toggle("hidden",!u));
  $$(".guest-link").forEach(x=>x.classList.toggle("hidden",!!u));
  $$(".admin-link").forEach(x=>x.classList.toggle("hidden",!u||u.role!=="admin"));
  $("#navUser").classList.toggle("hidden",!u); $("#navUser").textContent=u?`Hi, ${u.name.split(" ")[0]}`:"";
  $("#logoutBtn").classList.toggle("hidden",!u);
  $("#mainNav").classList.remove("open");
  if(name==="home")renderHome();
  if(name==="dashboard")renderDashboard();
  if(name==="my-items")renderMyItems();
  if(name==="admin")renderAdmin();
  if(name==="admin-users")renderAdminUsers();
  if(name==="profile")renderProfile();
  if(name==="admin-users" && (!u || u.role!=="admin")){toast("Administrator sign-in is required to open Account Control Center.",true);return setView("login");}
  if(name==="report"&&!u){toast("Please sign in to report an item.");name="login";setView(name);}
  window.scrollTo({top:0,behavior:"smooth"});
}
function statusText(s){return ({open:"Open",claimed:"Claim pending",resolved:"Returned",rejected:"Claim rejected",pending:"Pending",approved:"Approved"}[s]||s);}
function categoryOptions(){return CATEGORIES.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");}
function populateCategories(){
  $("#categoryFilter").insertAdjacentHTML("beforeend",categoryOptions());
  $("#reportCategory").innerHTML=categoryOptions();
  $("#reportDate").value=new Date().toISOString().slice(0,10);
}
function renderHome(){
  const all=items();$("#statReports").textContent=all.length;$("#statReturned").textContent=all.filter(i=>i.status==="resolved").length;$("#statUsers").textContent=users().length;
  const q=$("#searchInput").value.trim().toLowerCase(),type=$("#typeFilter").value,cat=$("#categoryFilter").value;
  const list=all.filter(i=>["open","claimed"].includes(i.status))
    .filter(i=>!type||i.type===type).filter(i=>!cat||i.category===cat)
    .filter(i=>!q||[i.title,i.description,i.location,i.category].join(" ").toLowerCase().includes(q))
    .sort((a,b)=>b.created-a.created);
  $("#itemsGrid").innerHTML=list.length?list.map(i=>`<article class="item-card" data-open-item="${i.id}"><div class="item-image">${i.image?`<img src="${i.image}" alt="${esc(i.title)}">`:`<span class="placeholder">${i.type==="lost"?"🧭":"🎁"}</span>`}<b class="type-pill ${i.type}">${i.type.toUpperCase()}</b></div><div class="item-content"><div class="item-meta">${esc(i.category)} · ${new Date(i.created).toLocaleDateString()}</div><h3>${esc(i.title)}</h3><p>${esc(i.description.slice(0,100))}${i.description.length>100?"…":""}</p><div class="card-bottom"><span>📍 ${esc(i.location)}</span><span>↗</span></div></div></article>`).join(""):`<div class="empty-state"><div>🕵️</div><h3>No matching listings yet</h3><p>Try a different search, or be the first to report an item.</p><button class="btn primary" data-action="report">Report an item</button></div>`;
}
function renderItem(idValue){
  const item=items().find(i=>i.id===idValue);if(!item){toast("Item not found.",true);setView("home");return;}
  currentItemId=item.id;const owner=me()&&me().id===item.userId;
  $("#itemDetail").innerHTML=`<div class="detail-layout"><div class="detail-image">${item.image?`<img src="${item.image}" alt="${esc(item.title)}">`:`<span class="placeholder">${item.type==="lost"?"🧭":"🎁"}</span>`}</div><div class="detail-content"><div class="item-meta">${esc(item.category)} · ${new Date(item.created).toLocaleDateString()}</div><span class="type-pill ${item.type}" style="position:static;display:inline-block;margin:15px 0">${item.type.toUpperCase()}</span><h1>${esc(item.title)}</h1><p class="detail-desc">${esc(item.description)}</p><div class="detail-facts"><div><small>LOCATION</small><b>📍 ${esc(item.location)}</b></div><div><small>DATE REPORTED</small><b>${esc(item.date)}</b></div><div><small>STATUS</small><b>${statusText(item.status)}</b></div><div><small>REPORTED BY</small><b>${esc(users().find(u=>u.id===item.userId)?.name||"Campus member")}</b></div></div>${owner?`<div class="notice">This is your listing. Manage it from My reports.</div>`:item.status==="open"?(me()?`<form id="claimForm" class="claim-form"><label>Think this is yours? Tell the reporter why.<textarea id="claimMessage" rows="3" required placeholder="I believe this is mine because…"></textarea></label><button class="btn primary">Submit ownership claim</button></form>`:`<button class="btn primary" data-view="login">Sign in to claim this item</button>`):`<div class="notice">This listing is not currently accepting new claims.</div>`}</div></div>`;
  setView("item"); // render detail view
}
function renderDashboard(){
  const u=me();if(!u)return setView("login");
  const mine=items().filter(i=>i.userId===u.id),myClaims=claims().filter(c=>c.claimantId===u.id),returned=mine.filter(i=>i.status==="resolved").length;
  $("#welcomeTitle").textContent=`Hello, ${u.name} 👋`;
  $("#dashboardMetrics").innerHTML=`<div class="metric-card"><span>My reports</span><strong>${mine.length}</strong><small>Items you have posted</small></div><div class="metric-card"><span>Claims submitted</span><strong>${myClaims.length}</strong><small>Ownership requests made</small></div><div class="metric-card"><span>Items returned</span><strong>${returned}</strong><small>Reports marked resolved</small></div><div class="metric-card"><span>Open listings</span><strong>${mine.filter(i=>i.status==="open"||i.status==="claimed").length}</strong><small>Still active</small></div>`;
  const incoming=claims().filter(c=>items().some(i=>i.id===c.itemId&&i.userId===u.id)).sort((a,b)=>b.created-a.created);
  $("#incomingClaims").innerHTML=incoming.length?incoming.map(c=>claimCard(c,true)).join(""):`<div class="notice">No incoming claims yet. When someone claims one of your listings, it will appear here.</div>`;
}
function claimCard(c,actions=false){
  const item=items().find(i=>i.id===c.itemId),claimant=users().find(u=>u.id===c.claimantId);
  return `<div class="claim-card"><div><b>${esc(item?.title||"Removed listing")}</b><p>${esc(c.message)}</p><small>${esc(claimant?.name||"Student")} · ${new Date(c.created).toLocaleString()}</small></div><div>${c.status==="pending"&&actions?`<button class="mini-btn approve" data-claim-action="approve" data-claim="${c.id}">Approve</button><button class="mini-btn reject" data-claim-action="reject" data-claim="${c.id}">Reject</button>`:`<span class="status ${c.status}">${statusText(c.status)}</span>`}</div></div>`;
}
function renderMyItems(){
  const u=me();if(!u)return setView("login");
  const mine=items().filter(i=>i.userId===u.id).sort((a,b)=>b.created-a.created);
  $("#myItemsList").innerHTML=`<table><thead><tr><th>ITEM</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${mine.length?mine.map(i=>`<tr><td><a href="#" class="table-link" data-open-item="${i.id}">${esc(i.title)}</a></td><td>${i.type}</td><td>${esc(i.location)}</td><td><span class="status ${i.status}">${statusText(i.status)}</span></td><td>${i.status!=="resolved"?`<button class="mini-btn" data-resolve="${i.id}">Mark returned</button>`:"—"} <button class="mini-btn reject" data-delete="${i.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="5" class="table-empty">You have not posted any reports yet.</td></tr>`}</tbody></table>`;
  const incoming=claims().filter(c=>mine.some(i=>i.id===c.itemId)).sort((a,b)=>b.created-a.created);
  $("#myClaimsList").innerHTML=incoming.length?incoming.map(c=>claimCard(c,true)).join(""):`<div class="notice">No claim requests to review.</div>`;
}
function renderAdmin(){
  if(!me()||me().role!=="admin"){toast("Admin access required.",true);return setView("home");}
  const all=items();$("#adminMetrics").innerHTML=`<div class="metric-card"><span>Total reports</span><strong>${all.length}</strong></div><div class="metric-card"><span>Active reports</span><strong>${all.filter(i=>["open","claimed"].includes(i.status)).length}</strong></div><div class="metric-card"><span>Community users</span><strong>${users().length}</strong></div><div class="metric-card"><span>Returned items</span><strong>${all.filter(i=>i.status==="resolved").length}</strong></div>`;
  $("#adminItems").innerHTML=`<table><thead><tr><th>ITEM</th><th>REPORTER</th><th>TYPE</th><th>CATEGORY</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>${all.length?all.sort((a,b)=>b.created-a.created).map(i=>`<tr><td><a class="table-link" href="#" data-open-item="${i.id}">${esc(i.title)}</a></td><td>${esc(users().find(u=>u.id===i.userId)?.name||"Unknown")}</td><td>${i.type}</td><td>${esc(i.category)}</td><td><span class="status ${i.status}">${statusText(i.status)}</span></td><td><button class="mini-btn reject" data-admin-delete="${i.id}">Delete</button></td></tr>`).join(""):`<tr><td colspan="6" class="table-empty">No reports.</td></tr>`}</tbody></table>`;
}
function renderAdminUsers(){
  const admin=me();if(!admin||admin.role!=="admin"){toast("Administrator sign-in is required.",true);return setView("login");}
  const list=users();const students=list.filter(u=>u.role!=="admin");
  $("#portalUserCount").textContent=list.length;
  const logs=read(STORE.resetLog,[]);$("#portalResetCount").textContent=logs.length;
  $("#adminTargetUser").innerHTML=students.length?students.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} · ${esc(u.email)}</option>`).join(""):`<option value="">No student accounts registered</option>`;
  $("#adminTargetUser").disabled=!students.length;
  $("#adminResetLog").innerHTML=logs.length?logs.slice(0,8).map(x=>`<div class="reset-log-row"><b>${esc(x.targetName)}</b><span>${esc(x.targetEmail)}</span><small>${new Date(x.created).toLocaleString()}</small></div>`).join(""):`<p class="muted">No password resets recorded yet.</p>`;
}
function filterAdminUsers(){
  if(!me()||me().role!=="admin")return;
  const q=$("#adminUserSearch").value.trim().toLowerCase();const students=users().filter(u=>u.role!=="admin"&&(!q||`${u.name} ${u.email}`.toLowerCase().includes(q)));
  $("#adminTargetUser").innerHTML=students.length?students.map(u=>`<option value="${esc(u.id)}">${esc(u.name)} · ${esc(u.email)}</option>`).join(""):`<option value="">No matching student account</option>`;
}
$("#adminUserSearch").addEventListener("input",filterAdminUsers);
$("#adminResetForm").addEventListener("submit",e=>{
  e.preventDefault();const admin=me();if(!admin||admin.role!=="admin"){toast("Admin permission denied.",true);setView("login");return;}
  const targetId=$("#adminTargetUser").value,pass=$("#adminNewPassword").value,confirmPass=$("#adminConfirmPassword").value;
  if(pass.length<8){toast("Use at least 8 characters.",true);return;}if(pass!==confirmPass){toast("Passwords do not match.",true);return;}
  const list=users(),target=list.find(u=>u.id===targetId&&u.role!=="admin");if(!target){toast("Select a valid student account.",true);return;}
  target.password=pass;write(STORE.users,list);
  const logs=read(STORE.resetLog,[]);logs.unshift({targetName:target.name,targetEmail:target.email,adminEmail:admin.email,created:Date.now()});write(STORE.resetLog,logs.slice(0,30));
  e.target.reset();renderAdminUsers();toast(`Password reset for ${target.name}.`);
});

function renderProfile(){const u=me();if(!u)return setView("login");$("#profileName").value=u.name;$("#profileEmail").value=u.email;$("#profilePhone").value=u.phone||"";}
async function fileAsDataUrl(file){
  if(!file)return "";
  const maxUploadSize=10*1024*1024;
  const maxStoredSize=450*1024;
  if(file.size>maxUploadSize)throw new Error("Please choose an image smaller than 10 MB.");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error("Only JPG, PNG and WEBP images are allowed.");
  const imageUrl=URL.createObjectURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Could not open this image. Please try another photo."));image.src=imageUrl;});
    let scale=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));
    for(let attempt=0;attempt<8;attempt++){
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const ctx=canvas.getContext("2d");
      if(!ctx)throw new Error("Image compression is not supported by this browser.");
      ctx.fillStyle="#ffffff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
      const quality=Math.max(.42,.78-attempt*.055);
      const dataUrl=canvas.toDataURL("image/jpeg",quality);
      const approxBytes=Math.ceil((dataUrl.length-"data:image/jpeg;base64,".length)*.75);
      if(approxBytes<=maxStoredSize)return dataUrl;
      scale*=.82;
    }
    throw new Error("This image could not be compressed enough. Please choose a smaller photo.");
  }finally{URL.revokeObjectURL(imageUrl);}
}
function submitClaim(itemId,message){
  const u=me();if(!u){setView("login");return;}
  if(claims().some(c=>c.itemId===itemId&&c.claimantId===u.id)){toast("You have already submitted a claim for this item.",true);return;}
  const list=claims();list.push({id:id(),itemId,claimantId:u.id,message,status:"pending",created:Date.now()});write(STORE.claims,list);
  const its=items();const it=its.find(i=>i.id===itemId);if(it)it.status="claimed";write(STORE.items,its);toast("Your ownership claim has been submitted.");renderItem(itemId);
}
function claimAction(claimId,action){
  const cs=claims(),c=cs.find(x=>x.id===claimId),it=items().find(i=>i.id===c?.itemId);
  if(!c||!it||it.userId!==me()?.id){toast("You cannot manage this claim.",true);return;}
  if(action==="approve"){c.status="approved";it.status="resolved";cs.filter(x=>x.itemId===it.id&&x.id!==c.id&&x.status==="pending").forEach(x=>x.status="rejected");}
  else {c.status="rejected";if(it.status==="claimed")it.status="open";}
  write(STORE.claims,cs);write(STORE.items,items());toast(action==="approve"?"Claim approved. Item marked returned.":"Claim rejected.");renderMyItems();
}
document.addEventListener("click",e=>{
  const view=e.target.closest("[data-view]");if(view){e.preventDefault();setView(view.dataset.view);return;}
  const action=e.target.closest("[data-action]");if(action){if(action.dataset.action==="report")setView("report");return;}
  const open=e.target.closest("[data-open-item]");if(open){e.preventDefault();renderItem(open.dataset.openItem);return;}
  const ca=e.target.closest("[data-claim-action]");if(ca){claimAction(ca.dataset.claim,ca.dataset.claimAction);return;}
  const resolve=e.target.closest("[data-resolve]");if(resolve){const its=items(),it=its.find(i=>i.id===resolve.dataset.resolve);if(it&&it.userId===me()?.id){it.status="resolved";write(STORE.items,its);toast("Item marked as returned.");renderMyItems();}return;}
  const del=e.target.closest("[data-delete],[data-admin-delete]");if(del){if(!confirm("Delete this report?"))return;const itemId=del.dataset.delete||del.dataset.adminDelete;write(STORE.items,items().filter(i=>i.id!==itemId));write(STORE.claims,claims().filter(c=>c.itemId!==itemId));toast("Report deleted.");me()?.role==="admin"?renderAdmin():renderMyItems();return;}
});
$("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
$("#logoutBtn").addEventListener("click",e=>{e.preventDefault();localStorage.removeItem(STORE.session);toast("Signed out.");setView("home");});
$("#filterForm").addEventListener("submit",e=>{e.preventDefault();renderHome();});
$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();const email=$("#loginEmail").value.trim().toLowerCase(),pass=$("#loginPassword").value;
  const u=users().find(x=>x.email.toLowerCase()===email&&x.password===pass);
  if(!u){toast("Incorrect email or password.",true);return;}
  write(STORE.session,{id:u.id});toast("Welcome back, "+u.name+"!");setView("dashboard");
});
$("#registerForm").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#regName").value.trim(),email=$("#regEmail").value.trim().toLowerCase(),phone=$("#regPhone").value.trim(),password=$("#regPassword").value;
  if(users().some(u=>u.email.toLowerCase()===email)){toast("This email is already registered.",true);return;}
  if(password.length<6){toast("Password must be at least 6 characters.",true);return;}
  const u={id:id(),name,email,phone,password,role:"student"};write(STORE.users,[...users(),u]);write(STORE.session,{id:u.id});toast("Account created successfully.");setView("dashboard");
});
$("#reportForm").addEventListener("submit",async e=>{
  e.preventDefault();const u=me();if(!u){setView("login");return;}
  try{const image=await fileAsDataUrl($("#reportImage").files[0]);const item={id:id(),userId:u.id,type:$("#reportType").value,title:$("#reportTitle").value.trim(),description:$("#reportDescription").value.trim(),category:$("#reportCategory").value,location:$("#reportLocation").value.trim(),date:$("#reportDate").value,image,status:"open",created:Date.now()};write(STORE.items,[item,...items()]);e.target.reset();$("#reportDate").value=new Date().toISOString().slice(0,10);toast("Your report has been published.");setView("my-items");}catch(err){toast(err.message,true);}
});
$("#profileForm").addEventListener("submit",e=>{e.preventDefault();const u=me();const list=users();const actual=list.find(x=>x.id===u.id);actual.name=$("#profileName").value.trim();actual.phone=$("#profilePhone").value.trim();write(STORE.users,list);toast("Profile updated.");setView("dashboard");});
$("#claimForm")?.addEventListener("submit",e=>e.preventDefault());
document.addEventListener("submit",e=>{if(e.target.id==="claimForm"){e.preventDefault();const msg=$("#claimMessage").value.trim();if(msg)submitClaim(currentItemId,msg);}});
seed();populateCategories();setView("home");

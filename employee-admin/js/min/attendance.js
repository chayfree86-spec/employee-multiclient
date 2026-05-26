const AttendanceManager={currentDate:null,saveDebounceMs:450,_saveTimer:null,_pendingSaveSnapshot:null,currentStaff:[],currentAttendanceData:{},currentAofRows:[],_lastChangedAttendance:null,normalizeStatus:t=>t?t==="half_day"||t==="halfday"?"halfday":t==="weekend"||t==="holiday"?"holiday":t:"",isWeeklyOffDate:t=>!1,getDisplayAttendanceData:(t,e)=>{const a={...e||{}};return Object.keys(a).length===0&&AttendanceManager.isWeeklyOffDate(AttendanceManager.currentDate)&&t.filter(n=>n.status==="active").forEach(n=>{a[n.id]="holiday"}),a},getLatestSavedDate:()=>null,formatDateLocal:t=>{const e=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),n=String(t.getDate()).padStart(2,"0");return`${e}-${a}-${n}`},parseLocalDate:t=>{if(!t)return null;const[e,a,n]=String(t).split("-").map(Number);return!e||!a||!n?null:new Date(e,a-1,n)},isSameLocalDate:(t,e)=>!t||!e?!1:AttendanceManager.formatDateLocal(t)===AttendanceManager.formatDateLocal(e),updateDateSelectionState:t=>{const e=document.querySelector(".date-selection-box");if(!e||!t)return;const a=new Date;e.classList.toggle("has-selected-date",!!t),e.classList.toggle("is-today",AttendanceManager.isSameLocalDate(t,a))},decorateCalendarDay:(t,e,a)=>{const n=new Date;AttendanceManager.isSameLocalDate(e,n)&&t.classList.add("attendance-today")},changeDateByDays:t=>{const e=new Date(`${AttendanceManager.currentDate}T00:00:00`);e.setDate(e.getDate()+t);const a=new Date;if(a.setHours(0,0,0,0),e>a)return;AttendanceManager.currentDate=AttendanceManager.formatDateLocal(e);const n=document.getElementById("attendance-date")?._flatpickr;if(n){n.setDate(AttendanceManager.currentDate,!0);return}AttendanceManager.loadAttendanceList(),AttendanceManager.updateWeekdayDisplay(e)},hasAdvanceInCurrentViewMonth:t=>{const e=new Date(`${AttendanceManager.currentDate}T00:00:00`),a=e.getMonth(),n=e.getFullYear();return(AttendanceManager.currentAofRows||[]).some(r=>{if(String(r.employee_id)!==String(t)||r.type!=="advance"||(Number(r.amount)||0)<=0||!r.date)return!1;const l=new Date(`${r.date}T00:00:00`);return l.getMonth()===a&&l.getFullYear()===n})},hasDeductionInCurrentViewMonth:t=>{const e=new Date(`${AttendanceManager.currentDate}T00:00:00`),a=e.getMonth(),n=e.getFullYear();return(AttendanceManager.currentAofRows||[]).some(r=>{if(String(r.employee_id)!==String(t)||r.type!=="fine"||(Number(r.amount)||0)<=0||!r.date)return!1;const l=new Date(`${r.date}T00:00:00`);return l.getMonth()===a&&l.getFullYear()===n})},rowsToDayData:t=>{const e={};return(t||[]).forEach(a=>{e[String(a.employee_id)]=ApiSyncManager.statusFromApi(a.status)}),e},getMonthlyStatusCounts:t=>{const e={};return(t||[]).forEach(a=>{const n=String(a.employee_id||"");if(!n)return;const r=AttendanceManager.normalizeStatus(ApiSyncManager.statusFromApi(a.status));r&&(e[n]||(e[n]={present:0,absent:0,halfday:0,holiday:0}),r==="present"?e[n].present++:r==="absent"?e[n].absent++:r==="halfday"?e[n].halfday++:r==="holiday"&&e[n].holiday++)}),e},getStatusLabel:(t,e)=>e>0?`${t} <span class="attendance-status-count">[ ${e} ]</span>`:t,formatSalaryAmountWithHold:(t,e=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(t,e):`\u20B9${Number(t||0).toLocaleString()}`,renderAttendance:t=>{t.innerHTML=`
            <div class="card">
                <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
                    <h3>Daily Attendance</h3>
                    <div class="date-selection-box" style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                        <button type="button" class="date-nav-btn" aria-label="Previous date" onclick="AttendanceManager.changeDateByDays(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="input-wrapper" style="min-width: 250px;">
                            <i class="fas fa-calendar-day" style="left: 1rem; color: var(--primary);"></i>
                            <input type="text" id="attendance-date" class="date-input" value="${AttendanceManager.currentDate}" 
                                style="width: 100%; padding: 0.8rem 1rem 0.8rem 3rem; border: 1px solid var(--border); border-radius: 12px; font-weight: 700; font-family: var(--app-font); cursor: pointer; background: var(--bg-main);">
                        </div>
                        <button type="button" class="date-nav-btn" aria-label="Next date" onclick="AttendanceManager.changeDateByDays(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <div id="weekday-display" style="font-weight: 700; color: var(--text-muted); background: var(--bg-main); padding: 0.8rem 1.2rem; border-radius: 12px; font-size: 0.9rem; letter-spacing: 0.5px; border: 1px solid var(--border); display: flex; align-items: center; gap: 8px;">
                            <i class="far fa-clock"></i>
                            <span id="weekday-text"></span>
                        </div>
                    </div>
                    <div class="attendance-actions" style="display:flex; gap:1rem; width:100%;">
                        <button id="btn-mark-present" class="btn-primary" onclick="AttendanceManager.markAll('present')" style="background:#e8f8f4; color:#006b55; border:1px solid #80d8c7; display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-check-double"></i> Mark All Present
                        </button>
                        <button id="btn-mark-holiday" class="btn-primary" onclick="AttendanceManager.markAll('holiday')" style="background:#e8f4fb; color:#075985; border:1px solid #93c5fd; display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-mug-hot"></i> Mark All Weekly Off
                        </button>
                        <button id="btn-mark-absent" class="btn-primary" onclick="AttendanceManager.markAll('absent')" style="background:#fff0f0; color:#a11218; border:1px solid #f2a2a4; display:flex; align-items:center; justify-content:center; gap:8px; padding: 0.6rem 1.2rem; font-weight: 700; transition: all 0.3s ease;">
                            <i class="fas fa-user-times"></i> Mark All Absent
                        </button>
                    </div>
                </div>
                <div class="attendance-stats-header" id="attendance-stats-row">
                    <!-- Stats will be injected here -->
                </div>

                <div id="attendance-empty-note" style="display:none; margin:0 0 1rem; padding:0.9rem 1rem; border:1px solid rgba(245, 158, 11, 0.25); background:rgba(245, 158, 11, 0.08); color:#9a6700; border-radius:14px; font-weight:600;"></div>
                <div class="table-responsive">
                    <table id="attendance-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody id="attendance-list">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        `,AttendanceManager.initDatePicker(),AttendanceManager.loadAttendanceList(),AttendanceManager.updateStats()},initDatePicker:()=>{const t=document.getElementById("attendance-date");if(!t)return;const e=AttendanceManager.parseLocalDate(AttendanceManager.currentDate)||new Date;AttendanceManager.updateWeekdayDisplay(e),AttendanceManager.updateDateSelectionState(e),t.addEventListener("change",()=>{if(!t.value)return;AttendanceManager.currentDate=t.value;const a=AttendanceManager.parseLocalDate(t.value);AttendanceManager.loadAttendanceList(),AttendanceManager.updateWeekdayDisplay(a),AttendanceManager.updateDateSelectionState(a)}),window.setTimeout(async()=>{await AttendanceManager.ensureFlatpickr(),!(typeof flatpickr!="function"||!document.getElementById("attendance-date")||t._flatpickr)&&flatpickr("#attendance-date",{defaultDate:AttendanceManager.currentDate,maxDate:"today",dateFormat:"Y-m-d",altInput:!0,altFormat:"d M, D",monthSelectorType:"static",disableMobile:!0,onDayCreate:(a,n,r,l)=>{AttendanceManager.decorateCalendarDay(l,l.dateObj,r)},onChange:(a,n)=>{AttendanceManager.currentDate=n,AttendanceManager.loadAttendanceList(),AttendanceManager.updateWeekdayDisplay(a[0]),AttendanceManager.updateDateSelectionState(a[0])},onMonthChange:(a,n,r)=>{r.redraw()},onYearChange:(a,n,r)=>{r.redraw()},onReady:(a,n,r)=>{r.calendarContainer.classList.add("attendance-calendar","app-date-calendar"),AttendanceManager.updateWeekdayDisplay(a[0]),AttendanceManager.updateDateSelectionState(a[0])}})},4e3)},ensureFlatpickr:()=>{if(typeof flatpickr=="function")return Promise.resolve();if(AttendanceManager._flatpickrPromise)return AttendanceManager._flatpickrPromise;const t="assets/lib/flatpickr/flatpickr.min.css?v=20260525-1";if(!document.querySelector(`link[href="${t}"]`)){const e=document.createElement("link");e.rel="stylesheet",e.href=t,document.head.appendChild(e)}return AttendanceManager._flatpickrPromise=new Promise(e=>{const a=document.createElement("script");a.src="assets/lib/flatpickr/flatpickr.min.js?v=20260525-1",a.async=!0,a.onload=()=>e(),a.onerror=()=>e(),document.body.appendChild(a)}),AttendanceManager._flatpickrPromise},loadAttendanceList:async()=>{const t=document.getElementById("attendance-list");if(!t)return;t.innerHTML='<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend attendance data...</td></tr>';let e=[],a={},n={};try{const s=new Date(`${AttendanceManager.currentDate}T00:00:00`),[o,u,c,d]=await Promise.all([ApiClient.listEmployees(),ApiClient.getAttendanceByDate(AttendanceManager.currentDate),ApiClient.listAof(),ApiClient.getAttendanceMonth(s.getMonth()+1,s.getFullYear())]);e=(o||[]).map(f=>ApiSyncManager.normalizeEmployee(f)),a=AttendanceManager.rowsToDayData(u||[]),n=AttendanceManager.getMonthlyStatusCounts(d?.list||[]),AttendanceManager.currentStaff=e,AttendanceManager.currentAttendanceData=a,AttendanceManager.currentAofRows=c||[]}catch(s){console.error("Failed to load attendance from backend",s),AttendanceManager.currentStaff=[],AttendanceManager.currentAttendanceData={},AttendanceManager.currentAofRows=[],t.innerHTML='<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--danger); font-weight:700;">Backend attendance data unavailable</td></tr>',AttendanceManager.updateStats(),AttendanceManager.updateEmptyStateNote(0,!0);return}const r=AttendanceManager.getDisplayAttendanceData(e,a);if(e.length===0){t.innerHTML='<tr><td colspan="3" style="text-align:center">No staff found. Add staff first.</td></tr>';return}t.innerHTML=e.filter(s=>s.status==="active").map(s=>{const o=AttendanceManager.normalizeStatus(r[s.id]||""),u=AttendanceManager.hasAdvanceInCurrentViewMonth(s.id),c=AttendanceManager.hasDeductionInCurrentViewMonth(s.id),d=n[String(s.id)]||{},f=Number(s.salaryAmount||0),i=new Date(`${AttendanceManager.currentDate}T00:00:00`),p=window.PayrollSettings.getDaysDivisor(i.getMonth()+1,i.getFullYear()),y=p>0?Math.round(f/p):0;return`
                <tr class="attendance-row">
                    <td onclick="switchView('staff-profile', '${s.id}')" style="cursor:pointer; font-weight:600; color:var(--primary);">
                        <div style="display:flex; align-items:center; gap:10px;" class="staff-link">
                            <img src="${s.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(s.name),"random","fff",30)}" alt="${s.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(s.name)}', 'random', 'fff', 30)}" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                            <div>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span>${s.name}</span>
                                    ${u?'<i class="fas fa-star" style="color:#FFD700; font-size:0.8rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);" title="Advance pending"></i>':""}
                                    ${c?'<i class="fas fa-star" style="color:#0984e3; font-size:0.8rem; text-shadow: 0 0 5px rgba(9,132,227,0.45);" title="Payment deduction applied"></i>':""}
                                </div>
                                <div class="attendance-salary-meta">Basic Salary: ${AttendanceManager.formatSalaryAmountWithHold(f,s)} / \u20B9${y.toLocaleString()}</div>
                            </div>
                        </div>
                    </td>
                    <td onclick="switchView('staff-profile', '${s.id}')" style="cursor:pointer; color:var(--text-muted);">${s.role}</td>
                    <td>
                        <div class="attendance-toggle">
                            <label class="toggle-btn ${o==="present"?"active":""}" title="Present" style="--active-bg: var(--success);">
                                <input type="radio" name="att-${s.id}" value="present" 
                                    ${o==="present"?"checked":""} 
                                    data-checked="${o==="present"}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel("P",Number(d.present||0))}
                            </label>
                            <label class="toggle-btn ${o==="absent"?"active":""}" title="Absent" style="--active-bg: var(--danger);">
                                <input type="radio" name="att-${s.id}" value="absent" 
                                    ${o==="absent"?"checked":""} 
                                    data-checked="${o==="absent"}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel("A",Number(d.absent||0))}
                            </label>
                            <label class="toggle-btn ${o==="halfday"?"active":""}" title="Half Day" style="--active-bg: #FF9F43;">
                                <input type="radio" name="att-${s.id}" value="halfday" 
                                    ${o==="halfday"?"checked":""} 
                                    data-checked="${o==="halfday"}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel("H",Number(d.halfday||0))}
                            </label>
                            <label class="toggle-btn ${o==="holiday"?"active":""}" title="Holiday" style="--active-bg: #0ABDE3;">
                                <input type="radio" name="att-${s.id}" value="holiday" 
                                    ${o==="holiday"?"checked":""} 
                                    data-checked="${o==="holiday"}"
                                    onclick="AttendanceManager.toggleStatus(this)">
                                ${AttendanceManager.getStatusLabel("Off",Number(d.holiday||0))}
                            </label>
                        </div>
                    </td>
                </tr>
            `}).join(""),t.querySelectorAll(".attendance-toggle").forEach(s=>{const o=s.querySelector("input:checked");o&&(s.querySelectorAll(".toggle-btn").forEach(u=>u.classList.remove("active")),o.parentElement.classList.add("active"))});const l=Object.keys(a).length;AttendanceManager.updateEmptyStateNote(l),AttendanceManager.updateStats()},updateEmptyStateNote:(t,e=!1)=>{const a=document.getElementById("attendance-empty-note");if(!a)return;if(e){a.style.display="block",a.textContent="Backend attendance data unavailable. Cached fallback data is not shown.";return}if(t>0){a.style.display="none",a.innerHTML="";return}const n=AttendanceManager.getLatestSavedDate(),r=AttendanceManager.currentDate;if(AttendanceManager.isWeeklyOffDate(r)){a.style.display="block",a.textContent=`Tuesday weekly off is applied by default for ${r}.`;return}if(n&&n!==r){a.style.display="block",a.innerHTML=`No attendance saved for <strong>${r}</strong>. Latest saved date is <strong>${n}</strong>.
                <button type="button" onclick="AttendanceManager.loadLatestSavedDate()" style="margin-left:10px; padding:6px 10px; border:none; border-radius:10px; background:#9a6700; color:white; font-weight:700; cursor:pointer;">Load Latest Saved Date</button>`;return}a.style.display="block",a.textContent=`No attendance saved for ${r}.`},loadLatestSavedDate:()=>{const t=AttendanceManager.getLatestSavedDate();if(!t)return;AttendanceManager.currentDate=t;const e=document.getElementById("attendance-date");e?e._flatpickr?.setDate(t,!0):AttendanceManager.loadAttendanceList()},updateHighlight:t=>{t.closest(".attendance-toggle").querySelectorAll(".toggle-btn").forEach(n=>n.classList.remove("active")),t.parentElement.classList.add("active"),document.getElementsByName(t.name).forEach(n=>n.dataset.checked=(n===t).toString()),AttendanceManager._lastChangedAttendance={staffId:String(t.name||"").replace(/^att-/,""),status:t.value},AttendanceManager.persistDraftFromDom()},toggleStatus:t=>{t.dataset.checked==="true"?(AttendanceManager._lastChangedAttendance={staffId:String(t.name||"").replace(/^att-/,""),status:""},t.checked=!1,t.dataset.checked="false",t.parentElement.classList.remove("active"),document.getElementsByName(t.name).forEach(n=>n.dataset.checked="false"),AttendanceManager.persistDraftFromDom()):AttendanceManager.updateHighlight(t)},markAll:async t=>{let e=AttendanceManager.currentStaff||[];if(e.length===0)try{e=(await ApiClient.listEmployees()||[]).map(i=>ApiSyncManager.normalizeEmployee(i)),AttendanceManager.currentStaff=e||[]}catch(i){window.showAlert(`Unable to load staff from backend: ${i.message}`);return}const a=e.filter(i=>i.status==="active");if(a.length===0)return;AttendanceManager._lastChangedAttendance={staffId:"",status:t,bulkCount:a.length};let n="var(--success)",r="Present",l="fa-check-double";t==="absent"?(n="var(--danger)",r="Absent",l="fa-user-times"):t==="holiday"&&(n="#0ABDE3",r="Weekly Off",l="fa-mug-hot");const s=`
            <div id="premium-sync-container" style="text-align:center; padding: 2rem 1rem; position:relative; min-width:350px;">
                <div style="position:relative; z-index:1001;">
                    <div style="position:relative; width:220px; height:220px; margin:0 auto 2.5rem; display:flex; align-items:center; justify-content:center;">
                        <div style="position:absolute; width:240px; height:240px; border:1px dashed ${n}; border-radius:50%; opacity:0.1; animation: spin-slow 20s linear infinite;"></div>
                        <div style="position:absolute; width:260px; height:260px; border:1px solid ${n}; border-radius:50%; opacity:0.03; animation: pulse-ring 3s ease-out infinite;"></div>
                        
                        <svg viewBox="0 0 100 100" style="position:absolute; width:100%; height:100%; transform: rotate(-90deg);">
                            <circle cx="50" cy="50" r="45" stroke="var(--border)" stroke-width="5" fill="none" opacity="0.3" />
                            <circle id="sync-ring" cx="50" cy="50" r="45" stroke="${n}" stroke-width="6" fill="none" 
                                stroke-dasharray="283" stroke-dashoffset="283" 
                                style="transition: stroke-dashoffset 0.3s ease-out; stroke-linecap: round;" />
                        </svg>

                        <div style="text-align:center; z-index:2;">
                            <div id="sync-counter" style="font-size:5rem; font-weight:700; color:var(--primary); line-height:1; font-family:var(--app-font);">0</div>
                            <div style="font-size:0.85rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:3px; margin-top:5px;">Process</div>
                        </div>
                    </div>

                    <div style="height:80px; margin-bottom:1.5rem; display:flex; align-items:center; justify-content:center; perspective: 1000px;">
                        <div id="syncing-name" style="font-size:2.2rem; font-weight:700; color:var(--primary); font-family:var(--app-font); opacity:0; transform:translateY(20px) rotateX(-20deg); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">Initializing...</div>
                    </div>

                    <div style="display:inline-flex; align-items:center; gap:15px; background:var(--bg-main); padding:1.25rem 3.5rem; border-radius:100px; border:1px solid var(--border); box-shadow:0 15px 45px rgba(0,0,0,0.08);">
                        <i class="fas ${l}" style="color:${n}; font-size:1.5rem;"></i>
                        <span style="font-weight:700; color:var(--text-main); font-size:1.2rem;">Marking <b>${r}</b></span>
                    </div>
                </div>

                <style>
                    @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes pulse-ring { 0% { transform: scale(0.9); opacity: 0.1; } 100% { transform: scale(1.1); opacity: 0; } }
                    .name-active { opacity: 1 !important; transform: translateY(0) rotateX(0deg) !important; }
                    #modal-container { z-index: 10000 !important; }
                </style>
            </div>
        `;window.ModalManager&&window.ModalManager.show("Bulk Attendance Sync",s);const o=document.getElementById("sync-ring"),u=document.getElementById("sync-counter"),c=document.getElementById("syncing-name"),d=283,f=a.length;for(let i=0;i<f;i++){const p=a[i];u.textContent=i+1,o.style.strokeDashoffset=d-(i+1)/f*d,c&&(c.classList.remove("name-active"),await new Promise(m=>setTimeout(m,80)),c.textContent=p.name,c.classList.add("name-active"));const y=document.querySelector(`input[name="att-${p.id}"][value="${t}"]`);if(y){y.checked=!0,y.dataset.checked="true";const m=y.closest(".attendance-toggle");m&&(m.querySelectorAll(".toggle-btn").forEach(g=>g.classList.remove("active")),y.parentElement.classList.add("active")),document.getElementsByName(y.name).forEach(g=>{g!==y&&(g.dataset.checked="false")})}AttendanceManager.updateStats(),await new Promise(m=>setTimeout(m,220))}c&&(c.innerHTML='<span style="color:var(--success)"><i class="fas fa-check-circle"></i> Sync Successful</span>'),setTimeout(()=>{window.ModalManager?.hide(),AttendanceManager.persistDraftFromDom(!0)},1500)},collectDayDataFromDom:()=>{const t={};return document.querySelectorAll('#attendance-list input[type="radio"]:checked').forEach(e=>{const a=String(e.name||"").replace(/^att-/,"");a&&(t[a]=e.value)}),t},persistDraftFromDom:(t=!1)=>{const e=AttendanceManager.collectDayDataFromDom();ApiSyncManager.primeAttendanceDay(AttendanceManager.currentDate,e),window.SyncStatus?.show("Attendance changes pending","info");const a=Object.keys(e).length;if(AttendanceManager.updateEmptyStateNote(a),AttendanceManager.updateStats(),AttendanceManager._saveTimer&&(clearTimeout(AttendanceManager._saveTimer),AttendanceManager._saveTimer=null),AttendanceManager._pendingSaveSnapshot={date:AttendanceManager.currentDate,dayData:e},t){AttendanceManager.flushPendingSave();return}AttendanceManager._saveTimer=setTimeout(()=>{AttendanceManager.flushPendingSave()},AttendanceManager.saveDebounceMs)},flushPendingSave:async()=>{AttendanceManager._saveTimer&&(clearTimeout(AttendanceManager._saveTimer),AttendanceManager._saveTimer=null);const t=AttendanceManager._pendingSaveSnapshot;if(!t)return;AttendanceManager._pendingSaveSnapshot=null;const n=(AttendanceManager.currentStaff||[]).filter(r=>r.status==="active").map(r=>{const l=t.dayData[r.id];return l?{employee_id:Number(r.id),date:t.date,status:ApiSyncManager.statusToApi(l)}:null}).filter(Boolean);try{window.SyncStatus?.show("Saving attendance...","saving"),n.length>0&&await ApiClient.saveAttendanceBulk(n)}catch(r){window.SyncStatus?.show("Attendance sync failed","error",2800),window.showAlert(`Attendance sync failed: ${r.message}`);return}if(t.date===AttendanceManager.currentDate){AttendanceManager.currentAttendanceData={...t.dayData};const r={present:0,absent:0,halfday:0,holiday:0};Object.values(t.dayData||{}).forEach(i=>{const p=AttendanceManager.normalizeStatus(i);p&&Object.prototype.hasOwnProperty.call(r,p)&&r[p]++});const l={present:"P",absent:"A",halfday:"H",holiday:"Off"},s={present:"success",absent:"error",halfday:"warning",holiday:"info"},o={present:"Present Saved",absent:"Absent Saved",halfday:"Half Day Saved",holiday:"Off Saved"},u=AttendanceManager._lastChangedAttendance||{},c=AttendanceManager.normalizeStatus(u.status||""),d=(AttendanceManager.currentStaff||[]).find(i=>String(i.id)===String(u.staffId)),f=d?`${l[c]||"Not Marked"} saved for ${t.date}`:u.bulkCount?`${u.bulkCount} staff marked ${l[c]||""} for ${t.date}`:`Attendance saved for ${t.date}`;window.SyncStatus?.show(`Attendance saved for ${t.date}`,"success",1600),window.showAlert(f,{title:o[c]||"Attendance Saved",type:s[c]||"success",highlight:d?d.name:"",autoCloseMs:3600,stats:[{label:"P",value:r.present,type:"success"},{label:"A",value:r.absent,type:"error"},{label:"H",value:r.halfday,type:"warning"},{label:"Off",value:r.holiday,type:"info"}]})}},updateStats:()=>{const t=AttendanceManager.currentStaff||[],e=t.filter(y=>y.status==="active"),a=AttendanceManager.collectDayDataFromDom(),n=Object.keys(a).length?a:AttendanceManager.currentAttendanceData||{},r=AttendanceManager.getDisplayAttendanceData(t,n),l=document.getElementById("attendance-stats-row");if(!l)return;let s=0,o=0,u=0,c=0;e.forEach(y=>{const m=AttendanceManager.normalizeStatus(r[y.id]||"");m==="present"?s++:m==="absent"?o++:m==="halfday"?u++:m==="holiday"&&c++}),l.innerHTML=`
            <div class="attendance-stat-pill stat-present" title="Present">
                <i class="fas fa-check"></i><strong>${s}</strong>
            </div>
            <div class="attendance-stat-pill stat-absent" title="Absent">
                <i class="fas fa-xmark"></i><strong>${o}</strong>
            </div>
            <div class="attendance-stat-pill stat-halfday" title="Half Day">
                <i class="fas fa-adjust"></i><strong>${u}</strong>
            </div>
            <div class="attendance-stat-pill stat-off" title="Off">
                <i class="fas fa-mug-hot"></i><strong>${c}</strong>
            </div>
        `;const d=document.getElementById("btn-mark-present"),f=document.getElementById("btn-mark-holiday"),i=document.getElementById("btn-mark-absent"),p=e.length;p>0&&d&&f&&i&&(s===p?(d.style.background="var(--success)",d.style.color="white"):(d.style.background="rgba(0, 184, 148, 0.1)",d.style.color="var(--success)"),c===p?(f.style.background="var(--info)",f.style.color="white"):(f.style.background="rgba(10, 189, 227, 0.1)",f.style.color="var(--info)"),o===p?(i.style.background="var(--danger)",i.style.color="white"):(i.style.background="rgba(214, 48, 49, 0.1)",i.style.color="var(--danger)"))},updateWeekdayDisplay:t=>{const e=document.getElementById("weekday-text");if(e&&t){const a={weekday:"long"};e.textContent=t.toLocaleDateString("en-US",a).toUpperCase()}AttendanceManager.updateDateSelectionState(t)}};AttendanceManager.currentDate=AttendanceManager.formatDateLocal(new Date),window.AttendanceManager=AttendanceManager;

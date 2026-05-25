const StaffManager={_renderToken:0,_isSavingStaff:!1,currentStaffList:[],currentAofRows:[],initDatePicker:(t,e={})=>{if(typeof flatpickr!="function")return null;const n=e.onReady,a={dateFormat:"Y-m-d",monthSelectorType:"static",disableMobile:!0,...e,onReady:(i,r,o)=>{o.calendarContainer.classList.add("attendance-calendar","app-date-calendar"),typeof n=="function"&&n(i,r,o)}};return flatpickr(t,a)},formatSalaryAmountWithHold:(t,e=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(t,e):`&#8377;${Number(t||0).toLocaleString()}`,getPositiveAmount:(t,e="Amount")=>{const n=parseFloat(document.getElementById(t)?.value);return!Number.isFinite(n)||n<=0?(window.showAlert(`${e} 0 se bada hona chahiye`),null):n},getLoanAndSavingState:t=>{const e=StorageManager.get("advances")||{},n=StorageManager.get("savings")||{},a=StorageManager.get("transfers")||{},i=e[t]||[],r=n[t]||[],o=a[t]||[],s=i.filter(f=>f.type==="paid").reduce((f,h)=>f+(Number(h.amount)||0),0),c=i.filter(f=>f.type==="received").reduce((f,h)=>f+(Number(h.amount)||0),0),l=r.filter(f=>f.type==="deposit").reduce((f,h)=>f+(Number(h.amount)||0),0),p=r.filter(f=>f.type==="withdraw").reduce((f,h)=>f+(Number(h.amount)||0),0),v=o.filter(f=>f.type==="loan_to_saving").reduce((f,h)=>f+(Number(h.amount)||0),0),b=o.filter(f=>f.type==="saving_to_loan").reduce((f,h)=>f+(Number(h.amount)||0),0);return{staffAdvances:i,staffSavings:r,staffTransfers:o,loanGiven:s,loanReceived:c,savingDeposits:l,savingWithdrawals:p,loanToSaving:v,savingToLoan:b,loanBalance:Math.max(0,s+b-c-v),savingBalance:Math.max(0,l+v-p-b)}},getLoanHistoryMeta:t=>t==="received"?{label:"Credit",badgeClass:"badge-success"}:{label:"Debit",badgeClass:"badge-danger"},getLedgerSummary:async t=>{const e=await ApiClient.getAofSummary(Number(t));return{loanBalance:Number(e?.loan_balance||0),savingBalance:Number(e?.saving_balance||0),totalLoanAdded:Number(e?.total_loan_added||0),totalLoanReceived:Number(e?.total_loan_received||0),totalSavingDeposit:Number(e?.total_saving_deposit||0),totalSavingWithdraw:Number(e?.total_saving_withdraw||0),totalLoanToSaving:Number(e?.loan_to_saving||0),totalSavingToLoan:Number(e?.saving_to_loan||0)}},refreshAdvanceModalSummary:async t=>{const e=document.getElementById("advance-ledger-status");if(e){e.innerHTML='<span style="color:var(--text-muted);">Loading advance payment...</span>';try{const n=await StaffManager.getLedgerSummary(t);e.innerHTML=`
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                <div style="padding:10px; border-radius:12px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--danger); text-transform:uppercase;">Advance Balance</div>
                    <div style="font-size:1rem; font-weight:800; color:var(--danger);">&#8377;${n.loanBalance.toLocaleString()}</div>
                </div>
                <div style="padding:10px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--info); text-transform:uppercase;">Debit</div>
                    <div style="font-size:1rem; font-weight:800; color:var(--info);">&#8377;${n.totalLoanAdded.toLocaleString()}</div>
                </div>
                <div style="padding:10px; border-radius:12px; background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.2);">
                    <div style="font-size:0.7rem; font-weight:700; color:var(--success); text-transform:uppercase;">Credit</div>
                    <div style="font-size:1rem; font-weight:800; color:var(--success);">&#8377;${n.totalLoanReceived.toLocaleString()}</div>
                </div>
            </div>
        `}catch{e.innerHTML='<span style="color:var(--danger); font-weight:700;">Backend advance summary load nahi ho payi.</span>'}}},hasAdvanceTakenInMonth:(t,e=new Date().getMonth(),n=new Date().getFullYear())=>Array.isArray(StaffManager.currentAofRows)&&StaffManager.currentAofRows.length>0?StaffManager.currentAofRows.some(r=>{if(String(r.employee_id)!==String(t)||r.type!=="advance"||(Number(r.amount)||0)<=0||!r.date)return!1;const o=new Date(`${r.date}T00:00:00`);return o.getMonth()===e&&o.getFullYear()===n}):((StorageManager.get("advances")||{})[t]||[]).some(r=>{if(r.type!=="paid"||(Number(r.amount)||0)<=0||!r.date)return!1;const o=new Date(`${r.date}T00:00:00`);return o.getMonth()===e&&o.getFullYear()===n}),hasDeductionInMonth:(t,e=new Date().getMonth(),n=new Date().getFullYear())=>Array.isArray(StaffManager.currentAofRows)&&StaffManager.currentAofRows.length>0?StaffManager.currentAofRows.some(r=>{if(String(r.employee_id)!==String(t)||!["fine","deduction"].includes(r.type)||(Number(r.amount)||0)<=0||!r.date)return!1;const o=new Date(`${r.date}T00:00:00`);return o.getMonth()===e&&o.getFullYear()===n}):((StorageManager.get("fines")||{})[t]||[]).some(r=>{if(r.type!=="deduction"||(Number(r.amount)||0)<=0||!r.date)return!1;const o=new Date(`${r.date}T00:00:00`);return o.getMonth()===e&&o.getFullYear()===n}),getActiveHoldMonthKey:(t,e=null)=>{const a=(StorageManager.get("salaryAdjustments")||{})[t]||{};return Object.entries(a).filter(([,r])=>!!r?.hold&&Number(r?.holdDays||0)>0).map(([r])=>r).sort()[0]||e},getLocalPendingHold:(t,e=0)=>{if(window.SalaryManager?.getLocalPendingHold)return window.SalaryManager.getLocalPendingHold(t,e);const a=(StorageManager.get("salaryAdjustments")||{})[t]||{},i=new Date,r=Number(e||0)/window.PayrollSettings.getDaysDivisor(i.getMonth()+1,i.getFullYear());return Object.values(a).reduce((o,s)=>{const c=Number(s?.holdDays||0);return!s?.hold||c<=0||(o.days+=c,o.amount+=r*c),o},{days:0,amount:0})},getDefaultAutoHoldConfig:()=>({enabled:StorageManager.get("auto_hold_enabled")===!0,days:Number(StorageManager.get("auto_hold_days")||0)}),applyDefaultHoldForNewStaff:async(t,e)=>{const n=StaffManager.getDefaultAutoHoldConfig();if(!n.enabled||n.days<=0)return{applied:!1,holdDays:0,warning:null};if(!e)return{applied:!1,holdDays:0,warning:"Auto hold skipped because joining date is missing."};const a=new Date(`${e}T00:00:00`);if(Number.isNaN(a.getTime()))return{applied:!1,holdDays:0,warning:"Auto hold skipped because joining date is invalid."};const i=String(t),r=`${a.getFullYear()}-${String(a.getMonth()+1).padStart(2,"0")}`,o=StorageManager.get("salaryAdjustments")||{};o[i]||(o[i]={}),o[i][r]={overtime:0,advance:0,fine:0,adjustment:0,...o[i][r]||{},hold:!0,holdDays:n.days},StorageManager.save("salaryAdjustments",o);let s=null;try{await ApiClient.addManualHold(i,n.days)}catch{s="Auto hold local me save hua, lekin cloud hold sync nahi ho paya."}return{applied:!0,holdDays:n.days,monthKey:r,warning:s}},getFilteredStaff:(t="")=>{let e=StorageManager.get("staff")||[];if(t){const n=t.toLowerCase();e=e.filter(a=>a.name&&a.name.toLowerCase().includes(n)||a.mobile&&a.mobile.includes(n))}return e},findExistingStaffByNameMobile:(t,e,n=null)=>{const a=String(t||"").trim().toLowerCase(),i=String(e||"").trim();return!a||!i?null:(StaffManager.currentStaffList.length>0?StaffManager.currentStaffList:StorageManager.get("staff")||[]).find(o=>String(o.id)!==String(n||"")&&String(o.mobile||"").trim()===i&&String(o.name||"").trim().toLowerCase()===a)||null},getCurrentMonthIndicators:(t=new Date().getMonth(),e=new Date().getFullYear(),n=null)=>{if(Array.isArray(n)){const s=new Set,c=new Set;return n.forEach(l=>{if(!l?.date||(Number(l.amount)||0)<=0)return;const p=new Date(`${l.date}T00:00:00`);p.getMonth()!==t||p.getFullYear()!==e||(l.type==="advance"&&s.add(String(l.employee_id)),(l.type==="fine"||l.type==="deduction")&&c.add(String(l.employee_id)))}),{advanceIds:s,deductionIds:c}}const a=StorageManager.get("advances")||{},i=StorageManager.get("fines")||{},r=new Set,o=new Set;return Object.entries(a).forEach(([s,c])=>{(c||[]).some(l=>{if(l.type!=="paid"||(Number(l.amount)||0)<=0||!l.date)return!1;const p=new Date(`${l.date}T00:00:00`);return p.getMonth()===t&&p.getFullYear()===e})&&r.add(String(s))}),Object.entries(i).forEach(([s,c])=>{(c||[]).some(l=>{if(l.type!=="deduction"||(Number(l.amount)||0)<=0||!l.date)return!1;const p=new Date(`${l.date}T00:00:00`);return p.getMonth()===t&&p.getFullYear()===e})&&o.add(String(s))}),{advanceIds:r,deductionIds:o}},buildStaffListMarkup:(t="",e={})=>{const{isLoading:n=!1,loadFailed:a=!1,staffList:i=null,aofRows:r=null}=e;let o=Array.isArray(i)?i.slice():StaffManager.getFilteredStaff(t);if(t&&Array.isArray(i)){const l=t.toLowerCase();o=o.filter(p=>p.name&&p.name.toLowerCase().includes(l)||p.mobile&&p.mobile.includes(l))}const{advanceIds:s,deductionIds:c}=StaffManager.getCurrentMonthIndicators(new Date().getMonth(),new Date().getFullYear(),r);return`
            <div class="card">
                <div class="card-header">
                    <h3>Staff Management ${t?`<span style="font-size:0.8rem; color:var(--text-muted); font-weight:400;">(Searching for "${t}")</span>`:""}</h3>
                    <button class="btn-primary" onclick="StaffManager.showAddStaffModal()">
                        <i class="fas fa-plus"></i> Add Staff
                    </button>
                </div>
                <div class="table-responsive staff-list-wrap">
                    <table class="staff-list-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Role</th>
                                <th>Salary Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${n?`<tr><td colspan="7" style="text-align:center; padding:3rem;">
                                <i class="fas fa-spinner fa-spin" style="font-size:1.5rem; color:var(--text-muted); display:block; margin-bottom:10px;"></i>
                                Loading staff...
                            </td></tr>`:o.length===0?`<tr><td colspan="7" style="text-align:center; padding:3rem;">
                                <i class="fas ${a?"fa-triangle-exclamation":"fa-search-minus"}" style="font-size:2rem; color:var(--text-muted); display:block; margin-bottom:10px;"></i>
                                ${a?"Failed to load staff from backend.":"No staff found matching your search"}
                            </td></tr>`:o.map(l=>{const p=s.has(String(l.id)),v=c.has(String(l.id)),b=StaffManager.formatDateDisplay(l.joinDate);return`
                                <tr class="attendance-row staff-card-row">
                                    <td class="staff-card-primary" data-label="Name" onclick="switchView('staff-profile', '${l.id}')" style="cursor:pointer; font-weight:600; color:var(--primary);">
                                        <div style="display:flex; align-items:center; gap:10px;" class="staff-link">
                                            <img src="${l.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(l.name),"random","fff",30)}" alt="${l.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(l.name)}', 'random', 'fff', 30)" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                                            <div style="display:flex; flex-direction:column; gap:3px;">
                                                <div style="display:flex; align-items:center; gap:6px;">
                                                    <span>${l.name}</span>
                                                    ${p?'<i class="fas fa-star" style="color:#FFD700; font-size:0.8rem; text-shadow: 0 0 5px rgba(255,215,0,0.5);" title="Has Salary Advance"></i>':""}
                                                    ${v?'<i class="fas fa-star" style="color:#0984e3; font-size:0.8rem; text-shadow: 0 0 5px rgba(9,132,227,0.45);" title="Has Payment Deduction"></i>':""}
                                                </div>
                                                ${b?`<span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">${b}</span>`:""}
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Mobile" style="font-weight:600; color:var(--text-muted);"><i class="fas fa-phone-alt" style="font-size:0.75rem; margin-right:5px; opacity:0.5;"></i>${l.mobile||"---"}</td>
                                    <td data-label="Role" onclick="switchView('staff-profile', '${l.id}')" style="cursor:pointer; color:var(--text-muted);">${l.role||"---"}</td>
                                    <td data-label="Salary Type">${l.salaryType}</td>
                                    <td data-label="Amount">${StaffManager.formatSalaryAmountWithHold(l.salaryAmount,l)}</td>
                                    <td data-label="Status">
                                        <span class="status-badge ${l.status==="active"?"status-active":"status-inactive"}">
                                            ${l.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td class="staff-card-actions" data-label="Actions" onclick="event.stopPropagation()">
                                        <div class="staff-action-row" style="display:flex; align-items:center; gap:12px;">
                                            <label class="switch-toggle" title="Toggle Status">
                                                <input type="checkbox" ${l.status==="active"?"checked":""} onchange="StaffManager.toggleStaffStatus('${l.id}')">
                                                <span class="slider-round"></span>
                                            </label>
                                            <button class="btn-icon" style="color:var(--success); border-color:rgba(0,184,148,0.2);" onclick="StaffManager.showQuickSalaryActionModal('${l.id}')" title="Quick Adjustment">
                                                <i class="fas fa-money-bill-wave"></i>
                                            </button>
                                            <button class="btn-icon" style="color:var(--info); border-color:rgba(9,132,227,0.2);" onclick="StaffManager.showPhotoUploadModal('${l.id}')" title="Update Photo">
                                                <i class="fas fa-camera"></i>
                                            </button>
                                            <button class="btn-icon" onclick="StaffManager.showEditStaffModal('${l.id}')"><i class="fas fa-edit"></i></button>
                                            <button class="btn-icon text-danger" onclick="StaffManager.deleteStaff('${l.id}')"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `},formatDateDisplay:t=>{if(!t)return"";const e=String(t).slice(0,10).split("-");if(e.length!==3)return String(t);const[n,a,i]=e;return!n||!a||!i?"":`${i.padStart(2,"0")}-${a.padStart(2,"0")}-${n}`},renderStaffList:async(t,e="")=>{const n=++StaffManager._renderToken;t.innerHTML=StaffManager.buildStaffListMarkup(e,{isLoading:!0});try{const[a,i]=await Promise.all([ApiClient.listEmployees(),ApiClient.listAof()]);StaffManager.currentStaffList=(a||[]).map(r=>ApiSyncManager.normalizeEmployee(r)),StaffManager.currentAofRows=i||[]}catch{if(n!==StaffManager._renderToken)return;t.innerHTML=StaffManager.buildStaffListMarkup(e,{loadFailed:!0});return}n===StaffManager._renderToken&&(t.innerHTML=StaffManager.buildStaffListMarkup(e,{staffList:StaffManager.currentStaffList,aofRows:StaffManager.currentAofRows}))},buildProfileStaffSelectorOptions:t=>(StaffManager.currentStaffList.length>0?StaffManager.currentStaffList:StorageManager.get("staff")||[]).slice().sort((n,a)=>(n.name||"").localeCompare(a.name||"")).map(n=>`
            <option value="${n.id}" ${String(n.id)===String(t)?"selected":""}>
                ${n.name}${n.role?` - ${n.role}`:""}
            </option>
        `).join(""),handleProfileStaffChange:async t=>{const e=document.getElementById("view-container");if(!e||!t)return;const n=document.getElementById("profile-month-picker");if(n?.value){const[a,i]=n.value.split("-");await StaffManager.renderProfilePage(e,t,parseInt(i,10)-1,parseInt(a,10));return}await StaffManager.renderProfilePage(e,t)},getProfileMonthPickerHtml:(t,e,n,a=!0)=>{const i=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],r=new Date,o=r.getFullYear(),s=r.getMonth(),c=`${n}-${String(e+1).padStart(2,"0")}`,l=new Date(n,e,1).toLocaleDateString("en-US",{month:"long",year:"numeric"}),p=i.map((v,b)=>{const f=n>o||n===o&&b>s;return`
                <button type="button"
                    class="profile-month-option ${b===e?"active":""}"
                    ${f?"disabled":""}
                    onclick="StaffManager.selectProfileMonth('${t}', ${b}, ${n})">
                    ${v}
                </button>
            `}).join("");return`
            <div class="profile-month-picker">
                ${a?`<input type="hidden" id="profile-month-picker" value="${c}">`:""}
                <button type="button" class="profile-month-trigger" onclick="StaffManager.toggleProfileMonthMenu(event)">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${l}</span>
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="profile-month-menu">
                    <div class="profile-month-year">
                        <button type="button" class="profile-month-nav" onclick="StaffManager.changeProfileMonthYear('${t}', ${e}, ${n-1})">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span>${n}</span>
                        <button type="button" class="profile-month-nav" ${n>=o?"disabled":""} onclick="StaffManager.changeProfileMonthYear('${t}', ${e}, ${n+1})">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="profile-month-grid">
                        ${p}
                    </div>
                    <div class="profile-month-actions">
                        <button type="button" onclick="StaffManager.selectProfileMonth('${t}', ${s}, ${o})">This month</button>
                    </div>
                </div>
            </div>
        `},toggleProfileMonthMenu:t=>{t?.stopPropagation();const n=t?.currentTarget?.closest(".profile-month-picker")?.querySelector(".profile-month-menu");document.querySelectorAll(".profile-month-menu.open").forEach(a=>{a!==n&&a.classList.remove("open")}),n?.classList.toggle("open")},selectProfileMonth:async(t,e,n)=>{const a=document.getElementById("view-container");a&&await StaffManager.renderProfilePage(a,t,e,n)},changeProfileMonthYear:async(t,e,n)=>{const a=new Date,i=n===a.getFullYear()?Math.min(e,a.getMonth()):e;await StaffManager.selectProfileMonth(t,i,n)},renderProfilePage:async(t,e,n=null,a=null)=>{const i=new Date;let r=n,o=a;if(r===null||o===null){const d=SalaryManager.getPreviousMonthYear();let u=null,m=null;try{u=await ApiClient.getPayrollSummary(Number(e),i.getMonth()+1,i.getFullYear()),m=await ApiClient.getPayrollSummary(Number(e),d.month+1,d.year)}catch(S){console.error("Failed to load backend payroll summary for profile default month",S),t.innerHTML="<h2>Backend staff profile data unavailable</h2>";return}const y=u?.is_already_generated||m?.is_already_generated?{month:i.getMonth(),year:i.getFullYear()}:d;r=y.month,o=y.year}const s=r,c=o;window.HeaderManager?.sync("staff-profile",e);let l=null,p=null,v=null;try{const[d,u,m,y]=await Promise.all([ApiClient.listEmployees(),ApiClient.getPayrollSummary(Number(e),s+1,c),ApiClient.getAttendanceByEmployeeMonth(Number(e),s+1,c),ApiClient.listAof()]);StaffManager.currentStaffList=(d||[]).map(S=>ApiSyncManager.normalizeEmployee(S)),l=StaffManager.currentStaffList.find(S=>String(S.id)===String(e)),p=u,v=m,StaffManager.currentAofRows=y||[]}catch(d){return console.error("Failed to load staff profile from backend",d),t.innerHTML="<h2>Backend staff profile data unavailable</h2>"}if(!l)return t.innerHTML="<h2>Staff not found</h2>";const b=`${o}-${String(r+1).padStart(2,"0")}`,f=`${c}-${String(s+1).padStart(2,"0")}`,h=p?.hold_info||{total_hold_days:0,total_hold_amount:0},M=SalaryManager.getSlipDataFromSummary(p,s,c),F=Number(M?.daysPresent||0),$=M?.adj||{overtime:0,advance:0,fine:0,adjustment:0,hold:!1},P=Math.round(Number(M?.holdAmount||0)),C=Math.round(Number(M?.earnedSalary||0)),A=Math.max(0,C-P),H=p?.generated||p?.details||null,z=Number(H?.base_salary||0),_=Number(H?.days_divisor||0),T=z>0&&_>0?Math.round(z/_):0,U=Math.max(Number($.holdDays||0),Number(h.total_hold_days||0)),I=Math.max(Math.round(Number(h.total_hold_amount||0))),E=!!$.hold||Number($.holdDays||0)>0||Number(h.total_hold_days||0)>0||Number(h.total_hold_amount||0)>0,j=!!p?.is_already_generated,q=r===i.getMonth()&&o===i.getFullYear(),N=!j&&!q,B=(v?.list||[]).map(d=>({date:d.date,status:ApiSyncManager.statusFromApi(d.status)||d.status||""})).sort((d,u)=>u.date.localeCompare(d.date)),D={present:B.filter(d=>d.status==="present").length,holiday:B.filter(d=>d.status==="holiday").length,halfday:B.filter(d=>d.status==="halfday").length},R=[D.present>0?`<span style="color:var(--success);">${D.present}P</span>`:"",D.holiday>0?`<span style="color:var(--info);">${D.holiday}HO</span>`:"",D.halfday>0?`<span style="color:var(--warning);">${D.halfday}HD</span>`:""].filter(Boolean).join(""),O=B.reduce((d,u)=>(u.date&&(d[u.date]||(d[u.date]={}),d[u.date][String(e)]=u.status),d),{}),k=(StaffManager.currentAofRows||[]).filter(d=>String(d.employee_id)===String(e)).map(d=>({id:Number(d.id||0),type:d.type||"",amount:Number(d.amount||0),date:d.date||"",remark:d.notes||""})),Y=d=>{if(!d.date)return!1;const u=new Date(`${d.date}T00:00:00`);return u.getMonth()===s&&u.getFullYear()===c},V=k.some(d=>d.type==="advance"&&Y(d)),G=k.some(d=>["fine","deduction"].includes(d.type)&&Y(d));t.innerHTML=`
            <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div style="display:flex; align-items:center; gap:1.5rem;">
                    <button class="btn-icon" onclick="switchView('staff')"><i class="fas fa-arrow-left"></i></button>
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <img src="${l.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(l.name),"3E2723","fff",80)}" alt="${l.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(l.name)}', '3E2723', 'fff', 80)" style="width:60px; height:60px; border-radius:15px; object-fit:cover;">
                        <div>
                            <h1 style="font-size:1.8rem; margin:0; line-height:1.2;">
                                ${l.name}
                                ${V?'<i class="fas fa-star" style="color:#FFD700; font-size:1rem; margin-left:8px;"></i>':""}
                                ${G?'<i class="fas fa-star" style="color:#0984e3; font-size:1rem; margin-left:8px;"></i>':""}
                            </h1>
                            <p style="color:var(--text-muted); font-weight:600;"><i class="fas fa-id-badge" style="margin-right:8px; color:var(--accent);"></i>${l.role}</p>
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
                    <button class="btn-outline" onclick="StaffManager.showPhotoUploadModal('${l.id}')"><i class="fas fa-camera"></i> Update Photo</button>
                    ${StaffManager.getProfileMonthPickerHtml(e,r,o)}
                    <button class="btn-outline" onclick="StaffManager.showEditStaffModal('${l.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn-primary" style="background:${N?"var(--success)":"var(--text-muted)"}; cursor:${N?"pointer":"not-allowed"};" ${N?`onclick="SalaryManager.showSalaryConfigModal('${l.id}', ${r}, ${o})"`:"disabled"}>
                        <i class="fas fa-file-invoice-dollar"></i> ${j?"Salary Generated":"Generate Salary"}
                    </button>
                    <button class="btn-primary" onclick="window.print()"><i class="fas fa-print"></i> Print</button>
                </div>
            </div>

            <div class="profile-detail-layout" style="display:grid; grid-template-columns: 350px 1fr; gap:2rem;">
                <!-- Left Sidebar -->
                <div class="profile-side-column" style="display:flex; flex-direction:column; gap:2rem;">
                    <!-- Personal Details -->
                    <div class="card profile-personal-card">
                        <div class="card-header"><h3>Personal Details</h3></div>
                        <div style="padding-top:10px;">
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Father's Name</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;">${l.fatherName||"---"}</span>
                            </div>
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Mobile Number</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-phone-alt" style="margin-right:10px; font-size:0.9rem; color:var(--primary);"></i>${l.mobile||"---"}</span>
                            </div>
                            <div style="margin-bottom:1.5rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Alt Mobile</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-phone" style="margin-right:10px; font-size:0.9rem; color:var(--text-muted);"></i>${l.mobileAlt||"---"}</span>
                            </div>
                            <div style="margin-bottom:1rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Joining Date</label>
                                <span style="font-size:1.1rem; color:var(--text-main); font-weight:600;"><i class="fas fa-calendar-alt" style="margin-right:10px; font-size:0.9rem; color:var(--primary);"></i>${l.joinDate||"---"}</span>
                            </div>
                            <div style="margin-bottom:1rem;">
                                <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:5px;">Staff Status</label>
                                <span class="badge ${l.status==="active"?"badge-success":"badge-danger"}" style="text-transform: uppercase; font-weight: 700; padding: 4px 12px; font-size:0.7rem;">${l.status}</span>
                            </div>

                            <!-- Action Buttons inside Personal Details -->
                            <div style="border-top: 1px solid var(--border); padding-top: 1.5rem; display:flex; flex-direction:column; gap:12px;">
                                <button class="btn-outline" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:0.8rem;" onclick="StaffManager.toggleStaffStatus('${l.id}')">
                                    <i class="fas fa-power-off"></i> ${l.status==="active"?"Deactivate Staff":"Activate Staff"}
                                </button>
                                <button class="btn-outline text-danger" style="width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:0.8rem; border-color:rgba(214, 48, 49, 0.2);" onclick="StaffManager.deleteStaff('${l.id}')">
                                    <i class="fas fa-trash-alt"></i> Delete Record
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Summary Stats -->
                    <div class="card profile-summary-card">
                        <div class="card-header"><h3>Attendance Summary</h3></div>
                        ${(()=>{const d=B.filter(m=>{const y=new Date(m.date);return y.getMonth()===r&&y.getFullYear()===o}),u={present:d.filter(m=>m.status==="present").length,absent:d.filter(m=>m.status==="absent").length,halfday:d.filter(m=>m.status==="halfday").length,holiday:d.filter(m=>m.status==="holiday").length};return`
                            <div class="profile-attendance-summary" style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; padding-top:10px;">
                                <div class="profile-attendance-stat" style="background:rgba(0, 184, 148, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(0, 184, 148, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--success); font-weight:700; text-transform:uppercase;">Present</label>
                                    <h4 style="font-size:1.4rem; color:var(--success); margin-top:4px;">${u.present}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(214, 48, 49, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(214, 48, 49, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--danger); font-weight:700; text-transform:uppercase;">Absent</label>
                                    <h4 style="font-size:1.4rem; color:var(--danger); margin-top:4px;">${u.absent}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(253, 203, 110, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(253, 203, 110, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--warning); font-weight:700; text-transform:uppercase;">Half Day</label>
                                    <h4 style="font-size:1.4rem; color:var(--warning); margin-top:4px;">${u.halfday}</h4>
                                </div>
                                <div class="profile-attendance-stat" style="background:rgba(9, 132, 227, 0.05); padding:1rem; border-radius:12px; border:1px solid rgba(9, 132, 227, 0.1); text-align:center;">
                                    <label style="font-size:0.6rem; color:var(--info); font-weight:700; text-transform:uppercase;">Holiday</label>
                                    <h4 style="font-size:1.4rem; color:var(--info); margin-top:4px;">${u.holiday}</h4>
                                </div>
                            </div>
                        `})()}
                    </div>
                </div>

                <!-- Right Side -->
                <div class="profile-main-column" style="display:flex; flex-direction:column; gap:2rem;">
                    <!-- Stats Grid -->
                    <div class="card profile-payment-card">
                        <div class="card-header"><h3>Payment Detail</h3></div>
                        <p style="margin:0 0 1rem; color:var(--text-muted); font-size:0.8rem; font-weight:600;">
                            Showing salary month: ${new Date(c,s,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}
                        </p>
                        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-top:10px;">
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Salary Type</label>
                                <h4 style="font-size:1.2rem; color:var(--primary); margin-top:4px;">${l.salaryType}</h4>
                            </div>
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Base Amount</label>
                                <h4 style="font-size:1.2rem; color:var(--success); margin-top:4px;">${StaffManager.formatSalaryAmountWithHold(z,h)}</h4>
                                ${T>0?`<div style="font-size:0.74rem; color:var(--text-muted); font-weight:700; margin-top:5px;">Per day: &#8377;${T.toLocaleString()}</div>`:""}
                            </div>
                            <div style="background:var(--bg-main); padding:1.25rem; border-radius:15px; border:1px solid var(--border);">
                                <label style="font-size:0.65rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Earn Salary</label>
                                <h4 style="font-size:1.2rem; color:var(--info); margin-top:4px;">&#8377;${A.toLocaleString()}</h4>
                                ${R?`<div style="font-size:0.68rem; font-weight:800; margin-top:4px; display:flex; gap:7px; align-items:center;">${R}</div>`:""}
                                ${P>0?`<div style="font-size:0.74rem; color:var(--danger); font-weight:700; margin-top:5px;">Hold: -&#8377;${P.toLocaleString()}</div>`:""}
                            </div>
                            <div style="background:${E?"rgba(214, 48, 49, 0.05)":"var(--bg-main)"}; padding:1.25rem; border-radius:15px; border:1px solid ${E?"var(--danger)":"var(--border)"}; cursor:pointer; transition: all 0.2s ease;" 
                                 onclick="StaffManager.showHoldToggleModal('${l.id}', '${f}')">
                                <label style="font-size:0.65rem; color:${E?"var(--danger)":"var(--text-muted)"}; font-weight:700; text-transform:uppercase;">Hold Status</label>
                                <h4 style="font-size:1.2rem; color:${E?"var(--danger)":"var(--success)"}; margin-top:4px;">
                                    ${E?`<i class="fas fa-lock"></i> Held (${U} D${I>0?` | &#8377;${I.toLocaleString()}`:""})`:'<i class="fas fa-check-circle"></i> No Hold'}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <!-- Advance Payment Section -->
                    <div class="card profile-advance-card">
                        <div class="card-header" style="border-bottom:none; margin-bottom:0;">
                            <h3>Advance Payment</h3>
                            <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:#6c5ce7;" onclick="StaffManager.showAdvanceModal('${l.id}')">
                                <i class="fas fa-plus"></i> Add Advance Payment
                            </button>
                        </div>
                        ${(()=>{const d=k.filter(g=>["advance","advance_paid"].includes(g.type)).map(g=>({...g,type:g.type==="advance"?"paid":"received"})).sort((g,w)=>{const x=String(w.date||"").localeCompare(String(g.date||""));return x!==0?x:Number(w.id||0)-Number(g.id||0)}),u=d.filter(g=>g.type==="paid").reduce((g,w)=>g+Number(w.amount||0),0),m=d.filter(g=>g.type==="received").reduce((g,w)=>g+Number(w.amount||0),0),y=Math.max(0,u-m),S=g=>String(g||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return`
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-top:1.25rem;">
                                <div style="background:rgba(108, 92, 231, 0.07); border:1px solid rgba(108, 92, 231, 0.22); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:#6c5ce7; font-weight:800; text-transform:uppercase;">Balance</label>
                                    <h4 style="font-size:1.35rem; color:#6c5ce7; margin-top:4px;">&#8377;${y.toLocaleString()}</h4>
                                </div>
                                <div style="background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.18); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:var(--danger); font-weight:800; text-transform:uppercase;">Debit Given</label>
                                    <h4 style="font-size:1.35rem; color:var(--danger); margin-top:4px;">&#8377;${u.toLocaleString()}</h4>
                                </div>
                                <div style="background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.18); padding:1rem; border-radius:14px;">
                                    <label style="font-size:0.65rem; color:var(--success); font-weight:800; text-transform:uppercase;">Credit Received</label>
                                    <h4 style="font-size:1.35rem; color:var(--success); margin-top:4px;">&#8377;${m.toLocaleString()}</h4>
                                </div>
                            </div>
                            <div class="table-responsive" style="max-height:280px; border:1px solid var(--border); border-radius:12px; margin-top:1.25rem;">
                                <table class="table-compact" style="font-size:0.85rem;">
                                    <thead style="position:sticky; top:0; z-index:1;">
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Remark</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${d.length===0?'<tr><td colspan="5" style="text-align:center; padding:1rem;">No advance payment records</td></tr>':d.map(g=>{const w=g.type==="received",x=StaffManager.getLoanHistoryMeta(g.type);return`
                                                <tr>
                                                    <td data-label="Date"><span class="ledger-cell-value">${g.date?new Date(`${g.date}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"}):"-"}</span></td>
                                                    <td data-label="Type"><span class="ledger-cell-value"><span class="badge ${x.badgeClass}" style="font-size:0.65rem; padding:4px 9px;">${x.label}</span></span></td>
                                                    <td data-label="Amount" style="font-weight:800; color:${w?"var(--success)":"var(--danger)"};"><span class="ledger-cell-value">${w?"+":"-"}&#8377;${Number(g.amount||0).toLocaleString()}</span></td>
                                                    <td data-label="Remark" style="font-size:0.8rem; color:var(--text-muted); max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${S(g.remark)}"><span class="ledger-cell-value">${g.remark||"-"}</span></td>
                                                    <td data-label="Action">
                                                        <div style="display:flex; gap:3px;">
                                                            <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditAdvanceModal('${l.id}', ${g.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                            <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteAdvance('${l.id}', ${g.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `}).join("")}
                                    </tbody>
                                </table>
                            </div>
                        `})()}
                    </div>

                    <!-- Financial Logs Section (Payment Deduction & Overtime) -->
                    <div class="card profile-finance-card">
                        <div class="card-header" style="border-bottom:none; margin-bottom:0;">
                            <h3>Financial Logs</h3>
                            <div class="profile-finance-actions" style="display:flex; gap:10px;">
                                <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:var(--danger);" onclick="StaffManager.showDeductionModal('${l.id}')">
                                    <i class="fas fa-plus"></i> Add Payment Deduction
                                </button>
                                <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; background:var(--success);" onclick="StaffManager.showOvertimeModal('${l.id}')">
                                    <i class="fas fa-plus"></i> Add Overtime
                                </button>
                            </div>
                        </div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:1.5rem;">
                            <!-- Payment Deduction Column -->
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <h4 style="font-size:0.9rem; color:var(--danger);">Payment Deduction History</h4>
                                    ${`<span style="font-size:0.8rem; font-weight:700; color:var(--danger);">Total: &#8377;${k.filter(m=>["fine","deduction"].includes(m.type)).reduce((m,y)=>m+y.amount,0).toLocaleString()}</span>`}
                                </div>
                                <div class="table-responsive" style="max-height:250px; border:1px solid var(--border); border-radius:12px;">
                                    <table class="table-compact" style="font-size:0.85rem;">
                                        <thead style="position:sticky; top:0; z-index:1;">
                                            <tr>
                                                <th>Date</th>
                                                <th>Amt</th>
                                                <th>Remark</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(()=>{const d=k.filter(u=>["fine","deduction"].includes(u.type));return d.length===0?'<tr><td colspan="4" style="text-align:center">No records</td></tr>':d.sort((u,m)=>m.id-u.id).map(u=>`
                                                        <tr>
                                                            <td data-label="Date"><span class="ledger-cell-value">${u.date?new Date(`${u.date}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}):"-"}</span></td>
                                                            <td data-label="Amount" style="font-weight:700; color:var(--danger);"><span class="ledger-cell-value">&#8377;${u.amount}</span></td>
                                                            <td data-label="Remark" style="font-size:0.8rem; color:var(--text-muted); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${u.remark||""}"><span class="ledger-cell-value">${u.remark||"-"}</span></td>
                                                            <td data-label="Action">
                                                                <div style="display:flex; gap:3px;">
                                                                    <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditFineModal('${l.id}', ${u.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                                    <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteFine('${l.id}', ${u.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    `).join("")})()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Overtime Column -->
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <h4 style="font-size:0.9rem; color:var(--success);">Overtime History</h4>
                                    ${`<span style="font-size:0.8rem; font-weight:700; color:var(--success);">Total: &#8377;${k.filter(m=>m.type==="overtime").reduce((m,y)=>m+y.amount,0).toLocaleString()}</span>`}
                                </div>
                                <div class="table-responsive" style="max-height:250px; border:1px solid var(--border); border-radius:12px;">
                                    <table class="table-compact" style="font-size:0.85rem;">
                                        <thead style="position:sticky; top:0; z-index:1;">
                                            <tr>
                                                <th>Date</th>
                                                <th>Amt</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${(()=>{const d=k.filter(u=>u.type==="overtime");return d.length===0?'<tr><td colspan="3" style="text-align:center">No records</td></tr>':d.sort((u,m)=>m.id-u.id).map(u=>`
                                                        <tr>
                                                            <td data-label="Date"><span class="ledger-cell-value">${u.date?new Date(`${u.date}T00:00:00`).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}):"-"}</span></td>
                                                            <td data-label="Amount" style="font-weight:700; color:var(--success);"><span class="ledger-cell-value">&#8377;${u.amount}</span></td>
                                                            <td data-label="Action">
                                                                <div style="display:flex; gap:3px;">
                                                                    <button class="btn-icon" style="width:28px; height:28px;" onclick="StaffManager.showEditOvertimeModal('${l.id}', ${u.id})"><i class="fas fa-edit" style="font-size:0.7rem;"></i></button>
                                                                    <button class="btn-icon text-danger" style="width:28px; height:28px;" onclick="StaffManager.deleteOvertime('${l.id}', ${u.id})"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    `).join("")})()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Section -->
                    <div class="card profile-calendar-card" style="padding: 1.5rem;">
                        <div class="card-header" style="margin-bottom: 2rem;">
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div style="background:var(--primary); color:white; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;">
                                    <i class="fas fa-calendar-check"></i>
                                </div>
                                <div>
                                    <h3 style="margin:0;">Attendance Report</h3>
                                    <p style="font-size:0.75rem; color:var(--text-muted); margin:0;">Daily tracking for ${new Date(o,r,1).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</p>
                                </div>
                            </div>
                            ${StaffManager.getProfileMonthPickerHtml(e,r,o,!1)}
                        </div>
                        
                        <!-- Visual Calendar View -->
                        <div class="mini-calendar" style="margin-bottom: 2rem; background:var(--bg-main); border:1px solid var(--border); border-radius:16px; padding: 1.5rem;">
                            <div class="cal-header" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 1rem;">
                                ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">${d}</span>`).join("")}
                            </div>
                            <div class="cal-body" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                                ${(()=>{const d=new Date(o,r,1).getDay(),u=new Date(o,r+1,0).getDate();let m=[];for(let y=0;y<d;y++)m.push('<div class="cal-cell empty" style="aspect-ratio:1/1;"></div>');for(let y=1;y<=u;y++){const S=`${o}-${String(r+1).padStart(2,"0")}-${String(y).padStart(2,"0")}`,g=(O[S]||{})[e]||"none";let w="transparent",x="var(--text-muted)",L="1px solid rgba(0,0,0,0.05)";g==="present"?(w="var(--success)",x="#fff",L="none"):g==="absent"?(w="var(--danger)",x="#fff",L="none"):g==="halfday"?(w="var(--warning)",x="#fff",L="none"):g==="holiday"&&(w="var(--info)",x="#fff",L="none"),m.push(`
                                        <div class="cal-cell" 
                                            onclick="StaffManager.showMarkAttendanceModal('${e}', '${S}')"
                                            style="aspect-ratio:1/1; display:flex; align-items:center; justify-content:center; border-radius:10px; background:${w}; color:${x}; font-weight:700; font-size:0.85rem; border:${L}; cursor:pointer; transition: all 0.2s ease;">
                                            ${y}
                                        </div>
                                    `)}return m.join("")})()}
                            </div>
                        </div>

                        <!-- Table View -->
                        <div class="table-responsive profile-attendance-table-wrap" style="max-height:400px; border:1px solid var(--border); border-radius:12px;">
                            <table class="profile-attendance-table">
                                <thead>
                                    <tr>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Date</th>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Status</th>
                                        <th style="background:var(--bg-main); position:sticky; top:0; z-index:1;">Day</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(()=>{const d=new Date;d.setHours(23,59,59,999);const u=new Date(o,r+1,0).getDate(),m=[];for(let y=u;y>=1;y--){if(new Date(o,r,y)>d)continue;const g=`${o}-${String(r+1).padStart(2,"0")}-${String(y).padStart(2,"0")}`,w=(O[g]||{})[e]||"absent";m.push({date:g,status:w})}return m.map(y=>`
                                            <tr>
                                                <td style="font-weight:600;">${new Date(y.date).toLocaleDateString("en-GB")}</td>
                                                <td>
                                                    <span class="badge ${y.status==="present"?"badge-success":y.status==="absent"?"badge-danger":y.status==="halfday"?"badge-warning":"badge-info"}" style="font-size:0.65rem; padding:4px 10px;">
                                                        ${y.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style="color:var(--text-muted); font-size:0.8rem;">${new Date(y.date).toLocaleDateString("en-US",{weekday:"short"})}</td>
                                            </tr>
                                        `).join("")})()}
                                </tbody>
                            </table>
                        </div>
                        </div>

                        <!-- Print Only Signatures -->
                        <div class="print-only-signatures">
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <p style="font-size: 0.8rem; font-weight: 700;">Accountant / Manager</p>
                            </div>
                            <div class="sig-box">
                                <div class="sig-line"></div>
                                <p style="font-size: 0.8rem; font-weight: 700;">Staff Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `},showAddStaffModal:()=>{ModalManager.show("Add New Staff",`
            <form id="add-staff-form" data-mode="add" onsubmit="StaffManager.handleAddStaff(event, this.dataset.editId || null)">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div id="photo-preview-container" style="position:relative; width:100px; height:100px; margin:0 auto; border-radius:30%; overflow:hidden; border:2px dashed var(--primary); display:flex; align-items:center; justify-content:center; background:rgba(62, 39, 35, 0.05); cursor:pointer;" onclick="document.getElementById('staff-photo-input-gallery').click()">
                        <img id="staff-photo-preview" src="" alt="Selected staff photo preview" style="width:100%; height:100%; object-fit:cover; display:none;">
                        <div id="photo-placeholder" style="text-align:center; color:var(--primary);">
                            <i class="fa-solid fa-camera" style="font-size:2rem; display:block; margin-bottom:5px;"></i>
                            <span style="font-size:0.7rem; font-weight:800; letter-spacing:0.5px;">ADD PHOTO</span>
                        </div>
                    </div>
                    <div style="margin-top:12px; display:flex; justify-content:center; gap:10px;">
                         <button type="button" class="btn-outline" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; border-color:var(--primary); color:var(--primary); background:rgba(62, 39, 35, 0.05);" onclick="document.getElementById('staff-photo-input-camera').click()">
                            <i class="fas fa-camera"></i> Camera
                         </button>
                         <button type="button" class="btn-outline" style="padding:8px 12px; font-size:0.75rem; border-radius:10px;" onclick="document.getElementById('staff-photo-input-gallery').click()">
                            <i class="fas fa-image"></i> Gallery
                         </button>
                    </div>
                    <!-- Hidden Inputs -->
                    <input type="file" id="staff-photo-input-camera" accept="image/*" capture="environment" style="display:none;" onchange="StaffManager.handlePhotoPreview(this)">
                    <input type="file" id="staff-photo-input-gallery" accept="image/*" style="display:none;" onchange="StaffManager.handlePhotoPreview(this)">
                    <input type="hidden" id="staff-photo-data">
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Full Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user"></i>
                            <input type="text" id="staff-name" required placeholder="Employee Name">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Father's Name</label>
                        <div class="input-wrapper">
                            <i class="fas fa-users"></i>
                            <input type="text" id="staff-father-name" placeholder="Optional">
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Mobile Number</label>
                        <div class="input-wrapper">
                            <i class="fas fa-phone-alt"></i>
                            <input type="tel" id="staff-mobile" pattern="[0-9]{10}" placeholder="10 Digit Number">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Date of Birth</label>
                        <div class="input-wrapper">
                            <i class="fas fa-birthday-cake"></i>
                            <input type="date" id="staff-dob" class="date-input">
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Designation / Role (Optional)</label>
                        <div class="input-wrapper">
                            <i class="fas fa-briefcase"></i>
                            <input type="text" id="staff-role" placeholder="e.g. Chef, Waiter">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Joining Date</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-day"></i>
                            <input type="text" id="staff-join-date" class="date-input" required>
                        </div>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="input-group">
                        <label>Status</label>
                        <div class="input-wrapper">
                            <i class="fas fa-info-circle"></i>
                            <select id="staff-status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Salary Type</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-alt"></i>
                            <select id="staff-salary-type">
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly" selected>Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="input-group">
                    <label>Base Salary Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="staff-salary-amount" required placeholder="0.00">
                    </div>
                </div>

                <div style="margin-top: 1rem; display: flex; gap: 1rem;">
                    <button type="submit" class="btn-primary full-width">Save Staff</button>
                </div>
            </form>
        `),setTimeout(()=>{setupCustomDropdown("staff-status"),setupCustomDropdown("staff-salary-type"),StaffManager.initDatePicker("#staff-join-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},handlePhotoPreview:t=>{const e=t.files[0];if(e){const n=new FileReader;n.onload=a=>{document.getElementById("staff-photo-preview").src=a.target.result,document.getElementById("staff-photo-preview").style.display="block",document.getElementById("photo-placeholder").style.display="none",document.getElementById("staff-photo-data").value=a.target.result},n.readAsDataURL(e)}},showPhotoUploadModal:t=>{const e=(StorageManager.get("staff")||[]).find(a=>a.id===t);if(!e)return;const n=`
            <form id="photo-upload-form" onsubmit="StaffManager.handlePhotoUploadSubmit(event, '${t}')">
                <div style="text-align:center; margin-bottom:1.5rem;">
                    <div style="position:relative; width:120px; height:120px; margin:0 auto; border-radius:28px; overflow:hidden; border:2px dashed var(--primary); display:flex; align-items:center; justify-content:center; background:rgba(62, 39, 35, 0.05);">
                        <img id="staff-photo-upload-preview" src="${e.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(e.name),"3E2723","fff",120)}" alt="${e.name} profile photo preview" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(e.name)}', '3E2723', 'fff', 120)" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <p style="margin:1rem 0 0; color:var(--text-muted); font-weight:600;">${e.name}</p>
                </div>

                <div style="display:flex; justify-content:center; gap:10px; margin-bottom:1rem;">
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('staff-photo-upload-camera').click()">
                        <i class="fas fa-camera"></i> Camera
                    </button>
                    <button type="button" class="btn-outline" style="padding:10px 14px; border-radius:12px;" onclick="document.getElementById('staff-photo-upload-gallery').click()">
                        <i class="fas fa-image"></i> Gallery
                    </button>
                </div>

                <input type="file" id="staff-photo-upload-camera" accept="image/*" capture="environment" style="display:none;" onchange="StaffManager.previewPhotoUpload(this, '${encodeURIComponent(e.name)}')">
                <input type="file" id="staff-photo-upload-gallery" accept="image/*" style="display:none;" onchange="StaffManager.previewPhotoUpload(this, '${encodeURIComponent(e.name)}')">

                <button type="submit" class="btn-primary full-width">Upload Photo</button>
            </form>
        `;ModalManager.show(`Update Photo - ${e.name}`,n)},previewPhotoUpload:(t,e)=>{const n=t.files[0],a=document.getElementById("staff-photo-upload-preview");if(!n||!a){a&&window.PhotoHelper.applyFallback(a,e,"3E2723","fff",120);return}const i=new FileReader;i.onload=r=>{a.src=r.target.result},i.readAsDataURL(n)},handlePhotoUploadSubmit:async(t,e)=>{t.preventDefault();const n=document.getElementById("staff-photo-upload-camera").files[0]||document.getElementById("staff-photo-upload-gallery").files[0];if(!n){window.showAlert("Please select a photo first");return}try{await ApiClient.uploadEmployeeImage(e,n),await ApiSyncManager.bootstrap(!0),ModalManager.hide();const a=document.getElementById("view-container");if(window.currentView==="staff"&&a)await StaffManager.renderStaffList(a);else if(window.currentView==="staff-profile"&&a){const i=document.getElementById("profile-month-picker");if(i){const[r,o]=i.value.split("-");await StaffManager.renderProfilePage(a,e,parseInt(o,10)-1,parseInt(r,10))}}else window.currentView==="attendance"?await AttendanceManager.loadAttendanceList():window.currentView==="salary"?await SalaryManager.refreshSalaryList():window.currentView==="reports"&&a&&await ReportsManager.renderReports(a);window.showAlert("Photo uploaded successfully")}catch(a){window.showAlert(a.message||"Failed to upload photo")}},showEditStaffModal:t=>{const e=(StorageManager.get("staff")||[]).find(r=>r.id===t);if(!e)return;StaffManager.showAddStaffModal(),document.getElementById("modal-title").textContent="Edit Staff Member";const n=document.getElementById("add-staff-form");n.dataset.editId=String(t),n.dataset.mode="edit";const a=(r,o)=>{const s=document.getElementById(r);s&&(s.value=o??"",s.dispatchEvent(new Event("change",{bubbles:!0})))};setTimeout(()=>{a("staff-name",e.name),a("staff-father-name",e.fatherName||""),a("staff-mobile",e.mobile||""),a("staff-role",e.role||""),a("staff-dob",e.dob||""),a("staff-status",e.status||"active"),a("staff-salary-type",e.salaryType||"Monthly"),a("staff-salary-amount",e.salaryAmount||0);const r=document.getElementById("staff-join-date");if(r?._flatpickr?r._flatpickr.setDate(e.joinDate||new Date,!0,"Y-m-d"):a("staff-join-date",e.joinDate||""),e.photo){const o=document.getElementById("staff-photo-preview"),s=document.getElementById("photo-placeholder"),c=document.getElementById("staff-photo-data");o&&(o.src=e.photo,o.style.display="block"),s&&(s.style.display="none"),c&&(c.value=e.photo)}},80)},handleAddStaff:async(t,e=null)=>{if(t.preventDefault(),e=e||t.target?.dataset?.editId||null,t.target?.dataset?.mode==="edit"&&!e){window.showAlert("Edit staff id missing hai. Duplicate create block kar diya.");return}if(StaffManager._isSavingStaff)return;const n=t.target?.querySelector('button[type="submit"]');StaffManager._isSavingStaff=!0,n&&(n.disabled=!0,n.dataset.originalText=n.textContent,n.textContent=e?"Updating...":"Saving...");const a={name:document.getElementById("staff-name").value,father_name:document.getElementById("staff-father-name").value,mobile:document.getElementById("staff-mobile").value,alternate_mobile:document.getElementById("staff-mobile-alt")?.value||void 0,date_of_birth:document.getElementById("staff-dob").value,role:document.getElementById("staff-role").value,join_date:document.getElementById("staff-join-date").value,status:document.getElementById("staff-status").value,monthly_salary:parseFloat(document.getElementById("staff-salary-amount").value)||0},i=document.getElementById("staff-photo-input-camera").files[0]||document.getElementById("staff-photo-input-gallery").files[0];try{if(!e){const l=StaffManager.findExistingStaffByNameMobile(a.name,a.mobile);if(l){window.showAlert(`Ye staff already exist karta hai: ${l.name}`);return}}const r=e?await ApiClient.updateEmployee(e,a):await ApiClient.createEmployee(a),o=String(r?.id||e);let s=null;i&&o&&await ApiClient.uploadEmployeeImage(o,i),!e&&o&&(s=await StaffManager.applyDefaultHoldForNewStaff(o,a.join_date)),await ApiSyncManager.bootstrap(!0),ModalManager.hide();const c=document.getElementById("view-container");if(window.currentView==="salary")await SalaryManager.refreshSalaryList();else if(window.currentView==="staff-profile"&&c){const l=document.getElementById("profile-month-picker");if(l&&o){const[p,v]=l.value.split("-");await StaffManager.renderProfilePage(c,o,parseInt(v,10)-1,parseInt(p,10))}}else window.currentView==="attendance"?await AttendanceManager.loadAttendanceList():window.currentView==="reports"&&c?await ReportsManager.renderReports(c):c&&await StaffManager.renderStaffList(c);if(e){window.showAlert("Staff updated");return}if(s?.applied){const l=`Staff added. Auto hold set for ${s.holdDays} days.`;window.showAlert(s.warning?`${l} ${s.warning}`:l);return}window.showAlert(s?.warning||"Staff added")}catch(r){window.showAlert(r.message||"Failed to save staff")}finally{StaffManager._isSavingStaff=!1,n&&(n.disabled=!1,n.textContent=n.dataset.originalText||"Save Staff",delete n.dataset.originalText)}},toggleStaffStatus:async t=>{const e=StorageManager.get("staff")||[],n=e.findIndex(a=>a.id===t);if(n!==-1){const a=e[n].status==="active"?"inactive":"active";try{await ApiClient.updateEmployee(t,{status:a}),await ApiSyncManager.bootstrap(!0),StaffManager.renderStaffList(document.getElementById("view-container")),window.showAlert("Status updated")}catch(i){window.showAlert(i.message||"Failed to update status")}}},deleteStaff:async t=>{if(await ConfirmManager.ask("Are you sure? This will remove all records for this staff."))try{await ApiClient.deleteEmployee(t),await ApiSyncManager.bootstrap(!0),StaffManager.renderStaffList(document.getElementById("view-container")),window.showAlert("Staff deleted")}catch(n){window.showAlert(n.message||"Failed to delete staff")}},showAdvanceModal:t=>{const e=`
            <form id="advance-form" onsubmit="StaffManager.handleAdvanceSubmit(event, '${t}')">
                <div id="advance-ledger-status" style="margin-bottom:1rem;"></div>
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="adv-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Transaction Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-exchange-alt"></i>
                        <select id="adv-type">
                            <option value="paid">Debit - Given to Staff</option>
                            <option value="received">Credit - Received from Staff</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="adv-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="adv-remark" placeholder="e.g. Urgent help, Medical">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Record</button>
                </div>
            </form>
        `;ModalManager.show("Advance Payment",e),setTimeout(()=>{setupCustomDropdown("adv-type"),StaffManager.initDatePicker("#adv-date",{defaultDate:"today",dateFormat:"Y-m-d"}),StaffManager.refreshAdvanceModalSummary(t)},50)},showEditAdvanceModal:(t,e)=>{const a=((StorageManager.get("advances")||{})[t]||[]).find(r=>r.id===e);if(!a)return;StaffManager.showAdvanceModal(t),document.getElementById("modal-title").textContent="Edit Advance Payment",document.getElementById("adv-amount").value=a.amount,document.getElementById("adv-type").value=a.type,document.getElementById("adv-date").value=a.date,document.getElementById("adv-remark").value=a.remark||"";const i=document.getElementById("advance-form");i.onsubmit=r=>StaffManager.handleAdvanceSubmit(r,t,e)},handleAdvanceSubmit:async(t,e,n=null)=>{t.preventDefault();const a=StaffManager.getPositiveAmount("adv-amount","Loan/advance amount");if(a===null)return;const i=document.getElementById("adv-type").value;let r=null;try{r=await StaffManager.getLedgerSummary(e)}catch(v){window.showAlert(v.message||"Backend advance summary load nahi ho payi");return}const o=(StorageManager.get("advances")||{})[e]||[],s=n?o.find(v=>Number(v.id)===Number(n)):null,c=s?.type==="received"?Number(s.amount||0):0,l=Number(r.loanBalance||0)+c;if(i==="received"){if(l<=0){window.showAlert("Advance balance nahi hai, credit receive nahi ho sakta");return}if(a>l){window.showAlert(`Credit amount advance balance se zyada nahi ho sakta. Available: \u20B9${l.toLocaleString()}`);return}}const p={employee_id:Number(e),amount:a,type:i==="paid"?"advance":"advance_paid",date:document.getElementById("adv-date").value,notes:document.getElementById("adv-remark").value,repay_months:1};try{if(n?await ApiClient.updateAof(n,p):await ApiClient.createAof(p),await ApiSyncManager.bootstrap(!0),ModalManager.hide(),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const b=document.getElementById("profile-month-picker");if(b){const[f,h]=b.value.split("-");await StaffManager.renderProfilePage(document.getElementById("view-container"),e,parseInt(h,10)-1,parseInt(f,10))}else await StaffManager.renderProfilePage(document.getElementById("view-container"),e)}window.showAlert(n?"Advance payment updated":"Advance payment saved")}catch(v){window.showAlert(v.message||"Failed to save advance")}},deleteAdvance:async(t,e)=>{if(await ConfirmManager.ask("Delete this record?"))try{if(await ApiClient.deleteAof(e),await ApiSyncManager.bootstrap(!0),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const i=document.getElementById("profile-month-picker");if(i){const[r,o]=i.value.split("-");await StaffManager.renderProfilePage(document.getElementById("view-container"),t,parseInt(o,10)-1,parseInt(r,10))}else await StaffManager.renderProfilePage(document.getElementById("view-container"),t)}window.showAlert("Advance payment deleted")}catch(a){window.showAlert(a.message||"Failed to delete record")}},showSavingModal:(t,e="deposit")=>{const n=`
            <form id="saving-form" onsubmit="StaffManager.handleSavingSubmit(event, '${t}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="saving-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Saving Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-piggy-bank"></i>
                        <select id="saving-type">
                            <option value="deposit" ${e==="deposit"?"selected":""}>Deposit</option>
                            <option value="withdraw" ${e==="withdraw"?"selected":""}>Withdraw</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="saving-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="saving-remark" placeholder="e.g. Monthly saving">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width" style="background:var(--success);">Save Saving</button>
                </div>
            </form>
        `;ModalManager.show("Manage Saving",n),setTimeout(()=>{setupCustomDropdown("saving-type"),StaffManager.initDatePicker("#saving-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},showEditSavingModal:(t,e)=>{const a=((StorageManager.get("savings")||{})[t]||[]).find(r=>r.id===e);if(!a)return;StaffManager.showSavingModal(t,a.type),document.getElementById("modal-title").textContent="Edit Saving Record",document.getElementById("saving-amount").value=a.amount,document.getElementById("saving-type").value=a.type,document.getElementById("saving-date").value=a.date,document.getElementById("saving-remark").value=a.remark||"";const i=document.getElementById("saving-form");i.onsubmit=r=>StaffManager.handleSavingSubmit(r,t,e)},handleSavingSubmit:async(t,e,n=null)=>{t.preventDefault();const a=StaffManager.getPositiveAmount("saving-amount","Saving amount");if(a===null)return;const i=document.getElementById("saving-type").value,r=StaffManager.getLoanAndSavingState(e);if(i==="withdraw"){if(r.savingBalance<=0){window.showAlert("Saving master me balance nahi hai, withdraw nahi ho sakta");return}if(a>r.savingBalance){window.showAlert(`Withdraw amount saving balance se zyada nahi ho sakta. Available: &#8377;${r.savingBalance.toLocaleString()}`);return}}const o=i==="withdraw"?"saving_withdraw":"saving_deposit",s={employee_id:Number(e),amount:a,type:o,date:document.getElementById("saving-date").value,notes:document.getElementById("saving-remark").value,repay_months:1};try{n?await ApiClient.updateAof(n,s):await ApiClient.createAof(s),await ApiSyncManager.bootstrap(!0),ModalManager.hide(),document.getElementById("salary-list")?await SalaryManager.refreshSalaryList():await StaffManager.renderProfilePage(document.getElementById("view-container"),e),window.showAlert(n?"Saving updated":"Saving recorded")}catch(c){window.showAlert(c.message||"Failed to save saving entry")}},deleteSaving:async(t,e)=>{if(await ConfirmManager.ask("Delete this saving record?"))try{await ApiClient.deleteAof(e),await ApiSyncManager.bootstrap(!0),document.getElementById("salary-list")?await SalaryManager.refreshSalaryList():await StaffManager.renderProfilePage(document.getElementById("view-container"),t),window.showAlert("Saving record deleted")}catch(a){window.showAlert(a.message||"Failed to delete saving record")}},showTransferModal:t=>{const e=StaffManager.getLoanAndSavingState(t),n=`
            <form id="transfer-form" onsubmit="StaffManager.handleTransferSubmit(event, '${t}')">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:1rem;">
                    <div style="padding:12px; border-radius:12px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.2);">
                        <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase;">Loan Balance</div>
                        <div style="font-size:1.1rem; font-weight:800; color:var(--danger);">&#8377;${e.loanBalance.toLocaleString()}</div>
                    </div>
                    <div style="padding:12px; border-radius:12px; background:rgba(0, 184, 148, 0.06); border:1px solid rgba(0, 184, 148, 0.2);">
                        <div style="font-size:0.75rem; font-weight:700; color:var(--success); text-transform:uppercase;">Saving Balance</div>
                        <div style="font-size:1.1rem; font-weight:800; color:var(--success);">&#8377;${e.savingBalance.toLocaleString()}</div>
                    </div>
                </div>
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="transfer-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Direction</label>
                    <div class="input-wrapper">
                        <i class="fas fa-right-left"></i>
                        <select id="transfer-direction">
                            <option value="loan_to_saving">Loan Master to Saving Master</option>
                            <option value="saving_to_loan">Saving Master to Loan Master</option>
                        </select>
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="transfer-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remark (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="transfer-remark" placeholder="e.g. Shift excess fund">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Transfer Fund</button>
                </div>
            </form>
        `;ModalManager.show("Transfer Between Masters",n),setTimeout(()=>{setupCustomDropdown("transfer-direction"),StaffManager.initDatePicker("#transfer-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},handleTransferSubmit:async(t,e)=>{t.preventDefault();const n=StaffManager.getPositiveAmount("transfer-amount","Transfer amount");if(n!==null)try{await ApiClient.transferFund({employee_id:Number(e),amount:n,direction:document.getElementById("transfer-direction").value,date:document.getElementById("transfer-date").value,notes:document.getElementById("transfer-remark").value}),await ApiSyncManager.bootstrap(!0),ModalManager.hide(),document.getElementById("salary-list")?await SalaryManager.refreshSalaryList():await StaffManager.renderProfilePage(document.getElementById("view-container"),e),window.showAlert("Fund transferred successfully")}catch(a){window.showAlert(a.message||"Failed to transfer fund")}},showMarkAttendanceModal:(t,e)=>{const a=((StorageManager.get("attendance")||{})[e]||{})[t]||"absent",o=`
            <div style="text-align:center; padding:10px;">
                <p style="color:var(--text-muted); margin-bottom:1.5rem;">Marking attendance for: <br><strong>${new Date(e).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</strong></p>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${t}', '${e}', 'present')" 
                        style="border-color:var(--success); color:var(--success); background:${a==="present"?"rgba(0, 184, 148, 0.1)":"transparent"};">
                        <i class="fas fa-check-circle" style="margin-right:8px;"></i> Present
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${t}', '${e}', 'absent')" 
                        style="border-color:var(--danger); color:var(--danger); background:${a==="absent"?"rgba(214, 48, 49, 0.1)":"transparent"};">
                        <i class="fas fa-times-circle" style="margin-right:8px;"></i> Absent
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${t}', '${e}', 'halfday')" 
                        style="border-color:var(--warning); color:var(--warning); background:${a==="halfday"?"rgba(253, 203, 110, 0.1)":"transparent"};">
                        <i class="fas fa-adjust" style="margin-right:8px;"></i> Half Day
                    </button>
                    <button class="btn-outline" onclick="StaffManager.handleMarkAttendance('${t}', '${e}', 'holiday')" 
                        style="border-color:var(--info); color:var(--info); background:${a==="holiday"?"rgba(9, 132, 227, 0.1)":"transparent"};">
                        <i class="fas fa-mug-hot" style="margin-right:8px;"></i> Weekly Off
                    </button>
                </div>
            </div>
        `;ModalManager.show("Mark Attendance",o)},handleMarkAttendance:async(t,e,n)=>{const a=StorageManager.get("attendance")||{};a[e]||(a[e]={});const i=a[e][t];a[e][t]=n,ApiSyncManager.primeAttendanceDay(e,a[e]),window.SyncStatus?.show("Saving attendance...","saving");const r=new Date(`${e}T00:00:00`);ModalManager.hide();const o=document.getElementById("salary-list");o?await SalaryManager.refreshSalaryList():await StaffManager.renderProfilePage(document.getElementById("view-container"),t,r.getMonth(),r.getFullYear());try{await ApiClient.saveAttendance({employee_id:Number(t),date:e,status:ApiSyncManager.statusToApi(n)}),window.SyncStatus?.show(`Attendance saved for ${new Date(e).toLocaleDateString()}`,"success",1600),window.showAlert(`Status updated for ${new Date(e).toLocaleDateString()}`)}catch(s){const c=StorageManager.get("attendance")||{};c[e]||(c[e]={}),i?c[e][t]=i:delete c[e][t],ApiSyncManager.primeAttendanceDay(e,c[e]),o?await SalaryManager.refreshSalaryList():await StaffManager.renderProfilePage(document.getElementById("view-container"),t,r.getMonth(),r.getFullYear()),window.SyncStatus?.show("Attendance sync failed","error",2800),window.showAlert(s.message||"Failed to update attendance")}},showQuickSalaryActionModal:t=>{const e=(StorageManager.get("staff")||[]).find(s=>s.id===t);if(!e)return;const n=new Date,a=`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`,i=StaffManager.getLocalPendingHold(t,e.salaryAmount),r=Number(i.days||0)>0,o=`
            <div class="quick-salary-modal" style="padding:10px;">
                <p class="quick-salary-subtitle" style="text-align:center; color:var(--text-muted); margin-bottom:1.5rem;">Quick adjustment for <strong>${e.name}</strong></p>
                
                <div class="quick-salary-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; margin-bottom:2rem;">
                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(108, 92, 231, 0.25); color:#6c5ce7; background:rgba(108, 92, 231, 0.07); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showAdvanceModal('${t}')">
                        <i class="fas fa-wallet" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Advance Payment</span>
                    </button>

                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(214, 48, 49, 0.2); color:var(--danger); background:rgba(214, 48, 49, 0.08); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showDeductionModal('${t}')">
                        <i class="fas fa-minus-circle" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Payment Deduction</span>
                    </button>
                    
                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:rgba(0, 184, 148, 0.2); color:var(--success); background:rgba(0, 184, 148, 0.05); transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showOvertimeModal('${t}')">
                        <i class="fas fa-clock" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">Overtime</span>
                    </button>

                    <button class="btn-outline quick-salary-card" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:1.5rem 0.5rem; border-color:${r?"var(--danger)":"rgba(99, 110, 114, 0.2)"}; color:${r?"var(--danger)":"var(--text-muted)"}; background:${r?"rgba(214, 48, 49, 0.05)":"rgba(99, 110, 114, 0.05)"}; transition:all 0.3s ease; border-radius:20px;" 
                        onclick="StaffManager.showHoldToggleModal('${t}', '${a}')">
                        <i class="fas ${r?"fa-lock":"fa-play-circle"}" style="font-size:1.8rem; margin-bottom:5px;"></i>
                        <span style="font-size:0.85rem; font-weight:700;">${r?"Held (Manage)":"Hold Salary"}</span>
                    </button>
                </div>

                <div class="quick-salary-note" style="background:var(--bg-main); padding:1rem; border-radius:12px; border:1px solid var(--border); display:flex; gap:12px; align-items:start;">
                    <i class="fas fa-info-circle" style="color:var(--info); margin-top:3px;"></i>
                    <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin:0;">
                        <strong>Advance Payment</strong> debit/credit real backend ledger me save hota hai. <strong>Amount Deduction</strong> selected date wale month's salary me apply hota hai.
                    </p>
                </div>
            </div>
        `;ModalManager.show("Quick Salary Actions",o)},getHoldMonthOptions:(t,e=null)=>{const n=["January","February","March","April","May","June","July","August","September","October","November","December"],a=new Date,r=(e!==null?Math.min(e,a.getFullYear()):parseInt(document.getElementById("hold-year-select")?.value,10)||a.getFullYear())>=a.getFullYear()?a.getMonth():11;return n.slice(0,r+1).map((o,s)=>`<option value="${s}" ${s===t?"selected":""}>${o}</option>`).join("")},getHoldYearOptions:t=>{const e=new Date().getFullYear(),n=Math.min(t,e);return Array.from(new Set([n,e,e-1])).sort((i,r)=>r-i).map(i=>`<option value="${i}" ${i===n?"selected":""}>${i}</option>`).join("")},refreshHoldModalMonth:t=>{const e=parseInt(document.getElementById("hold-month-select")?.value,10),n=parseInt(document.getElementById("hold-year-select")?.value,10);if(Number.isNaN(e)||Number.isNaN(n))return;const a=`${n}-${String(e+1).padStart(2,"0")}`;StaffManager.showHoldToggleModal(t,a)},showHoldToggleModal:async(t,e)=>{const n=(StorageManager.get("staff")||[]).find(A=>A.id===t);if(!n)return;const a=StorageManager.get("salaryAdjustments")||{},i=new Date,[r,o]=(e||`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}`).split("-"),s=parseInt(r,10)||i.getFullYear(),c=s>=i.getFullYear()?i.getMonth():11,l=(parseInt(o,10)||i.getMonth()+1)-1,p=Math.min(l,c),v=`${s}-${String(p+1).padStart(2,"0")}`,b=(a[t]||{})[v]||{hold:!1,holdDays:0},f=StaffManager.getLocalPendingHold(t,n.salaryAmount),M=(await ApiClient.getPayrollSummary(Number(t),p+1,s).catch(()=>null))?.hold_info||{total_hold_days:0,total_hold_amount:0},F=Math.max(Number(b.holdDays||0),Number(f.days||0),Number(M.total_hold_days||0)),$=Math.max(Math.round(Number(f.amount||0)),Math.round(Number(M.total_hold_amount||0))),P=!!b.hold||Number(b.holdDays||0)>0||Number(f.days||0)>0||Number(M.total_hold_days||0)>0||Number(M.total_hold_amount||0)>0,C=`
            <div class="input-group" style="margin-bottom:1.25rem;">
                <label>Select Month</label>
                <div style="display:flex; gap:10px;">
                    <select id="hold-month-select" class="full-width" onchange="StaffManager.refreshHoldModalMonth('${t}')" style="padding:12px; border-radius:12px; background:var(--bg-main); font-weight:600;">
                        ${StaffManager.getHoldMonthOptions(p,s)}
                    </select>
                    <select id="hold-year-select" onchange="StaffManager.refreshHoldModalMonth('${t}')" style="width:120px; padding:12px; border-radius:12px; background:var(--bg-main); font-weight:600;">
                        ${StaffManager.getHoldYearOptions(s)}
                    </select>
                </div>
            </div>
        `;if(P){const A=`
                <div style="text-align:center; padding:1rem;">
                    ${C}
                    <div style="background:rgba(214, 48, 49, 0.1); width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem; color:var(--danger); font-size:1.5rem;">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h3>Salary is Currently Held</h3>
                    <p style="color:var(--text-muted); margin:10px 0 8px;">Pending Hold: <strong>${F} Days</strong>${$>0?` | <strong>&#8377;${$.toLocaleString()}</strong>`:""}</p>
                    <p style="color:var(--text-muted); margin:0 0 20px; font-size:0.85rem;">Release selected month se trigger hoga, lekin active hold overall clear ho jayega.</p>
                    <button class="btn-primary" style="background:var(--success); width:100%;" onclick="StaffManager.toggleHoldSalary('${t}', '${v}', false)">
                        <i class="fas fa-unlock"></i> Release Salary
                    </button>
                    <button class="btn-outline" style="width:100%; margin-top:10px;" onclick="ModalManager.hide()">Cancel</button>
                </div>
            `;ModalManager.show(`Manage Hold - ${n.name}`,A)}else{const A=`
                <div style="padding:0.5rem;">
                    ${C}
                    <p style="margin-bottom:1.5rem; color:var(--text-muted); font-size:0.9rem;">Select how many days of salary you want to put on hold for this month.</p>
                    <div class="input-group">
                        <label>Days to Hold</label>
                        <div class="input-wrapper">
                            <i class="fas fa-calendar-times"></i>
                            <input type="number" id="manual-hold-days" value="31" min="1" max="31" placeholder="e.g. 30">
                        </div>
                    </div>
                    <button class="btn-primary" style="width:100%; background:var(--danger); margin-top:1rem;" onclick="StaffManager.toggleHoldSalary('${t}', '${v}', true)">
                        <i class="fas fa-lock"></i> Put on Hold
                    </button>
                </div>
            `;ModalManager.show(`Hold Salary - ${n.name}`,A)}setupCustomDropdown("hold-month-select"),setupCustomDropdown("hold-year-select")},toggleHoldSalary:async(t,e,n)=>{const a=StorageManager.get("salaryAdjustments")||{};a[t]||(a[t]={}),a[t][e]||(a[t][e]={overtime:0,advance:0,fine:0,adjustment:0,hold:!1,holdDays:0});const i={...a[t][e]},r=JSON.parse(JSON.stringify(a[t]||{})),o=n&&parseInt(document.getElementById("manual-hold-days").value)||0;try{if(window.SyncStatus?.show(n?"Saving hold...":"Releasing hold...","saving"),n)await ApiClient.addManualHold(t,o);else{const c=StaffManager.getLocalPendingHold(t,0),l=Number(c.days||i.holdDays||0);await ApiClient.releaseManualHold(t,l)}if(n?(a[t][e].hold=!0,a[t][e].holdDays=o):Object.keys(a[t]).forEach(c=>{a[t][c]&&(a[t][c].hold=!1,a[t][c].holdDays=0)}),StorageManager.save("salaryAdjustments",a),ModalManager.hide(),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const c=document.getElementById("profile-month-picker");if(c){const[l,p]=c.value.split("-");await StaffManager.renderProfilePage(document.getElementById("view-container"),t,parseInt(p)-1,parseInt(l))}}window.SyncStatus?.show(n?`Hold saved for ${o} days`:"Hold released","success",1600),window.showAlert(n?`Salary held for ${o} days`:"Salary released successfully")}catch(s){a[t]=r,a[t][e]=i,StorageManager.save("salaryAdjustments",a),window.SyncStatus?.show("Hold sync failed","error",2800),window.showAlert(s.message||"Failed to update hold")}},showDeductionModal:t=>{const e=`
            <form id="deduction-form" onsubmit="StaffManager.handleDeductionSubmit(event, '${t}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="deduction-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Deduction Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-minus-circle"></i>
                        <input type="number" id="deduction-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="deduction-remark" placeholder="e.g. Breakage, Uniform, Cash short">
                    </div>
                </div>
                <div style="margin-top:1.5rem;">
                    <button type="submit" class="btn-primary full-width" style="background:#b26a00;">Save Deduction</button>
                </div>
            </form>
        `;ModalManager.show("Add Payment Deduction",e),setTimeout(()=>{StaffManager.initDatePicker("#deduction-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},handleDeductionSubmit:async(t,e,n=null)=>{t.preventDefault();const a=document.getElementById("deduction-date").value,i=StaffManager.getPositiveAmount("deduction-amount","Deduction amount");if(i===null)return;const r=document.getElementById("deduction-remark").value,o=new Date(`${a}T00:00:00`),s={employee_id:Number(e),amount:i,date:a,notes:r,type:"deduction",repay_months:1};try{if(n?await ApiClient.updateAof(n,s):await ApiClient.createAof(s),await ApiSyncManager.bootstrap(!0),await ApiSyncManager.syncMonth(o.getMonth()+1,o.getFullYear(),!0),ModalManager.hide(),document.getElementById("salary-list")){const l=document.getElementById("salary-month"),p=document.getElementById("salary-year");l&&p&&(l.value=String(o.getMonth()),p.value=String(o.getFullYear())),await SalaryManager.refreshSalaryList()}else{const l=document.getElementById("view-container"),p=document.getElementById("profile-month-picker");if(l&&p){const[v,b]=p.value.split("-");await StaffManager.renderProfilePage(l,e,parseInt(b,10)-1,parseInt(v,10))}}window.showAlert(`Deduction saved for ${o.toLocaleDateString("en-US",{month:"long",year:"numeric"})}`)}catch(c){window.showAlert(c.message||"Failed to save deduction")}},showFineModal:t=>{const e=`
            <form id="fine-form" onsubmit="StaffManager.handleFineSubmit(event, '${t}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="fine-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Payment Deduction Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="fine-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="fine-remark" placeholder="e.g. Late coming, Glass broken">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Payment Deduction</button>
                </div>
            </form>
        `;ModalManager.show("Add Payment Deduction",e),setTimeout(()=>{StaffManager.initDatePicker("#fine-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},handleFineSubmit:async(t,e,n=null)=>{t.preventDefault();const a=StaffManager.getPositiveAmount("fine-amount","Payment deduction amount");if(a===null)return;const i={employee_id:Number(e),amount:a,date:document.getElementById("fine-date").value,notes:document.getElementById("fine-remark").value,type:"fine",repay_months:1};try{if(n?await ApiClient.updateAof(n,i):await ApiClient.createAof(i),await ApiSyncManager.bootstrap(!0),ModalManager.hide(),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const o=document.getElementById("view-container");if(o&&o.querySelector(".mini-calendar")){const s=document.getElementById("profile-month-picker");if(s){const[c,l]=s.value.split("-");await StaffManager.renderProfilePage(o,e,parseInt(l)-1,parseInt(c))}else await StaffManager.renderProfilePage(o,e)}}window.showAlert(n?"Payment deduction updated":"Payment deduction recorded")}catch(r){window.showAlert(r.message||"Failed to save payment deduction")}},showEditFineModal:(t,e)=>{const a=((StorageManager.get("fines")||{})[t]||[]).find(r=>r.id===e);if(!a)return;StaffManager.showFineModal(t),document.getElementById("modal-title").textContent="Edit Payment Deduction Record",document.getElementById("fine-amount").value=a.amount,document.getElementById("fine-date").value=a.date,document.getElementById("fine-remark").value=a.remark||"";const i=document.getElementById("fine-form");i.onsubmit=r=>StaffManager.handleFineSubmit(r,t,e)},deleteFine:async(t,e)=>{if(await ConfirmManager.ask("Delete this payment deduction record?"))try{if(await ApiClient.deleteAof(e),await ApiSyncManager.bootstrap(!0),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const i=document.getElementById("view-container");if(i&&i.querySelector(".mini-calendar")){const r=document.getElementById("profile-month-picker");if(r){const[o,s]=r.value.split("-");await StaffManager.renderProfilePage(i,t,parseInt(s)-1,parseInt(o))}else await StaffManager.renderProfilePage(i,t)}}window.showAlert("Payment deduction record deleted")}catch(a){window.showAlert(a.message||"Failed to delete payment deduction")}},showOvertimeModal:t=>{const e=`
            <form id="overtime-form" onsubmit="StaffManager.handleOvertimeSubmit(event, '${t}')">
                <div class="input-group">
                    <label>Date</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="text" id="ot-date" required class="date-input">
                    </div>
                </div>
                <div class="input-group">
                    <label>Amount (&#8377;)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-money-bill-wave"></i>
                        <input type="number" id="ot-amount" required min="0.01" step="0.01" placeholder="0.00">
                    </div>
                </div>
                <div class="input-group">
                    <label>Remarks</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sticky-note"></i>
                        <input type="text" id="ot-remark" placeholder="e.g. Extra shift, Sunday working">
                    </div>
                </div>
                <div style="margin-top: 1.5rem;">
                    <button type="submit" class="btn-primary full-width">Save Overtime</button>
                </div>
            </form>
        `;ModalManager.show("Add Overtime",e),setTimeout(()=>{StaffManager.initDatePicker("#ot-date",{defaultDate:"today",dateFormat:"Y-m-d"})},50)},handleOvertimeSubmit:async(t,e,n=null)=>{t.preventDefault();const a=StaffManager.getPositiveAmount("ot-amount","Overtime amount");if(a===null)return;const i={employee_id:Number(e),amount:a,date:document.getElementById("ot-date").value,notes:document.getElementById("ot-remark").value,type:"overtime",repay_months:1};try{if(n?await ApiClient.updateAof(n,i):await ApiClient.createAof(i),await ApiSyncManager.bootstrap(!0),ModalManager.hide(),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const o=document.getElementById("view-container");if(o&&o.querySelector(".mini-calendar")){const s=document.getElementById("profile-month-picker");if(s){const[c,l]=s.value.split("-");await StaffManager.renderProfilePage(o,e,parseInt(l)-1,parseInt(c))}else await StaffManager.renderProfilePage(o,e)}}window.showAlert(n?"Overtime updated":"Overtime recorded")}catch(r){window.showAlert(r.message||"Failed to save overtime")}},showEditOvertimeModal:(t,e)=>{const a=((StorageManager.get("overtime")||{})[t]||[]).find(r=>r.id===e);if(!a)return;StaffManager.showOvertimeModal(t),document.getElementById("modal-title").textContent="Edit Overtime Record",document.getElementById("ot-amount").value=a.amount,document.getElementById("ot-date").value=a.date,document.getElementById("ot-remark").value=a.remark||"";const i=document.getElementById("overtime-form");i.onsubmit=r=>StaffManager.handleOvertimeSubmit(r,t,e)},deleteOvertime:async(t,e)=>{if(await ConfirmManager.ask("Delete this overtime record?"))try{if(await ApiClient.deleteAof(e),await ApiSyncManager.bootstrap(!0),document.getElementById("salary-list"))await SalaryManager.refreshSalaryList();else{const i=document.getElementById("view-container");if(i&&i.querySelector(".mini-calendar")){const r=document.getElementById("profile-month-picker");if(r){const[o,s]=r.value.split("-");await StaffManager.renderProfilePage(i,t,parseInt(s)-1,parseInt(o))}else await StaffManager.renderProfilePage(i,t)}}window.showAlert("Overtime record deleted")}catch(a){window.showAlert(a.message||"Failed to delete overtime")}}};window.StaffManager=StaffManager,document.addEventListener("click",t=>{t.target.closest?.(".profile-month-picker")||document.querySelectorAll(".profile-month-menu.open").forEach(n=>n.classList.remove("open"))});

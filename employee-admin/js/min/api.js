const ApiClient={_workingBaseUrl:null,get configuredApiRoot(){const e=window.EmployeeAdminEnv?.API_BASE_URL||"";return String(e).trim().replace(/\/+$/,"").replace(/\/api\/v1$/,"")},get configuredBaseUrl(){return this.configuredApiRoot?this.configuredApiRoot.includes("?route=")?this.configuredApiRoot:`${this.configuredApiRoot}/api/v1`:""},get appRoot(){if(this.configuredApiRoot)return this.configuredApiRoot;const e="/employee-admin",t=window.location.pathname||"",a=t.indexOf(e);return a!==-1?`${window.location.origin}${t.slice(0,a)}/employee-api`:`${window.location.origin}/employee-api`},get baseUrl(){return`${this.appRoot}/api/v1`},get gatewayUrl(){return`${this.appRoot}/gateway.php?route=/api/v1`},get baseUrlCandidates(){const e=window.location.origin,t=this.configuredBaseUrl,a=t?[t]:[`${e}/api/v1`,`${e}/index.php/api/v1`,this.gatewayUrl,this.baseUrl,`${this.appRoot}/index.php/api/v1`,`${this.appRoot}/index.php?route=/api/v1`],n=this._workingBaseUrl?[this._workingBaseUrl,...a]:a;return Array.from(new Set(n))},buildUrl(e,t){if(!e.includes("?route="))return`${e}${t}`;const a=t.indexOf("?");if(a===-1)return`${e}${t}`;const n=t.slice(0,a),o=t.slice(a+1);return`${e}${n}&${o}`},async request(e,t={}){const{method:a="GET",body:n,formData:o,headers:r={}}=t,i={Accept:"application/json","Cache-Control":"no-store",...r},s=sessionStorage.getItem("employee_management_admin_token");s&&(i.Authorization=`Bearer ${s}`);const l={method:a,headers:i,cache:"no-store"};o?(l.body=o,delete l.headers["Content-Type"]):n!==void 0&&(l.headers["Content-Type"]="application/json",l.body=JSON.stringify(n));let d=null;for(const g of this.baseUrlCandidates)try{const c=await fetch(this.buildUrl(g,e),l),m=await c.text();let y=null;if(m)try{y=JSON.parse(m)}catch{if(c.status===404){d=new Error(`Invalid server response (${c.status})`);continue}throw new Error(`Invalid server response (${c.status})`)}if(c.status===404){d=new Error(y?.message||`Request failed (${c.status})`);continue}if(!c.ok||y?.status===!1)throw new Error(y?.message||`Request failed (${c.status})`);return this._workingBaseUrl=g,y?.data??null}catch(c){if(d=c,!String(c?.message||"").includes("(404)"))throw c}throw d||new Error("API request failed")},login(e,t){return this.request("/login",{method:"POST",body:{username:e,password:t}})},changePassword(e,t,a){return this.request("/profile/change-password",{method:"POST",body:{username:e,current_password:t,new_password:a}})},getProfile(e={}){const t=new URLSearchParams;return e.id&&t.set("id",e.id),e.username&&t.set("username",e.username),this.request(`/profile?${t.toString()}`)},updateProfile(e,t){return this.request(`/profile/update/${encodeURIComponent(e)}`,{method:"POST",body:t})},getDashboard(){return this.request("/dashboard")},getAttendanceReport(e,t){return this.request(`/reports/attendance?month=${encodeURIComponent(e)}&year=${encodeURIComponent(t)}`)},getSalaryReport(e,t){return this.request(`/reports/salary?month=${encodeURIComponent(e)}&year=${encodeURIComponent(t)}`)},listEmployees(){return this.request("/employees")},createEmployee(e){return this.request("/employees",{method:"POST",body:e})},updateEmployee(e,t){return this.request(`/employees/${e}`,{method:"PUT",body:t})},deleteEmployee(e){return this.request(`/employees/${e}`,{method:"DELETE"})},uploadEmployeeImage(e,t){const a=new FormData;return a.append("profile_image",t),this.request(`/employees/${e}/upload-image`,{method:"POST",formData:a})},uploadProfileImage(e,t){const a=new FormData;return a.append("id",e),a.append("profile_image",t),this.request("/profile/upload-image",{method:"POST",formData:a})},getAttendanceByDate(e){return this.request(`/attendance?date=${encodeURIComponent(e)}`)},getAttendanceByEmployeeMonth(e,t,a){return this.request(`/attendance?employee_id=${encodeURIComponent(e)}&month=${encodeURIComponent(t)}&year=${encodeURIComponent(a)}`)},getAttendanceMonth(e,t){return this.request(`/attendance?scope=month&month=${encodeURIComponent(e)}&year=${encodeURIComponent(t)}`)},saveAttendance(e){return this.request("/attendance",{method:"POST",body:e})},saveAttendanceBulk(e){return this.request("/attendance/bulk",{method:"POST",body:{records:e}})},listAof(e=null,t=null,a=null,n=null){const o=new URLSearchParams;e!=null&&o.set("month",e),t!=null&&o.set("year",t),a!=null&&o.set("employee_id",a),n!=null&&o.set("type",n);const r=o.toString();return this.request(r?`/aof?${r}`:"/aof")},getAofSummary(e){return this.request(`/aof/summary?employee_id=${encodeURIComponent(e)}`)},createAof(e){return this.request("/aof",{method:"POST",body:e})},transferFund(e){return this.request("/aof/transfer",{method:"POST",body:e})},updateAof(e,t){return this.request(`/aof/${e}`,{method:"PUT",body:t})},deleteAof(e){return this.request(`/aof/${e}`,{method:"DELETE"})},listPayroll(e,t){return e==null||t===void 0||t===null?this.request("/payroll"):this.request(`/payroll?month=${encodeURIComponent(e)}&year=${encodeURIComponent(t)}`)},getPayrollSummary(e,t,a,n=null,o=!1){let r=`/payroll/summary?employee_id=${encodeURIComponent(e)}&month=${encodeURIComponent(t)}&year=${encodeURIComponent(a)}`;return n!==null&&(r+=`&advance_deduction=${encodeURIComponent(Number(n)||0)}`),o&&(r+="&release_hold=1"),this.request(r)},generatePayroll(e){return this.request("/payroll/generate",{method:"POST",body:e})},addManualHold(e,t,a=0){return this.request("/payroll/add-hold",{method:"POST",body:{employee_id:Number(e),days:Number(t)||0,amount:Number(a)||0}})},releaseManualHold(e,t=0){return this.request("/payroll/release-hold",{method:"POST",body:{employee_id:Number(e),days:Number(t)||0}})},deletePayroll(e){return this.request(`/payroll/${e}`,{method:"DELETE"})},deleteAllPayroll(e,t){return this.request(`/payroll/delete-all?month=${encodeURIComponent(e)}&year=${encodeURIComponent(t)}`,{method:"DELETE"})},getSettings(){return this.request("/settings")},updateSettings(e){return this.request("/settings",{method:"PUT",body:e})}};window.PayrollSettings={getDaysDivisor(e,t){const a=StorageManager.get("payroll_settings")||{};return a.payroll_mode==="per_day"?new Date(t,e,0).getDate():Number(a.monthly_days||30)||30}},window.PhotoHelper={normalizeImageUrl(e=""){const t=String(e||"").trim();if(!t)return"";if(/^(data:|blob:)/i.test(t))return t;if(/^https?:/i.test(t)){try{const n=new URL(t);if(n.origin===window.location.origin&&n.pathname.startsWith("/uploads/"))return`${ApiClient.appRoot}${n.pathname}`}catch{return t}return t}if(/^[^/\\]+\.(png|jpe?g|webp|gif|svg)$/i.test(t))return"";const a=t.startsWith("/")?t:`/uploads/profile/${t.replace(/^uploads\/profile\//,"")}`;return a.startsWith("/uploads/")?`${ApiClient.appRoot}${a}`:`${window.location.origin}${a}`},decodeName(e=""){try{return decodeURIComponent(e)}catch{return e||"User"}},getInitials(e=""){const a=this.decodeName(e).trim().split(/\s+/).filter(Boolean);return a.length===0?"U":a.length===1?a[0].slice(0,1).toUpperCase():`${a[0][0]||""}${a[1][0]||""}`.toUpperCase()},pickBackground(e="",t="8B5E3C"){if(t&&t!=="random")return t;const a=["3E2723","0F766E","166534","1D4ED8","7C3AED","B45309","BE123C","374151"],n=this.decodeName(e).split("").reduce((o,r)=>o+r.charCodeAt(0),0);return a[n%a.length]},avatarUrl(e,t="random",a="fff",n=80){const o=this.getInitials(e),r=this.pickBackground(e,t),i=a||"fff",s=Math.max(14,Math.round(n*.38)),l=`
            <svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 ${n} ${n}">
                <rect width="${n}" height="${n}" rx="${Math.round(n*.22)}" fill="#${r}" />
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
                    font-family="Mulish" font-size="${s}" font-weight="700" fill="#${i}">
                    ${o}
                </text>
            </svg>
        `.replace(/\s+/g," ").trim();return`data:image/svg+xml;charset=UTF-8,${encodeURIComponent(l)}`},applyFallback(e,t,a="random",n="fff",o=80){e&&(e.onerror=null,e.src=this.avatarUrl(t,a,n,o))},smartPhoto(e,t,a,n="random",o="fff",r=80){if(!e)return;e.onerror=null,e.src=this.avatarUrl(a,n,o,r);if(!t)return;const s=new Image;s.onload=()=>{e.src=t},s.src=t}},window.HoldSalaryUI={isHeld(e){return Number(e?.activeHoldAmount||e?.active_hold_amount||0)>0||Number(e?.activeHoldDays||e?.active_hold_days||0)>0||Number(e?.total_hold_amount||0)>0||Number(e?.total_hold_days||0)>0},icon(e){return this.isHeld(e)?'<i class="fas fa-lock hold-salary-lock" title="Salary hold active"></i>':""},amount(e,t){return`<span class="salary-amount-with-lock">\u20B9${Number(e||0).toLocaleString()}${this.icon(t)}</span>`}};const ApiSyncManager={CACHE_TTL_MS:300*1e3,_bootPromise:null,_bootIncludesMonth:!1,_monthPromises:{},_datePromises:{},_monthSyncedAt:{},_dateSyncedAt:{},statusFromApi(e){return e==="half_day"?"halfday":e==="weekend"?"holiday":e},statusToApi(e){return e==="halfday"?"half_day":e},monthKey(e,t){return`${t}-${String(e).padStart(2,"0")}`},isFresh(e){return Number(e)>0&&Date.now()-e<this.CACHE_TTL_MS},touchMonth(e,t){this._monthSyncedAt[this.monthKey(e,t)]=Date.now()},touchDate(e){this._dateSyncedAt[e]=Date.now()},primeAttendanceDay(e,t){const a=StorageManager.get("attendance")||{};a[e]={...t||{}},StorageManager.saveLocal("attendance",a),this.touchDate(e);const n=new Date(`${e}T00:00:00`);Number.isNaN(n.getTime())||this.touchMonth(n.getMonth()+1,n.getFullYear())},normalizeEmployee(e){return{id:String(e.id),name:e.name||"",fatherName:e.father_name||"",dob:e.dob||e.date_of_birth||"",mobile:e.mobile||"",mobileAlt:e.alternate_mobile||"",role:e.role||"Staff",joinDate:e.join_date||"",status:String(e.status||"active").toLowerCase(),salaryType:"Monthly",salaryAmount:Number(e.monthly_salary||0),activeHoldDays:Number(e.active_hold_days||0),activeHoldAmount:Number(e.active_hold_amount||0),photo:window.PhotoHelper.normalizeImageUrl(e.profile_image)||null}},normalizeAof(e){const t={},a={},n={},o={},r={};return(e||[]).forEach(i=>{const s=String(i.employee_id),l={id:Number(i.id),amount:Number(i.amount||0),date:i.date,remark:i.notes||"",type:i.type||""};i.type==="advance"||i.type==="advance_paid"?(t[s]||(t[s]=[]),t[s].push({...l,type:i.type==="advance"?"paid":"received"})):i.type==="saving_deposit"||i.type==="saving_withdraw"?(a[s]||(a[s]=[]),a[s].push({...l,type:i.type==="saving_deposit"?"deposit":"withdraw"})):i.type==="transfer_loan_to_saving"||i.type==="transfer_saving_to_loan"?(n[s]||(n[s]=[]),n[s].push({...l,type:i.type==="transfer_loan_to_saving"?"loan_to_saving":"saving_to_loan"})):i.type==="overtime"?(r[s]||(r[s]=[]),r[s].push(l)):(i.type==="fine"||i.type==="deduction")&&(o[s]||(o[s]=[]),o[s].push(l))}),{advances:t,savings:a,transfers:n,fines:o,overtime:r}},buildPayrollState(e){const t={},a={};return(e||[]).forEach(n=>{const o=String(n.employee_id),r=this.monthKey(n.month,n.year),i=Number(n.days_divisor||0)||window.PayrollSettings.getDaysDivisor(Number(n.month),Number(n.year)),s=Number(n.base_salary||0)/i,l=s>0?Math.round(Number(n.hold_deduction||0)/s):0;t[o]||(t[o]={}),t[o][r]={overtime:Number(n.overtime||0),advance:Number(n.advance_deduction||0),fine:Number(n.fine||0),adjustment:0,hold:Number(n.hold_deduction||0)>0,holdDays:l,status:"generated",payrollId:Number(n.id),paid:Number(n.paid||0)===1,netPayable:Number(n.total_salary||0),totalDays:Number(n.total_days||0),presentDays:Number(n.present_days||0),absentDays:Number(n.absent_days||0),halfDays:Number(n.half_days||0),holdAmount:Number(n.hold_deduction||0),releasedAmount:Number(n.hold_salary_released||0),weekendHolidayAmount:Number(n.weekend_holiday_amount||0),raw:n},a[`${o}:${r}`]=n}),{salaryAdjustments:t,payrollMap:a,payrollRecords:e||[]}},mergeAttendance(e,t){return{...e||{},...t||{}}},mergeSalaryAdjustments(e,t){const a={...e||{}};return Object.entries(t||{}).forEach(([n,o])=>{a[n]={...a[n]||{},...o||{}}}),a},async syncCore(e={}){const{includeCurrentMonth:t=!0}=e,a=new Date,n=a.getMonth()+1,o=a.getFullYear(),[r,i,s,l,d]=await Promise.all([ApiClient.listEmployees(),ApiClient.listAof(),ApiClient.listPayroll(n,o),ApiClient.getDashboard(),ApiClient.getSettings().catch(()=>null)]);d&&(StorageManager.saveLocal("payroll_settings",d),["cafe_name","business_address","business_phone","business_email"].forEach(p=>{d[p]!==void 0&&StorageManager.save(p,d[p])}),window.BrandingManager?.applyBranding?.());const g=(r||[]).map(p=>this.normalizeEmployee(p)),{advances:c,savings:m,transfers:y,fines:f,overtime:h}=this.normalizeAof(i),u=this.buildPayrollState(s);StorageManager.saveLocal("staff",g),StorageManager.saveLocal("advances",c),StorageManager.saveLocal("savings",m),StorageManager.saveLocal("transfers",y),StorageManager.saveLocal("fines",f),StorageManager.saveLocal("overtime",h),StorageManager.saveLocal("salaryAdjustments",u.salaryAdjustments),StorageManager.saveLocal("payrollRecords",u.payrollRecords),StorageManager.saveLocal("payrollMap",u.payrollMap),StorageManager.saveLocal("apiDashboard",l),t&&await this.syncMonth(n,o,!0)},async bootstrap(e=!1,t={}){const a=t.includeCurrentMonth!==!1;if(!e&&this._bootPromise&&(this._bootIncludesMonth||!a))return this._bootPromise;const n=!e&&a&&this._bootPromise&&!this._bootIncludesMonth?this._bootPromise:null;this._bootIncludesMonth=a;const o=(async()=>{n&&await n.catch(()=>null),await this.syncCore({includeCurrentMonth:a})})().catch(r=>{throw this._bootPromise===o&&(this._bootPromise=null,this._bootIncludesMonth=!1),r});return this._bootPromise=o,o},async bootstrapCore(e=!1){return this.bootstrap(e,{includeCurrentMonth:!1})},async syncMonth(e,t,a=!1){const n=this.monthKey(e,t);if(!a&&this.isFresh(this._monthSyncedAt[n]))return Promise.resolve();if(!a&&this._monthPromises[n])return this._monthPromises[n];const o=async()=>{const r={};try{((await ApiClient.getAttendanceMonth(e,t))?.list||[]).forEach(h=>{const u=String(h.employee_id||"");u&&(r[h.date]||(r[h.date]={}),r[h.date][u]=this.statusFromApi(h.status))})}catch(y){const f=StorageManager.get("staff")||[],h=await Promise.all(f.map(async p=>{try{const x=await ApiClient.getAttendanceByEmployeeMonth(p.id,e,t);return{staffId:p.id,data:x}}catch{return{staffId:p.id,data:null}}}));if(!h.some(p=>Array.isArray(p?.data?.list)))throw y;h.forEach(p=>{(p?.data?.list||[]).forEach(b=>{r[b.date]||(r[b.date]={}),r[b.date][p.staffId]=this.statusFromApi(b.status)})})}const i=await ApiClient.listPayroll(e,t),s=this.buildPayrollState(i),l=StorageManager.get("attendance")||{},d=StorageManager.get("payrollMap")||{},g=this.monthKey(e,t),c={...d};Object.keys(c).forEach(y=>{y.endsWith(`:${g}`)&&delete c[y]});const m={...l};Object.keys(m).forEach(y=>{y.startsWith(`${g}-`)&&delete m[y]}),StorageManager.saveLocal("attendance",this.mergeAttendance(m,r)),StorageManager.saveLocal("salaryAdjustments",s.salaryAdjustments),StorageManager.saveLocal("payrollRecords",s.payrollRecords),StorageManager.saveLocal("payrollMap",{...c,...s.payrollMap}),this.touchMonth(e,t)};return this._monthPromises[n]=o().finally(()=>{delete this._monthPromises[n]}),this._monthPromises[n]},async syncDate(e,t=!1){if(!t&&this.isFresh(this._dateSyncedAt[e]))return Promise.resolve();if(!t&&this._datePromises[e])return this._datePromises[e];const a=async()=>{const n=await ApiClient.getAttendanceByDate(e),o=StorageManager.get("attendance")||{},r={};(n||[]).forEach(i=>{r[String(i.employee_id)]=this.statusFromApi(i.status)}),o[e]=r,StorageManager.saveLocal("attendance",o),this.touchDate(e)};return this._datePromises[e]=a().finally(()=>{delete this._datePromises[e]}),this._datePromises[e]},async refreshAfterMutation(e=null,t=null){await this.bootstrap(!0),e&&t&&await this.syncMonth(e,t,!0)}},SalaryManager={isActiveStaff:e=>String(e?.status||"active").toLowerCase()==="active",formatSalaryAmountWithHold:(e,t=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(e,t):`\u20B9${Number(e||0).toLocaleString()}`,getAllowedMonthIndexes:e=>{const t=SalaryManager.getPreviousMonthYear(),a=Number(e);if(a>t.year)return[];const n=a===t.year?t.month:11;return Array.from({length:n+1},(o,r)=>r)},getAllowedYears:(e=null)=>{const a=SalaryManager.getPreviousMonthYear().year,n=e!==null?Math.min(e,a):null,o=[a,a-1];return n!==null&&n<a-1&&o.push(n),Array.from(new Set(o)).sort((r,i)=>i-r)},syncSalaryMonthOptions:()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const a=["January","February","March","April","May","June","July","August","September","October","November","December"],n=Number(t.value),o=SalaryManager.getAllowedMonthIndexes(n),r=Number(e.value),i=o.includes(r)?r:o[o.length-1]??SalaryManager.getPreviousMonthYear().month;e.innerHTML=o.slice().reverse().map(s=>`<option value="${s}">${a[s]}</option>`).join(""),e.value=String(i),e.parentElement?._refreshCustomDropdown?.()},getPreviousMonthYear:()=>{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-1,1);return{month:t.getMonth(),year:t.getFullYear()}},getDefaultSalaryPeriod:async()=>SalaryManager.getPreviousMonthYear(),initializeSalaryPeriod:async()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const a=await SalaryManager.getDefaultSalaryPeriod();e.value=String(a.month),t.value=String(a.year),SalaryManager.syncSalaryMonthOptions(),e.parentElement?._refreshCustomDropdown?.(),t.parentElement?._refreshCustomDropdown?.(),await SalaryManager.refreshSalaryList()},handleSalaryYearChange:()=>{SalaryManager.syncSalaryMonthOptions(),SalaryManager.refreshSalaryList()},getSelectedMonthYear:(e=null,t=null)=>{const a=new Date,n=document.getElementById("salary-month"),o=document.getElementById("salary-year");return{month:n?parseInt(n.value,10):e??a.getMonth(),year:o?parseInt(o.value,10):t??a.getFullYear()}},getLocalPendingHold:(e,t=0)=>{const n=(StorageManager.get("salaryAdjustments")||{})[e]||{},o=new Date,r=Number(t||0)/window.PayrollSettings.getDaysDivisor(o.getMonth()+1,o.getFullYear());return Object.values(n).reduce((i,s)=>{const l=Number(s?.holdDays||0);return!s?.hold||l<=0||(i.days+=l,i.amount+=r*l),i},{days:0,amount:0})},renderSalary:e=>{const t=["January","February","March","April","May","June","July","August","September","October","November","December"],n=new Date().getFullYear(),o=SalaryManager.getPreviousMonthYear();e.innerHTML=`
            <div style="display:flex; flex-direction:column; gap:2rem; padding-bottom:2rem;">
                <!-- Header & Stats -->
                <div class="salary-dashboard-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <div>
                        <h1 style="font-size:2rem; font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Salary Dashboard</h1>
                        <p style="color:var(--text-muted); font-weight:600;">Manage monthly payroll and deductions</p>
                        <div id="salary-payroll-mode-badge" style="margin-top:8px; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; background:var(--bg-main); border:1px solid var(--border); font-size:0.78rem; font-weight:700; color:var(--info);">
                            <i class="fas fa-calculator"></i> <span id="salary-mode-text">Loading...</span>
                        </div>
                    </div>
                    <div class="salary-filter-bar" style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-card); padding:8px; border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-calendar-alt" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-month" onchange="SalaryManager.refreshSalaryList()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease; min-width:150px;">
                                ${SalaryManager.getAllowedMonthIndexes(o.year).slice().reverse().map(r=>`<option value="${r}" ${r===o.month?"selected":""}>${t[r]}</option>`).join("")}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-clock" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-year" onchange="SalaryManager.handleSalaryYearChange()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease;">
                                ${SalaryManager.getAllowedYears(o.year).map(r=>`<option value="${r}" ${r===o.year?"selected":""}>${r}</option>`).join("")}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <button id="generate-all-btn" class="btn-primary" onclick="SalaryManager.generateAllSalaries()" style="padding:10px 15px; border-radius:12px; font-size:0.85rem; display:flex; align-items:center; gap:8px; white-space:nowrap;">
                            <i class="fas fa-magic"></i> Generate All
                        </button>
                        <button id="delete-all-btn" class="btn-outline" onclick="SalaryManager.deleteAllSalaries()" style="padding:10px; border-radius:12px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" title="Delete All Generated Salaries">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;">
                    <!-- Total Payable Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(0, 184, 148, 0.1); color:var(--success); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-hand-holding-usd"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Total Payable</label>
                            <h2 id="stats-total-payable" style="font-size:1.6rem; font-weight:700; color:var(--text-main); margin:0;">\u20B90</h2>
                            <div id="stats-pay-period" style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Period: -</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Gross Salary: <span id="stats-total-earned">\u20B90</span></div>
                            <span style="font-size:0.75rem; color:var(--success); font-weight:700;"><i class="fas fa-check-circle"></i> Ready to Pay</span>
                        </div>
                    </div>

                    <!-- Total Held Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(214, 48, 49, 0.1); color:var(--danger); display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-lock"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Total Held Amount</label>
                            <h2 id="stats-total-held" style="font-size:1.6rem; font-weight:700; color:var(--danger); margin:0;">\u20B90</h2>
                            <div style="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Held for <span id="stats-held-count">0</span> Staff</div>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-lock"></i> Locked</span>
                        </div>
                    </div>

                    <!-- Advance Deduction Card -->
                    <div class="card" style="padding:1.5rem; display:flex; align-items:center; gap:1.25rem; transition: transform 0.2s; cursor:default; border:1px solid var(--border);" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width:60px; height:60px; border-radius:18px; background:rgba(108, 92, 231, 0.1); color:#6c5ce7; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div>
                            <label style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Advance Adjusted</label>
                            <h2 id="stats-total-advance" style="font-size:1.6rem; font-weight:700; color:#6c5ce7; margin:0;">\u20B90</h2>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;"><i class="fas fa-sync-alt"></i> Deducted</span>
                        </div>
                    </div>
                </div>

                <!-- Staff Salary Table -->
                <div class="card" style="padding:0; overflow:hidden;">
                    <div class="table-responsive salary-table-wrap">
                        <table class="salary-table" style="width:100%; border-collapse:collapse;">
                            <thead style="background:var(--bg-main);">
                                <tr>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Base Salary</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Working Days</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Earned</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Deductions</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Hold Status</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Advance</th>
                                    <th style="padding:1.2rem; text-align:left; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Final Payable</th>
                                    <th style="padding:1.2rem; text-align:right; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="salary-list">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,setupCustomDropdown("salary-month"),setupCustomDropdown("salary-year"),SalaryManager.initializeSalaryPeriod()},getSearchQuery:()=>(document.getElementById("global-search")?.value||"").trim().toLowerCase(),matchesSearch:(e,t)=>{if(!t)return!0;const a=String(e.name||"").toLowerCase(),n=String(e.mobile||"").toLowerCase();return a.includes(t)||n.includes(t)},refreshSalaryListLocalDeprecated:async()=>{throw new Error("Local salary fallback has been removed. Use refreshSalaryList for backend data.")},refreshSalaryListRemovedBody:!1,refreshSalaryList:async(e={})=>{const t=document.getElementById("salary-month"),a=document.getElementById("salary-year"),n=document.getElementById("salary-list");if(!t||!a||!n)return;const o=parseInt(t.value),r=parseInt(a.value);n.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend salary data...</td></tr>';let i=[];try{i=(await ApiClient.listEmployees()||[]).map(v=>ApiSyncManager.normalizeEmployee(v)).filter(SalaryManager.isActiveStaff)}catch($){console.error("Failed to load salary staff from backend",$),n.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend staff data unavailable</td></tr>';return}const s=SalaryManager.getSearchQuery(),l=i.filter($=>SalaryManager.matchesSearch($,s));let d=0,g=0,c=0,m=0,y=0,f=!1,h=!1;if(l.length===0)n.innerHTML=`<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);">${s?"No staff found for this search.":"No active staff found for this period."}</td></tr>`;else{const $=await Promise.all(l.map(async v=>{const A=`${r}-${String(o+1).padStart(2,"0")}`,S=await ApiClient.getPayrollSummary(Number(v.id),o+1,r).catch(q=>(console.error("Failed to fetch salary summary",q),null)),M=SalaryManager.getSlipDataFromSummary(S,o,r);if(!M)return f=!0,`
                        <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                            <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${v.id}')">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${v.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(v.name),"3E2723","fff",40)}" alt="${v.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(v.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                    <div>
                                        <div style="font-weight:700; color:var(--primary);">${v.name}</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${v.role} | ${v.salaryType}</div>
                                    </div>
                                </div>
                            </td>
                            <td colspan="7" style="padding:1.2rem; color:var(--danger); font-weight:700;">Backend salary data unavailable</td>
                            <td data-label="Action" style="padding:1.2rem; text-align:right;">
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.refreshSalaryList({skipSync:true})">
                                    <i class="fas fa-sync-alt"></i> Retry
                                </button>
                            </td>
                        </tr>
                    `;const P=!!(S?.is_already_generated||S?.generated);P?h=!0:f=!0;const D=M.staff,E=Number(M.daysPresent||0),k=Number(M.earnedSalary||0),w=Number(M.finalSalary||0),z=S?.generated||S?.details||null,L=Number(z?.base_salary||0),I=Number(z?.days_divisor||0),T=L>0&&I>0?Math.round(L/I):0,j=Number(M.holdAmount||0),F=Number(S?.hold_info?.total_hold_days||0),C=Number(S?.hold_info?.total_hold_amount||0),N=Number(M.adj?.advance||0),R=Number(M.monthlyFine||0),H=N+R+j,U=Number(M.advBalance||0);d+=w,c+=N,m+=k;let B="";return C>0?(g+=C,y++,B=`<div style="display:flex; flex-direction:column; gap:2px; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${v.id}', '${A}')" title="Click to Manage Hold">
                        <span style="color:var(--danger); font-size:0.8rem; font-weight:700;"><i class="fas fa-lock"></i> Held</span>
                        <span style="font-size:0.75rem; color:var(--danger); font-weight:600;">\u20B9${Math.round(C).toLocaleString()}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${F.toLocaleString()} Days</span>
                    </div>`):B=`<span style="color:var(--success); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${v.id}', '${A}')" title="Click to Put on Hold"><i class="fas fa-check-circle"></i> No Hold</span>`,`
                    <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                        <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${v.id}')">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${v.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(v.name),"3E2723","fff",40)}" alt="${v.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(v.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700; color:var(--primary);">${D.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${D.role} | ${D.salaryType}</div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Base Salary" style="padding:1.2rem; color:var(--text-main);">
                            <div style="font-weight:700;">${SalaryManager.formatSalaryAmountWithHold(L,S?.hold_info)}</div>
                            ${T>0?`<div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; margin-top:4px;">Per day: \u20B9${T.toLocaleString()}</div>`:""}
                        </td>
                        <td data-label="Working Days" style="padding:1.2rem; font-weight:700;">${E} Days</td>
                        <td data-label="Earned" style="padding:1.2rem; font-weight:700; color:var(--success);">\u20B9${Math.round(k).toLocaleString()}</td>
                        <td data-label="Deductions" style="padding:1.2rem;">
                            <div style="font-weight:700; color:${H>0?"var(--danger)":"var(--text-muted)"};">\u20B9${Math.round(H).toLocaleString()}</div>
                        </td>
                        <td data-label="Hold Status" style="padding:1.2rem;">${B}</td>
                        <td data-label="Advance" style="padding:1.2rem; cursor:pointer; transition:background 0.2s;" onclick="StaffManager.showAdvanceModal('${v.id}')" title="Click to Manage Advance">
                            <div style="font-weight:700; color:${N>0?"#6c5ce7":"var(--text-muted)"};">\u20B9${N.toLocaleString()}</div>
                            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Bal: \u20B9${U.toLocaleString()}</div>
                        </td>
                        <td data-label="Final Payable" style="padding:1.2rem;">
                            <div style="font-size:1.1rem; font-weight:700; color:#0984e3;">\u20B9${w.toLocaleString()}</div>
                        </td>
                        <td data-label="Action" style="padding:1.2rem; text-align:right;">
                            <div class="salary-row-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                                ${P?`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:#0984e3; border:1.5px solid #0984e3;" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalarySlipUI('${v.id}', ${o}, ${r})" title="View Salary Slip">
                                    <i class="fas fa-eye"></i> View Slip
                                </button>
                                <button class="btn-outline" style="padding:8px; border-radius:10px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" 
                                        onclick="event.stopPropagation(); SalaryManager.deleteSalary('${v.id}', '${A}')" title="Delete Generated Salary">
                                    <i class="fas fa-trash-alt"></i>
                                </button>`:`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalaryConfigModal('${v.id}', ${o}, ${r})">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate
                                </button>`}
                            </div>
                        </td>
                    </tr>
                `}));n.innerHTML=$.join("")}document.getElementById("stats-total-payable").textContent=`\u20B9${d.toLocaleString()}`;const u=document.getElementById("stats-pay-period");if(u){const $=new Date(r,o,1),v=new Date(r,o+1,0),A=S=>S.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});u.textContent=`Period: ${A($)} to ${A(v)}`}document.getElementById("stats-total-earned").textContent=`\u20B9${Math.round(m).toLocaleString()}`,document.getElementById("stats-total-held").textContent=`\u20B9${Math.round(g).toLocaleString()}`,document.getElementById("stats-held-count").textContent=y,document.getElementById("stats-total-advance").textContent=`\u20B9${c.toLocaleString()}`;const p=document.getElementById("stats-total-advance").parentElement;let x=p.querySelector(".adv-breakdown");x||(x=document.createElement("div"),x.className="adv-breakdown",x.style.cssText="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-top:4px;",p.appendChild(x)),x.innerHTML=`Adj: \u20B9${c.toLocaleString()}`;const b=document.getElementById("generate-all-btn"),_=document.getElementById("delete-all-btn");b&&(!f&&i.length>0&&!s?(b.disabled=!0,b.style.opacity="0.5",b.style.cursor="not-allowed",b.title="All salaries generated for this month",b.innerHTML='<i class="fas fa-check-circle"></i> All Generated'):(b.disabled=!1,b.style.opacity="1",b.style.cursor="pointer",b.title="",b.innerHTML='<i class="fas fa-magic"></i> Generate All')),_&&(_.style.display=h?"block":"none"),SalaryManager.updatePayrollModeBadge(o,r)},updatePayrollModeBadge:(e,t)=>{const a=document.getElementById("salary-mode-text");if(!a)return;const n=StorageManager.get("payroll_settings")||{},o=n.payroll_mode||"monthly",r=Number(n.monthly_days||30)||30,i=new Date(t,e+1,0).getDate(),s=window.PayrollSettings.getDaysDivisor(e+1,t),l=o==="per_day"?"Per Day (Calendar)":`Monthly (Fixed ${r} Days)`;a.textContent=`${l} | Divisor: ${s} days | Calendar: ${i} days`},calculateDaysPresent:(e,t,a,n)=>{let o=0;const r=new Date(a,t+1,0).getDate();for(let i=1;i<=r;i++){const s=`${a}-${String(t+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`,l=n[s]?n[s][e]:"";l==="present"||l==="holiday"?o++:l==="halfday"&&(o+=.5)}return o},calculateAttendanceCounts:(e,t,a,n)=>{let o=0,r=0,i=0,s=0,l=0,d=0;const g=new Date(a,t+1,0).getDate(),c=StorageManager.get("weekly_holiday")??0;for(let m=1;m<=g;m++){const y=`${a}-${String(t+1).padStart(2,"0")}-${String(m).padStart(2,"0")}`,h=new Date(`${y}T00:00:00`).getDay()===c,u=n[y]?n[y][e]:"";h?u==="absent"?d++:l++:u==="present"||u==="holiday"?(u==="holiday"&&s++,o++):u==="halfday"?i++:u==="absent"&&r++}return{present:o,absent:r,half:i,holiday:s+l,weekendHoliday:l,weekendAbsent:d}},calculateBaseEarned:(e,t,a=null,n=null,o=null)=>{const r=a!==null?a:new Date().getMonth(),i=n!==null?n:new Date().getFullYear(),s=window.PayrollSettings.getDaysDivisor(r+1,i);if(e.salaryType==="Daily")return e.salaryAmount*t;if(e.salaryType==="Weekly")return e.salaryAmount/7*t;if((StorageManager.get("payroll_settings")||{}).payroll_mode==="monthly"&&o){const d=s>0?e.salaryAmount/s:0;return e.salaryAmount-o.absent*d-o.half*d*.5-o.weekendAbsent*d}return e.salaryAmount/s*t},calculateFinalSalary:(e,t,a,n=null,o=null,r=null,i=null)=>{const s=SalaryManager.calculateBaseEarned(e,t,o,r,i);let l=0,d=0;n&&o!==null&&r!==null&&(l=((StorageManager.get("fines")||{})[n]||[]).filter(u=>{const p=new Date(u.date);return p.getMonth()===o&&p.getFullYear()===r}).reduce((u,p)=>u+p.amount,0),d=((StorageManager.get("overtime")||{})[n]||[]).filter(u=>{const p=new Date(u.date);return p.getMonth()===o&&p.getFullYear()===r}).reduce((u,p)=>u+p.amount,0));let g=0;a.hold&&(a.holdDays||0)>0&&(g=SalaryManager.calculateBaseEarned(e,1,o,r)*(a.holdDays||0));const c=s+d-(a.advance||0)-l+(a.adjustment||0)-g;return Math.round(c)},showAdjustModal:(e,t)=>{const a=(StorageManager.get("staff")||[]).find(i=>i.id===e),o=((StorageManager.get("salaryAdjustments")||{})[e]||{})[t]||{overtime:0,advance:0,fine:0,adjustment:0,hold:!1},r=`
            <form onsubmit="SalaryManager.handleAdjustSubmit(event, '${e}', '${t}')">
                <div class="grid-2">
                    <div class="input-group">
                        <label>Advance (\u20B9)</label>
                        <input type="number" id="adj-advance" class="date-input full-width" value="${o.advance}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Manual Adj (\u20B9)</label>
                        <input type="number" id="adj-manual" class="date-input full-width" value="${o.adjustment}">
                    </div>
                </div>
                <div class="input-group" style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="checkbox" id="adj-hold" ${o.hold?"checked":""}>
                    <label for="adj-hold">Hold Salary</label>
                </div>
                <button type="submit" class="btn-primary full-width" style="margin-top:1rem;">Save Adjustments</button>
            </form>
        `;ModalManager.show(`Adjustments for ${a.name}`,r)},handleAdjustSubmit:(e,t,a)=>{e.preventDefault();const n=StorageManager.get("salaryAdjustments")||{};if(n[t]||(n[t]={}),n[t][a]={advance:parseFloat(document.getElementById("adj-advance").value)||0,adjustment:parseFloat(document.getElementById("adj-manual").value)||0,hold:document.getElementById("adj-hold").checked},StorageManager.save("salaryAdjustments",n),ModalManager.hide(),document.getElementById("salary-list"))SalaryManager.refreshSalaryList();else{const r=document.getElementById("profile-month-picker");if(r){const[i,s]=r.value.split("-");StaffManager.renderProfilePage(document.getElementById("view-container"),t,parseInt(s)-1,parseInt(i))}}window.showAlert("Adjustments saved")},refreshConfigModal:async e=>{const t=parseInt(document.getElementById("config-month")?.value,10),a=parseInt(document.getElementById("config-year")?.value,10);await SalaryManager.showSalaryConfigModal(e,t,a)},showSalaryConfigModal:async(e,t=null,a=null)=>{const n=(StorageManager.get("staff")||[]).find(w=>w.id===e),o=["January","February","March","April","May","June","July","August","September","October","November","December"],r=SalaryManager.getSelectedMonthYear(t,a),i=Math.min(r.year,new Date().getFullYear()),s=SalaryManager.getAllowedMonthIndexes(i),l=s.includes(r.month)?r.month:s[s.length-1],d=`${i}-${String(l+1).padStart(2,"0")}`,g=await ApiClient.getPayrollSummary(Number(e),l+1,i).catch(w=>(console.error("Failed to fetch payroll summary",w),null));if(!g?.preview){window.showAlert?.("Backend salary preview load nahi hua. Real data ke bina preview generate nahi hoga.");return}const c=g.preview,m=c.attendance||{},y=c.deduction_entries||[],f=Math.round(Number(c.payment_deduction||0)),h=Math.round(Number(c.overtime||0)),u=Math.max(0,Math.round(Number(g.available_advance||0))),p=g.hold_info||{total_hold_days:0,total_hold_amount:0},x=Math.round(Number(c.hold_deduction||0)),b=Math.round(Number(c.hold_release||0)),_=Number(p.total_hold_days||0),$=x>0||b>0||_>0,v=Number(m.working_days||0),A=Math.round(Number(c.earned_salary||0)),S=Math.max(0,Math.round(Number(c.before_advance||g.estimated_earnings||0))),M=`
            <div style="padding:0;">
                <div class="input-group" style="margin-bottom:0.65rem;">
                    <label style="font-weight:700; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Select Month</label>
                    <div style="display:flex; gap:10px;">
                        <select id="config-month" class="full-width" onchange="SalaryManager.refreshConfigModal('${e}')" style="padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${s.map(w=>`<option value="${w}" ${w===l?"selected":""}>${o[w]}</option>`).join("")}
                        </select>
                        <select id="config-year" onchange="SalaryManager.refreshConfigModal('${e}')" style="width:110px; padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${SalaryManager.getAllowedYears(i).map(w=>`<option value="${w}" ${w===i?"selected":""}>${w}</option>`).join("")}
                        </select>
                    </div>
                </div>

                ${u>0?`
                <!-- Advance Payment Section -->
                <div style="margin-bottom:1.5rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--danger);"></div>
                            <span style="font-weight:700; font-size:1rem;">Deduct Advance Payment</span>
                        </div>
                        <input type="checkbox" id="config-adv-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${u})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:14px;">
                        <div style="padding:10px 12px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.12);">
                            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Balance</div>
                            <div style="font-size:1rem; font-weight:700; color:var(--info); margin-top:4px;">\u20B9${u.toLocaleString()}</div>
                        </div>
                    </div>
                    <div id="config-adv-options" style="display:none; margin-top:1.2rem; padding-top:1.2rem; border-top:1px dashed var(--border);">
                        <p style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:12px;">Balance: \u20B9${u.toLocaleString()}</p>
                        <div style="display:flex; gap:20px; margin-bottom:15px;">
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="full" checked onchange="SalaryManager.updateConfigUI('${e}', ${u})"> Full Amount
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="custom" onchange="SalaryManager.updateConfigUI('${e}', ${u})"> Custom Amount
                            </label>
                        </div>
                        <input type="number" id="config-adv-custom" placeholder="Enter amount" oninput="SalaryManager.updateConfigUI('${e}', ${u})"
                            style="display:none; width:100%; padding:12px; border-radius:10px; border:1.5px solid var(--border); font-weight:700; font-size:1rem;">
                    </div>
                </div>
                `:""}

                <!-- Payment Deduction Section -->
                <div id="new-deduction-section" style="margin-bottom:0.55rem; padding:0.6rem 0.75rem; background:rgba(214, 48, 49, 0.02); border-radius:12px; border:1px solid rgba(214, 48, 49, 0.12);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-minus-circle" style="color:var(--danger); font-size:0.9rem;"></i>
                            <span style="font-weight:700; font-size:0.84rem; color:var(--text-main);">Payment Deduction</span>
                        </div>
                        <button class="btn-icon" style="color:var(--danger); background:rgba(214,48,49,0.07); border:none; width:24px; height:24px;" onclick="SalaryManager.showDeductionPopup('${e}', ${l}, ${i})" title="Add New Deduction">
                            <i class="fas fa-plus" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        ${y.length===0?`
                            <p style="font-size:0.68rem; color:var(--text-muted); text-align:center; padding:4px 6px; background:rgba(0,0,0,0.01); border-radius:8px; border:1px dashed var(--border); margin:0;">No deductions found.</p>
                        `:y.map(w=>`
                            <div style="display:flex; align-items:center; justify-content:space-between; background:white; padding:5px 8px; border-radius:9px; border:1px solid var(--border);">
                                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <div style="font-weight:700; color:var(--danger); font-size:0.95rem; white-space:nowrap;">\u20B9${Number(w.amount||0).toLocaleString()}</div>
                                    <div style="width:1px; height:12px; background:var(--border);"></div>
                                    <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${w.notes||""}">${w.notes||"Deduction"}</div>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--info); border:none;" onclick="StaffManager.showEditFineModal('${e}', ${w.id})">
                                        <i class="fas fa-edit" style="font-size:0.75rem;"></i>
                                    </button>
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--danger); border:none;" onclick="StaffManager.deleteFine('${e}', ${w.id})">
                                        <i class="fas fa-trash-alt" style="font-size:0.75rem;"></i>
                                    </button>
                                </div>
                            </div>
                        `).join("")}
                    </div>

                    ${f>0?`
                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Total:</span>
                        <strong style="color:var(--danger); font-size:0.95rem;">\u20B9${f.toLocaleString()}</strong>
                    </div>
                    `:""}
                </div>

                ${$?`
                <!-- Hold Salary Section -->
                <div style="margin-bottom:2rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-lock" style="color:var(--danger); font-size:1.1rem;"></i>
                            <span style="font-weight:700; font-size:1rem;">Release Hold Salary</span>
                        </div>
                        <input type="checkbox" id="config-hold-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${u})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Pending hold: ${_} days | \u20B9${x.toLocaleString()}</p>
                </div>
                `:""}

                <!-- Salary Detail Preview -->
                <div id="salary-detail-preview" style="margin-bottom:0.65rem; padding:0.7rem; background:var(--bg-main); border-radius:14px; border:1px solid var(--border);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-file-invoice-dollar" style="color:var(--primary);"></i>
                            <span style="font-weight:700; color:var(--text-main);">Salary Detail Preview</span>
                        </div>
                        <strong id="salary-preview-total" style="font-size:1rem; color:var(--success);">&#8377;${S.toLocaleString()}</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px;">
                        <div style="grid-column:span 2; padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Attendance</span>
                            <strong style="font-size:0.82rem;">${m.present||0} P / ${m.half||0} H / ${m.absent||0} A / ${m.holiday||0} Hol</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Working Days</span>
                            <strong style="font-size:0.9rem;">${v}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Earned Salary</span>
                            <strong style="font-size:0.9rem; color:var(--info);">&#8377;${Math.round(A).toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Overtime</span>
                            <strong style="font-size:0.9rem; color:var(--success);">+&#8377;${h.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Deduction</span>
                            <strong style="font-size:0.9rem; color:var(--danger);">-&#8377;${f.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Advance</span>
                            <strong id="salary-advance-deduction-preview" style="font-size:0.9rem; color:#6c5ce7;">-&#8377;0</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Hold</span>
                            <strong id="salary-hold-preview" style="font-size:0.9rem; color:var(--warning);">${b>0?"+":"-"}&#8377;${(b>0?b:x).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:0.75rem; padding:10px 14px; border-radius:15px; background:linear-gradient(135deg, rgba(0,184,148,0.12), rgba(9,132,227,0.10)); border:1px solid rgba(0,184,148,0.25); text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Net Payable Salary</div>
                    <div id="salary-net-payable" style="font-size:1.8rem; line-height:1.05; font-weight:700; color:var(--success); margin-top:3px;">&#8377;${S.toLocaleString()}</div>
                </div>

                <button type="button" id="salary-preview-btn" class="btn-primary full-width" data-staff-id="${e}" data-advance-balance="${u}" data-before-advance="${S}" onclick="SalaryManager.handleConfigSubmit('${e}', this)" 
                    style="padding:12px; border-radius:14px; font-size:1rem; font-weight:700;">
                    Submit & Preview Slip
                </button>
            </div>
        `;ModalManager.show(`Salary Generation : ${n.name}`,M);const P=document.getElementById("modal-container"),D=P?.querySelector(".modal-card"),E=P?.querySelector(".modal-header"),k=P?.querySelector(".modal-body");D&&(D.style.maxHeight="96vh",D.style.padding="1.35rem"),E&&(E.style.marginBottom="0.8rem",E.style.paddingBottom="0.65rem"),k&&(k.style.overflowY="hidden",k.style.paddingRight="0"),setupCustomDropdown("config-month"),setupCustomDropdown("config-year"),setTimeout(()=>{const w=document.getElementById("salary-preview-btn");w&&(w.onclick=null,w.addEventListener("click",()=>{SalaryManager.handleConfigSubmit(e,w)}))},0)},getSelectedAdvanceDeduction:(e,t)=>{const a=document.getElementById("config-adv-toggle"),n=a?a.checked:!1,o=document.querySelector('input[name="adv-type"]:checked')?.value,r=parseFloat(document.getElementById("config-adv-custom")?.value)||0;return n?Math.min(Math.max(0,o==="full"?e:r),e,t):0},setConfigNetPayable:e=>{const a=`\u20B9${Math.max(0,Math.round(Number(e||0))).toLocaleString()}`,n=document.getElementById("salary-net-payable"),o=document.getElementById("salary-preview-total");n&&(n.textContent=a),o&&(o.textContent=a)},setConfigAdvanceDeductionPreview:e=>{const t=Math.max(0,Math.round(Number(e||0))),a=document.getElementById("salary-advance-deduction-preview");a&&(a.textContent=`-\u20B9${t.toLocaleString()}`)},setConfigHoldPreview:(e,t)=>{const a=document.getElementById("salary-hold-preview");if(!a)return;const n=Math.max(0,Math.round(Number(t||0))),o=Math.max(0,Math.round(Number(e||0)));a.textContent=n>0?`+\u20B9${n.toLocaleString()}`:`-\u20B9${o.toLocaleString()}`},updateConfigUI:async(e,t)=>{const a=document.getElementById("config-adv-toggle"),n=a?a.checked:!1,o=document.getElementById("config-adv-options"),r=document.getElementById("config-adv-custom"),i=document.querySelector('input[name="adv-type"]:checked')?.value,s=document.getElementById("salary-preview-btn"),l=document.getElementById("config-month"),d=document.getElementById("config-year"),g=document.getElementById("config-hold-toggle")?.checked||!1;if(o&&(o.style.display=n?"block":"none"),r&&(r.style.display=n&&i==="custom"?"block":"none"),!s||!l||!d)return;const c=Math.max(0,Number(s.dataset.beforeAdvance||0)),m=SalaryManager.getSelectedAdvanceDeduction(Math.max(0,Number(t||0)),c);s.dataset.selectedAdvanceDeduction=m,SalaryManager.setConfigAdvanceDeductionPreview(m),SalaryManager.setConfigNetPayable(c-m);try{const y=await ApiClient.getPayrollSummary(Number(e),Number(l.value)+1,Number(d.value),m,g),f=Math.max(0,Math.round(Number(y?.preview?.final_salary??c)));SalaryManager.setConfigHoldPreview(y?.preview?.hold_deduction,y?.preview?.hold_release),SalaryManager.setConfigNetPayable(f)}catch(y){console.error("Failed to refresh backend net payable",y)}},showDeductionPopup:(e,t,a)=>{document.getElementById("salary-deduction-popup")?.remove();const n=new Date,o=n.getMonth()===t&&n.getFullYear()===a?`${a}-${String(t+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`:`${a}-${String(t+1).padStart(2,"0")}-01`,r=document.createElement("div");r.id="salary-deduction-popup",r.style.cssText="position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; padding:18px;",r.innerHTML=`
            <div style="width:min(360px, 100%); background:white; border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.22); padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <strong style="font-size:1rem; color:var(--text-main);">Add Payment Deduction</strong>
                    <button type="button" class="btn-icon" onclick="SalaryManager.closeDeductionPopup()" style="width:28px; height:28px; border:none; background:var(--bg-main); color:var(--text-muted);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="salary-deduction-form" onsubmit="SalaryManager.handleDeductionPopupSubmit(event, '${e}', ${t}, ${a})">
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Date</label>
                        <input type="text" id="salary-deduction-date" required value="${o}" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:700;">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Amount (&#8377;)</label>
                        <input type="number" id="salary-deduction-amount" required min="0.01" step="0.01" placeholder="0" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:700;">
                    </div>
                    <div class="input-group" style="margin-bottom:14px;">
                        <label>Remarks</label>
                        <input type="text" id="salary-deduction-notes" placeholder="Reason" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:600;">
                    </div>
                    <button type="submit" class="btn-primary full-width" style="padding:12px; border-radius:12px; font-weight:700;">Save Deduction</button>
                </form>
            </div>
        `,r.addEventListener("click",i=>{i.target===r&&SalaryManager.closeDeductionPopup()}),document.body.appendChild(r),StaffManager.initDatePicker?.("#salary-deduction-date",{defaultDate:o,dateFormat:"Y-m-d"}),setTimeout(()=>document.getElementById("salary-deduction-amount")?.focus(),0)},closeDeductionPopup:()=>{document.getElementById("salary-deduction-popup")?.remove()},handleDeductionPopupSubmit:async(e,t,a,n)=>{e.preventDefault();const o=Number(document.getElementById("salary-deduction-amount")?.value||0),r=document.getElementById("salary-deduction-date")?.value,i=document.getElementById("salary-deduction-notes")?.value||"";if(!r||o<=0){window.showAlert("Valid deduction amount enter karein");return}const s=e.target.querySelector('button[type="submit"]'),l=s?.innerHTML;s&&(s.disabled=!0,s.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...');try{await ApiClient.createAof({employee_id:Number(t),amount:o,date:r,notes:i,type:"fine",repay_months:1}),await ApiSyncManager.bootstrap(!0),await ApiSyncManager.syncMonth(a+1,n,!0),SalaryManager.closeDeductionPopup(),await SalaryManager.showSalaryConfigModal(t,a,n),window.showAlert("Payment deduction recorded")}catch(d){window.showAlert(d.message||"Failed to save payment deduction")}finally{s?.isConnected&&(s.disabled=!1,s.innerHTML=l)}},getConfigPayload:e=>{const t=parseInt(document.getElementById("config-month").value),a=parseInt(document.getElementById("config-year").value),n=document.getElementById("config-hold-toggle")?.checked||!1,o=document.getElementById("salary-preview-btn"),r=Math.max(0,Number(o?.dataset.advanceBalance||0)),i=Math.max(0,Number(o?.dataset.beforeAdvance||0));let s=SalaryManager.getSelectedAdvanceDeduction(r,i);return s<0&&(s=0),s>r?(window.showAlert(`Advance deduction balance se zyada nahi ho sakta. Available: \u20B9${r.toLocaleString()}`),null):{staffId:e,month:t,year:a,advanceDeduction:s,advanceBalance:r,releaseHold:n}},handleConfigSubmit:async(e,t=null)=>{const a=SalaryManager.getConfigPayload(e);if(!a)return;const n=t?.innerHTML;t&&(t.disabled=!0,t.innerHTML='<i class="fas fa-spinner fa-spin"></i> Preparing Preview...');try{await SalaryManager.showGenerationPreview(a)}finally{t?.isConnected&&(t.disabled=!1,t.innerHTML=n)}},showGenerationPreview:async e=>{const{staffId:t,month:a,year:n,advanceDeduction:o,advanceBalance:r}=e;try{await ApiSyncManager.syncMonth(a+1,n,!0).catch(()=>null);const i=await ApiClient.getPayrollSummary(Number(t),a+1,n,o,e.releaseHold).catch(D=>(console.error("Failed to fetch payroll summary",D),null));if(!i?.preview||!i?.employee?.name||!Number(i?.employee?.monthly_salary)){window.showAlert("Backend salary preview load nahi hua. Real data ke bina slip preview nahi banega.");return}const s=i.employee,l={id:s.id,name:s.name,role:s.role||"-",salaryType:"Monthly",salaryAmount:Number(s.monthly_salary)},d=i.preview,g=d.attendance||{},c=Number(g.present||0),m=Number(g.absent||0),y=Number(g.half||0),f=Number(g.holiday||0),h=Number(g.working_days||0),u=Math.round(Number(d.earned_salary||0)),p=Math.round(Number(d.payment_deduction||0)),x=(d.deduction_entries||[]).map(D=>String(D.notes||"").trim()).filter(Boolean),b=Math.round(Number(d.overtime||0)),_=Math.round(Number(d.hold_deduction||0)),$=Math.round(Number(d.hold_release||0)),v=Math.max(0,Math.round(Number(d.before_advance||i.estimated_earnings||0))),A=Math.max(0,Math.round(Number(d.final_salary??v))),S={advance:o,hold:_>0,holdDays:0,releasedAmount:$},P=`
                <div class="salary-slip-fit-shell">
                    ${SalaryManager.getCompactSlipHTML({staff:l,p:c,a:m,h:y,holiday:f,daysPresent:h,adj:S,finalSalary:A,month:a,year:n,monthlyOT:b,monthlyFine:p,advBalance:Math.max(0,r-o),earnedSalary:u,holdAmount:_,paymentDeductionRemarks:x})}
                </div>
                <div class="slip-actions" style="margin-top:0.7rem; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                    <button class="btn-outline" style="font-weight:700; padding:10px; border-radius:13px;" onclick="SalaryManager.showSalaryConfigModal('${t}', ${a}, ${n})">
                        <i class="fas fa-arrow-left"></i> Edit
                    </button>
                    <button class="btn-primary" style="background:var(--success); font-weight:700; padding:10px; border-radius:13px;" onclick="SalaryManager.confirmGenerateSalary('${t}', ${a}, ${n}, ${o}, ${e.releaseHold?"true":"false"})">
                        <i class="fas fa-check-circle"></i> Generate Salary
                    </button>
                </div>
            `;ModalManager.show(`Preview Salary Slip - ${l.name}`,P),SalaryManager.fitActiveSalarySlipModal()}catch(i){window.showAlert(i.message||"Failed to preview salary")}},confirmGenerateSalary:async(e,t,a,n=0,o=!1)=>{try{window.SyncStatus?.show("Generating salary...","saving"),await ApiClient.generatePayroll({employee_id:Number(e),month:t+1,year:a,advance_deduction:Number(n)||0,release_hold:!!o}),await ApiSyncManager.syncMonth(t+1,a,!0);const r=document.getElementById("salary-month"),i=document.getElementById("salary-year");if(r&&(r.value=t),i&&(i.value=a),window.SyncStatus?.show("Salary generated","success",1600),window.currentView==="staff-profile"){ModalManager.hide(),await StaffManager.renderProfilePage(document.getElementById("view-container"),e);return}await SalaryManager.refreshSalaryList(),await SalaryManager.showSalarySlipUI(e,t,a)}catch(r){window.showAlert(r.message||"Failed to generate salary")}},generateAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);let a=[];try{a=(await ApiClient.listEmployees()||[]).map(r=>ApiSyncManager.normalizeEmployee(r)).filter(SalaryManager.isActiveStaff)}catch(o){window.showAlert(`Backend staff data unavailable: ${o.message}`);return}if(a.length===0){window.showAlert("No active staff found");return}if(await ConfirmManager.ask(`Are you sure you want to generate salary for all ${a.length} staff members for this month?`))try{const o=await ApiClient.generatePayroll({employee_id:-1,month:e+1,year:t});await ApiSyncManager.syncMonth(e+1,t,!0),await SalaryManager.refreshSalaryList(),window.showAlert(`Successfully generated salary for ${o?.generated||0} staff members`)}catch(o){window.showAlert(o.message||"Failed to generate salaries")}},deleteAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);if(await ConfirmManager.ask("Are you sure you want to delete ALL generated salaries for this month? This will reset all advance and hold deductions."))try{await ApiClient.deleteAllPayroll(e+1,t),await ApiSyncManager.syncMonth(e+1,t,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Successfully reset salary data for this month")}catch(n){window.showAlert(n.message||"Failed to delete salary records")}},getSlipDataFromSummary:(e,t,a,n=null,o=null)=>{if(!e?.employee?.name||!Number(e?.employee?.monthly_salary))return null;const r=e.generated||e.preview;if(!r)return null;const i=e.employee,s=r.attendance||{},l=Number(n===null?r.advance_deduction||0:n||0),d=Number(o===null?e.available_advance||0:o||0),g=Math.max(0,Math.round(Number(r.before_advance||e.estimated_earnings||0))),c=r.final_salary!==void 0&&n===null,m=c?Math.max(0,Math.round(Number(r.final_salary||0))):Math.max(0,g-l);return{staff:{id:i.id,name:i.name,role:i.role||"-",salaryType:"Monthly",salaryAmount:Number(i.monthly_salary)},p:Number(s.present||0),a:Number(s.absent||0),h:Number(s.half||0),holiday:Number(s.holiday||0),daysPresent:Number(s.working_days||0),adj:{advance:l,hold:Number(r.hold_deduction||0)>0,holdDays:0,releasedAmount:Math.round(Number(r.hold_release||0))},finalSalary:m,month:t,year:a,monthlyOT:Math.round(Number(r.overtime||0)),monthlyFine:Math.round(Number(r.payment_deduction||0)),advBalance:Math.max(0,c?d:d-l),earnedSalary:Math.round(Number(r.earned_salary||0)),holdAmount:Math.round(Number(r.hold_deduction||0)),paymentDeductionRemarks:(r.deduction_entries||[]).map(y=>String(y.notes||"").trim()).filter(Boolean)}},showSalarySlipUI:async(e,t,a)=>{await ApiSyncManager.syncMonth(t+1,a,!0).catch(()=>null);const n=await ApiClient.getPayrollSummary(Number(e),t+1,a).catch(x=>(console.error("Failed to fetch payroll summary",x),null)),o=SalaryManager.getSlipDataFromSummary(n,t,a);if(!o){window.showAlert("Backend salary data load nahi hua. Real data ke bina slip nahi banegi.");return}const{staff:r,p:i,a:s,h:l,holiday:d,adj:g,finalSalary:c,monthlyOT:m,monthlyFine:y,advBalance:f}=o,h=["January","February","March","April","May","June","July","August","September","October","November","December"],p=`
            <div class="salary-slip-fit-shell">
                ${SalaryManager.getSlipHTML(o)}
            </div>
            <div class="slip-actions" style="margin-top:2rem; padding-bottom: 2rem; display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                <button class="btn-primary" onclick="SalaryManager.printSlip()"><i class="fas fa-print"></i> Print Slip</button>
                <button class="btn-primary" style="background:#0984e3;" onclick="SalaryManager.downloadPDF('${r.name}', '${h[t]}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
                <button class="btn-primary" style="background:#25D366; border:none;" onclick="SalaryManager.shareWhatsApp('${r.name}', ${c}, '${h[t]}', {p:${i}, a:${s}, h:${l}, holiday:${d}, ot:${m}, fine:${y}, adv:${g.advance||0}, bal:${f}})">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-outline" style="grid-column: span 3; font-weight:700; border-color:var(--primary); color:var(--primary);" onclick="ModalManager.hide();">
                    <i class="fas fa-times"></i> Close Preview
                </button>
            </div>
        `;ModalManager.show(`Salary Slip - ${r.name}`,p),SalaryManager.fitActiveSalarySlipModal()},fitActiveSalarySlipModal:()=>{const e=document.getElementById("modal-container"),t=e?.querySelector(".modal-card"),a=e?.querySelector(".modal-header"),n=e?.querySelector(".modal-body"),o=e?.querySelector(".salary-slip-fit-shell"),r=e?.querySelector("#salary-slip-print"),i=e?.querySelector(".slip-actions");if(!e||!t||!n||!o||!r)return;e.classList.add("salary-slip-modal"),t.classList.add("salary-slip-modal-card"),n.classList.add("salary-slip-modal-body");const s=()=>{r.style.transform="",o.style.height="",o.style.minHeight="";const l=a?.offsetHeight||0,d=i?.offsetHeight||0,g=window.getComputedStyle(t),c=window.getComputedStyle(n),m=parseFloat(c.rowGap||c.gap||0),y=parseFloat(g.paddingTop)+parseFloat(g.paddingBottom)+(Number.isFinite(m)?m:0),f=Math.max(280,n.clientWidth),h=Math.max(260,window.innerHeight-l-d-y-52),u=Math.max(r.scrollWidth,r.offsetWidth,1),p=Math.max(r.scrollHeight,r.offsetHeight,1),x=Math.min(1,f/u,h/p),b=Math.ceil(p*x);r.style.transformOrigin="top center",r.style.transform=`scale(${x})`,o.style.height=`${b}px`,o.style.minHeight=`${b}px`};requestAnimationFrame(()=>{s(),requestAnimationFrame(s)}),window.removeEventListener("resize",SalaryManager._fitSalarySlipOnResize),SalaryManager._fitSalarySlipOnResize=s,window.addEventListener("resize",SalaryManager._fitSalarySlipOnResize)},printSlip:()=>{const e=document.getElementById("salary-slip-print").innerHTML,t=window.open("","","height=700,width=700");t.document.write("<html><head><title>Salary Slip</title>"),t.document.write('<link rel="stylesheet" href="style.css">'),t.document.write("<style>body{padding:20px;} .salary-slip{border:1px solid #ddd; padding:20px; border-radius:8px;} .slip-header{text-align:center; margin-bottom:20px;} .slip-row{display:flex; justify-content:space-between; margin-bottom:10px;} .total-row{font-size:1.2rem; border-top:2px solid #333; padding-top:10px; margin-top:10px;} .slip-footer{display:flex; justify-content:space-between; margin-top:50px; border-top:1px dashed #ccc; padding-top:20px;}</style>"),t.document.write("</head><body>"),t.document.write(e),t.document.write("</body></html>"),t.document.close(),setTimeout(()=>t.print(),500)},downloadPDF:async(e,t)=>{const a=document.getElementById("salary-slip-print"),n=a?.style.transform||"",o=a?.style.transformOrigin||"";a&&(a.style.transform="",a.style.transformOrigin="");const r={margin:1,filename:`Salary_Slip_${e}_${t}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}},i=await window.loadHtml2Pdf();Promise.resolve(i().set(r).from(a).save()).finally(()=>{a&&(a.style.transform=n,a.style.transformOrigin=o)})},deleteSalary:async(e,t)=>{if(!await ConfirmManager.ask("Are you sure you want to delete this generated salary? This will reset advance and hold status for this month."))return;const n=StorageManager.get("payrollMap")||{},o=StorageManager.get("salaryAdjustments")||{};let r=n[`${e}:${t}`],i=r?.id||r?.payrollId||o[e]?.[t]?.payrollId;if(!i){const[s,l]=t.split("-").map(Number);await ApiSyncManager.syncMonth(l,s,!0);const d=StorageManager.get("payrollMap")||{},g=StorageManager.get("salaryAdjustments")||{};if(r=d[`${e}:${t}`],i=r?.id||r?.payrollId||g[e]?.[t]?.payrollId,!i){window.showAlert("No generated payroll record ID found. Please try refreshing the page.");return}}try{await ApiClient.deletePayroll(i);const s=StorageManager.get("payrollMap")||{};delete s[`${e}:${t}`],StorageManager.saveLocal("payrollMap",s),o[e]&&o[e][t]&&(delete o[e][t],StorageManager.saveLocal("salaryAdjustments",o));const[l,d]=t.split("-").map(Number);await ApiSyncManager.syncMonth(d,l,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Generated salary deleted successfully")}catch(s){const[l,d]=t.split("-").map(Number);s.message&&s.message.toLowerCase().includes("not found")?(await ApiSyncManager.syncMonth(d,l,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Salary record already removed")):window.showAlert(s.message||"Failed to delete salary")}},shareWhatsApp:(e,t,a,n={})=>{let o=`*CAFE PREMIUM SALARY SLIP*%0A---------------------------%0A*Staff:* ${e}%0A*Month:* ${a}%0A%0A*Attendance Summary:*%0A- Present: ${n.p||0}%0A- Half Days: ${n.h||0}%0A- Absent: ${n.a||0}%0A- Holiday: ${n.holiday||0}%0A%0A*Financial Details:*%0A- OT: \u20B9${(n.ot||0).toLocaleString()}%0A- Payment Deduction: \u20B9${(n.fine||0).toLocaleString()}%0A- Advance Adj: \u20B9${(n.adv||0).toLocaleString()}%0A%0A*Final Payout: \u20B9${t.toLocaleString()}*%0A---------------------------%0A*Balance Advance: \u20B9${(n.bal||0).toLocaleString()}*%0A%0AHave a great day!`;window.open(`https://wa.me/?text=${o}`,"_blank")},getCompactSlipHTML:e=>{const{staff:t,p:a,a:n,h:o,holiday:r=0,daysPresent:i,adj:s,finalSalary:l,month:d,year:g,monthlyOT:c,monthlyFine:m,advBalance:y,earnedSalary:f,holdAmount:h}=e,u=["January","February","March","April","May","June","July","August","September","October","November","December"],p=(x,b,_="var(--text-main)")=>`
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <span>${x}</span>
                <strong style="color:${_}; white-space:nowrap;">${b}</strong>
            </div>`;return`
            <div id="salary-slip-print" class="salary-slip" style="padding:16px; border:1px solid #ddd; border-radius:14px; background:#fff; color:#333; font-family:var(--app-font);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:10px; margin-bottom:12px; border-bottom:1px solid #eee;">
                    <div>
                        <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Salary Slip</div>
                        <strong style="font-size:1rem; color:var(--primary);">${u[d]} ${g}</strong>
                    </div>
                    <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                        <strong style="display:block; color:var(--text-main); font-size:0.95rem;">${t.name}</strong>
                        ${t.role||"-"}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Attendance</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${p("Present",a,"var(--success)")}
                            ${p("Half",o,"var(--warning)")}
                            ${p("Absent",n,"var(--danger)")}
                            ${p("Holiday",r,"var(--info)")}
                            ${p("Working",`${i} Days`)}
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Financial</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${p("Base Salary",SalaryManager.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:h}))}
                            ${p("Earned Salary",`\u20B9${Math.round(f).toLocaleString()}`,"var(--info)")}
                            ${p("Overtime",`+\u20B9${c.toLocaleString()}`,"var(--success)")}
                            ${p("Deduction",`-\u20B9${m.toLocaleString()}`,"var(--danger)")}
                            ${p("Hold",`-\u20B9${Math.round(h).toLocaleString()}`,"var(--warning)")}
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Advance Deducted</div>
                        <strong style="font-size:0.95rem; color:var(--danger);">\u20B9${(s.advance||0).toLocaleString()}</strong>
                    </div>
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Remaining Balance</div>
                        <strong style="font-size:0.95rem; color:#6c5ce7;">\u20B9${y.toLocaleString()}</strong>
                    </div>
                </div>

                <div style="margin-top:12px; padding:15px; background:linear-gradient(135deg, rgba(0,184,148,0.14), rgba(9,132,227,0.10)); border:2px solid rgba(0,184,148,0.28); border-radius:15px; text-align:center;">
                    <span style="font-size:0.74rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Net Payable Salary</span>
                    <div style="font-size:2.35rem; line-height:1.02; font-weight:700; color:var(--success); margin-top:4px;">\u20B9${l.toLocaleString()}</div>
                    <p style="font-size:0.68rem; color:#777; margin:4px 0 0; font-style:italic;">${numberToWords(Math.round(l))} Only</p>
                </div>
            </div>`},getSlipHTML:e=>{const{staff:t,p:a,a:n,h:o,holiday:r=0,daysPresent:i,adj:s,finalSalary:l,month:d,year:g,monthlyOT:c,monthlyFine:m,advBalance:y,earnedSalary:f,holdAmount:h,paymentDeductionRemarks:u=[]}=e,p=["January","February","March","April","May","June","July","August","September","October","November","December"],x=P=>String(P).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),b=m>0&&u.length>0?`
                            <div style="margin-top:8px; padding:10px 12px; border-radius:10px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.14);">
                                <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase; margin-bottom:6px;">Deduction Remarks</div>
                                <div style="display:flex; flex-direction:column; gap:4px; color:#666; font-size:0.82rem;">
                                    ${u.map(P=>`<div>- ${x(P)}</div>`).join("")}
                                </div>
                            </div>
                        `:"",_=x(window.BrandingManager?.getCafeName?.()||"Cafe Admin"),$=x(window.BrandingManager?.getBusinessAddress?.()||""),v=x(window.BrandingManager?.getBusinessPhone?.()||""),A=x(window.BrandingManager?.getBusinessEmail?.()||""),S=[];v&&S.push(`Contact: ${v}`),A&&S.push(`Email: ${A}`);const M=S.join(" | ");return`
            <div id="salary-slip-print" class="salary-slip" style="padding:38px; border:1px solid #ddd; border-radius:16px; background:#fff; color:#333; font-family:var(--app-font); line-height:1.58; overflow:visible;">
                <!-- Business Header -->
                <div style="text-align:center; margin-bottom:28px; border-bottom:2px solid var(--primary); padding-bottom:18px;">
                    <h1 style="margin:0; font-size:2rem; color:var(--primary); text-transform:uppercase; letter-spacing:1px;">${_}</h1>
                    ${$?`<p style="margin:5px 0 0; font-size:1rem; font-weight:700; color:#555;">${$}</p>`:""}
                    ${M?`<p style="margin:2px 0; color:#777; font-size:0.92rem;">${M}</p>`:""}
                    <div style="display:flex; justify-content:center; align-items:center; margin-top:18px;">
                        <div style="display:inline-flex; align-items:center; justify-content:center; min-width:190px; padding:6px 18px; background:var(--primary); color:white; border-radius:20px; font-size:0.88rem; font-weight:700;">
                            Salary Slip: ${p[d]} ${g}
                        </div>
                    </div>
                </div>

                <!-- Detail Grid -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:38px;">
                    <!-- Staff & Attendance -->
                    <div>
                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Staff Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Name:</span> <strong>${t.name}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Role:</span> <strong>${t.role}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Salary Type:</span> <strong>${t.salaryType}</strong></div>
                        </div>

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Attendance Summary</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Present Days:</span> <strong style="color:var(--success);">${a}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Half Days:</span> <strong style="color:var(--warning);">${o}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Absent Days:</span> <strong style="color:var(--danger);">${n}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Holiday:</span> <strong style="color:var(--info);">${r}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Total Working:</span> <strong>${i} Days</strong></div>
                        </div>
                    </div>

                    <!-- Financial & Advance -->
                    <div>
                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Financial Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Base Salary:</span> <strong>${SalaryManager.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:h})}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--success);"><span>Overtime (+):</span> <strong>\u20B9${c.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--danger);"><span>Payment Deduction (-):</span> <strong>\u20B9${m.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--warning);"><span>Hold Amount (-):</span> <strong>\u20B9${Math.round(h).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Earned Salary:</span> <strong>\u20B9${Math.round(f).toLocaleString()}</strong></div>
                        </div>
                        ${b}

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Advance Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Advance Deducted:</span> <strong style="color:var(--danger);">\u20B9${(s.advance||0).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Remaining Balance:</span> <strong style="color:#6c5ce7;">\u20B9${y.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Final Payout Section -->
                <div style="position:relative; z-index:2; margin:38px 18px 10px; padding:28px; background:linear-gradient(135deg, #dffbf4, #eaf7ff); border:2px solid rgba(0,184,148,0.32); border-radius:16px; text-align:center; box-shadow:0 0 0 14px #fff;">
                    <span style="font-size:1rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:1px;">Net Payable Salary</span>
                    <div style="font-size:3.25rem; line-height:1.05; font-weight:700; color:var(--success); margin-top:8px;">\u20B9${l.toLocaleString()}</div>
                    <p style="font-size:0.9rem; color:#777; margin-top:6px; font-style:italic;">(Rupees: ${numberToWords(Math.round(l))} Only)</p>
                </div>

                <div class="slip-footer" style="display:flex; justify-content:space-between; margin-top:38px;">
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employer Signature</strong>
                    </div>
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employee Signature</strong>
                    </div>
                </div>
            </div>`},downloadAllSlips:async()=>{const e=document.getElementById("report-month")||document.getElementById("salary-month"),t=document.getElementById("report-year")||document.getElementById("salary-year");if(!e||!t)return;const a=parseInt(e.value),n=parseInt(t.value);let o=[],r=new Set;try{const[m,y]=await Promise.all([ApiClient.listEmployees(),ApiClient.listPayroll(a+1,n)]);o=(m||[]).map(f=>ApiSyncManager.normalizeEmployee(f)).filter(f=>["active","inactive"].includes(String(f.status||"active").toLowerCase())),r=new Set((y||[]).map(f=>String(f.employee_id)))}catch(m){window.showAlert(`Backend salary slip data unavailable: ${m.message}`);return}const i=["January","February","March","April","May","June","July","August","September","October","November","December"],s=document.createElement("div");s.style.width="800px",s.style.background="white",window.showAlert("Generating all slips... This may take a moment.");let l=!1,d=0;for(const m of o){if(!r.has(String(m.id)))continue;const y=await ApiClient.getPayrollSummary(Number(m.id),a+1,n).catch(p=>(console.error("Failed to fetch payroll summary",p),null)),f=SalaryManager.getSlipDataFromSummary(y,a,n);if(!f)continue;const h=document.createElement("div");h.innerHTML=SalaryManager.getSlipHTML(f);const u=h.firstElementChild;u&&(d>0&&(u.style.pageBreakBefore="always"),u.style.marginBottom="0",s.appendChild(u),d++,l=!0)}if(!l){window.showAlert("No generated slips found for this month!");return}const g={margin:.3,filename:`Salary_Slips_${i[a]}_${n}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,letterRendering:!0},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}};s.style.position="fixed",s.style.left="-9999px",s.style.top="0",document.body.appendChild(s),(await window.loadHtml2Pdf())().set(g).from(s).save().then(()=>{document.body.removeChild(s)})}};function numberToWords(e){if(isNaN(e)||e===null)return"";const t=Math.floor(Math.abs(e));if(t===0)return"Zero";const a=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],n=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];function o(r){return r<20?a[r]:r<100?n[Math.floor(r/10)]+(r%10!==0?" "+a[r%10]:""):r<1e3?a[Math.floor(r/100)]+" Hundred"+(r%100!==0?" and "+o(r%100):""):r<1e5?o(Math.floor(r/1e3))+" Thousand"+(r%1e3!==0?" "+o(r%1e3):""):r<1e7?o(Math.floor(r/1e5))+" Lakh"+(r%1e5!==0?" "+o(r%1e5):""):""}return(e<0?"Minus ":"")+o(t)}window.SalaryManager=SalaryManager;

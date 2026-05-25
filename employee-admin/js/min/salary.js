const SalaryManager={isActiveStaff:e=>String(e?.status||"active").toLowerCase()==="active",formatSalaryAmountWithHold:(e,t=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(e,t):`\u20B9${Number(e||0).toLocaleString()}`,getAllowedMonthIndexes:e=>{const t=SalaryManager.getPreviousMonthYear(),r=Number(e);if(r>t.year)return[];const o=r===t.year?t.month:11;return Array.from({length:o+1},(n,a)=>a)},getAllowedYears:(e=null)=>{const r=SalaryManager.getPreviousMonthYear().year,o=e!==null?Math.min(e,r):null,n=[r,r-1];return o!==null&&o<r-1&&n.push(o),Array.from(new Set(n)).sort((a,l)=>l-a)},syncSalaryMonthOptions:()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const r=["January","February","March","April","May","June","July","August","September","October","November","December"],o=Number(t.value),n=SalaryManager.getAllowedMonthIndexes(o),a=Number(e.value),l=n.includes(a)?a:n[n.length-1]??SalaryManager.getPreviousMonthYear().month;e.innerHTML=n.slice().reverse().map(i=>`<option value="${i}">${r[i]}</option>`).join(""),e.value=String(l),e.parentElement?._refreshCustomDropdown?.()},getPreviousMonthYear:()=>{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-1,1);return{month:t.getMonth(),year:t.getFullYear()}},getDefaultSalaryPeriod:async()=>SalaryManager.getPreviousMonthYear(),initializeSalaryPeriod:async()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const r=await SalaryManager.getDefaultSalaryPeriod();e.value=String(r.month),t.value=String(r.year),SalaryManager.syncSalaryMonthOptions(),e.parentElement?._refreshCustomDropdown?.(),t.parentElement?._refreshCustomDropdown?.(),await SalaryManager.refreshSalaryList()},handleSalaryYearChange:()=>{SalaryManager.syncSalaryMonthOptions(),SalaryManager.refreshSalaryList()},getSelectedMonthYear:(e=null,t=null)=>{const r=new Date,o=document.getElementById("salary-month"),n=document.getElementById("salary-year");return{month:o?parseInt(o.value,10):e??r.getMonth(),year:n?parseInt(n.value,10):t??r.getFullYear()}},getLocalPendingHold:(e,t=0)=>{const o=(StorageManager.get("salaryAdjustments")||{})[e]||{},n=new Date,a=Number(t||0)/window.PayrollSettings.getDaysDivisor(n.getMonth()+1,n.getFullYear());return Object.values(o).reduce((l,i)=>{const s=Number(i?.holdDays||0);return!i?.hold||s<=0||(l.days+=s,l.amount+=a*s),l},{days:0,amount:0})},renderSalary:e=>{const t=["January","February","March","April","May","June","July","August","September","October","November","December"],o=new Date().getFullYear(),n=SalaryManager.getPreviousMonthYear();e.innerHTML=`
            <div style="display:flex; flex-direction:column; gap:2rem; padding-bottom:2rem;">
                <!-- Header & Stats -->
                <div class="salary-dashboard-header" style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <div>
                        <h1 style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">Salary Dashboard</h1>
                        <p style="color:var(--text-muted); font-weight:600;">Manage monthly payroll and deductions</p>
                    </div>
                    <div class="salary-filter-bar" style="display:flex; align-items:center; gap:0.5rem; background:var(--bg-card); padding:8px; border-radius:16px; border:1px solid var(--border); box-shadow:var(--shadow-sm);">
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-calendar-alt" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-month" onchange="SalaryManager.refreshSalaryList()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease; min-width:150px;">
                                ${SalaryManager.getAllowedMonthIndexes(n.year).slice().reverse().map(a=>`<option value="${a}" ${a===n.month?"selected":""}>${t[a]}</option>`).join("")}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-clock" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-year" onchange="SalaryManager.handleSalaryYearChange()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease;">
                                ${SalaryManager.getAllowedYears(n.year).map(a=>`<option value="${a}" ${a===n.year?"selected":""}>${a}</option>`).join("")}
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
                            <h2 id="stats-total-payable" style="font-size:1.6rem; font-weight:800; color:var(--text-main); margin:0;">\u20B90</h2>
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
                            <h2 id="stats-total-held" style="font-size:1.6rem; font-weight:800; color:var(--danger); margin:0;">\u20B90</h2>
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
                            <h2 id="stats-total-advance" style="font-size:1.6rem; font-weight:800; color:#6c5ce7; margin:0;">\u20B90</h2>
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
        `,setupCustomDropdown("salary-month"),setupCustomDropdown("salary-year"),SalaryManager.initializeSalaryPeriod()},getSearchQuery:()=>(document.getElementById("global-search")?.value||"").trim().toLowerCase(),matchesSearch:(e,t)=>{if(!t)return!0;const r=String(e.name||"").toLowerCase(),o=String(e.mobile||"").toLowerCase();return r.includes(t)||o.includes(t)},refreshSalaryListLocalDeprecated:async()=>{throw new Error("Local salary fallback has been removed. Use refreshSalaryList for backend data.")},refreshSalaryListRemovedBody:!1,refreshSalaryList:async(e={})=>{const t=document.getElementById("salary-month"),r=document.getElementById("salary-year"),o=document.getElementById("salary-list");if(!t||!r||!o)return;const n=parseInt(t.value),a=parseInt(r.value);o.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend salary data...</td></tr>';let l=[];try{l=(await ApiClient.listEmployees()||[]).map(f=>ApiSyncManager.normalizeEmployee(f)).filter(SalaryManager.isActiveStaff)}catch(M){console.error("Failed to load salary staff from backend",M),o.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend staff data unavailable</td></tr>';return}const i=SalaryManager.getSearchQuery(),s=l.filter(M=>SalaryManager.matchesSearch(M,i));let d=0,m=0,u=0,p=0,g=0,h=!1,w=!1;if(s.length===0)o.innerHTML=`<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);">${i?"No staff found for this search.":"No active staff found for this period."}</td></tr>`;else{const M=await Promise.all(s.map(async f=>{const A=`${a}-${String(n+1).padStart(2,"0")}`,S=await ApiClient.getPayrollSummary(Number(f.id),n+1,a).catch(R=>(console.error("Failed to fetch salary summary",R),null)),$=SalaryManager.getSlipDataFromSummary(S,n,a);if(!$)return h=!0,`
                        <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                            <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${f.id}')">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <img src="${f.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(f.name),"3E2723","fff",40)}" alt="${f.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(f.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                    <div>
                                        <div style="font-weight:700; color:var(--primary);">${f.name}</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${f.role} | ${f.salaryType}</div>
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
                    `;const D=!!(S?.is_already_generated||S?.generated);D?w=!0:h=!0;const E=$.staff,P=Number($.daysPresent||0),z=Number($.earnedSalary||0),x=Number($.finalSalary||0),H=S?.generated||S?.details||null,B=Number(H?.base_salary||0),j=Number(H?.days_divisor||0),T=B>0&&j>0?Math.round(B/j):0,F=Number($.holdAmount||0),_=Number(S?.hold_info?.total_hold_days||0),N=Number(S?.hold_info?.total_hold_amount||0),L=Number($.adj?.advance||0),O=Number($.monthlyFine||0),I=L+O+F,Y=Number($.advBalance||0);d+=x,u+=L,p+=z;let C="";return N>0?(m+=N,g++,C=`<div style="display:flex; flex-direction:column; gap:2px; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${f.id}', '${A}')" title="Click to Manage Hold">
                        <span style="color:var(--danger); font-size:0.8rem; font-weight:700;"><i class="fas fa-lock"></i> Held</span>
                        <span style="font-size:0.75rem; color:var(--danger); font-weight:600;">\u20B9${Math.round(N).toLocaleString()}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${_.toLocaleString()} Days</span>
                    </div>`):C=`<span style="color:var(--success); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${f.id}', '${A}')" title="Click to Put on Hold"><i class="fas fa-check-circle"></i> No Hold</span>`,`
                    <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                        <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${f.id}')">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${f.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(f.name),"3E2723","fff",40)}" alt="${f.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(f.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700; color:var(--primary);">${E.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${E.role} | ${E.salaryType}</div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Base Salary" style="padding:1.2rem; color:var(--text-main);">
                            <div style="font-weight:700;">${SalaryManager.formatSalaryAmountWithHold(B,S?.hold_info)}</div>
                            ${T>0?`<div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; margin-top:4px;">Per day: \u20B9${T.toLocaleString()}</div>`:""}
                        </td>
                        <td data-label="Working Days" style="padding:1.2rem; font-weight:700;">${P} Days</td>
                        <td data-label="Earned" style="padding:1.2rem; font-weight:700; color:var(--success);">\u20B9${Math.round(z).toLocaleString()}</td>
                        <td data-label="Deductions" style="padding:1.2rem;">
                            <div style="font-weight:700; color:${I>0?"var(--danger)":"var(--text-muted)"};">\u20B9${Math.round(I).toLocaleString()}</div>
                        </td>
                        <td data-label="Hold Status" style="padding:1.2rem;">${C}</td>
                        <td data-label="Advance" style="padding:1.2rem; cursor:pointer; transition:background 0.2s;" onclick="StaffManager.showAdvanceModal('${f.id}')" title="Click to Manage Advance">
                            <div style="font-weight:700; color:${L>0?"#6c5ce7":"var(--text-muted)"};">\u20B9${L.toLocaleString()}</div>
                            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Bal: \u20B9${Y.toLocaleString()}</div>
                        </td>
                        <td data-label="Final Payable" style="padding:1.2rem;">
                            <div style="font-size:1.1rem; font-weight:800; color:#0984e3;">\u20B9${x.toLocaleString()}</div>
                        </td>
                        <td data-label="Action" style="padding:1.2rem; text-align:right;">
                            <div class="salary-row-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                                ${D?`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:#0984e3; border:1.5px solid #0984e3;" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalarySlipUI('${f.id}', ${n}, ${a})" title="View Salary Slip">
                                    <i class="fas fa-eye"></i> View Slip
                                </button>
                                <button class="btn-outline" style="padding:8px; border-radius:10px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" 
                                        onclick="event.stopPropagation(); SalaryManager.deleteSalary('${f.id}', '${A}')" title="Delete Generated Salary">
                                    <i class="fas fa-trash-alt"></i>
                                </button>`:`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalaryConfigModal('${f.id}', ${n}, ${a})">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate
                                </button>`}
                            </div>
                        </td>
                    </tr>
                `}));o.innerHTML=M.join("")}document.getElementById("stats-total-payable").textContent=`\u20B9${d.toLocaleString()}`;const c=document.getElementById("stats-pay-period");if(c){const M=new Date(a,n,1),f=new Date(a,n+1,0),A=S=>S.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});c.textContent=`Period: ${A(M)} to ${A(f)}`}document.getElementById("stats-total-earned").textContent=`\u20B9${Math.round(p).toLocaleString()}`,document.getElementById("stats-total-held").textContent=`\u20B9${Math.round(m).toLocaleString()}`,document.getElementById("stats-held-count").textContent=g,document.getElementById("stats-total-advance").textContent=`\u20B9${u.toLocaleString()}`;const y=document.getElementById("stats-total-advance").parentElement;let v=y.querySelector(".adv-breakdown");v||(v=document.createElement("div"),v.className="adv-breakdown",v.style.cssText="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-top:4px;",y.appendChild(v)),v.innerHTML=`Adj: \u20B9${u.toLocaleString()}`;const b=document.getElementById("generate-all-btn"),k=document.getElementById("delete-all-btn");b&&(!h&&l.length>0&&!i?(b.disabled=!0,b.style.opacity="0.5",b.style.cursor="not-allowed",b.title="All salaries generated for this month",b.innerHTML='<i class="fas fa-check-circle"></i> All Generated'):(b.disabled=!1,b.style.opacity="1",b.style.cursor="pointer",b.title="",b.innerHTML='<i class="fas fa-magic"></i> Generate All')),k&&(k.style.display=w?"block":"none")},calculateDaysPresent:(e,t,r,o)=>{let n=0;const a=new Date(r,t+1,0).getDate();for(let l=1;l<=a;l++){const i=`${r}-${String(t+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,s=o[i]?o[i][e]:"";s==="present"||s==="holiday"?n++:s==="halfday"&&(n+=.5)}return n},calculateAttendanceCounts:(e,t,r,o)=>{let n=0,a=0,l=0,i=0,s=0,d=0;const m=new Date(r,t+1,0).getDate(),u=StorageManager.get("weekly_holiday")??0;for(let p=1;p<=m;p++){const g=`${r}-${String(t+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`,w=new Date(`${g}T00:00:00`).getDay()===u,c=o[g]?o[g][e]:"";w?c==="absent"?d++:s++:c==="present"||c==="holiday"?(c==="holiday"&&i++,n++):c==="halfday"?l++:c==="absent"&&a++}return{present:n,absent:a,half:l,holiday:i+s,weekendHoliday:s,weekendAbsent:d}},calculateBaseEarned:(e,t,r=null,o=null,n=null)=>{const a=r!==null?r:new Date().getMonth(),l=o!==null?o:new Date().getFullYear(),i=window.PayrollSettings.getDaysDivisor(a+1,l);if(e.salaryType==="Daily")return e.salaryAmount*t;if(e.salaryType==="Weekly")return e.salaryAmount/7*t;if((StorageManager.get("payroll_settings")||{}).payroll_mode==="monthly"&&n){const d=i>0?e.salaryAmount/i:0;return e.salaryAmount-n.absent*d-n.half*d*.5-n.weekendAbsent*d}return e.salaryAmount/i*t},calculateFinalSalary:(e,t,r,o=null,n=null,a=null,l=null)=>{const i=SalaryManager.calculateBaseEarned(e,t,n,a,l);let s=0,d=0;o&&n!==null&&a!==null&&(s=((StorageManager.get("fines")||{})[o]||[]).filter(c=>{const y=new Date(c.date);return y.getMonth()===n&&y.getFullYear()===a}).reduce((c,y)=>c+y.amount,0),d=((StorageManager.get("overtime")||{})[o]||[]).filter(c=>{const y=new Date(c.date);return y.getMonth()===n&&y.getFullYear()===a}).reduce((c,y)=>c+y.amount,0));let m=0;r.hold&&(r.holdDays||0)>0&&(m=SalaryManager.calculateBaseEarned(e,1,n,a)*(r.holdDays||0));const u=i+d-(r.advance||0)-s+(r.adjustment||0)-m;return Math.round(u)},showAdjustModal:(e,t)=>{const r=(StorageManager.get("staff")||[]).find(l=>l.id===e),n=((StorageManager.get("salaryAdjustments")||{})[e]||{})[t]||{overtime:0,advance:0,fine:0,adjustment:0,hold:!1},a=`
            <form onsubmit="SalaryManager.handleAdjustSubmit(event, '${e}', '${t}')">
                <div class="grid-2">
                    <div class="input-group">
                        <label>Advance (\u20B9)</label>
                        <input type="number" id="adj-advance" class="date-input full-width" value="${n.advance}">
                    </div>
                </div>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Manual Adj (\u20B9)</label>
                        <input type="number" id="adj-manual" class="date-input full-width" value="${n.adjustment}">
                    </div>
                </div>
                <div class="input-group" style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="checkbox" id="adj-hold" ${n.hold?"checked":""}>
                    <label for="adj-hold">Hold Salary</label>
                </div>
                <button type="submit" class="btn-primary full-width" style="margin-top:1rem;">Save Adjustments</button>
            </form>
        `;ModalManager.show(`Adjustments for ${r.name}`,a)},handleAdjustSubmit:(e,t,r)=>{e.preventDefault();const o=StorageManager.get("salaryAdjustments")||{};if(o[t]||(o[t]={}),o[t][r]={advance:parseFloat(document.getElementById("adj-advance").value)||0,adjustment:parseFloat(document.getElementById("adj-manual").value)||0,hold:document.getElementById("adj-hold").checked},StorageManager.save("salaryAdjustments",o),ModalManager.hide(),document.getElementById("salary-list"))SalaryManager.refreshSalaryList();else{const a=document.getElementById("profile-month-picker");if(a){const[l,i]=a.value.split("-");StaffManager.renderProfilePage(document.getElementById("view-container"),t,parseInt(i)-1,parseInt(l))}}window.showAlert("Adjustments saved")},refreshConfigModal:async e=>{const t=parseInt(document.getElementById("config-month")?.value,10),r=parseInt(document.getElementById("config-year")?.value,10);await SalaryManager.showSalaryConfigModal(e,t,r)},showSalaryConfigModal:async(e,t=null,r=null)=>{const o=(StorageManager.get("staff")||[]).find(x=>x.id===e),n=["January","February","March","April","May","June","July","August","September","October","November","December"],a=SalaryManager.getSelectedMonthYear(t,r),l=Math.min(a.year,new Date().getFullYear()),i=SalaryManager.getAllowedMonthIndexes(l),s=i.includes(a.month)?a.month:i[i.length-1],d=`${l}-${String(s+1).padStart(2,"0")}`,m=await ApiClient.getPayrollSummary(Number(e),s+1,l).catch(x=>(console.error("Failed to fetch payroll summary",x),null));if(!m?.preview){window.showAlert?.("Backend salary preview load nahi hua. Real data ke bina preview generate nahi hoga.");return}const u=m.preview,p=u.attendance||{},g=u.deduction_entries||[],h=Math.round(Number(u.payment_deduction||0)),w=Math.round(Number(u.overtime||0)),c=Math.max(0,Math.round(Number(m.available_advance||0))),y=m.hold_info||{total_hold_days:0,total_hold_amount:0},v=Math.round(Number(u.hold_deduction||0)),b=Math.round(Number(u.hold_release||0)),k=Number(y.total_hold_days||0),M=v>0||b>0||k>0,f=Number(p.working_days||0),A=Math.round(Number(u.earned_salary||0)),S=Math.max(0,Math.round(Number(u.before_advance||m.estimated_earnings||0))),$=`
            <div style="padding:0;">
                <div class="input-group" style="margin-bottom:0.65rem;">
                    <label style="font-weight:700; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Select Month</label>
                    <div style="display:flex; gap:10px;">
                        <select id="config-month" class="full-width" onchange="SalaryManager.refreshConfigModal('${e}')" style="padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${i.map(x=>`<option value="${x}" ${x===s?"selected":""}>${n[x]}</option>`).join("")}
                        </select>
                        <select id="config-year" onchange="SalaryManager.refreshConfigModal('${e}')" style="width:110px; padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${SalaryManager.getAllowedYears(l).map(x=>`<option value="${x}" ${x===l?"selected":""}>${x}</option>`).join("")}
                        </select>
                    </div>
                </div>

                ${c>0?`
                <!-- Advance Payment Section -->
                <div style="margin-bottom:1.5rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--danger);"></div>
                            <span style="font-weight:700; font-size:1rem;">Deduct Advance Payment</span>
                        </div>
                        <input type="checkbox" id="config-adv-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${c})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:14px;">
                        <div style="padding:10px 12px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.12);">
                            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Balance</div>
                            <div style="font-size:1rem; font-weight:800; color:var(--info); margin-top:4px;">\u20B9${c.toLocaleString()}</div>
                        </div>
                    </div>
                    <div id="config-adv-options" style="display:none; margin-top:1.2rem; padding-top:1.2rem; border-top:1px dashed var(--border);">
                        <p style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:12px;">Balance: \u20B9${c.toLocaleString()}</p>
                        <div style="display:flex; gap:20px; margin-bottom:15px;">
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="full" checked onchange="SalaryManager.updateConfigUI('${e}', ${c})"> Full Amount
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="custom" onchange="SalaryManager.updateConfigUI('${e}', ${c})"> Custom Amount
                            </label>
                        </div>
                        <input type="number" id="config-adv-custom" placeholder="Enter amount" oninput="SalaryManager.updateConfigUI('${e}', ${c})"
                            style="display:none; width:100%; padding:12px; border-radius:10px; border:1.5px solid var(--border); font-weight:700; font-size:1rem;">
                    </div>
                </div>
                `:""}

                <!-- Payment Deduction Section -->
                <div id="new-deduction-section" style="margin-bottom:0.55rem; padding:0.6rem 0.75rem; background:rgba(214, 48, 49, 0.02); border-radius:12px; border:1px solid rgba(214, 48, 49, 0.12);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-minus-circle" style="color:var(--danger); font-size:0.9rem;"></i>
                            <span style="font-weight:800; font-size:0.84rem; color:var(--text-main);">Payment Deduction</span>
                        </div>
                        <button class="btn-icon" style="color:var(--danger); background:rgba(214,48,49,0.07); border:none; width:24px; height:24px;" onclick="SalaryManager.showDeductionPopup('${e}', ${s}, ${l})" title="Add New Deduction">
                            <i class="fas fa-plus" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        ${g.length===0?`
                            <p style="font-size:0.68rem; color:var(--text-muted); text-align:center; padding:4px 6px; background:rgba(0,0,0,0.01); border-radius:8px; border:1px dashed var(--border); margin:0;">No deductions found.</p>
                        `:g.map(x=>`
                            <div style="display:flex; align-items:center; justify-content:space-between; background:white; padding:5px 8px; border-radius:9px; border:1px solid var(--border);">
                                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <div style="font-weight:800; color:var(--danger); font-size:0.95rem; white-space:nowrap;">\u20B9${Number(x.amount||0).toLocaleString()}</div>
                                    <div style="width:1px; height:12px; background:var(--border);"></div>
                                    <div style="font-size:0.8rem; color:var(--text-muted); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;" title="${x.notes||""}">${x.notes||"Deduction"}</div>
                                </div>
                                <div style="display:flex; gap:4px;">
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--info); border:none;" onclick="StaffManager.showEditFineModal('${e}', ${x.id})">
                                        <i class="fas fa-edit" style="font-size:0.75rem;"></i>
                                    </button>
                                    <button class="btn-icon" style="width:24px; height:24px; background:transparent; color:var(--danger); border:none;" onclick="StaffManager.deleteFine('${e}', ${x.id})">
                                        <i class="fas fa-trash-alt" style="font-size:0.75rem;"></i>
                                    </button>
                                </div>
                            </div>
                        `).join("")}
                    </div>

                    ${h>0?`
                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Total:</span>
                        <strong style="color:var(--danger); font-size:0.95rem;">\u20B9${h.toLocaleString()}</strong>
                    </div>
                    `:""}
                </div>

                ${M?`
                <!-- Hold Salary Section -->
                <div style="margin-bottom:2rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <i class="fas fa-lock" style="color:var(--danger); font-size:1.1rem;"></i>
                            <span style="font-weight:700; font-size:1rem;">Release Hold Salary</span>
                        </div>
                        <input type="checkbox" id="config-hold-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${c})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Pending hold: ${k} days | \u20B9${v.toLocaleString()}</p>
                </div>
                `:""}

                <!-- Salary Detail Preview -->
                <div id="salary-detail-preview" style="margin-bottom:0.65rem; padding:0.7rem; background:var(--bg-main); border-radius:14px; border:1px solid var(--border);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-file-invoice-dollar" style="color:var(--primary);"></i>
                            <span style="font-weight:800; color:var(--text-main);">Salary Detail Preview</span>
                        </div>
                        <strong id="salary-preview-total" style="font-size:1rem; color:var(--success);">&#8377;${S.toLocaleString()}</strong>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:6px;">
                        <div style="grid-column:span 2; padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Attendance</span>
                            <strong style="font-size:0.82rem;">${p.present||0} P / ${p.half||0} H / ${p.absent||0} A / ${p.holiday||0} Hol</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Working Days</span>
                            <strong style="font-size:0.9rem;">${f}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Earned Salary</span>
                            <strong style="font-size:0.9rem; color:var(--info);">&#8377;${Math.round(A).toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Overtime</span>
                            <strong style="font-size:0.9rem; color:var(--success);">+&#8377;${w.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Deduction</span>
                            <strong style="font-size:0.9rem; color:var(--danger);">-&#8377;${h.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Advance</span>
                            <strong id="salary-advance-deduction-preview" style="font-size:0.9rem; color:#6c5ce7;">-&#8377;0</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Hold</span>
                            <strong id="salary-hold-preview" style="font-size:0.9rem; color:var(--warning);">${b>0?"+":"-"}&#8377;${(b>0?b:v).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:0.75rem; padding:10px 14px; border-radius:15px; background:linear-gradient(135deg, rgba(0,184,148,0.12), rgba(9,132,227,0.10)); border:1px solid rgba(0,184,148,0.25); text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Net Payable Salary</div>
                    <div id="salary-net-payable" style="font-size:1.8rem; line-height:1.05; font-weight:900; color:var(--success); margin-top:3px;">&#8377;${S.toLocaleString()}</div>
                </div>

                <button type="button" id="salary-preview-btn" class="btn-primary full-width" data-staff-id="${e}" data-advance-balance="${c}" data-before-advance="${S}" onclick="SalaryManager.handleConfigSubmit('${e}', this)" 
                    style="padding:12px; border-radius:14px; font-size:1rem; font-weight:800;">
                    Submit & Preview Slip
                </button>
            </div>
        `;ModalManager.show(`Salary Generation : ${o.name}`,$);const D=document.getElementById("modal-container"),E=D?.querySelector(".modal-card"),P=D?.querySelector(".modal-header"),z=D?.querySelector(".modal-body");E&&(E.style.maxHeight="96vh",E.style.padding="1.35rem"),P&&(P.style.marginBottom="0.8rem",P.style.paddingBottom="0.65rem"),z&&(z.style.overflowY="hidden",z.style.paddingRight="0"),setupCustomDropdown("config-month"),setupCustomDropdown("config-year"),setTimeout(()=>{const x=document.getElementById("salary-preview-btn");x&&(x.onclick=null,x.addEventListener("click",()=>{SalaryManager.handleConfigSubmit(e,x)}))},0)},getSelectedAdvanceDeduction:(e,t)=>{const r=document.getElementById("config-adv-toggle"),o=r?r.checked:!1,n=document.querySelector('input[name="adv-type"]:checked')?.value,a=parseFloat(document.getElementById("config-adv-custom")?.value)||0;return o?Math.min(Math.max(0,n==="full"?e:a),e,t):0},setConfigNetPayable:e=>{const r=`\u20B9${Math.max(0,Math.round(Number(e||0))).toLocaleString()}`,o=document.getElementById("salary-net-payable"),n=document.getElementById("salary-preview-total");o&&(o.textContent=r),n&&(n.textContent=r)},setConfigAdvanceDeductionPreview:e=>{const t=Math.max(0,Math.round(Number(e||0))),r=document.getElementById("salary-advance-deduction-preview");r&&(r.textContent=`-\u20B9${t.toLocaleString()}`)},setConfigHoldPreview:(e,t)=>{const r=document.getElementById("salary-hold-preview");if(!r)return;const o=Math.max(0,Math.round(Number(t||0))),n=Math.max(0,Math.round(Number(e||0)));r.textContent=o>0?`+\u20B9${o.toLocaleString()}`:`-\u20B9${n.toLocaleString()}`},updateConfigUI:async(e,t)=>{const r=document.getElementById("config-adv-toggle"),o=r?r.checked:!1,n=document.getElementById("config-adv-options"),a=document.getElementById("config-adv-custom"),l=document.querySelector('input[name="adv-type"]:checked')?.value,i=document.getElementById("salary-preview-btn"),s=document.getElementById("config-month"),d=document.getElementById("config-year"),m=document.getElementById("config-hold-toggle")?.checked||!1;if(n&&(n.style.display=o?"block":"none"),a&&(a.style.display=o&&l==="custom"?"block":"none"),!i||!s||!d)return;const u=Math.max(0,Number(i.dataset.beforeAdvance||0)),p=SalaryManager.getSelectedAdvanceDeduction(Math.max(0,Number(t||0)),u);i.dataset.selectedAdvanceDeduction=p,SalaryManager.setConfigAdvanceDeductionPreview(p),SalaryManager.setConfigNetPayable(u-p);try{const g=await ApiClient.getPayrollSummary(Number(e),Number(s.value)+1,Number(d.value),p,m),h=Math.max(0,Math.round(Number(g?.preview?.final_salary??u)));SalaryManager.setConfigHoldPreview(g?.preview?.hold_deduction,g?.preview?.hold_release),SalaryManager.setConfigNetPayable(h)}catch(g){console.error("Failed to refresh backend net payable",g)}},showDeductionPopup:(e,t,r)=>{document.getElementById("salary-deduction-popup")?.remove();const o=new Date,n=o.getMonth()===t&&o.getFullYear()===r?`${r}-${String(t+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`:`${r}-${String(t+1).padStart(2,"0")}-01`,a=document.createElement("div");a.id="salary-deduction-popup",a.style.cssText="position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; padding:18px;",a.innerHTML=`
            <div style="width:min(360px, 100%); background:white; border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.22); padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <strong style="font-size:1rem; color:var(--text-main);">Add Payment Deduction</strong>
                    <button type="button" class="btn-icon" onclick="SalaryManager.closeDeductionPopup()" style="width:28px; height:28px; border:none; background:var(--bg-main); color:var(--text-muted);">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="salary-deduction-form" onsubmit="SalaryManager.handleDeductionPopupSubmit(event, '${e}', ${t}, ${r})">
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Date</label>
                        <input type="text" id="salary-deduction-date" required value="${n}" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:700;">
                    </div>
                    <div class="input-group" style="margin-bottom:10px;">
                        <label>Amount (&#8377;)</label>
                        <input type="number" id="salary-deduction-amount" required min="0.01" step="0.01" placeholder="0" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:800;">
                    </div>
                    <div class="input-group" style="margin-bottom:14px;">
                        <label>Remarks</label>
                        <input type="text" id="salary-deduction-notes" placeholder="Reason" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:600;">
                    </div>
                    <button type="submit" class="btn-primary full-width" style="padding:12px; border-radius:12px; font-weight:800;">Save Deduction</button>
                </form>
            </div>
        `,a.addEventListener("click",l=>{l.target===a&&SalaryManager.closeDeductionPopup()}),document.body.appendChild(a),StaffManager.initDatePicker?.("#salary-deduction-date",{defaultDate:n,dateFormat:"Y-m-d"}),setTimeout(()=>document.getElementById("salary-deduction-amount")?.focus(),0)},closeDeductionPopup:()=>{document.getElementById("salary-deduction-popup")?.remove()},handleDeductionPopupSubmit:async(e,t,r,o)=>{e.preventDefault();const n=Number(document.getElementById("salary-deduction-amount")?.value||0),a=document.getElementById("salary-deduction-date")?.value,l=document.getElementById("salary-deduction-notes")?.value||"";if(!a||n<=0){window.showAlert("Valid deduction amount enter karein");return}const i=e.target.querySelector('button[type="submit"]'),s=i?.innerHTML;i&&(i.disabled=!0,i.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...');try{await ApiClient.createAof({employee_id:Number(t),amount:n,date:a,notes:l,type:"fine",repay_months:1}),await ApiSyncManager.bootstrap(!0),await ApiSyncManager.syncMonth(r+1,o,!0),SalaryManager.closeDeductionPopup(),await SalaryManager.showSalaryConfigModal(t,r,o),window.showAlert("Payment deduction recorded")}catch(d){window.showAlert(d.message||"Failed to save payment deduction")}finally{i?.isConnected&&(i.disabled=!1,i.innerHTML=s)}},getConfigPayload:e=>{const t=parseInt(document.getElementById("config-month").value),r=parseInt(document.getElementById("config-year").value),o=document.getElementById("config-hold-toggle")?.checked||!1,n=document.getElementById("salary-preview-btn"),a=Math.max(0,Number(n?.dataset.advanceBalance||0)),l=Math.max(0,Number(n?.dataset.beforeAdvance||0));let i=SalaryManager.getSelectedAdvanceDeduction(a,l);return i<0&&(i=0),i>a?(window.showAlert(`Advance deduction balance se zyada nahi ho sakta. Available: \u20B9${a.toLocaleString()}`),null):{staffId:e,month:t,year:r,advanceDeduction:i,advanceBalance:a,releaseHold:o}},handleConfigSubmit:async(e,t=null)=>{const r=SalaryManager.getConfigPayload(e);if(!r)return;const o=t?.innerHTML;t&&(t.disabled=!0,t.innerHTML='<i class="fas fa-spinner fa-spin"></i> Preparing Preview...');try{await SalaryManager.showGenerationPreview(r)}finally{t?.isConnected&&(t.disabled=!1,t.innerHTML=o)}},showGenerationPreview:async e=>{const{staffId:t,month:r,year:o,advanceDeduction:n,advanceBalance:a}=e;try{await ApiSyncManager.syncMonth(r+1,o,!0).catch(()=>null);const l=await ApiClient.getPayrollSummary(Number(t),r+1,o,n,e.releaseHold).catch(E=>(console.error("Failed to fetch payroll summary",E),null));if(!l?.preview||!l?.employee?.name||!Number(l?.employee?.monthly_salary)){window.showAlert("Backend salary preview load nahi hua. Real data ke bina slip preview nahi banega.");return}const i=l.employee,s={id:i.id,name:i.name,role:i.role||"-",salaryType:"Monthly",salaryAmount:Number(i.monthly_salary)},d=l.preview,m=d.attendance||{},u=Number(m.present||0),p=Number(m.absent||0),g=Number(m.half||0),h=Number(m.holiday||0),w=Number(m.working_days||0),c=Math.round(Number(d.earned_salary||0)),y=Math.round(Number(d.payment_deduction||0)),v=(d.deduction_entries||[]).map(E=>String(E.notes||"").trim()).filter(Boolean),b=Math.round(Number(d.overtime||0)),k=Math.round(Number(d.hold_deduction||0)),M=Math.round(Number(d.hold_release||0)),f=Math.max(0,Math.round(Number(d.before_advance||l.estimated_earnings||0))),A=Math.max(0,Math.round(Number(d.final_salary??f))),S={advance:n,hold:k>0,holdDays:0,releasedAmount:M},D=`
                <div class="salary-slip-fit-shell">
                    ${SalaryManager.getCompactSlipHTML({staff:s,p:u,a:p,h:g,holiday:h,daysPresent:w,adj:S,finalSalary:A,month:r,year:o,monthlyOT:b,monthlyFine:y,advBalance:Math.max(0,a-n),earnedSalary:c,holdAmount:k,paymentDeductionRemarks:v})}
                </div>
                <div class="slip-actions" style="margin-top:0.7rem; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                    <button class="btn-outline" style="font-weight:800; padding:10px; border-radius:13px;" onclick="SalaryManager.showSalaryConfigModal('${t}', ${r}, ${o})">
                        <i class="fas fa-arrow-left"></i> Edit
                    </button>
                    <button class="btn-primary" style="background:var(--success); font-weight:900; padding:10px; border-radius:13px;" onclick="SalaryManager.confirmGenerateSalary('${t}', ${r}, ${o}, ${n}, ${e.releaseHold?"true":"false"})">
                        <i class="fas fa-check-circle"></i> Generate Salary
                    </button>
                </div>
            `;ModalManager.show(`Preview Salary Slip - ${s.name}`,D),SalaryManager.fitActiveSalarySlipModal()}catch(l){window.showAlert(l.message||"Failed to preview salary")}},confirmGenerateSalary:async(e,t,r,o=0,n=!1)=>{try{window.SyncStatus?.show("Generating salary...","saving"),await ApiClient.generatePayroll({employee_id:Number(e),month:t+1,year:r,advance_deduction:Number(o)||0,release_hold:!!n}),await ApiSyncManager.syncMonth(t+1,r,!0);const a=document.getElementById("salary-month"),l=document.getElementById("salary-year");if(a&&(a.value=t),l&&(l.value=r),window.SyncStatus?.show("Salary generated","success",1600),window.currentView==="staff-profile"){ModalManager.hide(),await StaffManager.renderProfilePage(document.getElementById("view-container"),e);return}await SalaryManager.refreshSalaryList(),await SalaryManager.showSalarySlipUI(e,t,r)}catch(a){window.showAlert(a.message||"Failed to generate salary")}},generateAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);let r=[];try{r=(await ApiClient.listEmployees()||[]).map(a=>ApiSyncManager.normalizeEmployee(a)).filter(SalaryManager.isActiveStaff)}catch(n){window.showAlert(`Backend staff data unavailable: ${n.message}`);return}if(r.length===0){window.showAlert("No active staff found");return}if(await ConfirmManager.ask(`Are you sure you want to generate salary for all ${r.length} staff members for this month?`))try{const n=await ApiClient.generatePayroll({employee_id:-1,month:e+1,year:t});await ApiSyncManager.syncMonth(e+1,t,!0),await SalaryManager.refreshSalaryList(),window.showAlert(`Successfully generated salary for ${n?.generated||0} staff members`)}catch(n){window.showAlert(n.message||"Failed to generate salaries")}},deleteAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);if(await ConfirmManager.ask("Are you sure you want to delete ALL generated salaries for this month? This will reset all advance and hold deductions."))try{await ApiClient.deleteAllPayroll(e+1,t),await ApiSyncManager.syncMonth(e+1,t,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Successfully reset salary data for this month")}catch(o){window.showAlert(o.message||"Failed to delete salary records")}},getSlipDataFromSummary:(e,t,r,o=null,n=null)=>{if(!e?.employee?.name||!Number(e?.employee?.monthly_salary))return null;const a=e.generated||e.preview;if(!a)return null;const l=e.employee,i=a.attendance||{},s=Number(o===null?a.advance_deduction||0:o||0),d=Number(n===null?e.available_advance||0:n||0),m=Math.max(0,Math.round(Number(a.before_advance||e.estimated_earnings||0))),u=a.final_salary!==void 0&&o===null,p=u?Math.max(0,Math.round(Number(a.final_salary||0))):Math.max(0,m-s);return{staff:{id:l.id,name:l.name,role:l.role||"-",salaryType:"Monthly",salaryAmount:Number(l.monthly_salary)},p:Number(i.present||0),a:Number(i.absent||0),h:Number(i.half||0),holiday:Number(i.holiday||0),daysPresent:Number(i.working_days||0),adj:{advance:s,hold:Number(a.hold_deduction||0)>0,holdDays:0,releasedAmount:Math.round(Number(a.hold_release||0))},finalSalary:p,month:t,year:r,monthlyOT:Math.round(Number(a.overtime||0)),monthlyFine:Math.round(Number(a.payment_deduction||0)),advBalance:Math.max(0,u?d:d-s),earnedSalary:Math.round(Number(a.earned_salary||0)),holdAmount:Math.round(Number(a.hold_deduction||0)),paymentDeductionRemarks:(a.deduction_entries||[]).map(g=>String(g.notes||"").trim()).filter(Boolean)}},showSalarySlipUI:async(e,t,r)=>{await ApiSyncManager.syncMonth(t+1,r,!0).catch(()=>null);const o=await ApiClient.getPayrollSummary(Number(e),t+1,r).catch(v=>(console.error("Failed to fetch payroll summary",v),null)),n=SalaryManager.getSlipDataFromSummary(o,t,r);if(!n){window.showAlert("Backend salary data load nahi hua. Real data ke bina slip nahi banegi.");return}const{staff:a,p:l,a:i,h:s,holiday:d,adj:m,finalSalary:u,monthlyOT:p,monthlyFine:g,advBalance:h}=n,w=["January","February","March","April","May","June","July","August","September","October","November","December"],y=`
            <div class="salary-slip-fit-shell">
                ${SalaryManager.getSlipHTML(n)}
            </div>
            <div class="slip-actions" style="margin-top:2rem; padding-bottom: 2rem; display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                <button class="btn-primary" onclick="SalaryManager.printSlip()"><i class="fas fa-print"></i> Print Slip</button>
                <button class="btn-primary" style="background:#0984e3;" onclick="SalaryManager.downloadPDF('${a.name}', '${w[t]}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
                <button class="btn-primary" style="background:#25D366; border:none;" onclick="SalaryManager.shareWhatsApp('${a.name}', ${u}, '${w[t]}', {p:${l}, a:${i}, h:${s}, holiday:${d}, ot:${p}, fine:${g}, adv:${m.advance||0}, bal:${h}})">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-outline" style="grid-column: span 3; font-weight:700; border-color:var(--primary); color:var(--primary);" onclick="ModalManager.hide();">
                    <i class="fas fa-times"></i> Close Preview
                </button>
            </div>
        `;ModalManager.show(`Salary Slip - ${a.name}`,y),SalaryManager.fitActiveSalarySlipModal()},fitActiveSalarySlipModal:()=>{const e=document.getElementById("modal-container"),t=e?.querySelector(".modal-card"),r=e?.querySelector(".modal-header"),o=e?.querySelector(".modal-body"),n=e?.querySelector(".salary-slip-fit-shell"),a=e?.querySelector("#salary-slip-print"),l=e?.querySelector(".slip-actions");if(!e||!t||!o||!n||!a)return;e.classList.add("salary-slip-modal"),t.classList.add("salary-slip-modal-card"),o.classList.add("salary-slip-modal-body");const i=()=>{a.style.transform="",n.style.height="",n.style.minHeight="";const s=r?.offsetHeight||0,d=l?.offsetHeight||0,m=window.getComputedStyle(t),u=window.getComputedStyle(o),p=parseFloat(u.rowGap||u.gap||0),g=parseFloat(m.paddingTop)+parseFloat(m.paddingBottom)+(Number.isFinite(p)?p:0),h=Math.max(280,o.clientWidth),w=Math.max(260,window.innerHeight-s-d-g-52),c=Math.max(a.scrollWidth,a.offsetWidth,1),y=Math.max(a.scrollHeight,a.offsetHeight,1),v=Math.min(1,h/c,w/y),b=Math.ceil(y*v);a.style.transformOrigin="top center",a.style.transform=`scale(${v})`,n.style.height=`${b}px`,n.style.minHeight=`${b}px`};requestAnimationFrame(()=>{i(),requestAnimationFrame(i)}),window.removeEventListener("resize",SalaryManager._fitSalarySlipOnResize),SalaryManager._fitSalarySlipOnResize=i,window.addEventListener("resize",SalaryManager._fitSalarySlipOnResize)},printSlip:()=>{const e=document.getElementById("salary-slip-print").innerHTML,t=window.open("","","height=700,width=700");t.document.write("<html><head><title>Salary Slip</title>"),t.document.write('<link rel="stylesheet" href="style.css">'),t.document.write("<style>body{padding:20px;} .salary-slip{border:1px solid #ddd; padding:20px; border-radius:8px;} .slip-header{text-align:center; margin-bottom:20px;} .slip-row{display:flex; justify-content:space-between; margin-bottom:10px;} .total-row{font-size:1.2rem; border-top:2px solid #333; padding-top:10px; margin-top:10px;} .slip-footer{display:flex; justify-content:space-between; margin-top:50px; border-top:1px dashed #ccc; padding-top:20px;}</style>"),t.document.write("</head><body>"),t.document.write(e),t.document.write("</body></html>"),t.document.close(),setTimeout(()=>t.print(),500)},downloadPDF:async(e,t)=>{const r=document.getElementById("salary-slip-print"),o=r?.style.transform||"",n=r?.style.transformOrigin||"";r&&(r.style.transform="",r.style.transformOrigin="");const a={margin:1,filename:`Salary_Slip_${e}_${t}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}},l=await window.loadHtml2Pdf();Promise.resolve(l().set(a).from(r).save()).finally(()=>{r&&(r.style.transform=o,r.style.transformOrigin=n)})},deleteSalary:async(e,t)=>{if(!await ConfirmManager.ask("Are you sure you want to delete this generated salary? This will reset advance and hold status for this month."))return;const o=StorageManager.get("payrollMap")||{},n=StorageManager.get("salaryAdjustments")||{};let a=o[`${e}:${t}`],l=a?.id||a?.payrollId||n[e]?.[t]?.payrollId;if(!l){const[i,s]=t.split("-").map(Number);await ApiSyncManager.syncMonth(s,i,!0);const d=StorageManager.get("payrollMap")||{},m=StorageManager.get("salaryAdjustments")||{};if(a=d[`${e}:${t}`],l=a?.id||a?.payrollId||m[e]?.[t]?.payrollId,!l){window.showAlert("No generated payroll record ID found. Please try refreshing the page.");return}}try{await ApiClient.deletePayroll(l);const i=StorageManager.get("payrollMap")||{};delete i[`${e}:${t}`],StorageManager.saveLocal("payrollMap",i),n[e]&&n[e][t]&&(delete n[e][t],StorageManager.saveLocal("salaryAdjustments",n));const[s,d]=t.split("-").map(Number);await ApiSyncManager.syncMonth(d,s,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Generated salary deleted successfully")}catch(i){const[s,d]=t.split("-").map(Number);i.message&&i.message.toLowerCase().includes("not found")?(await ApiSyncManager.syncMonth(d,s,!0),await SalaryManager.refreshSalaryList(),window.showAlert("Salary record already removed")):window.showAlert(i.message||"Failed to delete salary")}},shareWhatsApp:(e,t,r,o={})=>{let n=`*CAFE PREMIUM SALARY SLIP*%0A---------------------------%0A*Staff:* ${e}%0A*Month:* ${r}%0A%0A*Attendance Summary:*%0A- Present: ${o.p||0}%0A- Half Days: ${o.h||0}%0A- Absent: ${o.a||0}%0A- Holiday: ${o.holiday||0}%0A%0A*Financial Details:*%0A- OT: \u20B9${(o.ot||0).toLocaleString()}%0A- Payment Deduction: \u20B9${(o.fine||0).toLocaleString()}%0A- Advance Adj: \u20B9${(o.adv||0).toLocaleString()}%0A%0A*Final Payout: \u20B9${t.toLocaleString()}*%0A---------------------------%0A*Balance Advance: \u20B9${(o.bal||0).toLocaleString()}*%0A%0AHave a great day!`;window.open(`https://wa.me/?text=${n}`,"_blank")},getCompactSlipHTML:e=>{const{staff:t,p:r,a:o,h:n,holiday:a=0,daysPresent:l,adj:i,finalSalary:s,month:d,year:m,monthlyOT:u,monthlyFine:p,advBalance:g,earnedSalary:h,holdAmount:w}=e,c=["January","February","March","April","May","June","July","August","September","October","November","December"],y=(v,b,k="var(--text-main)")=>`
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <span>${v}</span>
                <strong style="color:${k}; white-space:nowrap;">${b}</strong>
            </div>`;return`
            <div id="salary-slip-print" class="salary-slip" style="padding:16px; border:1px solid #ddd; border-radius:14px; background:#fff; color:#333; font-family:var(--app-font);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:10px; margin-bottom:12px; border-bottom:1px solid #eee;">
                    <div>
                        <div style="font-size:0.78rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Salary Slip</div>
                        <strong style="font-size:1rem; color:var(--primary);">${c[d]} ${m}</strong>
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
                            ${y("Present",r,"var(--success)")}
                            ${y("Half",n,"var(--warning)")}
                            ${y("Absent",o,"var(--danger)")}
                            ${y("Holiday",a,"var(--info)")}
                            ${y("Working",`${l} Days`)}
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Financial</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${y("Base Salary",SalaryManager.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:w}))}
                            ${y("Earned Salary",`\u20B9${Math.round(h).toLocaleString()}`,"var(--info)")}
                            ${y("Overtime",`+\u20B9${u.toLocaleString()}`,"var(--success)")}
                            ${y("Deduction",`-\u20B9${p.toLocaleString()}`,"var(--danger)")}
                            ${y("Hold",`-\u20B9${Math.round(w).toLocaleString()}`,"var(--warning)")}
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Advance Deducted</div>
                        <strong style="font-size:0.95rem; color:var(--danger);">\u20B9${(i.advance||0).toLocaleString()}</strong>
                    </div>
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:900; text-transform:uppercase;">Remaining Balance</div>
                        <strong style="font-size:0.95rem; color:#6c5ce7;">\u20B9${g.toLocaleString()}</strong>
                    </div>
                </div>

                <div style="margin-top:12px; padding:15px; background:linear-gradient(135deg, rgba(0,184,148,0.14), rgba(9,132,227,0.10)); border:2px solid rgba(0,184,148,0.28); border-radius:15px; text-align:center;">
                    <span style="font-size:0.74rem; color:var(--text-muted); text-transform:uppercase; font-weight:900;">Net Payable Salary</span>
                    <div style="font-size:2.35rem; line-height:1.02; font-weight:900; color:var(--success); margin-top:4px;">\u20B9${s.toLocaleString()}</div>
                    <p style="font-size:0.68rem; color:#777; margin:4px 0 0; font-style:italic;">${numberToWords(Math.round(s))} Only</p>
                </div>
            </div>`},getSlipHTML:e=>{const{staff:t,p:r,a:o,h:n,holiday:a=0,daysPresent:l,adj:i,finalSalary:s,month:d,year:m,monthlyOT:u,monthlyFine:p,advBalance:g,earnedSalary:h,holdAmount:w,paymentDeductionRemarks:c=[]}=e,y=["January","February","March","April","May","June","July","August","September","October","November","December"],v=D=>String(D).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),b=p>0&&c.length>0?`
                            <div style="margin-top:8px; padding:10px 12px; border-radius:10px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.14);">
                                <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase; margin-bottom:6px;">Deduction Remarks</div>
                                <div style="display:flex; flex-direction:column; gap:4px; color:#666; font-size:0.82rem;">
                                    ${c.map(D=>`<div>- ${v(D)}</div>`).join("")}
                                </div>
                            </div>
                        `:"",k=v(window.BrandingManager?.getCafeName?.()||"Cafe Admin"),M=v(window.BrandingManager?.getBusinessAddress?.()||""),f=v(window.BrandingManager?.getBusinessPhone?.()||""),A=v(window.BrandingManager?.getBusinessEmail?.()||""),S=[];f&&S.push(`Contact: ${f}`),A&&S.push(`Email: ${A}`);const $=S.join(" | ");return`
            <div id="salary-slip-print" class="salary-slip" style="padding:38px; border:1px solid #ddd; border-radius:16px; background:#fff; color:#333; font-family:var(--app-font); line-height:1.58; overflow:visible;">
                <!-- Business Header -->
                <div style="text-align:center; margin-bottom:28px; border-bottom:2px solid var(--primary); padding-bottom:18px;">
                    <h1 style="margin:0; font-size:2rem; color:var(--primary); text-transform:uppercase; letter-spacing:1px;">${k}</h1>
                    ${M?`<p style="margin:5px 0 0; font-size:1rem; font-weight:700; color:#555;">${M}</p>`:""}
                    ${$?`<p style="margin:2px 0; color:#777; font-size:0.92rem;">${$}</p>`:""}
                    <div style="display:flex; justify-content:center; align-items:center; margin-top:18px;">
                        <div style="display:inline-flex; align-items:center; justify-content:center; min-width:190px; padding:6px 18px; background:var(--primary); color:white; border-radius:20px; font-size:0.88rem; font-weight:800;">
                            Salary Slip: ${y[d]} ${m}
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
                            <div style="display:flex; justify-content:space-between;"><span>Present Days:</span> <strong style="color:var(--success);">${r}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Half Days:</span> <strong style="color:var(--warning);">${n}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Absent Days:</span> <strong style="color:var(--danger);">${o}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Holiday:</span> <strong style="color:var(--info);">${a}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Total Working:</span> <strong>${l} Days</strong></div>
                        </div>
                    </div>

                    <!-- Financial & Advance -->
                    <div>
                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Financial Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Base Salary:</span> <strong>${SalaryManager.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:w})}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--success);"><span>Overtime (+):</span> <strong>\u20B9${u.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--danger);"><span>Payment Deduction (-):</span> <strong>\u20B9${p.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--warning);"><span>Hold Amount (-):</span> <strong>\u20B9${Math.round(w).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Earned Salary:</span> <strong>\u20B9${Math.round(h).toLocaleString()}</strong></div>
                        </div>
                        ${b}

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Advance Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Advance Deducted:</span> <strong style="color:var(--danger);">\u20B9${(i.advance||0).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Remaining Balance:</span> <strong style="color:#6c5ce7;">\u20B9${g.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Final Payout Section -->
                <div style="position:relative; z-index:2; margin:38px 18px 10px; padding:28px; background:linear-gradient(135deg, #dffbf4, #eaf7ff); border:2px solid rgba(0,184,148,0.32); border-radius:16px; text-align:center; box-shadow:0 0 0 14px #fff;">
                    <span style="font-size:1rem; color:var(--text-muted); text-transform:uppercase; font-weight:900; letter-spacing:1px;">Net Payable Salary</span>
                    <div style="font-size:3.25rem; line-height:1.05; font-weight:900; color:var(--success); margin-top:8px;">\u20B9${s.toLocaleString()}</div>
                    <p style="font-size:0.9rem; color:#777; margin-top:6px; font-style:italic;">(Rupees: ${numberToWords(Math.round(s))} Only)</p>
                </div>

                <div class="slip-footer" style="display:flex; justify-content:space-between; margin-top:38px;">
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employer Signature</strong>
                    </div>
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employee Signature</strong>
                    </div>
                </div>
            </div>`},downloadAllSlips:async()=>{const e=document.getElementById("report-month")||document.getElementById("salary-month"),t=document.getElementById("report-year")||document.getElementById("salary-year");if(!e||!t)return;const r=parseInt(e.value),o=parseInt(t.value);let n=[],a=new Set;try{const[p,g]=await Promise.all([ApiClient.listEmployees(),ApiClient.listPayroll(r+1,o)]);n=(p||[]).map(h=>ApiSyncManager.normalizeEmployee(h)).filter(h=>["active","inactive"].includes(String(h.status||"active").toLowerCase())),a=new Set((g||[]).map(h=>String(h.employee_id)))}catch(p){window.showAlert(`Backend salary slip data unavailable: ${p.message}`);return}const l=["January","February","March","April","May","June","July","August","September","October","November","December"],i=document.createElement("div");i.style.width="800px",i.style.background="white",window.showAlert("Generating all slips... This may take a moment.");let s=!1,d=0;for(const p of n){if(!a.has(String(p.id)))continue;const g=await ApiClient.getPayrollSummary(Number(p.id),r+1,o).catch(y=>(console.error("Failed to fetch payroll summary",y),null)),h=SalaryManager.getSlipDataFromSummary(g,r,o);if(!h)continue;const w=document.createElement("div");w.innerHTML=SalaryManager.getSlipHTML(h);const c=w.firstElementChild;c&&(d>0&&(c.style.pageBreakBefore="always"),c.style.marginBottom="0",i.appendChild(c),d++,s=!0)}if(!s){window.showAlert("No generated slips found for this month!");return}const m={margin:.3,filename:`Salary_Slips_${l[r]}_${o}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,letterRendering:!0},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}};i.style.position="fixed",i.style.left="-9999px",i.style.top="0",document.body.appendChild(i),(await window.loadHtml2Pdf())().set(m).from(i).save().then(()=>{document.body.removeChild(i)})}};function numberToWords(e){if(isNaN(e)||e===null)return"";const t=Math.floor(Math.abs(e));if(t===0)return"Zero";const r=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],o=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];function n(a){return a<20?r[a]:a<100?o[Math.floor(a/10)]+(a%10!==0?" "+r[a%10]:""):a<1e3?r[Math.floor(a/100)]+" Hundred"+(a%100!==0?" and "+n(a%100):""):a<1e5?n(Math.floor(a/1e3))+" Thousand"+(a%1e3!==0?" "+n(a%1e3):""):a<1e7?n(Math.floor(a/1e5))+" Lakh"+(a%1e5!==0?" "+n(a%1e5):""):""}return(e<0?"Minus ":"")+n(t)}window.SalaryManager=SalaryManager;

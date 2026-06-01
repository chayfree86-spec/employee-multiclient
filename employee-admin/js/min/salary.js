var SalaryManager=(()=>{const s={isActiveStaff:e=>String(e?.status||"active").toLowerCase()==="active",formatSalaryAmountWithHold:(e,t=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(e,t):`\u20B9${Number(e||0).toLocaleString()}`,getAllowedMonthIndexes:e=>{const t=s.getPreviousMonthYear(),r=Number(e);if(r>t.year)return[];const o=r===t.year?t.month:11;return Array.from({length:o+1},(n,a)=>a)},getAllowedYears:(e=null)=>{const r=s.getPreviousMonthYear().year,o=e!==null?Math.min(e,r):null,n=[r,r-1];return o!==null&&o<r-1&&n.push(o),Array.from(new Set(n)).sort((a,l)=>l-a)},syncSalaryMonthOptions:()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const r=["January","February","March","April","May","June","July","August","September","October","November","December"],o=Number(t.value),n=s.getAllowedMonthIndexes(o),a=Number(e.value),l=n.includes(a)?a:n[n.length-1]??s.getPreviousMonthYear().month;e.innerHTML=n.slice().reverse().map(i=>`<option value="${i}">${r[i]}</option>`).join(""),e.value=String(l),e.parentElement?._refreshCustomDropdown?.()},getPreviousMonthYear:()=>{const e=new Date,t=new Date(e.getFullYear(),e.getMonth()-1,1);return{month:t.getMonth(),year:t.getFullYear()}},getDefaultSalaryPeriod:async()=>s.getPreviousMonthYear(),initializeSalaryPeriod:async()=>{const e=document.getElementById("salary-month"),t=document.getElementById("salary-year");if(!e||!t)return;const r=await s.getDefaultSalaryPeriod();e.value=String(r.month),t.value=String(r.year),s.syncSalaryMonthOptions(),e.parentElement?._refreshCustomDropdown?.(),t.parentElement?._refreshCustomDropdown?.(),await s.refreshSalaryList()},handleSalaryYearChange:()=>{s.syncSalaryMonthOptions(),s.refreshSalaryList()},getSelectedMonthYear:(e=null,t=null)=>{const r=new Date,o=document.getElementById("salary-month"),n=document.getElementById("salary-year");return{month:o?parseInt(o.value,10):e??r.getMonth(),year:n?parseInt(n.value,10):t??r.getFullYear()}},getLocalPendingHold:(e,t=0)=>{const o=(StorageManager.get("salaryAdjustments")||{})[e]||{},n=new Date,a=Number(t||0)/window.PayrollSettings.getDaysDivisor(n.getMonth()+1,n.getFullYear());return Object.values(o).reduce((l,i)=>{const d=Number(i?.holdDays||0);return!i?.hold||d<=0||(l.days+=d,l.amount+=a*d),l},{days:0,amount:0})},renderSalary:e=>{const t=["January","February","March","April","May","June","July","August","September","October","November","December"],o=new Date().getFullYear(),n=s.getPreviousMonthYear();e.innerHTML=`
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
                                ${s.getAllowedMonthIndexes(n.year).slice().reverse().map(a=>`<option value="${a}" ${a===n.month?"selected":""}>${t[a]}</option>`).join("")}
                            </select>
                            <i class="fas fa-chevron-down" style="position:absolute; right:12px; color:var(--text-muted); font-size:0.7rem; pointer-events:none;"></i>
                        </div>
                        <div class="salary-filter-divider" style="width:1px; height:20px; background:var(--border);"></div>
                        <div class="salary-filter-control" style="position:relative; display:flex; align-items:center;">
                            <i class="fas fa-clock" style="position:absolute; left:12px; color:var(--primary); font-size:0.9rem; pointer-events:none;"></i>
                            <select id="salary-year" onchange="SalaryManager.handleSalaryYearChange()" 
                                style="appearance:none; -webkit-appearance:none; padding:10px 35px 10px 35px; border-radius:12px; border:1px solid transparent; background:var(--bg-main); color:var(--text-main); font-weight:700; font-size:0.9rem; cursor:pointer; transition:all 0.2s ease;">
                                ${s.getAllowedYears(n.year).map(a=>`<option value="${a}" ${a===n.year?"selected":""}>${a}</option>`).join("")}
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
        `,setupCustomDropdown("salary-month"),setupCustomDropdown("salary-year"),s.initializeSalaryPeriod()},getSearchQuery:()=>(document.getElementById("global-search")?.value||"").trim().toLowerCase(),matchesSearch:(e,t)=>{if(!t)return!0;const r=String(e.name||"").toLowerCase(),o=String(e.mobile||"").toLowerCase();return r.includes(t)||o.includes(t)},refreshSalaryListLocalDeprecated:async()=>{throw new Error("Local salary fallback has been removed. Use refreshSalaryList for backend data.")},refreshSalaryListRemovedBody:!1,refreshSalaryList:async(e={})=>{const t=document.getElementById("salary-month"),r=document.getElementById("salary-year"),o=document.getElementById("salary-list");if(!t||!r||!o)return;const n=parseInt(t.value),a=parseInt(r.value);o.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading backend salary data...</td></tr>';let l=[];try{l=(await ApiClient.listEmployees()||[]).map(v=>ApiSyncManager.normalizeEmployee(v)).filter(s.isActiveStaff)}catch($){console.error("Failed to load salary staff from backend",$),o.innerHTML='<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend staff data unavailable</td></tr>';return}const i=s.getSearchQuery(),d=l.filter($=>s.matchesSearch($,i));let c=0,y=0,g=0,m=0,f=0,h=!1,S=!1;if(d.length===0)o.innerHTML=`<tr><td colspan="9" style="padding:3rem; text-align:center; color:var(--text-muted);">${i?"No staff found for this search.":"No active staff found for this period."}</td></tr>`;else{const $=await Promise.all(d.map(async v=>{const k=`${a}-${String(n+1).padStart(2,"0")}`,M=await ApiClient.getPayrollSummary(Number(v.id),n+1,a).catch(G=>(console.error("Failed to fetch salary summary",G),null)),A=s.getSlipDataFromSummary(M,n,a);if(!A)return h=!0,`
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
                    `;const E=!!(M?.is_already_generated||M?.generated);E?S=!0:h=!0;const z=A.staff,L=Number(A.daysPresent||0),P=Number(A.earnedSalary||0),w=Number(A.finalSalary||0),j=M?.generated||M?.details||null,N=Number(j?.base_salary||0),T=Number(j?.days_divisor||0),I=N>0&&T>0?Math.round(N/T):0,O=Number(A.holdAmount||0),Y=Number(M?.hold_info?.total_hold_days||0),C=Number(M?.hold_info?.total_hold_amount||0),B=Number(A.adj?.advance||0),R=Number(A.monthlyFine||0),F=B+R+O,J=Number(A.advBalance||0);c+=w,g+=B,m+=P;let H="";return C>0?(y+=C,f++,H=`<div style="display:flex; flex-direction:column; gap:2px; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${v.id}', '${k}')" title="Click to Manage Hold">
                        <span style="color:var(--danger); font-size:0.8rem; font-weight:700;"><i class="fas fa-lock"></i> Held</span>
                        <span style="font-size:0.75rem; color:var(--danger); font-weight:600;">\u20B9${Math.round(C).toLocaleString()}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">${Y.toLocaleString()} Days</span>
                    </div>`):H=`<span style="color:var(--success); font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="StaffManager.showHoldToggleModal('${v.id}', '${k}')" title="Click to Put on Hold"><i class="fas fa-check-circle"></i> No Hold</span>`,`
                    <tr class="salary-row" style="border-bottom:1px solid var(--border); transition:all 0.2s ease;">
                        <td data-label="Staff Member" style="padding:1.2rem; cursor:pointer;" onclick="switchView('staff-profile', '${v.id}')">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${v.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(v.name),"3E2723","fff",40)}" alt="${v.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(v.name)}', '3E2723', 'fff', 40)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700; color:var(--primary);">${z.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${z.role} | ${z.salaryType}</div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Base Salary" style="padding:1.2rem; color:var(--text-main);">
                            <div style="font-weight:700;">${s.formatSalaryAmountWithHold(N,M?.hold_info)}</div>
                            ${I>0?`<div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; margin-top:4px;">Per day: \u20B9${I.toLocaleString()}</div>`:""}
                        </td>
                        <td data-label="Working Days" style="padding:1.2rem; font-weight:700;">${L} Days</td>
                        <td data-label="Earned" style="padding:1.2rem; font-weight:700; color:var(--success);">\u20B9${Math.round(P).toLocaleString()}</td>
                        <td data-label="Deductions" style="padding:1.2rem;">
                            <div style="font-weight:700; color:${F>0?"var(--danger)":"var(--text-muted)"};">\u20B9${Math.round(F).toLocaleString()}</div>
                        </td>
                        <td data-label="Hold Status" style="padding:1.2rem;">${H}</td>
                        <td data-label="Advance" style="padding:1.2rem; cursor:pointer; transition:background 0.2s;" onclick="StaffManager.showAdvanceModal('${v.id}')" title="Click to Manage Advance">
                            <div style="font-weight:700; color:${B>0?"#6c5ce7":"var(--text-muted)"};">\u20B9${B.toLocaleString()}</div>
                            <div style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">Bal: \u20B9${J.toLocaleString()}</div>
                        </td>
                        <td data-label="Final Payable" style="padding:1.2rem;">
                            <div style="font-size:1.1rem; font-weight:700; color:#0984e3;">\u20B9${w.toLocaleString()}</div>
                        </td>
                        <td data-label="Action" style="padding:1.2rem; text-align:right;">
                            <div class="salary-row-actions" style="display:flex; justify-content:flex-end; gap:8px;">
                                ${E?`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:#0984e3; border:1.5px solid #0984e3;" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalarySlipUI('${v.id}', ${n}, ${a})" title="View Salary Slip">
                                    <i class="fas fa-eye"></i> View Slip
                                </button>
                                <button class="btn-outline" style="padding:8px; border-radius:10px; color:var(--danger); border-color:rgba(214, 48, 49, 0.2); background:rgba(214, 48, 49, 0.05);" 
                                        onclick="event.stopPropagation(); SalaryManager.deleteSalary('${v.id}', '${k}')" title="Delete Generated Salary">
                                    <i class="fas fa-trash-alt"></i>
                                </button>`:`
                                <button class="btn-primary" style="padding:8px 12px; font-size:0.75rem; border-radius:10px; background:var(--bg-main); color:var(--primary); border:1.5px solid var(--primary);" 
                                        onclick="event.stopPropagation(); SalaryManager.showSalaryConfigModal('${v.id}', ${n}, ${a})">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate
                                </button>`}
                            </div>
                        </td>
                    </tr>
                `}));o.innerHTML=$.join("")}document.getElementById("stats-total-payable").textContent=`\u20B9${c.toLocaleString()}`;const p=document.getElementById("stats-pay-period");if(p){const $=new Date(a,n,1),v=new Date(a,n+1,0),k=M=>M.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});p.textContent=`Period: ${k($)} to ${k(v)}`}document.getElementById("stats-total-earned").textContent=`\u20B9${Math.round(m).toLocaleString()}`,document.getElementById("stats-total-held").textContent=`\u20B9${Math.round(y).toLocaleString()}`,document.getElementById("stats-held-count").textContent=f,document.getElementById("stats-total-advance").textContent=`\u20B9${g.toLocaleString()}`;const u=document.getElementById("stats-total-advance").parentElement;let b=u.querySelector(".adv-breakdown");b||(b=document.createElement("div"),b.className="adv-breakdown",b.style.cssText="font-size:0.75rem; color:var(--text-muted); font-weight:600; margin-top:4px;",u.appendChild(b)),b.innerHTML=`Adj: \u20B9${g.toLocaleString()}`;const x=document.getElementById("generate-all-btn"),D=document.getElementById("delete-all-btn");x&&(!h&&l.length>0&&!i?(x.disabled=!0,x.style.opacity="0.5",x.style.cursor="not-allowed",x.title="All salaries generated for this month",x.innerHTML='<i class="fas fa-check-circle"></i> All Generated'):(x.disabled=!1,x.style.opacity="1",x.style.cursor="pointer",x.title="",x.innerHTML='<i class="fas fa-magic"></i> Generate All')),D&&(D.style.display=S?"block":"none"),s.updatePayrollModeBadge(n,a)},updatePayrollModeBadge:(e,t)=>{const r=document.getElementById("salary-mode-text");if(!r)return;const o=StorageManager.get("payroll_settings")||{},n=o.payroll_mode||"monthly",a=Number(o.monthly_days||30)||30,l=new Date(t,e+1,0).getDate(),i=window.PayrollSettings.getDaysDivisor(e+1,t),d=n==="per_day"?"Per Day (Calendar)":`Monthly (Fixed ${a} Days)`;r.textContent=`${d} | Divisor: ${i} days | Calendar: ${l} days`},calculateDaysPresent:(e,t,r,o)=>{let n=0;const a=new Date(r,t+1,0).getDate();for(let l=1;l<=a;l++){const i=`${r}-${String(t+1).padStart(2,"0")}-${String(l).padStart(2,"0")}`,d=o[i]?o[i][e]:"";d==="present"||d==="holiday"?n++:d==="halfday"&&(n+=.5)}return n},calculateAttendanceCounts:(e,t,r,o)=>{let n=0,a=0,l=0,i=0,d=0,c=0;const y=new Date(r,t+1,0).getDate(),g=StorageManager.get("weekly_holiday")??0;for(let m=1;m<=y;m++){const f=`${r}-${String(t+1).padStart(2,"0")}-${String(m).padStart(2,"0")}`,S=new Date(`${f}T00:00:00`).getDay()===g,p=o[f]?o[f][e]:"";S?p==="absent"?c++:d++:p==="present"||p==="holiday"?(p==="holiday"&&i++,n++):p==="halfday"?l++:p==="absent"&&a++}return{present:n,absent:a,half:l,holiday:i+d,weekendHoliday:d,weekendAbsent:c}},calculateBaseEarned:(e,t,r=null,o=null,n=null)=>{const a=r!==null?r:new Date().getMonth(),l=o!==null?o:new Date().getFullYear(),i=window.PayrollSettings.getDaysDivisor(a+1,l);if(e.salaryType==="Daily")return e.salaryAmount*t;if(e.salaryType==="Weekly")return e.salaryAmount/7*t;if((StorageManager.get("payroll_settings")||{}).payroll_mode==="monthly"&&n){const c=i>0?e.salaryAmount/i:0;return e.salaryAmount-n.absent*c-n.half*c*.5-n.weekendAbsent*c}return e.salaryAmount/i*t},calculateFinalSalary:(e,t,r,o=null,n=null,a=null,l=null)=>{const i=s.calculateBaseEarned(e,t,n,a,l);let d=0,c=0;o&&n!==null&&a!==null&&(d=((StorageManager.get("fines")||{})[o]||[]).filter(p=>{const u=new Date(p.date);return u.getMonth()===n&&u.getFullYear()===a}).reduce((p,u)=>p+u.amount,0),c=((StorageManager.get("overtime")||{})[o]||[]).filter(p=>{const u=new Date(p.date);return u.getMonth()===n&&u.getFullYear()===a}).reduce((p,u)=>p+u.amount,0));let y=0;r.hold&&(r.holdDays||0)>0&&(y=s.calculateBaseEarned(e,1,n,a)*(r.holdDays||0));const g=i+c-(r.advance||0)-d+(r.adjustment||0)-y;return Math.round(g)},showAdjustModal:(e,t)=>{const r=(StorageManager.get("staff")||[]).find(l=>l.id===e),n=((StorageManager.get("salaryAdjustments")||{})[e]||{})[t]||{overtime:0,advance:0,fine:0,adjustment:0,hold:!1},a=`
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
        `;ModalManager.show(`Adjustments for ${r.name}`,a)},handleAdjustSubmit:(e,t,r)=>{e.preventDefault();const o=StorageManager.get("salaryAdjustments")||{};if(o[t]||(o[t]={}),o[t][r]={advance:parseFloat(document.getElementById("adj-advance").value)||0,adjustment:parseFloat(document.getElementById("adj-manual").value)||0,hold:document.getElementById("adj-hold").checked},StorageManager.save("salaryAdjustments",o),ModalManager.hide(),document.getElementById("salary-list"))s.refreshSalaryList();else{const a=document.getElementById("profile-month-picker");if(a){const[l,i]=a.value.split("-");StaffManager.renderProfilePage(document.getElementById("view-container"),t,parseInt(i)-1,parseInt(l))}}window.showAlert("Adjustments saved")},refreshConfigModal:async e=>{const t=parseInt(document.getElementById("config-month")?.value,10),r=parseInt(document.getElementById("config-year")?.value,10);await s.showSalaryConfigModal(e,t,r)},showSalaryConfigModal:async(e,t=null,r=null)=>{const o=(StorageManager.get("staff")||[]).find(w=>w.id===e),n=["January","February","March","April","May","June","July","August","September","October","November","December"],a=s.getSelectedMonthYear(t,r),l=Math.min(a.year,new Date().getFullYear()),i=s.getAllowedMonthIndexes(l),d=i.includes(a.month)?a.month:i[i.length-1],c=`${l}-${String(d+1).padStart(2,"0")}`,y=await ApiClient.getPayrollSummary(Number(e),d+1,l).catch(w=>(console.error("Failed to fetch payroll summary",w),null));if(!y?.preview){window.showAlert?.("Backend salary preview load nahi hua. Real data ke bina preview generate nahi hoga.");return}const g=y.preview,m=g.attendance||{},f=g.deduction_entries||[],h=Math.round(Number(g.payment_deduction||0)),S=Math.round(Number(g.overtime||0)),p=Math.max(0,Math.round(Number(y.available_advance||0))),u=y.hold_info||{total_hold_days:0,total_hold_amount:0},b=Math.round(Number(g.hold_deduction||0)),x=Math.round(Number(g.hold_release||0)),D=Number(u.total_hold_days||0),$=b>0||x>0||D>0,v=Number(m.working_days||0),k=Math.round(Number(g.earned_salary||0)),M=Math.max(0,Math.round(Number(g.before_advance||y.estimated_earnings||0))),A=`
            <div style="padding:0;">
                <div class="input-group" style="margin-bottom:0.65rem;">
                    <label style="font-weight:700; color:var(--text-muted); font-size:0.75rem; text-transform:uppercase;">Select Month</label>
                    <div style="display:flex; gap:10px;">
                        <select id="config-month" class="full-width" onchange="SalaryManager.refreshConfigModal('${e}')" style="padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${i.map(w=>`<option value="${w}" ${w===d?"selected":""}>${n[w]}</option>`).join("")}
                        </select>
                        <select id="config-year" onchange="SalaryManager.refreshConfigModal('${e}')" style="width:110px; padding:9px 12px; border-radius:12px; background:var(--bg-main); font-weight:700;">
                            ${s.getAllowedYears(l).map(w=>`<option value="${w}" ${w===l?"selected":""}>${w}</option>`).join("")}
                        </select>
                    </div>
                </div>

                ${p>0?`
                <!-- Advance Payment Section -->
                <div style="margin-bottom:1.5rem; padding:1.25rem; background:var(--bg-main); border-radius:15px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:10px; height:10px; border-radius:50%; background:var(--danger);"></div>
                            <span style="font-weight:700; font-size:1rem;">Deduct Advance Payment</span>
                        </div>
                        <input type="checkbox" id="config-adv-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${p})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:14px;">
                        <div style="padding:10px 12px; border-radius:12px; background:rgba(9, 132, 227, 0.06); border:1px solid rgba(9, 132, 227, 0.12);">
                            <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Balance</div>
                            <div style="font-size:1rem; font-weight:700; color:var(--info); margin-top:4px;">\u20B9${p.toLocaleString()}</div>
                        </div>
                    </div>
                    <div id="config-adv-options" style="display:none; margin-top:1.2rem; padding-top:1.2rem; border-top:1px dashed var(--border);">
                        <p style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:12px;">Balance: \u20B9${p.toLocaleString()}</p>
                        <div style="display:flex; gap:20px; margin-bottom:15px;">
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="full" checked onchange="SalaryManager.updateConfigUI('${e}', ${p})"> Full Amount
                            </label>
                            <label style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem; cursor:pointer;">
                                <input type="radio" name="adv-type" value="custom" onchange="SalaryManager.updateConfigUI('${e}', ${p})"> Custom Amount
                            </label>
                        </div>
                        <input type="number" id="config-adv-custom" placeholder="Enter amount" oninput="SalaryManager.updateConfigUI('${e}', ${p})"
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
                        <button class="btn-icon" style="color:var(--danger); background:rgba(214,48,49,0.07); border:none; width:24px; height:24px;" onclick="SalaryManager.showDeductionPopup('${e}', ${d}, ${l})" title="Add New Deduction">
                            <i class="fas fa-plus" style="font-size:0.8rem;"></i>
                        </button>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:5px;">
                        ${f.length===0?`
                            <p style="font-size:0.68rem; color:var(--text-muted); text-align:center; padding:4px 6px; background:rgba(0,0,0,0.01); border-radius:8px; border:1px dashed var(--border); margin:0;">No deductions found.</p>
                        `:f.map(w=>`
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

                    ${h>0?`
                    <div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Total:</span>
                        <strong style="color:var(--danger); font-size:0.95rem;">\u20B9${h.toLocaleString()}</strong>
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
                        <input type="checkbox" id="config-hold-toggle" onchange="SalaryManager.updateConfigUI('${e}', ${p})" style="width:20px; height:20px; cursor:pointer;">
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-top:8px;">Pending hold: ${D} days | \u20B9${b.toLocaleString()}</p>
                </div>
                `:""}

                <!-- Salary Detail Preview -->
                <div id="salary-detail-preview" style="margin-bottom:0.65rem; padding:0.7rem; background:var(--bg-main); border-radius:14px; border:1px solid var(--border);">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fas fa-file-invoice-dollar" style="color:var(--primary);"></i>
                            <span style="font-weight:700; color:var(--text-main);">Salary Detail Preview</span>
                        </div>
                        <strong id="salary-preview-total" style="font-size:1rem; color:var(--success);">&#8377;${M.toLocaleString()}</strong>
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
                            <strong style="font-size:0.9rem; color:var(--info);">&#8377;${Math.round(k).toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Overtime</span>
                            <strong style="font-size:0.9rem; color:var(--success);">+&#8377;${S.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Deduction</span>
                            <strong style="font-size:0.9rem; color:var(--danger);">-&#8377;${h.toLocaleString()}</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Advance</span>
                            <strong id="salary-advance-deduction-preview" style="font-size:0.9rem; color:#6c5ce7;">-&#8377;0</strong>
                        </div>
                        <div style="padding:7px 8px; border-radius:10px; background:white; border:1px solid var(--border);">
                            <span style="display:block; font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Hold</span>
                            <strong id="salary-hold-preview" style="font-size:0.9rem; color:var(--warning);">${x>0?"+":"-"}&#8377;${(x>0?x:b).toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:0.75rem; padding:10px 14px; border-radius:15px; background:linear-gradient(135deg, rgba(0,184,148,0.12), rgba(9,132,227,0.10)); border:1px solid rgba(0,184,148,0.25); text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Net Payable Salary</div>
                    <div id="salary-net-payable" style="font-size:1.8rem; line-height:1.05; font-weight:700; color:var(--success); margin-top:3px;">&#8377;${M.toLocaleString()}</div>
                </div>

                <button type="button" id="salary-preview-btn" class="btn-primary full-width" data-staff-id="${e}" data-advance-balance="${p}" data-before-advance="${M}" onclick="SalaryManager.handleConfigSubmit('${e}', this)" 
                    style="padding:12px; border-radius:14px; font-size:1rem; font-weight:700;">
                    Submit & Preview Slip
                </button>
            </div>
        `;ModalManager.show(`Salary Generation : ${o.name}`,A);const E=document.getElementById("modal-container"),z=E?.querySelector(".modal-card"),L=E?.querySelector(".modal-header"),P=E?.querySelector(".modal-body");z&&(z.style.maxHeight="96vh",z.style.padding="1.35rem"),L&&(L.style.marginBottom="0.8rem",L.style.paddingBottom="0.65rem"),P&&(P.style.overflowY="hidden",P.style.paddingRight="0"),setupCustomDropdown("config-month"),setupCustomDropdown("config-year"),setTimeout(()=>{const w=document.getElementById("salary-preview-btn");w&&(w.onclick=null,w.addEventListener("click",()=>{s.handleConfigSubmit(e,w)}))},0)},getSelectedAdvanceDeduction:(e,t)=>{const r=document.getElementById("config-adv-toggle"),o=r?r.checked:!1,n=document.querySelector('input[name="adv-type"]:checked')?.value,a=parseFloat(document.getElementById("config-adv-custom")?.value)||0;return o?Math.min(Math.max(0,n==="full"?e:a),e,t):0},setConfigNetPayable:e=>{const r=`\u20B9${Math.max(0,Math.round(Number(e||0))).toLocaleString()}`,o=document.getElementById("salary-net-payable"),n=document.getElementById("salary-preview-total");o&&(o.textContent=r),n&&(n.textContent=r)},setConfigAdvanceDeductionPreview:e=>{const t=Math.max(0,Math.round(Number(e||0))),r=document.getElementById("salary-advance-deduction-preview");r&&(r.textContent=`-\u20B9${t.toLocaleString()}`)},setConfigHoldPreview:(e,t)=>{const r=document.getElementById("salary-hold-preview");if(!r)return;const o=Math.max(0,Math.round(Number(t||0))),n=Math.max(0,Math.round(Number(e||0)));r.textContent=o>0?`+\u20B9${o.toLocaleString()}`:`-\u20B9${n.toLocaleString()}`},updateConfigUI:async(e,t)=>{const r=document.getElementById("config-adv-toggle"),o=r?r.checked:!1,n=document.getElementById("config-adv-options"),a=document.getElementById("config-adv-custom"),l=document.querySelector('input[name="adv-type"]:checked')?.value,i=document.getElementById("salary-preview-btn"),d=document.getElementById("config-month"),c=document.getElementById("config-year"),y=document.getElementById("config-hold-toggle")?.checked||!1;if(n&&(n.style.display=o?"block":"none"),a&&(a.style.display=o&&l==="custom"?"block":"none"),!i||!d||!c)return;const g=Math.max(0,Number(i.dataset.beforeAdvance||0)),m=s.getSelectedAdvanceDeduction(Math.max(0,Number(t||0)),g);i.dataset.selectedAdvanceDeduction=m,s.setConfigAdvanceDeductionPreview(m),s.setConfigNetPayable(g-m);try{const f=await ApiClient.getPayrollSummary(Number(e),Number(d.value)+1,Number(c.value),m,y),h=Math.max(0,Math.round(Number(f?.preview?.final_salary??g)));s.setConfigHoldPreview(f?.preview?.hold_deduction,f?.preview?.hold_release),s.setConfigNetPayable(h)}catch(f){console.error("Failed to refresh backend net payable",f)}},showDeductionPopup:(e,t,r)=>{document.getElementById("salary-deduction-popup")?.remove();const o=new Date,n=o.getMonth()===t&&o.getFullYear()===r?`${r}-${String(t+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`:`${r}-${String(t+1).padStart(2,"0")}-01`,a=document.createElement("div");a.id="salary-deduction-popup",a.style.cssText="position:fixed; inset:0; z-index:20000; background:rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center; padding:18px;",a.innerHTML=`
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
                        <input type="number" id="salary-deduction-amount" required min="0.01" step="0.01" placeholder="0" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:700;">
                    </div>
                    <div class="input-group" style="margin-bottom:14px;">
                        <label>Remarks</label>
                        <input type="text" id="salary-deduction-notes" placeholder="Reason" style="width:100%; padding:11px 12px; border:1px solid var(--border); border-radius:10px; font-weight:600;">
                    </div>
                    <button type="submit" class="btn-primary full-width" style="padding:12px; border-radius:12px; font-weight:700;">Save Deduction</button>
                </form>
            </div>
        `,a.addEventListener("click",l=>{l.target===a&&s.closeDeductionPopup()}),document.body.appendChild(a),StaffManager.initDatePicker?.("#salary-deduction-date",{defaultDate:n,dateFormat:"Y-m-d"}),setTimeout(()=>document.getElementById("salary-deduction-amount")?.focus(),0)},closeDeductionPopup:()=>{document.getElementById("salary-deduction-popup")?.remove()},handleDeductionPopupSubmit:async(e,t,r,o)=>{e.preventDefault();const n=Number(document.getElementById("salary-deduction-amount")?.value||0),a=document.getElementById("salary-deduction-date")?.value,l=document.getElementById("salary-deduction-notes")?.value||"";if(!a||n<=0){window.showAlert("Valid deduction amount enter karein");return}const i=e.target.querySelector('button[type="submit"]'),d=i?.innerHTML;i&&(i.disabled=!0,i.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saving...');try{await ApiClient.createAof({employee_id:Number(t),amount:n,date:a,notes:l,type:"fine",repay_months:1}),await ApiSyncManager.bootstrap(!0),await ApiSyncManager.syncMonth(r+1,o,!0),s.closeDeductionPopup(),await s.showSalaryConfigModal(t,r,o),window.showAlert("Payment deduction recorded")}catch(c){window.showAlert(c.message||"Failed to save payment deduction")}finally{i?.isConnected&&(i.disabled=!1,i.innerHTML=d)}},getConfigPayload:e=>{const t=parseInt(document.getElementById("config-month").value),r=parseInt(document.getElementById("config-year").value),o=document.getElementById("config-hold-toggle")?.checked||!1,n=document.getElementById("salary-preview-btn"),a=Math.max(0,Number(n?.dataset.advanceBalance||0)),l=Math.max(0,Number(n?.dataset.beforeAdvance||0));let i=s.getSelectedAdvanceDeduction(a,l);return i<0&&(i=0),i>a?(window.showAlert(`Advance deduction balance se zyada nahi ho sakta. Available: \u20B9${a.toLocaleString()}`),null):{staffId:e,month:t,year:r,advanceDeduction:i,advanceBalance:a,releaseHold:o}},handleConfigSubmit:async(e,t=null)=>{const r=s.getConfigPayload(e);if(!r)return;const o=t?.innerHTML;t&&(t.disabled=!0,t.innerHTML='<i class="fas fa-spinner fa-spin"></i> Preparing Preview...');try{await s.showGenerationPreview(r)}finally{t?.isConnected&&(t.disabled=!1,t.innerHTML=o)}},showGenerationPreview:async e=>{const{staffId:t,month:r,year:o,advanceDeduction:n,advanceBalance:a}=e;try{await ApiSyncManager.syncMonth(r+1,o,!0).catch(()=>null);const l=await ApiClient.getPayrollSummary(Number(t),r+1,o,n,e.releaseHold).catch(z=>(console.error("Failed to fetch payroll summary",z),null));if(!l?.preview||!l?.employee?.name||!Number(l?.employee?.monthly_salary)){window.showAlert("Backend salary preview load nahi hua. Real data ke bina slip preview nahi banega.");return}const i=l.employee,d={id:i.id,name:i.name,role:i.role||"-",salaryType:"Monthly",salaryAmount:Number(i.monthly_salary)},c=l.preview,y=c.attendance||{},g=Number(y.present||0),m=Number(y.absent||0),f=Number(y.half||0),h=Number(y.holiday||0),S=Number(y.working_days||0),p=Math.round(Number(c.earned_salary||0)),u=Math.round(Number(c.payment_deduction||0)),b=(c.deduction_entries||[]).map(z=>String(z.notes||"").trim()).filter(Boolean),x=Math.round(Number(c.overtime||0)),D=Math.round(Number(c.hold_deduction||0)),$=Math.round(Number(c.hold_release||0)),v=Math.max(0,Math.round(Number(c.before_advance||l.estimated_earnings||0))),k=Math.max(0,Math.round(Number(c.final_salary??v))),M={advance:n,hold:D>0,holdDays:0,releasedAmount:$},E=`
                <div class="salary-slip-fit-shell">
                    ${s.getCompactSlipHTML({staff:d,p:g,a:m,h:f,holiday:h,daysPresent:S,adj:M,finalSalary:k,month:r,year:o,monthlyOT:x,monthlyFine:u,advBalance:Math.max(0,a-n),earnedSalary:p,holdAmount:D,paymentDeductionRemarks:b})}
                </div>
                <div class="slip-actions" style="margin-top:0.7rem; display:grid; grid-template-columns: repeat(2, 1fr); gap:10px;">
                    <button class="btn-outline" style="font-weight:700; padding:10px; border-radius:13px;" onclick="SalaryManager.showSalaryConfigModal('${t}', ${r}, ${o})">
                        <i class="fas fa-arrow-left"></i> Edit
                    </button>
                    <button class="btn-primary" style="background:var(--success); font-weight:700; padding:10px; border-radius:13px;" onclick="SalaryManager.confirmGenerateSalary('${t}', ${r}, ${o}, ${n}, ${e.releaseHold?"true":"false"})">
                        <i class="fas fa-check-circle"></i> Generate Salary
                    </button>
                </div>
            `;ModalManager.show(`Preview Salary Slip - ${d.name}`,E),s.fitActiveSalarySlipModal()}catch(l){window.showAlert(l.message||"Failed to preview salary")}},confirmGenerateSalary:async(e,t,r,o=0,n=!1)=>{try{window.SyncStatus?.show("Generating salary...","saving"),await ApiClient.generatePayroll({employee_id:Number(e),month:t+1,year:r,advance_deduction:Number(o)||0,release_hold:!!n}),await ApiSyncManager.syncMonth(t+1,r,!0);const a=document.getElementById("salary-month"),l=document.getElementById("salary-year");if(a&&(a.value=t),l&&(l.value=r),window.SyncStatus?.show("Salary generated","success",1600),window.currentView==="staff-profile"){ModalManager.hide(),await StaffManager.renderProfilePage(document.getElementById("view-container"),e);return}await s.refreshSalaryList(),await s.showSalarySlipUI(e,t,r)}catch(a){window.showAlert(a.message||"Failed to generate salary")}},generateAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);let r=[];try{r=(await ApiClient.listEmployees()||[]).map(a=>ApiSyncManager.normalizeEmployee(a)).filter(s.isActiveStaff)}catch(n){window.showAlert(`Backend staff data unavailable: ${n.message}`);return}if(r.length===0){window.showAlert("No active staff found");return}if(await ConfirmManager.ask(`Are you sure you want to generate salary for all ${r.length} staff members for this month?`))try{const n=await ApiClient.generatePayroll({employee_id:-1,month:e+1,year:t});await ApiSyncManager.syncMonth(e+1,t,!0),await s.refreshSalaryList(),window.showAlert(`Successfully generated salary for ${n?.generated||0} staff members`)}catch(n){window.showAlert(n.message||"Failed to generate salaries")}},deleteAllSalaries:async()=>{const e=parseInt(document.getElementById("salary-month").value),t=parseInt(document.getElementById("salary-year").value);if(await ConfirmManager.ask("Are you sure you want to delete ALL generated salaries for this month? This will reset all advance and hold deductions."))try{await ApiClient.deleteAllPayroll(e+1,t),await ApiSyncManager.syncMonth(e+1,t,!0),await s.refreshSalaryList(),window.showAlert("Successfully reset salary data for this month")}catch(o){window.showAlert(o.message||"Failed to delete salary records")}},getSlipDataFromSummary:(e,t,r,o=null,n=null)=>{if(!e?.employee?.name||!Number(e?.employee?.monthly_salary))return null;const a=e.generated||e.preview;if(!a)return null;const l=e.employee,i=a.attendance||{},d=Number(o===null?a.advance_deduction||0:o||0),c=Number(n===null?e.available_advance||0:n||0),y=Math.max(0,Math.round(Number(a.before_advance||e.estimated_earnings||0))),g=a.final_salary!==void 0&&o===null,m=g?Math.max(0,Math.round(Number(a.final_salary||0))):Math.max(0,y-d);return{staff:{id:l.id,name:l.name,role:l.role||"-",salaryType:"Monthly",salaryAmount:Number(l.monthly_salary)},p:Number(i.present||0),a:Number(i.absent||0),h:Number(i.half||0),holiday:Number(i.holiday||0),daysPresent:Number(i.working_days||0),adj:{advance:d,hold:Number(a.hold_deduction||0)>0,holdDays:0,releasedAmount:Math.round(Number(a.hold_release||0))},finalSalary:m,month:t,year:r,monthlyOT:Math.round(Number(a.overtime||0)),monthlyFine:Math.round(Number(a.payment_deduction||0)),advBalance:Math.max(0,g?c:c-d),earnedSalary:Math.round(Number(a.earned_salary||0)),holdAmount:Math.round(Number(a.hold_deduction||0)),paymentDeductionRemarks:(a.deduction_entries||[]).map(f=>String(f.notes||"").trim()).filter(Boolean)}},showSalarySlipUI:async(e,t,r)=>{await ApiSyncManager.syncMonth(t+1,r,!0).catch(()=>null);const o=await ApiClient.getPayrollSummary(Number(e),t+1,r).catch(b=>(console.error("Failed to fetch payroll summary",b),null)),n=s.getSlipDataFromSummary(o,t,r);if(!n){window.showAlert("Backend salary data load nahi hua. Real data ke bina slip nahi banegi.");return}const{staff:a,p:l,a:i,h:d,holiday:c,adj:y,finalSalary:g,monthlyOT:m,monthlyFine:f,advBalance:h}=n,S=["January","February","March","April","May","June","July","August","September","October","November","December"],u=`
            <div class="salary-slip-fit-shell">
                ${s.getSlipHTML(n)}
            </div>
            <div class="slip-actions" style="margin-top:2rem; padding-bottom: 2rem; display:grid; grid-template-columns: repeat(3, 1fr); gap:12px;">
                <button class="btn-primary" onclick="SalaryManager.printSlip()"><i class="fas fa-print"></i> Print Slip</button>
                <button class="btn-primary" style="background:#0984e3;" onclick="SalaryManager.downloadPDF('${a.name}', '${S[t]}')"><i class="fas fa-file-pdf"></i> Download PDF</button>
                <button class="btn-primary" style="background:#25D366; border:none;" onclick="SalaryManager.shareWhatsApp('${a.name}', ${g}, '${S[t]}', {p:${l}, a:${i}, h:${d}, holiday:${c}, ot:${m}, fine:${f}, adv:${y.advance||0}, bal:${h}})">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn-outline" style="grid-column: span 3; font-weight:700; border-color:var(--primary); color:var(--primary);" onclick="ModalManager.hide();">
                    <i class="fas fa-times"></i> Close Preview
                </button>
            </div>
        `;ModalManager.show(`Salary Slip - ${a.name}`,u),s.fitActiveSalarySlipModal()},fitActiveSalarySlipModal:()=>{const e=document.getElementById("modal-container"),t=e?.querySelector(".modal-card"),r=e?.querySelector(".modal-header"),o=e?.querySelector(".modal-body"),n=e?.querySelector(".salary-slip-fit-shell"),a=e?.querySelector("#salary-slip-print"),l=e?.querySelector(".slip-actions");if(!e||!t||!o||!n||!a)return;e.classList.add("salary-slip-modal"),t.classList.add("salary-slip-modal-card"),o.classList.add("salary-slip-modal-body");const i=()=>{a.style.transform="",n.style.height="",n.style.minHeight="";const d=r?.offsetHeight||0,c=l?.offsetHeight||0,y=window.getComputedStyle(t),g=window.getComputedStyle(o),m=parseFloat(g.rowGap||g.gap||0),f=parseFloat(y.paddingTop)+parseFloat(y.paddingBottom)+(Number.isFinite(m)?m:0),h=Math.max(280,o.clientWidth),S=Math.max(260,window.innerHeight-d-c-f-52),p=Math.max(a.scrollWidth,a.offsetWidth,1),u=Math.max(a.scrollHeight,a.offsetHeight,1),b=Math.min(1,h/p,S/u),x=Math.ceil(u*b);a.style.transformOrigin="top center",a.style.transform=`scale(${b})`,n.style.height=`${x}px`,n.style.minHeight=`${x}px`};requestAnimationFrame(()=>{i(),requestAnimationFrame(i)}),window.removeEventListener("resize",s._fitSalarySlipOnResize),s._fitSalarySlipOnResize=i,window.addEventListener("resize",s._fitSalarySlipOnResize)},printSlip:()=>{const e=document.getElementById("salary-slip-print").innerHTML,t=window.open("","","height=700,width=700");t.document.write("<html><head><title>Salary Slip</title>"),t.document.write('<link rel="stylesheet" href="style.css">'),t.document.write("<style>body{padding:20px;} .salary-slip{border:1px solid #ddd; padding:20px; border-radius:8px;} .slip-header{text-align:center; margin-bottom:20px;} .slip-row{display:flex; justify-content:space-between; margin-bottom:10px;} .total-row{font-size:1.2rem; border-top:2px solid #333; padding-top:10px; margin-top:10px;} .slip-footer{display:flex; justify-content:space-between; margin-top:50px; border-top:1px dashed #ccc; padding-top:20px;}</style>"),t.document.write("</head><body>"),t.document.write(e),t.document.write("</body></html>"),t.document.close(),setTimeout(()=>t.print(),500)},downloadPDF:async(e,t)=>{const r=document.getElementById("salary-slip-print"),o=r?.style.transform||"",n=r?.style.transformOrigin||"";r&&(r.style.transform="",r.style.transformOrigin="");const a={margin:1,filename:`Salary_Slip_${e}_${t}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}},l=await window.loadHtml2Pdf();Promise.resolve(l().set(a).from(r).save()).finally(()=>{r&&(r.style.transform=o,r.style.transformOrigin=n)})},deleteSalary:async(e,t)=>{if(!await ConfirmManager.ask("Are you sure you want to delete this generated salary? This will reset advance and hold status for this month."))return;const o=StorageManager.get("payrollMap")||{},n=StorageManager.get("salaryAdjustments")||{};let a=o[`${e}:${t}`],l=a?.id||a?.payrollId||n[e]?.[t]?.payrollId;if(!l){const[i,d]=t.split("-").map(Number);await ApiSyncManager.syncMonth(d,i,!0);const c=StorageManager.get("payrollMap")||{},y=StorageManager.get("salaryAdjustments")||{};if(a=c[`${e}:${t}`],l=a?.id||a?.payrollId||y[e]?.[t]?.payrollId,!l){window.showAlert("No generated payroll record ID found. Please try refreshing the page.");return}}try{await ApiClient.deletePayroll(l);const i=StorageManager.get("payrollMap")||{};delete i[`${e}:${t}`],StorageManager.saveLocal("payrollMap",i),n[e]&&n[e][t]&&(delete n[e][t],StorageManager.saveLocal("salaryAdjustments",n));const[d,c]=t.split("-").map(Number);await ApiSyncManager.syncMonth(c,d,!0),await s.refreshSalaryList(),window.showAlert("Generated salary deleted successfully")}catch(i){const[d,c]=t.split("-").map(Number);i.message&&i.message.toLowerCase().includes("not found")?(await ApiSyncManager.syncMonth(c,d,!0),await s.refreshSalaryList(),window.showAlert("Salary record already removed")):window.showAlert(i.message||"Failed to delete salary")}},shareWhatsApp:(e,t,r,o={})=>{let n=`*CAFE PREMIUM SALARY SLIP*%0A---------------------------%0A*Staff:* ${e}%0A*Month:* ${r}%0A%0A*Attendance Summary:*%0A- Present: ${o.p||0}%0A- Half Days: ${o.h||0}%0A- Absent: ${o.a||0}%0A- Holiday: ${o.holiday||0}%0A%0A*Financial Details:*%0A- OT: \u20B9${(o.ot||0).toLocaleString()}%0A- Payment Deduction: \u20B9${(o.fine||0).toLocaleString()}%0A- Advance Adj: \u20B9${(o.adv||0).toLocaleString()}%0A%0A*Final Payout: \u20B9${t.toLocaleString()}*%0A---------------------------%0A*Balance Advance: \u20B9${(o.bal||0).toLocaleString()}*%0A%0AHave a great day!`;window.open(`https://wa.me/?text=${n}`,"_blank")},getCompactSlipHTML:e=>{const{staff:t,p:r,a:o,h:n,holiday:a=0,daysPresent:l,adj:i,finalSalary:d,month:c,year:y,monthlyOT:g,monthlyFine:m,advBalance:f,earnedSalary:h,holdAmount:S}=e,p=["January","February","March","April","May","June","July","August","September","October","November","December"],u=(b,x,D="var(--text-main)")=>`
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <span>${b}</span>
                <strong style="color:${D}; white-space:nowrap;">${x}</strong>
            </div>`;return`
            <div id="salary-slip-print" class="salary-slip" style="padding:16px; border:1px solid #ddd; border-radius:14px; background:#fff; color:#333; font-family:var(--app-font);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; padding-bottom:10px; margin-bottom:12px; border-bottom:1px solid #eee;">
                    <div>
                        <div style="font-size:0.78rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Salary Slip</div>
                        <strong style="font-size:1rem; color:var(--primary);">${p[c]} ${y}</strong>
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
                            ${u("Present",r,"var(--success)")}
                            ${u("Half",n,"var(--warning)")}
                            ${u("Absent",o,"var(--danger)")}
                            ${u("Holiday",a,"var(--info)")}
                            ${u("Working",`${l} Days`)}
                        </div>
                    </div>
                    <div>
                        <h3 style="font-size:0.78rem; color:var(--primary); text-transform:uppercase; margin:0 0 8px; border-left:3px solid var(--primary); padding-left:8px;">Financial</h3>
                        <div style="font-size:0.84rem; display:flex; flex-direction:column; gap:5px;">
                            ${u("Base Salary",s.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:S}))}
                            ${u("Earned Salary",`\u20B9${Math.round(h).toLocaleString()}`,"var(--info)")}
                            ${u("Overtime",`+\u20B9${g.toLocaleString()}`,"var(--success)")}
                            ${u("Deduction",`-\u20B9${m.toLocaleString()}`,"var(--danger)")}
                            ${u("Hold",`-\u20B9${Math.round(S).toLocaleString()}`,"var(--warning)")}
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Advance Deducted</div>
                        <strong style="font-size:0.95rem; color:var(--danger);">\u20B9${(i.advance||0).toLocaleString()}</strong>
                    </div>
                    <div style="padding:9px 11px; border-radius:11px; background:var(--bg-main); border:1px solid var(--border);">
                        <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Remaining Balance</div>
                        <strong style="font-size:0.95rem; color:#6c5ce7;">\u20B9${f.toLocaleString()}</strong>
                    </div>
                </div>

                <div style="margin-top:12px; padding:15px; background:linear-gradient(135deg, rgba(0,184,148,0.14), rgba(9,132,227,0.10)); border:2px solid rgba(0,184,148,0.28); border-radius:15px; text-align:center;">
                    <span style="font-size:0.74rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Net Payable Salary</span>
                    <div style="font-size:2.35rem; line-height:1.02; font-weight:700; color:var(--success); margin-top:4px;">\u20B9${d.toLocaleString()}</div>
                    <p style="font-size:0.68rem; color:#777; margin:4px 0 0; font-style:italic;">${_(Math.round(d))} Only</p>
                </div>
            </div>`},getSlipHTML:e=>{const{staff:t,p:r,a:o,h:n,holiday:a=0,daysPresent:l,adj:i,finalSalary:d,month:c,year:y,monthlyOT:g,monthlyFine:m,advBalance:f,earnedSalary:h,holdAmount:S,paymentDeductionRemarks:p=[]}=e,u=["January","February","March","April","May","June","July","August","September","October","November","December"],b=E=>String(E).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),x=m>0&&p.length>0?`
                            <div style="margin-top:8px; padding:10px 12px; border-radius:10px; background:rgba(214, 48, 49, 0.06); border:1px solid rgba(214, 48, 49, 0.14);">
                                <div style="font-size:0.75rem; font-weight:700; color:var(--danger); text-transform:uppercase; margin-bottom:6px;">Deduction Remarks</div>
                                <div style="display:flex; flex-direction:column; gap:4px; color:#666; font-size:0.82rem;">
                                    ${p.map(E=>`<div>- ${b(E)}</div>`).join("")}
                                </div>
                            </div>
                        `:"",D=b(window.BrandingManager?.getCafeName?.()||"Cafe Admin"),$=b(window.BrandingManager?.getBusinessAddress?.()||""),v=b(window.BrandingManager?.getBusinessPhone?.()||""),k=b(window.BrandingManager?.getBusinessEmail?.()||""),M=[];v&&M.push(`Contact: ${v}`),k&&M.push(`Email: ${k}`);const A=M.join(" | ");return`
            <div id="salary-slip-print" class="salary-slip" style="padding:38px; border:1px solid #ddd; border-radius:16px; background:#fff; color:#333; font-family:var(--app-font); line-height:1.58; overflow:visible;">
                <!-- Business Header -->
                <div style="text-align:center; margin-bottom:28px; border-bottom:2px solid var(--primary); padding-bottom:18px;">
                    <h1 style="margin:0; font-size:2rem; color:var(--primary); text-transform:uppercase; letter-spacing:1px;">${D}</h1>
                    ${$?`<p style="margin:5px 0 0; font-size:1rem; font-weight:700; color:#555;">${$}</p>`:""}
                    ${A?`<p style="margin:2px 0; color:#777; font-size:0.92rem;">${A}</p>`:""}
                    <div style="display:flex; justify-content:center; align-items:center; margin-top:18px;">
                        <div style="display:inline-flex; align-items:center; justify-content:center; min-width:190px; padding:6px 18px; background:var(--primary); color:white; border-radius:20px; font-size:0.88rem; font-weight:700;">
                            Salary Slip: ${u[c]} ${y}
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
                            <div style="display:flex; justify-content:space-between;"><span>Base Salary:</span> <strong>${s.formatSalaryAmountWithHold(t.salaryAmount,{activeHoldAmount:S})}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--success);"><span>Overtime (+):</span> <strong>\u20B9${g.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--danger);"><span>Payment Deduction (-):</span> <strong>\u20B9${m.toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; color:var(--warning);"><span>Hold Amount (-):</span> <strong>\u20B9${Math.round(S).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between; padding-top:5px; border-top:1px solid #eee;"><span>Earned Salary:</span> <strong>\u20B9${Math.round(h).toLocaleString()}</strong></div>
                        </div>
                        ${x}

                        <h3 style="font-size:1.08rem; color:var(--primary); text-transform:uppercase; margin-top:24px; margin-bottom:15px; border-left:4px solid var(--primary); padding-left:10px;">Advance Details</h3>
                        <div style="font-size:1.08rem; display:flex; flex-direction:column; gap:9px;">
                            <div style="display:flex; justify-content:space-between;"><span>Advance Deducted:</span> <strong style="color:var(--danger);">\u20B9${(i.advance||0).toLocaleString()}</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>Remaining Balance:</span> <strong style="color:#6c5ce7;">\u20B9${f.toLocaleString()}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- Final Payout Section -->
                <div style="position:relative; z-index:2; margin:38px 18px 10px; padding:28px; background:linear-gradient(135deg, #dffbf4, #eaf7ff); border:2px solid rgba(0,184,148,0.32); border-radius:16px; text-align:center; box-shadow:0 0 0 14px #fff;">
                    <span style="font-size:1rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:1px;">Net Payable Salary</span>
                    <div style="font-size:3.25rem; line-height:1.05; font-weight:700; color:var(--success); margin-top:8px;">\u20B9${d.toLocaleString()}</div>
                    <p style="font-size:0.9rem; color:#777; margin-top:6px; font-style:italic;">(Rupees: ${_(Math.round(d))} Only)</p>
                </div>

                <div class="slip-footer" style="display:flex; justify-content:space-between; margin-top:38px;">
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employer Signature</strong>
                    </div>
                    <div style="border-top:1px dashed #ccc; padding-top:10px; font-size:0.9rem; width:40%; text-align:center;">
                        <strong>Employee Signature</strong>
                    </div>
                </div>
            </div>`},downloadAllSlips:async()=>{const e=document.getElementById("report-month")||document.getElementById("salary-month"),t=document.getElementById("report-year")||document.getElementById("salary-year");if(!e||!t)return;const r=parseInt(e.value),o=parseInt(t.value);let n=[],a=new Set;try{const[m,f]=await Promise.all([ApiClient.listEmployees(),ApiClient.listPayroll(r+1,o)]);n=(m||[]).map(h=>ApiSyncManager.normalizeEmployee(h)).filter(h=>["active","inactive"].includes(String(h.status||"active").toLowerCase())),a=new Set((f||[]).map(h=>String(h.employee_id)))}catch(m){window.showAlert(`Backend salary slip data unavailable: ${m.message}`);return}const l=["January","February","March","April","May","June","July","August","September","October","November","December"],i=document.createElement("div");i.style.width="800px",i.style.background="white",window.showAlert("Generating all slips... This may take a moment.");let d=!1,c=0;for(const m of n){if(!a.has(String(m.id)))continue;const f=await ApiClient.getPayrollSummary(Number(m.id),r+1,o).catch(u=>(console.error("Failed to fetch payroll summary",u),null)),h=s.getSlipDataFromSummary(f,r,o);if(!h)continue;const S=document.createElement("div");S.innerHTML=s.getSlipHTML(h);const p=S.firstElementChild;p&&(c>0&&(p.style.pageBreakBefore="always"),p.style.marginBottom="0",i.appendChild(p),c++,d=!0)}if(!d){window.showAlert("No generated slips found for this month!");return}const y={margin:.3,filename:`Salary_Slips_${l[r]}_${o}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,letterRendering:!0},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}};i.style.position="fixed",i.style.left="-9999px",i.style.top="0",document.body.appendChild(i),(await window.loadHtml2Pdf())().set(y).from(i).save().then(()=>{document.body.removeChild(i)})}};function _(e){if(isNaN(e)||e===null)return"";const t=Math.floor(Math.abs(e));if(t===0)return"Zero";const r=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"],o=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];function n(a){return a<20?r[a]:a<100?o[Math.floor(a/10)]+(a%10!==0?" "+r[a%10]:""):a<1e3?r[Math.floor(a/100)]+" Hundred"+(a%100!==0?" and "+n(a%100):""):a<1e5?n(Math.floor(a/1e3))+" Thousand"+(a%1e3!==0?" "+n(a%1e3):""):a<1e7?n(Math.floor(a/1e5))+" Lakh"+(a%1e5!==0?" "+n(a%1e5):""):""}return(e<0?"Minus ":"")+n(t)}window.SalaryManager=s;})();

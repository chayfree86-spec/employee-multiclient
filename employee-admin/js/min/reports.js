const ReportsManager={currentAttendanceReport:[],currentAttendanceMap:{},currentExpandedAttendanceStaffId:null,getSummaryCount:(t,e)=>{const a=(t||[]).find(d=>d.status===e);return Number(a?.count||0)},normalizeReportStatus:t=>t==="half_day"?"halfday":t==="weekend"?"holiday":t||"",getPayrollStatusMeta:t=>{const e=String(t||"").toLowerCase();return e==="generated"||e==="paid"?{generated:!0,html:'<span class="status-badge status-active"><i class="fas fa-check-circle" style="margin-right:5px;"></i> Generated</span>'}:e==="draft"?{generated:!1,html:'<span class="status-badge" style="background:rgba(0,0,0,0.05); color:var(--text-muted);"><i class="fas fa-file-alt" style="margin-right:5px;"></i> Draft</span>'}:{generated:!1,html:'<span class="status-badge" style="background:rgba(0,0,0,0.05); color:var(--text-muted);"><i class="fas fa-clock" style="margin-right:5px;"></i> Pending</span>'}},getSlipActionButtonStyle:(t,e)=>`padding:8px 12px; font-size:0.8rem; border-radius:10px; background:${t?e||"var(--primary)":"#b8b0ad"}; color:#fff; opacity:${t?"1":"0.55"}; cursor:${t?"pointer":"not-allowed"}; border:none;`,formatSalaryAmountWithHold:(t,e=null)=>window.HoldSalaryUI?.amount?window.HoldSalaryUI.amount(t,e):`\u20B9${Number(t||0).toLocaleString()}`,formatReportDate:t=>{if(!t)return"";const e=new Date(`${t}T00:00:00`);return Number.isNaN(e.getTime())?t:`${String(e.getDate()).padStart(2,"0")}-${String(e.getMonth()+1).padStart(2,"0")}-${e.getFullYear()}`},getDefaultReportPeriod:async()=>{const t=new Date,e={month:t.getMonth(),year:t.getFullYear()};try{const d=(await ApiClient.listPayroll()||[]).filter(i=>{const r=String(i.status||"").toLowerCase();return r==="generated"||r==="paid"||i.id}).map(i=>({month:Number(i.month||0),year:Number(i.year||0),id:Number(i.id||0)})).filter(i=>i.month>=1&&i.month<=12&&i.year>0).sort((i,r)=>r.year-i.year||r.month-i.month||r.id-i.id);if(d.length>0)return{month:d[0].month-1,year:d[0].year}}catch(a){console.error("Failed to load default report payroll period from backend",a)}return e},renderExpandedStaffShell:(t,e,a,d="")=>`
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:var(--bg-main);">
                    <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                    <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Section</th>
                    <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr class="attendance-row active">
                    <td style="padding:1.2rem;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${t.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(t.name),"3E2723","fff",35)}" alt="${t.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(t.name)}', '3E2723', 'fff', 35)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                            <div>
                                <div style="font-weight:800;">${t.name}</div>
                                <div style="font-size:0.75rem; color:var(--text-muted);">${t.role||"Staff"}</div>
                            </div>
                        </div>
                    </td>
                    <td style="padding:1.2rem; font-weight:800; color:var(--primary);">${e}</td>
                    <td style="padding:1.2rem; text-align:right;">${d}</td>
                </tr>
                <tr class="details-row active">
                    <td colspan="3" style="padding:0;">
                        <div style="padding:1.5rem; border-top:1px solid var(--border); background:#fafafa;">
                            ${a}
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `,renderExpandedFinancialDetail:(t,e=null)=>t?`
            <div style="display:grid; grid-template-columns:repeat(3, minmax(160px, 1fr)); gap:12px;">
                ${[["Base Salary",t.base_salary||0,"var(--primary)",e],["Overtime",t.overtime||0,"var(--success)"],["Payment Deduction",Number(t.fine||0)+Number(t.deduction||0),"var(--danger)"],["Advance Deducted",t.advance_deduction||0,"var(--info)"],["Hold Salary",t.hold_deduction||0,"var(--warning)"],["Net Payable",t.total_salary||0,"var(--success)"]].map(([d,i,r,n])=>`
            <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:1rem;">
                <div style="font-size:0.68rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">${d}</div>
                <div style="font-size:1.2rem; font-weight:900; color:${r}; margin-top:5px;">${d==="Base Salary"?ReportsManager.formatSalaryAmountWithHold(i,n):`\u20B9${Number(i||0).toLocaleString()}`}</div>
            </div>
        `).join("")}
            </div>
            <div style="margin-top:12px; color:var(--text-muted); font-size:0.82rem; font-weight:700;">
                Attendance: ${Number(t.present_days||0)}P / ${Number(t.half_days||0)}HD / ${Number(t.absent_days||0)}A / ${Number(t.weekend_holiday_days||0)}HO
            </div>
        `:'<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:800;">Backend payroll record not generated for this month.</div>',renderExpandedAdvancesDetail:t=>t.length?`
            <table style="width:100%; border-collapse:collapse; background:var(--bg-card); border-radius:14px; overflow:hidden;">
                <thead>
                    <tr style="background:var(--bg-main);">
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Date</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Type</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Amount</th>
                        <th style="padding:1rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    ${t.map(e=>`
                        <tr style="border-bottom:1px solid var(--border);">
                            <td style="padding:1rem; font-weight:700;">${ReportsManager.formatReportDate(e.date)}</td>
                            <td style="padding:1rem;"><span class="badge ${e.type==="paid"?"badge-danger":"badge-success"}">${e.type.toUpperCase()}</span></td>
                            <td style="padding:1rem; font-weight:900;">\u20B9${Number(e.amount||0).toLocaleString()}</td>
                            <td style="padding:1rem; color:var(--text-muted);">${e.remark||"---"}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `:'<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:800;">No backend advance records found for this month.</div>',renderExpandedSlipDetail:(t,e,a,d,i,r)=>{const n=ReportsManager.getPayrollStatusMeta(e?.status),s=n.generated;return`
            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
                <div>
                    <div style="font-size:0.72rem; color:var(--text-muted); font-weight:800; text-transform:uppercase;">Salary Slip Status</div>
                    <div style="margin-top:8px;">${n.html}</div>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button class="btn-primary" onclick="${s?`SalaryManager.showSalarySlipUI('${t.id}', ${a}, ${d})`:"return false"}"
                        style="${ReportsManager.getSlipActionButtonStyle(s,"var(--primary)")}"
                        ${s?"":"disabled"} title="View Slip">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-primary" onclick="${s?`SalaryManager.showSalarySlipUI('${t.id}', ${a}, ${d}); setTimeout(() => SalaryManager.printSlip(), 500);`:"return false"}"
                        style="${ReportsManager.getSlipActionButtonStyle(s,"#0984e3")}"
                        ${s?"":"disabled"} title="Download/Print">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn-primary" onclick="${s?`ReportsManager.handleShareSlip('${t.id}', ${a}, ${d}, '${i}', '${r}')`:"return false"}"
                        style="${ReportsManager.getSlipActionButtonStyle(s,"#25D366")}"
                        ${s?"":"disabled"} title="Share on WhatsApp">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                </div>
            </div>
            ${e?`<div style="margin-top:1rem; color:var(--text-muted); font-size:0.82rem; font-weight:700;">Net Payable: \u20B9${Number(e.total_salary||0).toLocaleString()}</div>`:""}
        `},renderDashboard:async t=>{const e=await ApiClient.getDashboard().catch(r=>(console.error("Failed to load dashboard",r),null));if(!e?.stats){t.innerHTML=`
                <div class="card" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">
                    Backend dashboard data unavailable
                </div>
            `;return}const a=e.stats,d=ReportsManager.getDashboardStaffRows(e.staffOverview||[]),i=ReportsManager.getDashboardAttendanceBars(e.charts?.attendanceHistory||[]);t.innerHTML=`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#F3E5F5; color:#7B1FA2;"><i class="fas fa-users"></i></div>
                        <span class="stat-trend badge-success">Current</span>
                    </div>
                    <div class="stat-info">
                        <h3>Total Staff</h3>
                        <div class="stat-value">${a.totalEmployees??0}</div>
                        <div style="display:flex; gap:12px; margin-top:6px; flex-wrap:wrap; font-size:0.75rem; font-weight:700;">
                            <span style="color:var(--success);">Active: ${a.activeEmployees??0}</span>
                            <span style="color:var(--danger);">Deactive: ${a.deactiveEmployees??0}</span>
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#E8F5E9; color:#2E7D32;"><i class="fas fa-user-check"></i></div>
                        <span class="stat-trend badge-success">+2.5%</span>
                    </div>
                    <div class="stat-info">
                        <h3>Present Today</h3>
                        <div class="stat-value">${a.todayPresent??0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon" style="background:#FFEBEE; color:#C62828;"><i class="fas fa-user-times"></i></div>
                        <span class="stat-trend badge-warning">-1.2%</span>
                    </div>
                    <div class="stat-info">
                        <h3>Absent Today</h3>
                        <div class="stat-value">${a.todayAbsent??0}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3>Payment Detail</h3>
                </div>
                
                <div class="payment-summary-grid" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:20px; margin-bottom:1.5rem;">
                    <div>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">TOTAL SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--primary);">\u20B9${Number(a.totalBaseSalary||0).toLocaleString()}</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">PAYOUT SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--success);">\u20B9${Number(a.currentMonthPayable||0).toLocaleString()}</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">ADVANCE PAYMENTS</p>
                        <h4 style="font-size:1.25rem; color:var(--info);">\u20B9${Number(a.totalAdvancePending||0).toLocaleString()} (${Number(a.advanceStaffCount||0)} Staff)</h4>
                    </div>
                    <div style="border-left:1px solid var(--border); padding-left:20px;">
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:4px; font-weight:600;">HELD SALARY</p>
                        <h4 style="font-size:1.25rem; color:var(--danger);">\u20B9${Number(a.heldSalaryAmount||0).toLocaleString()} (${Number(a.holdStaffCount||0)} Staff)</h4>
                    </div>
                </div>
                <div style="text-align:right;">
                    <button class="btn-primary" onclick="switchView('salary')" style="min-width:200px;">
                        <i class="fas fa-wallet" style="margin-right:8px;"></i> Manage Monthly Salaries
                    </button>
                </div>
            </div>

            <div class="dashboard-middle" style="grid-template-columns: 1fr;"> <!-- Made it 1 column -->
                <div class="card">
                    <div class="card-header">
                        <h3>Weekly Attendance Trends</h3>
                        <select class="btn-outline">
                            <option>Last 7 Days</option>
                        </select>
                    </div>
                    <div class="chart-container" style="align-items:end; min-height:230px;">
                        ${i.map(r=>`
                            <div class="chart-bar-wrapper" title="${r.title}" style="gap:8px;">
                                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:800;">${r.total}</div>
                                <div class="chart-bar-stack" style="height:${r.height}%; min-height:${r.total>0?"18px":"3px"}; width:28px; border-radius:12px 12px 4px 4px; overflow:hidden; display:flex; flex-direction:column-reverse; background:#eef2f7; box-shadow:inset 0 0 0 1px rgba(0,0,0,0.04);">
                                    <span style="display:block; flex:0 0 ${r.presentPct}%; background:#00b894;"></span>
                                    <span style="display:block; flex:0 0 ${r.halfPct}%; background:#fdcb6e;"></span>
                                    <span style="display:block; flex:0 0 ${r.absentPct}%; background:#d63031;"></span>
                                </div>
                                <span class="chart-label">${r.label}</span>
                                <span style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">${r.dateLabel}</span>
                            </div>
                        `).join("")}
                    </div>
                    <div style="display:flex; justify-content:center; gap:18px; margin-top:14px; font-size:0.75rem; color:var(--text-muted); font-weight:700;">
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#00b894;"></span> Present</span>
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#fdcb6e;"></span> Half Day</span>
                        <span><span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#d63031;"></span> Absent</span>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 2rem;">
                <div class="card-header">
                    <h3>Staff Overview</h3>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-outline"><i class="fas fa-filter"></i> Filter</button>
                        <button class="btn-primary" style="background:#2b1b17;"><i class="fas fa-file-export"></i> Export</button>
                    </div>
                </div>
                <div class="staff-overview">
                    <table>
                        <thead>
                            <tr>
                                <th>EMPLOYEE</th>
                                <th>ROLE</th>
                                <th>SHIFT STATUS</th>
                                <th>CHECK IN</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${d}
                        </tbody>
                    </table>
                </div>
            </div>
        `},getDashboardStaffRows:(t=[])=>t.length===0?'<tr><td colspan="5" style="text-align:center; padding:2rem;">No staff registered yet</td></tr>':t.slice(0,5).map(e=>`
            <tr>
                <td>
                    <div class="employee-cell">
                        <img src="${e.profile_image||window.PhotoHelper.avatarUrl(encodeURIComponent(e.name),"3E2723","fff",40)}" alt="${e.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(e.name)}', '3E2723', 'fff', 40)" class="employee-avatar">
                        <div>
                            <div style="font-weight:600;">${e.name}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${e.id}</div>
                        </div>
                    </div>
                </td>
                <td>${e.role}</td>
                <td><span class="badge ${ReportsManager.getAttendanceBadgeClass(e.attendance_status)}">${ReportsManager.formatAttendanceStatus(e.attendance_status)}</span></td>
                <td>${e.check_in||"--:--"}</td>
                <td><button class="btn-outline" onclick="switchView('staff-profile', '${e.id}')">View Profile</button></td>
            </tr>
        `).join(""),getDashboardAttendanceBars:(t=[])=>{if(!Array.isArray(t)||t.length===0)return["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((a,d)=>({label:a,height:0,isWeekend:d>=5}));const e=Math.max(...t.map(a=>{const d=Number(a.present||0),i=Number(a.absent||0),r=Number(a.half_day||a.halfDay||0);return d+i+r}),1);return t.slice(-7).map((a,d)=>{const i=Number(a.present||0),r=Number(a.absent||0),n=Number(a.half_day||a.halfDay||0),s=i+r+n,l=a.date?new Date(`${a.date}T00:00:00`):null,S=l&&!Number.isNaN(l.getTime())?l.toLocaleDateString("en-IN",{day:"2-digit",month:"short"}):"";return{label:a.label||a.day||a.month||`D${d+1}`,dateLabel:S,total:s,presentPct:s>0?Math.round(i/s*100):0,absentPct:s>0?Math.round(r/s*100):0,halfPct:s>0?Math.round(n/s*100):0,height:s>0?Math.max(12,Math.round(s/e*100)):2,isWeekend:!!(a.is_weekend||a.isWeekend),title:`${a.date||""} | Present: ${i}, Half: ${n}, Absent: ${r}`}})},getAttendanceBadgeClass:t=>t==="present"?"badge-success":t==="absent"?"badge-danger":t==="half_day"||t==="halfday"?"badge-warning":t==="holiday"||t==="weekend"?"badge-info":"badge-warning",formatAttendanceStatus:t=>({present:"Present",absent:"Absent",half_day:"Half Day",halfday:"Half Day",holiday:"Holiday",weekend:"Weekly Off",not_marked:"Not Marked"})[t]||"Not Marked",renderReports:async t=>{await ApiSyncManager.bootstrapCore();const e=["January","February","March","April","May","June","July","August","September","October","November","December"],a=new Date,d=await ReportsManager.getDefaultReportPeriod(),i=d.month,r=d.year,n=Array.from(new Set([r,a.getFullYear(),a.getFullYear()-1])).filter(s=>Number.isFinite(s)&&s>0).sort((s,l)=>l-s);t.innerHTML=`
            <div style="display:flex; flex-direction:column; gap:2rem; padding-bottom:2rem; animation: fadeIn 0.4s ease-out;">
                <!-- Premium Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, var(--primary), var(--primary-light)); padding:2rem; border-radius:24px; color:white; box-shadow:0 10px 30px rgba(62, 39, 35, 0.15);">
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                            <div style="background:rgba(255,255,255,0.2); width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                                <i class="fas fa-chart-pie" style="color:var(--accent);"></i>
                            </div>
                            <h1 style="font-size:1.8rem; font-weight:800; margin:0; letter-spacing:-0.5px;">Business Reports</h1>
                        </div>
                        <p style="opacity:0.8; font-size:0.9rem; font-weight:500;">Analyze your cafe's performance and staff efficiency</p>
                    </div>
                    
                    <div class="report-period-controls">
                        <div class="report-period-control">
                            <select id="report-month" onchange="ReportsManager.refreshReportView()" 
                                class="report-period-select" style="width:150px;">
                                ${e.map((s,l)=>`<option value="${l}" ${l===i?"selected":""}>${s}</option>`).join("")}
                            </select>
                        </div>
                        <div class="report-period-control">
                            <select id="report-year" onchange="ReportsManager.refreshReportView()" 
                                class="report-period-select" style="width:115px;">
                                ${n.map(s=>`<option value="${s}" ${s===r?"selected":""}>${s}</option>`).join("")}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Tabs & Quick Actions -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:0.75rem; border-radius:20px; border:1px solid var(--border); box-shadow:var(--shadow);">
                    <div class="report-tabs" style="display:flex; gap:5px; background:var(--bg-main); padding:6px; border-radius:16px;">
                        <button class="report-tab-btn active" onclick="ReportsManager.updateActiveTab(this, 'attendance')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:white; color:var(--primary); box-shadow:0 4px 6px rgba(0,0,0,0.05);">Attendance</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'salary')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Financials</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'advances')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Advances</button>
                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'slips')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Salary Slips</button>
                    </div>
                    <button id="report-action-btn" class="btn-primary" onclick="window.print()" style="background:var(--primary); padding:12px 24px; border-radius:14px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-print"></i> <span>Download Report</span>
                    </button>
                </div>

                <!-- Main Data Table Container -->
                <div class="card" style="padding:0; overflow:hidden; border-radius:24px; border:1px solid var(--border);">
                    <div id="report-content" class="table-responsive" style="margin:0;"></div>
                </div>
            </div>
            <style>
                .attendance-row { cursor: pointer; transition: background 0.2s; }
                .attendance-row:hover { background: rgba(0,0,0,0.02) !important; }
                .attendance-row.active { background: #fcfcfc !important; }
                .details-row { display: none; background: #fafafa; border-bottom: 1px solid var(--border); }
                .details-row.active { display: table-row; }
                .calendar-grid { 
                    display: grid; 
                    grid-template-columns: repeat(16, 1fr); 
                    gap: 10px; 
                    padding: 20px; 
                    width: 100%;
                }
                .calendar-day {
                    aspect-ratio: 1/1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid var(--border);
                    transition: all 0.2s;
                }
                .calendar-day span { font-size: 0.62rem; opacity: 0.9; margin-top: 2px; text-transform:uppercase; }
                .day-present { background: var(--success); color: #fff; border-color: var(--success); }
                .day-absent { background: var(--danger); color: #fff; border-color: var(--danger); }
                .day-half { background: var(--warning); color: #3E2723; border-color: var(--warning); }
                .day-off { background: #B2BEC3; color: #fff; border-color: #B2BEC3; }
                .calendar-header { 
                    text-align: center; 
                    font-size: 0.7rem; 
                    font-weight: 700; 
                    color: var(--text-muted); 
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
            </style>
        `,window.requestAnimationFrame(()=>{window.setupCustomDropdown?.("report-month"),window.setupCustomDropdown?.("report-year")}),ReportsManager.refreshReportView()},updateActiveTab:(t,e)=>{document.querySelectorAll(".report-tab-btn").forEach(a=>{a.classList.remove("active"),a.style.background="transparent",a.style.color="var(--text-muted)",a.style.boxShadow="none"}),t.classList.add("active"),t.style.background="white",t.style.color="var(--primary)",t.style.boxShadow="0 4px 6px rgba(0,0,0,0.05)",ReportsManager.showReport(e)},refreshReportView:()=>{const e=document.querySelector(".report-tab-btn.active").textContent.toLowerCase(),a=e.includes("attendance")?"attendance":e.includes("financials")?"salary":e.includes("advances")?"advances":"slips";ReportsManager.showReport(a)},showReport:async t=>{const e=document.getElementById("report-action-btn");e&&(t==="slips"?(e.onclick=()=>SalaryManager.downloadAllSlips(),e.querySelector("span").textContent="Download All Slips",e.querySelector("i").className="fas fa-file-pdf",e.style.background="#0984e3"):(e.onclick=()=>ReportsManager.downloadTableAsPDF(t),e.querySelector("span").textContent=`Download ${t.charAt(0).toUpperCase()+t.slice(1)} Report`,e.querySelector("i").className="fas fa-file-pdf",e.style.background="var(--primary)"));const a=["January","February","March","April","May","June","July","August","September","October","November","December"],d=document.getElementById("report-content"),i=document.getElementById("report-summary-cards"),r=parseInt(document.getElementById("report-month").value),n=parseInt(document.getElementById("report-year").value);let s=[],l={},S={},A=[],u={advances:{},fines:{},overtime:{}};try{const[c,p,m,g]=await Promise.all([ApiClient.listEmployees(),ApiClient.listAof(),ApiClient.listPayroll(r+1,n),ApiClient.getAttendanceMonth(r+1,n)]);s=(c||[]).map(o=>ApiSyncManager.normalizeEmployee(o)).filter(o=>o.status==="active"||o.status==="inactive"),(g?.list||[]).forEach(o=>{const f=String(o.employee_id||"");!f||!o.date||(l[o.date]||(l[o.date]={}),l[o.date][f]=ApiSyncManager.statusFromApi(o.status))}),ReportsManager.currentAttendanceMap=l,u=ApiSyncManager.normalizeAof(p||[]),StorageManager.saveLocal("advances",u.advances),StorageManager.saveLocal("fines",u.fines),StorageManager.saveLocal("overtime",u.overtime),A=m||[],S=ApiSyncManager.buildPayrollState(A).salaryAdjustments}catch(c){console.error("Failed to load backend report data",c),d.innerHTML='<div style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend report data unavailable</div>';return}const h=`${n}-${String(r+1).padStart(2,"0")}`,M={};A.forEach(c=>{M[String(c.employee_id)]=c});const y=s.find(c=>String(c.id)===String(ReportsManager.currentExpandedAttendanceStaffId));if(t!=="attendance"&&y){if(t==="salary"){const c=M[String(y.id)];d.innerHTML=ReportsManager.renderExpandedStaffShell(y,"Financials",ReportsManager.renderExpandedFinancialDetail(c,y),c?`<button class="btn-primary" onclick="SalaryManager.showSalarySlipUI('${y.id}', ${r}, ${n})" style="padding:8px 12px; font-size:0.8rem; border-radius:10px;"><i class="fas fa-file-invoice-dollar"></i> Slip</button>`:"");return}if(t==="advances"){const c=((u.advances||{})[String(y.id)]||[]).filter(p=>{const m=new Date(`${p.date}T00:00:00`);return m.getMonth()===r&&m.getFullYear()===n});d.innerHTML=ReportsManager.renderExpandedStaffShell(y,"Advances",ReportsManager.renderExpandedAdvancesDetail(c));return}if(t==="slips"){d.innerHTML=ReportsManager.renderExpandedStaffShell(y,"Salary Slips",ReportsManager.renderExpandedSlipDetail(y,M[String(y.id)],r,n,h,a[r]));return}}if(t==="attendance"){let c=0,p=0,m=0;const g=s.map(o=>{let f=0,v=0,x=0,D=0;const E=new Date(n,r+1,0).getDate();for(let k=1;k<=E;k++){const z=`${n}-${String(r+1).padStart(2,"0")}-${String(k).padStart(2,"0")}`,$=(l[z]||{})[o.id];$==="present"?f++:$==="absent"?v++:$==="halfday"?x++:$==="holiday"&&D++}return c+=f,p+=v,m+=x,`
                    <tr class="attendance-row" onclick="ReportsManager.toggleStaffAttendance('${o.id}')" id="row-${o.id}">
                        <td style="padding:1.2rem; display:flex; align-items:center; gap:12px;">
                            <img src="${o.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(o.name),"3E2723","fff",30)}" alt="${o.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(o.name)}', '3E2723', 'fff', 30)" style="width:30px; height:30px; border-radius:8px; object-fit:cover;">
                            <span style="font-weight:700;">${o.name} <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-left:8px; opacity:0.3;"></i></span>
                        </td>
                        <td style="padding:1.2rem;"><span style="color:var(--success); font-weight:700;">${f}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem;"><span style="color:var(--danger); font-weight:700;">${v}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem;"><span style="color:var(--warning); font-weight:700;">${x}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem; font-weight:800; background:rgba(0,0,0,0.02); color:var(--success);">${f+x*.5} <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
                        <td style="padding:1.2rem; text-align:right;">
                            <button class="btn-outline" onclick="event.stopPropagation(); ReportsManager.downloadSingleStaffCalendar('${o.id}', ${r}, ${n}, '${o.name}')" style="padding:6px 10px; font-size:0.7rem; border-radius:8px;" title="Download Calendar">
                                <i class="fas fa-download"></i>
                            </button>
                        </td>
                    </tr>
                    <tr class="details-row" id="details-${o.id}">
                        <td colspan="6" style="padding:0;">
                            <div style="padding:1.5rem; text-align:center; border-top:1px solid var(--border);">
                                <h4 style="font-size:0.9rem; margin-bottom:1rem; color:var(--primary);">Attendance Calendar - ${a[r]} ${n}</h4>
                                <div id="calendar-export-${o.id}">
                                    ${ReportsManager.renderStaffCalendar(o.id,r,n)}
                                </div>
                                <div style="display:flex; justify-content:center; gap:15px; margin-top:15px; font-size:0.7rem; font-weight:700;">
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--success);"></span> Present</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--danger);"></span> Absent</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:var(--warning);"></span> Half Day</span>
                                    <span style="display:flex; align-items:center; gap:5px;"><span style="width:8px; height:8px; border-radius:50%; background:#ccc;"></span> Holiday/Off</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                `}).join("");d.innerHTML=`
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Present</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Absent</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Half</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Total Att.</th>
                            <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>${g}</tbody>
                </table>
            `,ReportsManager.restoreExpandedAttendanceRow()}else if(t==="salary"){let c=0,p=0,m=0;const g=s.map(o=>{const f=(S[o.id]||{})[h]||{advance:0,hold:!1,holdDays:0},v=SalaryManager.calculateDaysPresent(o.id,r,n,l),x=SalaryManager.calculateBaseEarned(o,v,r,n),D=((StorageManager.get("fines")||{})[o.id]||[]).filter(w=>{const b=new Date(w.date);return b.getMonth()===r&&b.getFullYear()===n}).reduce((w,b)=>w+b.amount,0),E=((StorageManager.get("overtime")||{})[o.id]||[]).filter(w=>{const b=new Date(w.date);return b.getMonth()===r&&b.getFullYear()===n}).reduce((w,b)=>w+b.amount,0),k=x/(v||1),z=f.hold?k*(f.holdDays||0):0,$=SalaryManager.calculateFinalSalary(o,v,f,o.id,r,n);return`
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:1rem; font-weight:700;">${o.name}</td>
                        <td style="padding:1rem;">${ReportsManager.formatSalaryAmountWithHold(o.salaryAmount||0,o)}</td>
                        <td style="padding:1rem; color:var(--success); font-weight:600;">+\u20B9${E.toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--danger); font-weight:600;">-\u20B9${D.toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--danger); font-weight:600;">-\u20B9${(f.advance||0).toLocaleString()}</td>
                        <td style="padding:1rem; color:var(--warning); font-weight:600;">\u20B9${Math.round(z).toLocaleString()}</td>
                        <td style="padding:1rem; font-weight:600;">\u20B9${Math.round(x).toLocaleString()}</td>
                        <td style="padding:1rem; font-weight:800; color:var(--info); background:rgba(9,132,227,0.03);">\u20B9${Math.round($).toLocaleString()}</td>
                        <td style="padding:1rem; text-align:right;">
                            <button class="btn-primary" onclick="SalaryManager.showSalarySlipUI('${o.id}', ${r}, ${n})" style="padding:6px 10px; font-size:0.7rem; border-radius:8px;" title="View Slip">
                                <i class="fas fa-file-invoice-dollar"></i> Slip
                            </button>
                        </td>
                    </tr>
                `}).join("");d.innerHTML=`
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Name</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Base Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Overtime</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Payment Deduction</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Advance Adj</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Hold Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Earn Salary</th>
                            <th style="padding:1rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Payout</th>
                            <th style="padding:1rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>${g}</tbody>
                </table>`}else if(t==="advances"){const c=StorageManager.get("advances")||{};let p=[];s.forEach(m=>{(c[m.id]||[]).filter(g=>{const o=new Date(g.date);return o.getMonth()===r&&o.getFullYear()===n}).forEach(g=>p.push({...g,staffName:m.name}))}),d.innerHTML=`<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:var(--bg-main);"><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Date</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Type</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Amount</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Remark</th></tr></thead><tbody>${p.map(m=>`<tr><td style="padding:1.2rem;">${new Date(m.date).toLocaleDateString()}</td><td style="padding:1.2rem; font-weight:700;">${m.staffName}</td><td style="padding:1.2rem;"><span class="badge ${m.type==="paid"?"badge-danger":"badge-success"}">${m.type.toUpperCase()}</span></td><td style="padding:1.2rem; font-weight:800;">\u20B9${m.amount.toLocaleString()}</td><td style="padding:1.2rem; color:var(--text-muted); font-size:0.85rem;">${m.remark||"---"}</td></tr>`).join("")}</tbody></table>`}else if(t==="slips"){const c=s.map(p=>{const m=M[String(p.id)],g=ReportsManager.getPayrollStatusMeta(m?.status),o=g.generated;return`
                    <tr>
                        <td style="padding:1.2rem;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${p.photo||window.PhotoHelper.avatarUrl(encodeURIComponent(p.name),"3E2723","fff",35)}" alt="${p.name} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${encodeURIComponent(p.name)}', '3E2723', 'fff', 35)" style="width:35px; height:35px; border-radius:10px; object-fit:cover;">
                                <div>
                                    <div style="font-weight:700;">${p.name}</div>
                                    <div style="font-size:0.75rem; color:var(--text-muted);">${p.role}</div>
                                </div>
                            </div>
                        </td>
                        <td style="padding:1.2rem;">
                            ${g.html}
                        </td>
                        <td style="padding:1.2rem; text-align:right;">
                            <div style="display:flex; justify-content:flex-end; gap:8px;">
                                <button class="btn-primary" onclick="${o?`SalaryManager.showSalarySlipUI('${p.id}', ${r}, ${n})`:"return false"}"
                                    style="${ReportsManager.getSlipActionButtonStyle(o,"var(--primary)")}"
                                    ${o?"":"disabled"} title="View Slip">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn-primary" onclick="${o?`SalaryManager.showSalarySlipUI('${p.id}', ${r}, ${n}); setTimeout(() => SalaryManager.printSlip(), 500);`:"return false"}"
                                    style="${ReportsManager.getSlipActionButtonStyle(o,"#0984e3")}"
                                    ${o?"":"disabled"} title="Download/Print">
                                    <i class="fas fa-print"></i>
                                </button>
                                <button class="btn-primary" onclick="${o?`ReportsManager.handleShareSlip('${p.id}', ${r}, ${n}, '${h}', '${a[r]}')`:"return false"}"
                                    style="${ReportsManager.getSlipActionButtonStyle(o,"#25D366")}"
                                    ${o?"":"disabled"} title="Share on WhatsApp">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `}).join("");d.innerHTML=`
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--bg-main);">
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff Member</th>
                            <th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Status</th>
                            <th style="padding:1.2rem; text-align:right; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${s.length===0?'<tr><td colspan="3" style="padding:3rem; text-align:center; color:var(--text-muted);">No staff found matching the criteria.</td></tr>':c}
                    </tbody>
                </table>
            `}},toggleStaffAttendance:t=>{const e=document.getElementById(`row-${t}`),a=document.getElementById(`details-${t}`);if(!e||!a)return;const d=a.classList.contains("active");document.querySelectorAll(".details-row").forEach(i=>i.classList.remove("active")),document.querySelectorAll(".attendance-row").forEach(i=>i.classList.remove("active")),d?ReportsManager.currentExpandedAttendanceStaffId=null:(ReportsManager.currentExpandedAttendanceStaffId=String(t),e.classList.add("active"),a.classList.add("active"))},restoreExpandedAttendanceRow:()=>{const t=ReportsManager.currentExpandedAttendanceStaffId;if(!t)return;const e=document.getElementById(`row-${t}`),a=document.getElementById(`details-${t}`);!e||!a||(e.classList.add("active"),a.classList.add("active"))},renderStaffCalendar:(t,e,a)=>{const d=ReportsManager.currentAttendanceMap||{},i=new Date(a,e+1,0).getDate();let r='<div class="calendar-grid">';const n=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];for(let s=1;s<=i;s++){const l=new Date(a,e,s),S=n[l.getDay()],A=`${a}-${String(e+1).padStart(2,"0")}-${String(s).padStart(2,"0")}`,u=(d[A]||{})[t];let h="";u==="present"?h="day-present":u==="absent"?h="day-absent":u==="halfday"?h="day-half":u==="holiday"&&(h="day-off"),r+=`
                <div class="calendar-day ${h}" title="${s} ${u||"No Data"}">
                    <div>${s}</div>
                    <span>${S}</span>
                </div>
            `}return r+="</div>",r},handleShareSlip:async(t,e,a,d,i)=>{try{const r=await ApiClient.getPayrollSummary(Number(t),e+1,a),n=SalaryManager.getSlipDataFromSummary(r,e,a);if(!n){window.showAlert("Backend salary slip data unavailable");return}SalaryManager.shareWhatsApp(n.staff.name,n.finalSalary,i,{p:n.presentDays,a:n.absentDays,h:n.halfDays,ot:n.adj.overtime||0,fine:n.monthlyFine||0,adv:n.adj.advance||0,bal:n.advBalance||0})}catch(r){window.showAlert(`Backend salary slip data unavailable: ${r.message}`)}},downloadTableAsPDF:async t=>{const e=document.getElementById("report-content"),a=parseInt(document.getElementById("report-month").value),d=parseInt(document.getElementById("report-year").value),i=["January","February","March","April","May","June","July","August","September","October","November","December"],r=e.querySelectorAll("button, .action-cell, th:last-child, td:last-child");r.forEach(l=>l.style.display="none");const n={margin:.3,filename:`${t.charAt(0).toUpperCase()+t.slice(1)}_Report_${i[a]}_${d}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0},jsPDF:{unit:"in",format:"letter",orientation:["attendance","salary"].includes(t)?"landscape":"portrait"}};window.showAlert(`Generating ${t} report PDF...`),(await window.loadHtml2Pdf())().set(n).from(e).save().then(()=>{r.forEach(l=>l.style.display="")})},downloadSingleStaffCalendar:async(t,e,a,d)=>{const i=document.getElementById(`calendar-export-${t}`),r=["January","February","March","April","May","June","July","August","September","October","November","December"],n=document.createElement("div");n.style.padding="40px",n.style.background="#fff",n.style.fontFamily="var(--app-font)",n.innerHTML=`
            <div style="text-align:center; margin-bottom:30px; border-bottom:2px solid #3E2723; padding-bottom:15px;">
                <h1 style="color:#3E2723; margin:0;">CAFE PREMIUM</h1>
                <p style="margin:5px 0; font-weight:700;">Attendance Calendar: ${d}</p>
                <p style="color:#666; font-size:0.9rem;">${r[e]} ${a}</p>
            </div>
            ${i.innerHTML}
            <div style="display:flex; justify-content:center; gap:15px; margin-top:30px; font-size:0.8rem; font-weight:700;">
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#00b894;"></span> Present</span>
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#d63031;"></span> Absent</span>
                <span style="display:flex; align-items:center; gap:5px;"><span style="width:10px; height:10px; border-radius:50%; background:#fdcb6e;"></span> Half Day</span>
            </div>
        `;const s={margin:.5,filename:`Attendance_${d}_${r[e]}_${a}.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}};(await window.loadHtml2Pdf())().set(s).from(n).save()}};window.ReportsManager=ReportsManager;

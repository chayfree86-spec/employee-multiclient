employee-admin\js\attendance.js:330:            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--danger); font-weight:700;">Backend attendance data unavailable</td></tr>';
employee-admin\js\attendance.js:354:                    <td onclick="switchView('staff-profile', '${s.id}')" style="cursor:pointer; font-weight:700; color:var(--primary);">
employee-admin\js\attendance.js:359:                                    <span style="font-weight:700;">${s.name}</span>
employee-admin\js\attendance.js:450:                <button type="button" onclick="AttendanceManager.loadLatestSavedDate()" style="margin-left:10px; padding:6px 10px; border:none; border-radius:10px; background:#9a6700; color:white; font-weight:700; cursor:pointer;">Load Latest Saved Date</button>`;
employee-admin\js\attendance.js:554:                            <div id="sync-counter" style="font-size:5rem; font-weight:700; color:var(--primary); line-height:1; font-family:var(--app-font);">0</div>
employee-admin\js\attendance.js:555:                            <div style="font-size:0.85rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:3px; margin-top:5px;">Process</div>
employee-admin\js\attendance.js:560:                        <div id="syncing-name" style="font-size:2.2rem; font-weight:700; color:var(--primary); font-family:var(--app-font); opacity:0; transform:translateY(20px) rotateX(-20deg); transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);">Initializing...</div>
employee-admin\js\attendance.js:565:                        <span style="font-weight:700; color:var(--text-main); font-size:1.2rem;">Marking <b>${statusText}</b></span>
employee-admin\js\reports.js:103:                                <div style="font-weight:700;">${staff.name}</div>
employee-admin\js\reports.js:108:                    <td style="padding:1.2rem; font-weight:700; color:var(--primary);">${sectionTitle}</td>
employee-admin\js\reports.js:124:            return '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:700;">Backend payroll record not generated for this month.</div>';
employee-admin\js\reports.js:135:                <div style="font-size:0.68rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">${label}</div>
employee-admin\js\reports.js:136:                <div style="font-size:1.2rem; font-weight:700; color:${color}; margin-top:5px;">${label === 'Base Salary' ? ReportsManager.formatSalaryAmountWithHold(amount, holdSource) : `₹${Number(amount || 0).toLocaleString()}`}</div>
employee-admin\js\reports.js:144:            <div style="margin-top:12px; color:var(--text-muted); font-size:0.82rem; font-weight:700;">
employee-admin\js\reports.js:152:            return '<div style="padding:2rem; text-align:center; color:var(--text-muted); font-weight:700;">No backend advance records found for this month.</div>';
employee-admin\js\reports.js:167:                            <td style="padding:1rem; font-weight:700;">${ReportsManager.formatReportDate(entry.date)}</td>
employee-admin\js\reports.js:169:                            <td style="padding:1rem; font-weight:700;">₹${Number(entry.amount || 0).toLocaleString()}</td>
employee-admin\js\reports.js:184:                    <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Salary Slip Status</div>
employee-admin\js\reports.js:205:            ${record ? `<div style="margin-top:1rem; color:var(--text-muted); font-size:0.82rem; font-weight:700;">Net Payable: ₹${Number(record.total_salary || 0).toLocaleString()}</div>` : ''}
employee-admin\js\reports.js:217:                <div class="card" style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">
employee-admin\js\reports.js:235:                        <div style="display:flex; gap:12px; margin-top:6px; flex-wrap:wrap; font-size:0.75rem; font-weight:700;">
employee-admin\js\reports.js:304:                            <div style="font-weight:700;">${s.name}</div>
employee-admin\js\reports.js:396:                            <h1 style="font-size:1.8rem; font-weight:700; margin:0; letter-spacing:-0.5px;">Business Reports</h1>
employee-admin\js\reports.js:420:                        <button class="report-tab-btn active" onclick="ReportsManager.updateActiveTab(this, 'attendance')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:white; color:var(--primary); box-shadow:0 4px 6px rgba(0,0,0,0.05);">Attendance</button>
employee-admin\js\reports.js:421:                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'salary')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Financials</button>
employee-admin\js\reports.js:422:                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'advances')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Advances</button>
employee-admin\js\reports.js:423:                        <button class="report-tab-btn" onclick="ReportsManager.updateActiveTab(this, 'slips')" style="padding:10px 25px; border-radius:12px; font-weight:700; border:none; cursor:pointer; transition:all 0.3s; background:transparent; color:var(--text-muted);">Salary Slips</button>
employee-admin\js\reports.js:560:            content.innerHTML = '<div style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">Backend report data unavailable</div>';
employee-admin\js\reports.js:623:                            <span style="font-weight:700;">${s.name} <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-left:8px; opacity:0.3;"></i></span>
employee-admin\js\reports.js:625:                        <td style="padding:1.2rem;"><span style="color:var(--success); font-weight:700;">${p}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
employee-admin\js\reports.js:626:                        <td style="padding:1.2rem;"><span style="color:var(--danger); font-weight:700;">${a}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
employee-admin\js\reports.js:627:                        <td style="padding:1.2rem;"><span style="color:var(--warning); font-weight:700;">${h}</span> <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
employee-admin\js\reports.js:628:                        <td style="padding:1.2rem; font-weight:700; background:rgba(0,0,0,0.02); color:var(--success);">${p + (h * 0.5)} <span style="font-size:0.7rem; color:var(--text-muted);">Days</span></td>
employee-admin\js\reports.js:642:                                <div style="display:flex; justify-content:center; gap:15px; margin-top:15px; font-size:0.7rem; font-weight:700;">
employee-admin\js\reports.js:693:                        <td style="padding:1rem; font-weight:700;">${s.name}</td>
employee-admin\js\reports.js:700:                        <td style="padding:1rem; font-weight:700; color:var(--info); background:rgba(9,132,227,0.03);">₹${Math.round(payout).toLocaleString()}</td>
employee-admin\js\reports.js:736:            content.innerHTML = `<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:var(--bg-main);"><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Date</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Staff</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Type</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Amount</th><th style="padding:1.2rem; text-align:left; font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Remark</th></tr></thead><tbody>${logs.map(l => `<tr><td style="padding:1.2rem;">${new Date(l.date).toLocaleDateString()}</td><td style="padding:1.2rem; font-weight:700;">${l.staffName}</td><td style="padding:1.2rem;"><span class="badge ${l.type === 'paid' ? 'badge-danger' : 'badge-success'}">${l.type.toUpperCase()}</span></td><td style="padding:1.2rem; font-weight:700;">₹${l.amount.toLocaleString()}</td><td style="padding:1.2rem; color:var(--text-muted); font-size:0.85rem;">${l.remark || '---'}</td></tr>`).join('')}</tbody></table>`;
employee-admin\js\reports.js:749:                                    <div style="font-weight:700;">${s.name}</div>
employee-admin\js\reports.js:919:                <p style="margin:5px 0; font-weight:700;">Attendance Calendar: ${name}</p>
employee-admin\js\reports.js:923:            <div style="display:flex; justify-content:center; gap:15px; margin-top:30px; font-size:0.8rem; font-weight:700;">
employee-admin\style.css:127:    font-weight:700;
employee-admin\style.css:176:    font-weight:700;
employee-admin\style.css:239:    font-weight:700;
employee-admin\style.css:264:    font-weight:700;
employee-admin\style.css:281:    font-weight:700;
employee-admin\style.css:286:    font-weight:700;
employee-admin\style.css:314:    font-weight:700;
employee-admin\style.css:768:    font-weight:700;
employee-admin\style.css:834:    font-weight:700;
employee-admin\style.css:1408:    font-weight:700;
employee-admin\style.css:1415:    font-weight:700;
employee-admin\style.css:1472:    font-weight:700;
employee-admin\style.css:1551:    font-weight:700;
employee-admin\style.css:2816:    font-weight:700;
employee-admin\style.css:2835:    font-weight:700;
employee-admin\style.css:2878:    font-weight:700;
employee-admin\style.css:2919:.staff-card-primary,
employee-admin\style.css:3047:    font-weight:700;
employee-admin\style.css:3063:    font-weight:700;
employee-admin\style.css:3115:    font-weight:700;
employee-admin\style.css:3149:    font-weight:700;
employee-admin\style.css:3272:    font-weight:700;
employee-admin\style.css:4191:        font-weight:700;
employee-admin\style.css:4447:        font-weight:700;
employee-admin\style.css:4524:        font-weight:700;
employee-admin\style.css:4540:        font-weight:700;
employee-admin\style.css:4913:        font-weight:700;
employee-admin\style.css:4919:    .staff-list-table .staff-card-row .staff-card-primary {
employee-admin\style.css:4927:    .staff-list-table .staff-card-row .staff-card-primary::before {
employee-admin\style.css:5444:        font-weight:700;

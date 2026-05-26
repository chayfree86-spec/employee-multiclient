const SettingsManager={_activeTab:"admin",currentSettings:null,loadBackendSettings:async(a=!1)=>{if(SettingsManager.currentSettings&&!a)return SettingsManager.currentSettings;const e=await ApiClient.getSettings();return SettingsManager.currentSettings=e||{},["cafe_name","business_address","business_phone","business_email"].forEach(t=>{SettingsManager.currentSettings[t]!==void 0&&StorageManager.save(t,SettingsManager.currentSettings[t])}),StorageManager.saveLocal("payroll_settings",{payroll_mode:SettingsManager.currentSettings.payroll_mode,monthly_days:SettingsManager.currentSettings.monthly_days}),SettingsManager.currentSettings},getSettingValue:a=>SettingsManager.currentSettings?.[a],renderSettings:async a=>{const e=await AuthManager.resolveCurrentUser(),t=window.BrandingManager?.getCafeName?.()||e?.business_name||e?.name||e?.username||"Admin User",s=e?.role||"Administrator";a.innerHTML=`
            <div class="view-header" style="margin-bottom:2rem;">
                <h2 style="font-size:2rem; color:var(--primary);">System Settings</h2>
                <p style="color:var(--text-muted);">Configure your account and system preferences</p>
            </div>

            <div class="card settings-shell" style="padding:0; border-radius:var(--radius-lg); overflow:hidden;">
                <!-- Tabs Header -->
                <div class="settings-tabs" style="display:flex; background:var(--bg-main); padding:8px; gap:8px; border-bottom:1px solid var(--border);">
                    <button class="settings-tab-btn ${SettingsManager._activeTab==="admin"?"active":""}" onclick="SettingsManager.switchTab('admin')">
                        <i class="fas fa-user-shield"></i> Admin Setting
                    </button>
                    <button class="settings-tab-btn ${SettingsManager._activeTab==="defaults"?"active":""}" onclick="SettingsManager.switchTab('defaults')">
                        <i class="fas fa-sliders-h"></i> Default Setting
                    </button>
                    <button class="settings-tab-btn ${SettingsManager._activeTab==="theme"?"active":""}" onclick="SettingsManager.switchTab('theme')">
                        <i class="fas fa-palette"></i> Theme
                    </button>
                </div>

                <!-- Tab Content Container -->
                <div id="settings-tab-content" class="settings-tab-content" style="padding:2rem; min-height:400px; transition: var(--transition);">
                    ${await SettingsManager.getTabContent(SettingsManager._activeTab,e)}
                </div>
            </div>
        `},switchTab:async a=>{a==="access"&&(a="admin"),SettingsManager._activeTab=a;const e=document.getElementById("settings-tab-content");if(!e)return;document.querySelectorAll(".settings-tab-btn").forEach(s=>{const n=s.getAttribute("onclick").includes(`'${a}'`);s.classList.toggle("active",n)});const t=await AuthManager.resolveCurrentUser();e.style.opacity="0",e.style.transform="translateY(10px)",setTimeout(async()=>{e.innerHTML=await SettingsManager.getTabContent(a,t),e.style.opacity="1",e.style.transform="translateY(0)"},150)},getTabContent:async(a,e)=>{const t=window.BrandingManager?.getCafeName?.()||e?.business_name||e?.name||e?.username||"Admin User",s=e?.role||"Administrator",n=encodeURIComponent(t),o=window.BrandingManager?.getBusinessLogo?.()||window.PhotoHelper.normalizeImageUrl(e?.profile_image)||"",i=o||window.PhotoHelper.avatarUrl(n,"C8A97E","fff",120),r=d=>String(d??"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let l=null;try{l=await SettingsManager.loadBackendSettings()}catch{if(a==="defaults"||a==="admin")return`
                    <div style="padding:3rem; text-align:center; color:var(--danger); font-weight:700;">
                        Backend settings data unavailable
                    </div>
                `}const c=r(l?.cafe_name||""),b=r(l?.business_address||""),C=r(l?.business_phone||""),A=r(l?.business_email||"");switch(a){case"admin":return`
                    <div class="settings-admin-layout" style="display:grid; grid-template-columns: 280px 1fr; gap:3rem; animation: fadeIn 0.3s ease;">
                        <div class="settings-admin-side" style="display:flex; flex-direction:column; gap:12px;">
                            <button class="nav-item active" style="border:none; width:100%; border-radius:12px;" onclick="SettingsManager.switchTab('admin')">
                                <i class="fas fa-id-card"></i> Profile & Security
                            </button>
                            
                            <div class="settings-logo-card" style="margin-top:2rem; padding:1.5rem; text-align:center; background:var(--bg-main); border-radius:16px;">
                                <div class="settings-logo-box" style="position:relative; width:90px; height:90px; margin:0 auto 1rem; border-radius:12px; border:2px dashed var(--border); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="SettingsManager.showCompanyLogoModal()">
                                    <img id="settings-company-logo" src="${o}" alt="Company logo" onerror="this.src='https://placehold.co/200x200?text=LOGO'" style="max-width:80%; max-height:80%; object-fit:contain;">
                                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.3); border-radius:10px; color:white; display:flex; align-items:center; justify-content:center; opacity:0; transition:0.3s;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0">
                                        <i class="fas fa-camera"></i>
                                    </div>
                                </div>
                                <p style="font-size:0.75rem; font-weight:700; color:var(--text-main);">Update Logo</p>
                            </div>
                        </div>

                        <div class="settings-admin-main" style="display:flex; flex-direction:column; gap:2rem;">
                                <!-- Identity -->
                                <div class="settings-identity-card" style="display:flex; align-items:center; gap:1.5rem; background:var(--bg-main); padding:1.5rem; border-radius:16px;">
                                    <div style="position:relative; width:80px; height:80px; border-radius:24px; border:3px solid white; overflow:hidden; cursor:pointer;" onclick="AuthManager.showProfileImageModal()">
                                        <img src="${i}" alt="${t} profile photo" onerror="window.PhotoHelper.applyFallback(this, '${n}', 'C8A97E', 'fff', 80)" style="width:100%; height:100%; object-fit:cover;">
                                    </div>
                                    <div>
                                        <h3 style="font-size:1.2rem; color:var(--text-main); margin-bottom:4px;">${t}</h3>
                                        <p style="color:var(--text-muted); font-size:0.85rem; font-weight:600;">${s}</p>
                                    </div>
                                </div>

                                <!-- Security Controls -->
                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">Branding</h4>
                                    <div class="settings-branding-card" style="background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px;">
                                        <div class="settings-card-head" style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem;">
                                            <div>
                                                <p style="font-weight:700; color:var(--text-main); margin-bottom:6px;">Business Details</p>
                                                <p style="font-size:0.85rem; color:var(--text-muted);">Salary slip header, sidebar, login page, and browser title mein ye details show hongi.</p>
                                            </div>
                                            <button class="btn-primary" onclick="SettingsManager.saveBusinessBranding()">Save</button>
                                        </div>
                                        <div class="settings-branding-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                                            <div class="input-group" style="margin-bottom:0;">
                                                <label>Cafe Name</label>
                                                <input type="text" id="settings-cafe-name" value="${c}" maxlength="40" placeholder="Enter cafe name" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="margin-bottom:0;">
                                                <label>Contact Number</label>
                                                <input type="text" id="settings-business-phone" value="${C}" maxlength="40" placeholder="+91 98765 43210" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="grid-column:span 2; margin-bottom:0;">
                                                <label>Address</label>
                                                <input type="text" id="settings-business-address" value="${b}" maxlength="120" placeholder="Near Clock Tower, Main Market, City" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                            <div class="input-group" style="grid-column:span 2; margin-bottom:0;">
                                                <label>Email</label>
                                                <input type="email" id="settings-business-email" value="${A}" maxlength="120" placeholder="info@example.com" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:600;">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">Security & Password</h4>
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px;">
                                        <div>
                                            <p style="font-weight:700; color:var(--text-main);">Change Admin Password</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">Current password verify karke API par update hota hai.</p>
                                        </div>
                                        <button class="btn-primary" onclick="SettingsManager.showChangePasswordModal()">Update</button>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 style="margin-bottom:1rem; font-family:var(--app-font);">System Controls</h4>
                                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border); padding:1.25rem; border-radius:16px; margin-bottom:1rem;">
                                        <div>
                                            <p style="font-weight:700; color:var(--text-main);">Cloud Force Sync</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">Sync records with server immediately.</p>
                                        </div>
                                        <button class="btn-outline" onclick="SettingsManager.forceSync()">Sync Now</button>
                                    </div>

                                    <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(214, 48, 49, 0.03); border:1px dashed rgba(214, 48, 49, 0.2); padding:1.25rem; border-radius:16px;">
                                        <div>
                                            <p style="font-weight:700; color:var(--danger);">Clear Local Cache</p>
                                            <p style="font-size:0.85rem; color:var(--text-muted);">This will reset data and log you out.</p>
                                        </div>
                                        <button class="btn-outline" style="color:var(--danger); border-color:rgba(214, 48, 49, 0.4);" onclick="SettingsManager.clearLocalCache()">Logout & Reset</button>
                                    </div>
                                </div>
                        </div>
                    </div>
                `;case"defaults":const d=l||await SettingsManager.loadBackendSettings(!0),g=Number(d.salary_cycle),h=d.salary_cycle_type,E=Number(d.salary_cycle_weekday),_=Number(d.weekly_holiday),m=String(d.auto_hold_enabled)==="1"||d.auto_hold_enabled===!0,f=Number(d.auto_hold_days||0),u=d.payroll_mode,v=d.monthly_days,w=d.color_star_badge,x=d.color_advance,S=d.color_deduction,k=["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"],B=g==1?"st":g==2?"nd":g==3?"rd":"th";let y="";return h==="Monthly"?y=`${g}${B} Day`:h==="Weekly"?y=`Every ${k[E]}`:y="Daily",`
                    <div style="max-width:850px; animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom:2rem; font-family:var(--app-font); display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-sliders-h text-primary"></i> Default Business Rules
                        </h4>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
                            <!-- Salary Cycle -->
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main);">Salary Cycle</p>
                                    <p style="font-size:0.8rem; color:var(--text-muted);">${h} reset</p>
                                </div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="badge badge-warning">${y}</span>
                                    <button class="btn-icon-sm" onclick="SettingsManager.showSalaryCycleModal()"><i class="fas fa-edit"></i></button>
                                </div>
                            </div>

                            <!-- Weekly Holiday -->
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main);">Weekly Holiday</p>
                                    <p style="font-size:0.8rem; color:var(--text-muted);">Select fixed day-off</p>
                                </div>
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <span class="badge badge-info">${k[_]}</span>
                                    <button class="btn-icon-sm" onclick="SettingsManager.showWeeklyHolidayModal()"><i class="fas fa-chevron-down"></i></button>
                                </div>
                            </div>

                            <!-- Payroll Calculation Mode -->
                            <div style="grid-column: span 2; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1.5rem; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:260px;">
                                        <p style="font-weight:700; color:var(--text-main);">Payroll Calculation Mode</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">
                                            <strong>Monthly:</strong> Fixed days (e.g. 30) for all months. <strong>Per Day:</strong> Actual calendar days (28/29/30/31).
                                        </p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <span id="payroll-mode-badge" class="badge badge-info">${u==="per_day"?"Per Day (Calendar)":"Monthly ("+v+" days)"}</span>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:end; gap:12px; margin-top:1rem; flex-wrap:wrap;">
                                    <div style="min-width:200px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Mode</label>
                                        <select id="payroll-mode-select" onchange="SettingsManager.toggleMonthlyDaysField()" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700; color:var(--text-main);">
                                            <option value="monthly" ${u!=="per_day"?"selected":""}>Monthly (Fixed Days)</option>
                                            <option value="per_day" ${u==="per_day"?"selected":""}>Per Day (Calendar Days)</option>
                                        </select>
                                    </div>
                                    <div id="monthly-days-wrap" style="display:${u!=="per_day"?"block":"none"}; min-width:140px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Days in Month</label>
                                        <input type="number" id="monthly-days-input" min="28" max="31" value="${v}" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700; color:var(--text-main);">
                                    </div>
                                    <button class="btn-primary" onclick="SettingsManager.savePayrollMode()">Save</button>
                                </div>
                            </div>

                            <div style="grid-column: span 2; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1.5rem; flex-wrap:wrap;">
                                    <div style="flex:1; min-width:260px;">
                                        <p style="font-weight:700; color:var(--text-main);">Auto Salary Hold For New Staff</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">Default OFF. ON karne par new staff ke join month me entered days ka hold auto set ho jayega.</p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <span id="auto-hold-status-badge" class="badge ${m?"badge-danger":"badge-success"}">${m?`ON \u2022 ${f} Days`:"OFF"}</span>
                                        <label class="switch-toggle" title="Toggle Auto Hold">
                                            <input type="checkbox" id="auto-hold-enabled" ${m?"checked":""} onchange="SettingsManager.toggleAutoHoldFields(this.checked)">
                                            <span class="slider-round"></span>
                                        </label>
                                    </div>
                                </div>

                                <div style="display:flex; align-items:end; gap:12px; margin-top:1rem; flex-wrap:wrap;">
                                    <div id="auto-hold-days-wrap" style="display:${m?"block":"none"}; min-width:220px;">
                                        <label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:6px;">Hold Days</label>
                                        <input type="number" id="auto-hold-days" min="1" max="31" value="${f>0?f:10}" placeholder="Enter hold days" oninput="SettingsManager.toggleAutoHoldFields(document.getElementById('auto-hold-enabled').checked)" style="width:100%; padding:12px 14px; border:1px solid var(--border); border-radius:12px; background:var(--bg-main); font-weight:700;">
                                    </div>
                                    <button class="btn-primary" onclick="SettingsManager.saveAutoHoldDefaults()">Save Auto Hold</button>
                                </div>
                            </div>

                            <!-- Star Badge Color Setting -->
                            <div style="grid-column: span 2; display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                                <!-- Top Performance Star -->
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Top Performance</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${w}"></i> Star Badge Color</p>
                                    </div>
                                    <input type="color" value="${w}" onchange="SettingsManager.updateSystemColor('color_star_badge', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>

                                <!-- Advance Payment Star -->
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Advance Payment</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${x}"></i> Star Indicator Color</p>
                                    </div>
                                    <input type="color" value="${x}" onchange="SettingsManager.updateSystemColor('color_advance', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>

                                <!-- Payment Deduction Star -->
                                <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px solid var(--border); border-radius:16px; background:var(--bg-card);">
                                    <div>
                                        <p style="font-weight:700; color:var(--text-main);">Payment Deduction</p>
                                        <p style="font-size:0.8rem; color:var(--text-muted);"><i class="fas fa-star" style="color:${S}"></i> Star Indicator Color</p>
                                    </div>
                                    <input type="color" value="${S}" onchange="SettingsManager.updateSystemColor('color_deduction', this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                                </div>
                            </div>

                            <!-- Auto Sync (System) -->
                            <div style="grid-column: span 2; display:flex; justify-content:space-between; align-items:center; padding:1.25rem; border:1px dashed var(--border); border-radius:16px; margin-top:1rem;">
                                <div>
                                    <p style="font-weight:700; color:var(--text-main); font-size:0.9rem;">Cloud Sync Interval</p>
                                    <p style="font-size:0.75rem; color:var(--text-muted);">Current: Every 5 Minutes</p>
                                </div>
                                <button class="btn-icon-sm"><i class="fas fa-history"></i></button>
                            </div>
                        </div>
                    </div>
                `;case"theme":const M=StorageManager.get("custom_primary_color")||"#3E2723";return`
                    <div style="animation: fadeIn 0.3s ease;">
                        <h4 style="margin-bottom:1.5rem; font-family:var(--app-font);">Visual Identity & Experience</h4>
                        
                        <!-- Manual Color Picker -->
                        <div style="margin-bottom:2rem; padding:1.5rem; background:var(--bg-card); border-radius:16px; border:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <p style="font-weight:700; color:var(--text-main);">Manual Theme Color</p>
                                <p style="font-size:0.8rem; color:var(--text-muted);">Override primary system color manually</p>
                            </div>
                            <div style="display:flex; align-items:center; gap:15px;">
                                <div id="current-manual-color-preview" style="width:30px; height:30px; border-radius:8px; background:${M}; border:2px solid white; box-shadow:0 0 0 1px #ddd;"></div>
                                <input type="color" value="${M}" onchange="SettingsManager.updateManualThemeColor(this.value)" style="width:40px; height:40px; border:none; border-radius:50%; cursor:pointer; background:none;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1rem;">
                            ${[{id:"theme-cafe",name:"Cafe Gold",colors:["#3E2723","#5B4037"],desc:"Classic premium"},{id:"theme-light",name:"Clean Light",colors:["#f8f9fa","#e9ecef"],desc:"Minimalist"},{id:"theme-dark",name:"Midnight",colors:["#1A1210","#121212"],desc:"High-contrast"},{id:"theme-ocean",name:"Ocean Blue",colors:["#00695C","#00897B"],desc:"Calm water"},{id:"theme-forest",name:"Forest Green",colors:["#2E7D32","#388E3C"],desc:"Natural vibes"},{id:"theme-royal",name:"Royal Purple",colors:["#4527A0","#512DA8"],desc:"Majestic feel"},{id:"theme-sunset",name:"Sunset Orange",colors:["#E64A19","#F4511E"],desc:"Warm glow"},{id:"theme-ruby",name:"Ruby Red",colors:["#C62828","#D32F2F"],desc:"Energetic"},{id:"theme-slate",name:"Modern Slate",colors:["#37474F","#455A64"],desc:"Sophisticated"},{id:"theme-nebula",name:"Space Nebula",colors:["#1A237E","#283593"],desc:"Deep galaxy"},{id:"theme-rose",name:"Rose Petal",colors:["#AD1457","#C2185B"],desc:"Sweet touch"},{id:"theme-teal",name:"Cyber Teal",colors:["#00838F","#0097A7"],desc:"Tech focus"},{id:"theme-amber",name:"Vibrant Amber",colors:["#FF8F00","#FFA000"],desc:"Sunny day"},{id:"theme-indigo",name:"Indigo Night",colors:["#283593","#303F9F"],desc:"Urban look"},{id:"theme-brown",name:"Rustic Brown",colors:["#4E342E","#5D4037"],desc:"Earthy"},{id:"theme-gray",name:"Industrial Gray",colors:["#424242","#616161"],desc:"Professional"},{id:"theme-mint",name:"Fresh Mint",colors:["#00695C","#26A69A"],desc:"Cool & clean"},{id:"theme-cherry",name:"Wild Cherry",colors:["#880E4F","#C2185B"],desc:"Bold fruit"},{id:"theme-cobalt",name:"Pure Cobalt",colors:["#1565C0","#1976D2"],desc:"Solid blue"},{id:"theme-leaf",name:"Leafy Green",colors:["#558B2F","#689F38"],desc:"Eco friendly"},{id:"theme-gold",name:"Luxury Gold",colors:["#F9A825","#FBC02D"],desc:"Elite status"},{id:"theme-smoke",name:"White Smoke",colors:["#CFD8DC","#ECEFF1"],desc:"Aery light"},{id:"theme-carbon",name:"Carbon Black",colors:["#212121","#424242"],desc:"Stealth mode"},{id:"theme-lavender",name:"Soft Lavender",colors:["#6A1B9A","#7B1FA2"],desc:"Relaxing"},{id:"theme-coral",name:"Sea Coral",colors:["#D84315","#FF5722"],desc:"Bright ocean"},{id:"theme-olive",name:"Vintage Olive",colors:["#33691E","#558B2F"],desc:"Classic army"},{id:"theme-sky",name:"Daylight Sky",colors:["#0277BD","#0288D1"],desc:"Open air"},{id:"theme-maroon",name:"Rich Maroon",colors:["#b71c1c","#c62828"],desc:"Old school"},{id:"theme-sand",name:"Desert Sand",colors:["#A1887F","#BCAAA4"],desc:"Neutral"},{id:"theme-neon",name:"Neon Power",colors:["#1b5e20","#2e7d32"],desc:"High energy"}].map(p=>`
                                <div class="theme-option-card ${document.body.classList.contains(p.id)?"active":""}" 
                                     onclick="SettingsManager.setTheme('${p.id}', this, '${p.colors[0]}')"
                                     style="padding:12px; cursor:pointer; border:2px solid var(--border); border-radius:12px; background:var(--bg-card); transition:all 0.2s;">
                                    <div style="width:100%; height:40px; background:linear-gradient(45deg, ${p.colors[0]}, ${p.colors[1]}); border-radius:8px; margin-bottom:0.8rem;"></div>
                                    <p style="font-weight:700; color:var(--text-main); font-size:0.9rem; margin-bottom:2px;">${p.name}</p>
                                    <p style="font-size:0.7rem; color:var(--text-muted);">${p.desc}</p>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}},setTheme:(a,e,t=null)=>{t&&StorageManager.save("custom_primary_color",t),ThemeManager.setTheme(a),document.querySelectorAll(".theme-option-card").forEach(n=>{n.classList.remove("active"),n.style.borderColor="var(--border)"}),e&&(e.classList.add("active"),e.style.borderColor="var(--primary)");const s=document.getElementById("current-manual-color-preview");s&&t&&(s.style.background=t),window.showAlert(`Theme changed to ${a.replace("theme-","").toUpperCase()}`)},updateManualThemeColor:a=>{StorageManager.save("custom_primary_color",a);const e=StorageManager.get("theme")||"theme-cafe";ThemeManager.applyTheme(e);const t=document.getElementById("current-manual-color-preview");t&&(t.style.background=a),window.showAlert("Custom primary color applied!")},toggleAutoHoldFields:a=>{const e=document.getElementById("auto-hold-days-wrap"),t=document.getElementById("auto-hold-status-badge"),s=document.getElementById("auto-hold-days");if(e&&(e.style.display=a?"block":"none"),t){const n=Math.max(1,parseInt(s?.value,10)||0);t.className=`badge ${a?"badge-danger":"badge-success"}`,t.textContent=a?`ON \u2022 ${n} Days`:"OFF"}},toggleMonthlyDaysField:()=>{const a=document.getElementById("payroll-mode-select")?.value,e=document.getElementById("monthly-days-wrap");e&&(e.style.display=a==="per_day"?"none":"block")},savePayrollMode:async()=>{const a=document.getElementById("payroll-mode-select")?.value||"monthly",e=document.getElementById("monthly-days-input")?.value||"30",t=parseInt(e,10);if(a==="monthly"&&(t<28||t>31)){window.showAlert("Monthly days must be between 28 and 31");return}try{const s=await ApiClient.updateSettings({payroll_mode:a,monthly_days:String(t)});SettingsManager.currentSettings=s||await SettingsManager.loadBackendSettings(!0),StorageManager.saveLocal("payroll_settings",{payroll_mode:a,monthly_days:String(t)});const n=document.getElementById("payroll-mode-badge");n&&(n.textContent=a==="per_day"?"Per Day (Calendar)":`Monthly (${t} days)`),window.showAlert(a==="per_day"?"Payroll mode set to Per Day (actual calendar days)":`Payroll mode set to Monthly (${t} days)`)}catch(s){window.showAlert("Failed to save payroll mode: "+(s.message||"Unknown error"))}},saveAutoHoldDefaults:async()=>{const a=document.getElementById("auto-hold-enabled")?.checked||!1,e=document.getElementById("auto-hold-days"),t=a&&parseInt(e?.value,10)||0;if(a&&(t<1||t>31)){window.showAlert("Hold days 1 se 31 ke beech hone chahiye"),e?.focus();return}try{const s=await ApiClient.updateSettings({auto_hold_enabled:a?"1":"0",auto_hold_days:String(a?t:0)});SettingsManager.currentSettings=s||await SettingsManager.loadBackendSettings(!0),SettingsManager.toggleAutoHoldFields(a),window.showAlert(a?`Default auto hold enabled for ${t} days`:"Default auto hold disabled")}catch(s){window.showAlert(`Failed to save auto hold settings: ${s.message}`)}},saveCafeName:async()=>SettingsManager.saveBusinessBranding(),saveBusinessBranding:async()=>{const a=document.getElementById("settings-cafe-name");if(!a)return;const e=a.value.trim(),t=(document.getElementById("settings-business-address")?.value||"").trim(),s=(document.getElementById("settings-business-phone")?.value||"").trim(),n=(document.getElementById("settings-business-email")?.value||"").trim();if(!e){window.showAlert("Cafe name cannot be empty"),a.focus();return}if(n&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)){window.showAlert("Valid business email enter karein"),document.getElementById("settings-business-email")?.focus();return}try{const o=await ApiClient.updateSettings({cafe_name:e,business_address:t,business_phone:s,business_email:n}),i=await AuthManager.resolveCurrentUser();if(StorageManager.save("cafe_name",e),StorageManager.save("business_address",t),StorageManager.save("business_phone",s),StorageManager.save("business_email",n),i?.id){const r=await ApiClient.updateProfile(i.id,{business_name:e,owner_name:i.owner_name||i.username||e,mobile:s,email:n,address:t}),l={...i,...r||{},business_name:e,mobile:s,email:n,address:t,name:e};sessionStorage.setItem(AuthManager.storageKey("user"),JSON.stringify(l)),sessionStorage.setItem(AuthManager.storageKey("username"),l.username||i.username||""),AuthManager.updateSidebarUser(l)}SettingsManager.currentSettings=o||await SettingsManager.loadBackendSettings(!0),window.BrandingManager?.applyBranding&&window.BrandingManager.applyBranding(),window.showAlert("Business details updated")}catch(o){window.showAlert(`Failed to save business details: ${o.message}`)}},showChangePasswordModal:()=>{ModalManager.show("Change Security Credentials",`
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.4;">Enter your new password below. It will be updated instantly across all synced devices.</p>
                <form id="change-password-form" onsubmit="SettingsManager.handleChangePassword(event)">
                    <div class="input-group">
                        <label>Current Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-key"></i>
                            <input type="password" id="current-password" placeholder="Enter current password" required style="padding-left:3rem;">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>New Admin Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="new-password" placeholder="Enter new password" required style="padding-left:3rem;">
                        </div>
                    </div>
                     <div class="input-group">
                        <label>Confirm Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-check-double"></i>
                            <input type="password" id="confirm-password" placeholder="Confirm your password" required style="padding-left:3rem;">
                        </div>
                    </div>
                    <div style="margin-top:2rem;">
                        <button type="submit" class="btn-primary full-width" style="padding:14px; border-radius:14px; font-weight:700;">Update Admin Password</button>
                    </div>
                </form>
            </div>
        `)},handleChangePassword:async a=>{a.preventDefault();const e=document.getElementById("current-password").value,t=document.getElementById("new-password").value,s=document.getElementById("confirm-password").value,n=await AuthManager.resolveCurrentUser();if(!n?.username){window.showAlert("Logged-in user not found");return}if(t.length<6){window.showAlert("Password must be at least 6 characters");return}if(t!==s){window.showAlert("Passwords do not match!");return}try{await ApiClient.changePassword(n.username,e,t),window.showAlert("Password updated successfully"),ModalManager.hide()}catch(o){window.showAlert(o.message||"Failed to update password")}},showCompanyLogoModal:()=>{ModalManager.show("Company Branding",`
            <div style="padding:10px; text-align:center;">
                <div style="width:120px; height:120px; background:var(--bg-main); border:2px dashed var(--border); border-radius:15px; margin:0 auto 1.5rem; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <i class="fas fa-image" style="font-size:3rem; color:var(--border);"></i>
                </div>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem; line-height:1.4;">Upload your company logo (PNG/JPG). This logo will appear on salary slips and reports.</p>
                
                <input type="file" id="company-logo-input" accept="image/*" style="display:none;" onchange="SettingsManager.handleLogoUpload(event)">
                <button class="btn-primary full-width" onclick="document.getElementById('company-logo-input').click()" style="padding:14px; border-radius:14px; font-weight:700;">
                    <i class="fas fa-upload"></i> Choose Logo File
                </button>
                <button class="btn-outline full-width" onclick="ModalManager.hide()" style="margin-top:10px; padding:12px; border-radius:14px;">Cancel</button>
            </div>
        `)},handleLogoUpload:async a=>{const e=a.target.files[0];if(e){window.SyncStatus.show("Uploading logo...","saving");try{const t=await AuthManager.resolveCurrentUser();if(!t?.id)throw new Error("Logged-in user not found");const s=await ApiClient.uploadProfileImage(t.id,e),n={...t,profile_image:window.PhotoHelper.normalizeImageUrl(s?.profile_image||t.profile_image)};sessionStorage.setItem(AuthManager.storageKey("user"),JSON.stringify(n)),StorageManager.save("business_logo",n.profile_image||""),AuthManager.updateSidebarUser(n),window.BrandingManager?.applyBranding?.();const o=document.getElementById("settings-company-logo");o&&(o.src=n.profile_image),window.showAlert("Company Logo updated successfully!"),ModalManager.hide(),window.SyncStatus.show("Logo updated","success",3e3)}catch(t){window.SyncStatus.show("Upload failed","error",3e3),window.showAlert("Failed to upload logo: "+t.message)}}},forceSync:async()=>{window.SyncStatus.show("Refreshing system data...","saving");try{await ApiSyncManager.bootstrap(!0),window.SyncStatus.show("System sync complete","success",3e3),window.showAlert("Data synchronized with cloud"),SettingsManager.renderSettings(document.getElementById("view-container"))}catch(a){window.SyncStatus.show("Sync failed","error",3e3),window.showAlert("Sync Error: "+a.message)}},clearLocalCache:async()=>{await ConfirmManager.ask("Are you sure? This will delete all local attendance/salary data and logout. You will need to login again to sync data.")&&(StorageManager.clear(),sessionStorage.clear(),location.reload())},renderEmployeeLoginRows:()=>{const a=StorageManager.get("employee_logins")||[],e=StorageManager.get("staff")||[];return a.length===0?'<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No manual logins created yet.</td></tr>':a.map(t=>{const s=e.find(o=>o.id===t.staff_id),n=s?s.name:"Manual User";return`
            <tr>
                <td style="font-weight:700;">${t.username}</td>
                <td style="font-family:monospace; cursor:pointer;" title="Click to view/hide" onclick="const s = this.querySelector('.pass-text'); const b = this.querySelector('.pass-dots'); if(s.style.display==='none'){s.style.display='inline'; b.style.display='none';}else{s.style.display='none'; b.style.display='inline';}">
                    <span class="pass-dots">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span>
                    <span class="pass-text" style="display:none;">${t.password}</span>
                </td>
                <td style="font-size:0.9rem;">${n}</td>
                <td style="font-size:0.9rem;">${t.mobile||"---"}</td>
                <td>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${["dashboard","staff","attendance","salary","reports","settings"].map(o=>`
                            <button class="badge ${t.permissions.includes(o)?"badge-success":"badge-danger"}" 
                                    style="border:none; cursor:pointer; font-size:0.65rem; padding:4px 8px;" 
                                    onclick="SettingsManager.toggleEmployeePermission('${t.username}', '${o}')">
                                ${o.toUpperCase()}
                            </button>
                        `).join("")}
                    </div>
                </td>
                <td>
                    <button class="badge ${t.disabled?"badge-danger":"badge-success"}" 
                            style="border:none; cursor:pointer; font-size:0.65rem; padding:4px 8px; min-width:60px;"
                            onclick="SettingsManager.toggleLoginStatus('${t.username}')">
                        ${t.disabled?"OFF":"ON"}
                    </button>
                </td>
                <td>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-icon text-primary" onclick="SettingsManager.editEmployeeLogin('${t.username}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="SettingsManager.deleteEmployeeLogin('${t.username}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `}).join("")},showAddEmployeeLoginModal:()=>{const e=`
            <form id="add-employee-login-form" onsubmit="SettingsManager.handleAddEmployeeLogin(event)">
                <div class="input-group" style="margin-bottom:1.5rem;">
                    <label>Link to Existing Staff (Optional)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-users-cog"></i>
                        <select id="link-staff-select" onchange="SettingsManager.handleStaffSelect(this.value)">
                            <option value="">-- Create Independent Login --</option>
                            ${(StorageManager.get("staff")||[]).map(t=>`<option value="${t.id}">${t.name} (${t.mobile||"No Mobile"})</option>`).join("")}
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                    <div class="input-group">
                        <label>Login Username</label>
                        <div class="input-wrapper">
                            <i class="fas fa-user-tag"></i>
                            <input type="text" id="emp-username" placeholder="e.g. rahul_manager" required>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Assign Password</label>
                        <div class="input-wrapper">
                            <i class="fas fa-key"></i>
                            <input type="text" id="emp-password" placeholder="Create a password" required>
                        </div>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-top:1.5rem;">
                    <div class="input-group">
                        <label>Date of Birth</label>
                        <div class="input-wrapper">
                            <i class="fas fa-birthday-cake"></i>
                            <input type="text" id="emp-dob" placeholder="00-00-0000" maxlength="10" required style="padding-left:2.8rem;" oninput="SettingsManager.handleDobInput(this)">
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Mobile Number</label>
                        <div class="input-wrapper">
                            <i class="fas fa-phone-alt"></i>
                            <input type="tel" id="emp-mobile" pattern="[0-9]{10}" placeholder="10 Digit Number" required oninput="document.getElementById('emp-password').value = this.value">
                        </div>
                    </div>
                </div>

                <div style="margin-top:2rem; padding:1.5rem; background:var(--bg-main); border-radius:12px; border:1px solid var(--border);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <p style="font-size:0.8rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin:0; letter-spacing:0.5px;">INITIAL PERMISSIONS</p>
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem; font-weight:700; color:var(--primary);">
                            <input type="checkbox" id="perm-all" onchange="SettingsManager.toggleAllPermissions(this.checked)"> <i class="fas fa-check-double" style="font-size:0.8rem;"></i> All Select
                        </label>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" checked disabled> Dashboard (Required)
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-staff" class="perm-checkbox"> Staff List
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-attendance" class="perm-checkbox" checked> Attendance
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-salary" class="perm-checkbox"> Salary
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-reports" class="perm-checkbox"> Reports
                        </label>
                        <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:0.95rem; font-weight:600; color:var(--text-main);">
                            <input type="checkbox" id="perm-settings" class="perm-checkbox"> Settings
                        </label>
                    </div>
                </div>
                <button type="submit" class="btn-primary full-width" style="margin-top:2rem; padding:14px; border-radius:14px; font-weight:700; font-size:1rem;">
                    <i class="fas fa-user-plus"></i> Create Access
                </button>
            </form>
        `;ModalManager.show("Create Employee Account",e),setTimeout(()=>{setupCustomDropdown("link-staff-select")},50)},handleDobInput:a=>{let e=a.value.replace(/\D/g,"");e.length>8&&(e=e.substring(0,8));let t=e;e.length>4?t=e.substring(0,2)+"-"+e.substring(2,4)+"-"+e.substring(4):e.length>2&&(t=e.substring(0,2)+"-"+e.substring(2)),a.value=t,document.getElementById("emp-username").value=t},handleStaffSelect:a=>{if(!a)return;const e=(StorageManager.get("staff")||[]).find(r=>r.id===a);if(!e)return;const t=document.getElementById("emp-username"),s=document.getElementById("emp-password"),n=document.getElementById("emp-dob"),o=document.getElementById("emp-mobile");let i="00-00-0000";if(e.dob){const r=e.dob.split("-");r.length===3&&(r[0].length===4?i=`${r[2]}-${r[1]}-${r[0]}`:i=e.dob)}n&&(n.value=i),o&&(o.value=e.mobile||""),t&&(t.value=i),s&&(s.value=o.value||"")},toggleAllPermissions:a=>{document.querySelectorAll(".perm-checkbox").forEach(e=>{e.checked=a})},handleAddEmployeeLogin:a=>{a.preventDefault();const e=document.getElementById("emp-username").value,t=document.getElementById("emp-password").value,s=document.getElementById("emp-dob").value,n=document.getElementById("emp-mobile").value,o=document.getElementById("link-staff-select").value,i=document.getElementById("add-employee-login-form").hasAttribute("data-edit"),r=["dashboard"];document.getElementById("perm-staff").checked&&r.push("staff"),document.getElementById("perm-attendance").checked&&r.push("attendance"),document.getElementById("perm-salary").checked&&r.push("salary"),document.getElementById("perm-reports").checked&&r.push("reports"),document.getElementById("perm-settings").checked&&r.push("settings");let l=StorageManager.get("employee_logins")||[];if(i){const c=l.findIndex(b=>b.username===e);c!==-1&&(l[c]={...l[c],password:t,dob:s,mobile:n,staff_id:o,permissions:r})}else{if(l.find(c=>c.username===e)){window.showAlert("Username already exists!");return}l.push({username:e,password:t,dob:s,mobile:n,staff_id:o,permissions:r,role:"Staff",disabled:!1})}try{StorageManager.save("employee_logins",l),ModalManager.hide(),SettingsManager.switchTab("access"),window.showAlert(i?"Login access updated!":"Manual employee login created!")}catch(c){console.error(c),window.showAlert("Failed to save login: "+c.message)}},editEmployeeLogin:a=>{const e=(StorageManager.get("employee_logins")||[]).find(o=>o.username===a);if(!e)return;SettingsManager.showAddEmployeeLoginModal();const t=document.querySelector("#modal-container h2");t&&(t.textContent="Edit Employee Account");const s=document.getElementById("add-employee-login-form");s.setAttribute("data-edit","true"),document.getElementById("emp-username").value=e.username,document.getElementById("emp-username").readOnly=!0,document.getElementById("emp-password").value=e.password,document.getElementById("emp-dob").value=e.dob||"",document.getElementById("emp-mobile").value=e.mobile||"",document.getElementById("link-staff-select").value=e.staff_id||"",document.getElementById("perm-staff").checked=e.permissions.includes("staff"),document.getElementById("perm-attendance").checked=e.permissions.includes("attendance"),document.getElementById("perm-salary").checked=e.permissions.includes("salary"),document.getElementById("perm-reports").checked=e.permissions.includes("reports"),document.getElementById("perm-settings").checked=e.permissions.includes("settings");const n=s.querySelector('button[type="submit"]');n&&(n.innerHTML='<i class="fas fa-save"></i> Update Access')},toggleLoginStatus:a=>{let e=StorageManager.get("employee_logins")||[];const t=e.findIndex(s=>s.username===a);t!==-1&&(e[t].disabled=!e[t].disabled,StorageManager.save("employee_logins",e),SettingsManager.switchTab("access"),window.showAlert(`Login ${e[t].disabled?"Disabled":"Enabled"} for ${a}`))},toggleEmployeePermission:(a,e)=>{let t=StorageManager.get("employee_logins")||[];const s=t.find(n=>n.username===a);s&&(s.permissions.includes(e)?s.permissions=s.permissions.filter(n=>n!==e):s.permissions.push(e),StorageManager.save("employee_logins",t),SettingsManager.switchTab("access"))},deleteEmployeeLogin:async a=>{if(await ConfirmManager.ask(`Delete login access for "${a}"?`)){let t=StorageManager.get("employee_logins")||[];t=t.filter(s=>s.username!==a),StorageManager.save("employee_logins",t),SettingsManager.switchTab("access")}},showSalaryCycleModal:()=>{const a=SettingsManager.getSettingValue("salary_cycle_type")||"Monthly",e=Number(SettingsManager.getSettingValue("salary_cycle")||1),t=Number(SettingsManager.getSettingValue("salary_cycle_weekday")||1),s=Array.from({length:28},(i,r)=>r+1),n=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],o=`
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Select the salary calculation cycle type and reset day.</p>
                
                <div class="input-group">
                    <label>Cycle Type</label>
                    <div class="input-wrapper">
                        <i class="fas fa-sync"></i>
                        <select id="new-salary-cycle-type" onchange="SettingsManager.toggleCycleDayVisibility(this.value)" style="padding-left:3rem; width:100%;">
                            <option value="Daily" ${a==="Daily"?"selected":""}>Daily</option>
                            <option value="Weekly" ${a==="Weekly"?"selected":""}>Weekly</option>
                            <option value="Monthly" ${a==="Monthly"?"selected":""}>Monthly</option>
                        </select>
                    </div>
                </div>

                <div id="cycle-day-group" class="input-group" style="display: ${a==="Monthly"?"block":"none"};">
                    <label>Reset Day (of Month)</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-day"></i>
                        <select id="new-salary-cycle" style="padding-left:3rem; width:100%;">
                            ${s.map(i=>`<option value="${i}" ${i==e?"selected":""}>${i}${i==1?"st":i==2?"nd":i==3?"rd":"th"} Day</option>`).join("")}
                        </select>
                    </div>
                </div>

                <div id="cycle-weekday-group" class="input-group" style="display: ${a==="Weekly"?"block":"none"};">
                    <label>Reset Weekday</label>
                    <div class="input-wrapper">
                        <i class="fas fa-calendar-week"></i>
                        <select id="new-salary-cycle-weekday" style="padding-left:3rem; width:100%;">
                            ${n.map((i,r)=>`<option value="${r}" ${r==t?"selected":""}>${i}</option>`).join("")}
                        </select>
                    </div>
                </div>

                <button class="btn-primary full-width" onclick="SettingsManager.updateSalaryCycle()" style="margin-top:1rem;">Save Cycle Settings</button>
            </div>
        `;ModalManager.show("Update Salary Cycle",o),window.setupCustomDropdown&&(setupCustomDropdown("new-salary-cycle-type"),setupCustomDropdown("new-salary-cycle"),setupCustomDropdown("new-salary-cycle-weekday"))},toggleCycleDayVisibility:a=>{const e=document.getElementById("cycle-day-group"),t=document.getElementById("cycle-weekday-group");e&&(e.style.display=a==="Monthly"?"block":"none"),t&&(t.style.display=a==="Weekly"?"block":"none")},updateSalaryCycle:async()=>{const a=document.getElementById("new-salary-cycle-type").value,e=document.getElementById("new-salary-cycle").value,t=document.getElementById("new-salary-cycle-weekday").value;try{const s=await ApiClient.updateSettings({salary_cycle_type:a,salary_cycle:String(parseInt(e,10)),salary_cycle_weekday:String(parseInt(t,10))});SettingsManager.currentSettings=s||await SettingsManager.loadBackendSettings(!0),ModalManager.hide(),SettingsManager.switchTab("defaults"),window.showAlert(`Salary cycle updated to ${a}!`)}catch(s){window.showAlert(`Failed to save salary cycle: ${s.message}`)}},showWeeklyHolidayModal:()=>{const a=Number(SettingsManager.getSettingValue("weekly_holiday")||0),t=`
            <div style="padding:10px;">
                <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.5rem;">Select the fixed weekly holiday for your business.</p>
                <div class="input-group">
                    <label>Holiday Day</label>
                    <div class="input-wrapper">
                        <i class="fas fa-mug-hot"></i>
                        <select id="new-weekly-holiday" style="padding-left:3rem; width:100%;">
                            ${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((s,n)=>`<option value="${n}" ${n==a?"selected":""}>${s}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <button class="btn-primary full-width" onclick="SettingsManager.updateWeeklyHoliday()" style="margin-top:1rem;">Save Holiday</button>
            </div>
        `;ModalManager.show("Update Weekly Holiday",t),window.setupCustomDropdown&&setupCustomDropdown("new-weekly-holiday")},updateWeeklyHoliday:async()=>{const a=document.getElementById("new-weekly-holiday").value;try{const e=await ApiClient.updateSettings({weekly_holiday:String(parseInt(a,10))});SettingsManager.currentSettings=e||await SettingsManager.loadBackendSettings(!0),ModalManager.hide(),SettingsManager.switchTab("defaults"),window.showAlert("Weekly holiday updated!")}catch(e){window.showAlert(`Failed to save weekly holiday: ${e.message}`)}},updateSystemColor:async(a,e)=>{try{const t=await ApiClient.updateSettings({[a]:e});SettingsManager.currentSettings=t||await SettingsManager.loadBackendSettings(!0),SettingsManager.switchTab("defaults"),window.showAlert("Color setting updated!")}catch(t){window.showAlert(`Failed to save color setting: ${t.message}`)}}};

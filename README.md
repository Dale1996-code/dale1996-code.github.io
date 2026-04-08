<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Shift Control Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            background: radial-gradient(circle at 10% 10%, rgba(59, 130, 246, 0.15), transparent 25%),
                radial-gradient(circle at 90% 0%, rgba(16, 185, 129, 0.15), transparent 20%),
                #0b1021;
            color: #e5e7eb;
            font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            transition: background 0.3s ease, color 0.3s ease;
            -webkit-tap-highlight-color: transparent; /* iOS fix */
        }
        .card {
            background: rgba(17, 24, 39, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(10px);
        }
        .btn { cursor: pointer; transition: all 0.2s ease; }
        .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn:active { transform: translateY(1px); }
        .glass {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        
        /* LIGHT MODE OVERRIDES */
        body.light-mode {
            background: #f0f4f8;
            color: #1e293b;
        }
        body.light-mode .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            color: #1e293b;
        }
        body.light-mode .glass {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #334155;
        }
        body.light-mode .text-white { color: #0f172a !important; }
        body.light-mode .text-slate-200, body.light-mode .text-slate-300, body.light-mode .text-slate-400 { color: #475569 !important; }
        body.light-mode input, body.light-mode select, body.light-mode textarea {
            background-color: #f1f5f9;
            color: #0f172a;
            border-color: #cbd5e1;
        }

        /* PRINT STYLES */
        @media print {
            body { background: white; color: black; }
            .no-print, .btn, button { display: none !important; }
            .card, .glass { 
                background: white !important; 
                border: 1px solid #ccc !important; 
                box-shadow: none !important; 
                color: black !important;
                page-break-inside: avoid;
            }
            .text-white, .text-slate-200, .text-slate-300, .text-slate-400 { color: black !important; }
            input, textarea, select { border: none; background: transparent; color: black; appearance: none; }
            .grid { display: block; }
            .card { margin-bottom: 20px; }
        }
    </style>
</head>
<body class="min-h-screen">
    <div class="max-w-6xl mx-auto px-4 py-6 md:py-10" id="app"></div>

    <script>
        function escapeHTML(str) {
            if (!str) return "";
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }

        // --- CONFIG & STATE ---
        const DATA_KEY = "shiftControlDataV5";
        const SAFETY_KEY = "shiftSafetyChecklistV5";
        const ROSTER_KEY = "shiftRosterV1";
        const SUPPLIES_KEY = "shiftSuppliesV1";
        const HISTORY_KEY = "shiftHistoryV1";
        const THEME_KEY = "shiftTheme";

        let currentView = "input";
        let roster = [];
        let shiftHistory = [];
        let theme = "dark";

        const defaultShift = {
            date: new Date().toISOString().split("T")[0],
            associates: {
                grocery: [],
                produce: [],
                meat: [],
                frozenDairy: [],
                deliBakery: [],
            },
            palletCount: 12,
            problemAreas: [],
            customProblems: [],
            shiftNotes: "",
            managerNotes: "",
            staffAssignments: [],
            weather: "Sunny",
            breakSchedule: { firstBreak: "", lunch: "", secondBreak: "" },
        };

        let shiftData = { ...defaultShift };
        let safetyChecklist = {};
        let safetyCompletedAt = null;
        let supplies = { balingWire: "Good", plasticBags: "Good", receiptPaper: "Good", bathroomSupplies: "Good" };
        
        // Timer State
        const timerState = { label: "", remainingMs: 0, endTime: null, interval: null };

        // --- LOAD DATA ---
        function loadState() {
            try {
                const savedData = localStorage.getItem(DATA_KEY);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    shiftData = {
                        ...defaultShift,
                        ...parsed,
                        associates: { ...defaultShift.associates, ...(parsed.associates || {}) },
                        breakSchedule: { ...defaultShift.breakSchedule, ...(parsed.breakSchedule || {}) },
                        staffAssignments: parsed.staffAssignments || [],
                        customProblems: parsed.customProblems || [],
                    };
                }
                const savedSafety = localStorage.getItem(SAFETY_KEY);
                if (savedSafety) {
                    const parsed = JSON.parse(savedSafety);
                    safetyChecklist = parsed.items || {};
                    safetyCompletedAt = parsed.completedAt || null;
                }
                const savedRoster = localStorage.getItem(ROSTER_KEY);
                if (savedRoster) roster = JSON.parse(savedRoster);
                
                const savedSupplies = localStorage.getItem(SUPPLIES_KEY);
                if (savedSupplies) supplies = { ...supplies, ...JSON.parse(savedSupplies) };

                const savedHistory = localStorage.getItem(HISTORY_KEY);
                if (savedHistory) shiftHistory = JSON.parse(savedHistory);

                const savedTheme = localStorage.getItem(THEME_KEY);
                if (savedTheme) theme = savedTheme;
            } catch (err) {
                console.warn("Error loading state", err);
            }
        }
        loadState();

        // --- PERSISTENCE ---
        function persistData() { 
            localStorage.setItem(DATA_KEY, JSON.stringify(shiftData)); 
            saveShiftToHistory();
        }
        function persistSafety() { 
            localStorage.setItem(SAFETY_KEY, JSON.stringify({ items: safetyChecklist, completedAt: safetyCompletedAt })); 
        }
        function persistRoster() { localStorage.setItem(ROSTER_KEY, JSON.stringify(roster)); }
        function persistSupplies() { localStorage.setItem(SUPPLIES_KEY, JSON.stringify(supplies)); }
        function persistTheme() { localStorage.setItem(THEME_KEY, theme); }

        function saveShiftToHistory() {
            if (!shiftData.date) return;
            // Create a copy to prevent reference issues
            const snapshot = JSON.parse(JSON.stringify(shiftData));
            const updated = shiftHistory.filter((s) => s.date !== snapshot.date);
            updated.push(snapshot);
            updated.sort((a, b) => (a.date < b.date ? 1 : -1));
            shiftHistory = updated;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(shiftHistory));
        }

        // --- LOGIC HANDLERS ---
        function updateInput(field, value) { shiftData[field] = value; persistData(); render(); }
        function updateBreak(field, value) { shiftData.breakSchedule[field] = value; persistData(); }
        function switchView(v) { currentView = v; render(); }
        
        // ** THIS WAS MISSING IN YOUR ORIGINAL CODE **
        function updateSupply(key, value) {
            supplies[key] = value;
            persistSupplies();
            // We do not call render() here because the inline onclick does it, 
            // but for safety we could. The inline HTML handles the render call.
        }

        function toggleTheme() {
            theme = theme === "dark" ? "light" : "dark";
            persistTheme();
            applyTheme();
            render();
        }

        function applyTheme() {
            document.body.className = theme === "light" ? "min-h-screen light-mode" : "min-h-screen";
        }

        function toggleProblemArea(area) {
            if (shiftData.problemAreas.includes(area)) {
                shiftData.problemAreas = shiftData.problemAreas.filter(a => a !== area);
            } else {
                shiftData.problemAreas.push(area);
            }
            persistData();
            render();
        }

        function addCustomProblem() {
            const el = document.getElementById("customProblemInput");
            if (!el || !el.value.trim()) return;
            const val = el.value.trim();
            if (!shiftData.problemAreas.includes(val)) {
                shiftData.customProblems.push(val);
                shiftData.problemAreas.push(val);
                persistData();
                el.value = "";
                render();
            }
        }

        function toggleSafetyItem(key) {
            safetyChecklist[key] = !safetyChecklist[key];
            const allChecked = Object.values(safetyChecklist).length > 0 && Object.values(safetyChecklist).every(Boolean);
            safetyCompletedAt = allChecked ? new Date().toISOString() : null;
            persistSafety();
            render();
        }

        function resetChecklist() {
            if(!confirm("Reset safety checklist?")) return;
            safetyChecklist = {};
            safetyCompletedAt = null;
            persistSafety();
            render();
        }

        function startNewDay() {
            if (!confirm("Start a New Day?\n\nThis clears specific shift data but keeps your Roster and History.")) return;
            shiftData = { ...defaultShift, date: new Date().toISOString().split("T")[0] };
            safetyChecklist = {};
            safetyCompletedAt = null;
            persistData();
            persistSafety();
            currentView = "input";
            render();
        }

        // --- ROSTER LOGIC ---
        function addRosterName() {
            const el = document.getElementById("rosterInput");
            if (!el || !el.value.trim()) return;
            const val = el.value.trim();
            if (!roster.includes(val)) {
                roster.push(val);
                persistRoster();
            }
            el.value = "";
            render();
        }

        function removeRosterName(name) {
            if(!confirm(`Remove ${name} from roster?`)) return;
            roster = roster.filter(n => n !== name);
            persistRoster();
            // Clean up assignments
            Object.keys(shiftData.associates).forEach(dept => {
                shiftData.associates[dept] = shiftData.associates[dept].filter(n => n !== name);
            });
            shiftData.staffAssignments = shiftData.staffAssignments.filter(s => s.name !== name);
            persistData();
            render();
        }

        function toggleAssociate(dept, name) {
            // Check if currently in dept
            const currentlyInDept = shiftData.associates[dept].includes(name);
            
            // Remove from all depts first to prevent duplicates
            Object.keys(shiftData.associates).forEach(key => {
                shiftData.associates[key] = shiftData.associates[key].filter(n => n !== name);
            });

            // If it wasn't already in this dept, add it (toggle behavior)
            if (!currentlyInDept) {
                shiftData.associates[dept].push(name);
            }
            
            persistData();
            render();
        }

        // --- STAFF ASSIGNMENT LOGIC ---
        function addStaffAssignmentsBulk() {
            const el = document.getElementById("staffBulkInput");
            if (!el) return;
            const names = el.value.split("\n").map(n => n.trim()).filter(Boolean);
            const existing = shiftData.staffAssignments.map(s => s.name);
            names.forEach(name => {
                if (!existing.includes(name)) {
                    shiftData.staffAssignments.push({ name, zone: "" });
                }
            });
            persistData();
            el.value = "";
            render();
        }

        function addStaffAssignmentSingle() {
            const nameEl = document.getElementById("staffNameInput");
            const zoneEl = document.getElementById("staffZoneInput");
            if (!nameEl.value.trim()) return;
            shiftData.staffAssignments.push({ name: nameEl.value.trim(), zone: zoneEl.value.trim() });
            persistData();
            nameEl.value = ""; zoneEl.value = "";
            render();
        }

        function updateAssignmentZone(idx, val) {
            shiftData.staffAssignments[idx].zone = val;
            persistData();
        }

        function removeAssignment(idx) {
            shiftData.staffAssignments.splice(idx, 1);
            persistData();
            render();
        }

        // --- TIMER LOGIC ---
        function startTimer(min, label) {
            if (timerState.interval) clearInterval(timerState.interval);
            timerState.label = label;
            timerState.remainingMs = min * 60 * 1000;
            timerState.endTime = Date.now() + timerState.remainingMs;
            
            timerState.interval = setInterval(() => {
                const left = timerState.endTime - Date.now();
                if (left <= 0) {
                    timerState.remainingMs = 0;
                    clearInterval(timerState.interval);
                    timerState.interval = null;
                    // Optional: Audio beep could go here
                } else {
                    timerState.remainingMs = left;
                }
                renderTimer(); 
            }, 1000);
            renderTimer();
        }

        function stopTimer() {
            if (timerState.interval) clearInterval(timerState.interval);
            timerState.label = "";
            timerState.remainingMs = 0;
            timerState.interval = null;
            renderTimer();
        }

        function formatTimer(ms) {
            const sec = Math.ceil(ms / 1000);
            const m = Math.floor(sec / 60).toString().padStart(2, '0');
            const s = (sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        // --- CALCULATION LOGIC ---
        function getTotalAssociates() {
            return Object.values(shiftData.associates).reduce((sum, arr) => sum + arr.length, 0);
        }

        function getFreightStrategy() {
            const total = getTotalAssociates();
            const ppp = total > 0 ? shiftData.palletCount / total : 0;
            const tips = {
                Rain: "Monitor entrance mats and wet floor signs.",
                Snow: "Prioritize cart retrieval and salt.",
                Sunny: "Check temps in cases exposed to direct sun."
            };
            const weatherTip = tips[shiftData.weather] || "";

            if (shiftData.palletCount >= 15) {
                return { status: "HEAVY LOAD", color: "bg-rose-600", pace: `${ppp.toFixed(1)}/person`, strategy: "All hands on freight. Prioritize high velocity.", weatherTip };
            } else if (shiftData.palletCount >= 10) {
                return { status: "MODERATE", color: "bg-amber-500", pace: `${ppp.toFixed(1)}/person`, strategy: "Standard flow. Grocery leads freight.", weatherTip };
            }
            return { status: "LIGHT LOAD", color: "bg-emerald-500", pace: `${ppp.toFixed(1)}/person`, strategy: "Freight + Deep Zoning & Topstock.", weatherTip };
        }

        function getFreshPriorities() {
            const p = [];
            const problems = shiftData.problemAreas;
            
            // Deli
            if (problems.includes("Deli cooking prep behind")) {
                p.push({ area: "DELI", priority: "HIGH", color: "bg-rose-600", action: "Verify cook schedule & hot case levels." });
            } else {
                p.push({ area: "DELI", priority: "STD", color: "bg-sky-600", action: "Quick hot case check." });
            }
            
            // Produce/Meat
            if (problems.includes("Produce not maxed/full") || problems.includes("Meat not maxed/full")) {
                p.push({ area: "FRESH", priority: "HIGH", color: "bg-rose-600", action: "Full audit: dates, rotation, filling holes." });
            } else {
                p.push({ area: "FRESH", priority: "STD", color: "bg-sky-600", action: "Visual sweep & fill key items." });
            }

            // Dairy
            if (problems.includes("Frozen/Dairy daily tasks")) {
                p.push({ area: "DAIRY", priority: "HIGH", color: "bg-rose-600", action: "Milk rotation & frozen door temps." });
            } else {
                p.push({ area: "DAIRY", priority: "STD", color: "bg-sky-600", action: "Check milk stock & cleanliness." });
            }
            return p;
        }

        function copySummary() {
            const s = getFreightStrategy();
            const p = getFreshPriorities().filter(x => x.priority === "HIGH");
            const txt = [
                `📅 Shift: ${new Date().toLocaleDateString()}`,
                `📦 Pallets: ${shiftData.palletCount} (${s.status})`,
                `👥 Team: ${getTotalAssociates()}`,
                p.length ? `🔥 Priorities: ${p.map(x => x.area).join(", ")}` : "✅ Priorities: Standard Maintenance",
                shiftData.problemAreas.length ? `⚠️ Issues: ${shiftData.problemAreas.join(", ")}` : ""
            ].filter(Boolean).join("\n");
            
            navigator.clipboard.writeText(txt).then(() => alert("Summary copied!")).catch(e => alert(txt));
        }

        // --- RENDERERS ---
        function renderHeader() {
            return `
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 no-print">
                    <div class="flex items-center justify-between md:block">
                        <div>
                            <p class="text-xs text-slate-400">${new Date().toLocaleDateString()}</p>
                            <h1 class="text-2xl font-bold text-white tracking-tight">Shift Control</h1>
                        </div>
                        <div class="md:hidden flex gap-2">
                             <button onclick="toggleTheme()" class="btn p-2 rounded-lg glass">
                                <i data-lucide="${theme === "dark" ? "sun" : "moon"}" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div id="timerDisplay" class="flex-1 mx-0 md:mx-4"></div>

                    <div class="flex flex-wrap gap-2 items-center justify-center md:justify-end">
                         <button onclick="toggleTheme()" class="hidden md:block btn px-3 py-2 rounded-lg glass">
                            <i data-lucide="${theme === "dark" ? "sun" : "moon"}" class="w-4 h-4"></i>
                        </button>
                        <button onclick="startNewDay()" class="btn px-3 py-2 rounded-lg glass text-rose-300 border border-rose-500/30" title="Start New Day">
                            <i data-lucide="sun" class="w-4 h-4"></i>
                        </button>
                        
                        <div class="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 overflow-x-auto max-w-full">
                            <button onclick="switchView('input')" class="px-3 py-1 text-sm whitespace-nowrap rounded ${currentView==='input' ? 'bg-sky-600 text-white' : 'text-slate-300'}">Inputs</button>
                            <button onclick="switchView('dashboard')" class="px-3 py-1 text-sm whitespace-nowrap rounded ${currentView==='dashboard' ? 'bg-sky-600 text-white' : 'text-slate-300'}">Plan</button>
                            <button onclick="switchView('safety')" class="px-3 py-1 text-sm whitespace-nowrap rounded ${currentView==='safety' ? 'bg-sky-600 text-white' : 'text-slate-300'}">Safety</button>
                            <button onclick="switchView('supplies')" class="px-3 py-1 text-sm whitespace-nowrap rounded ${currentView==='supplies' ? 'bg-sky-600 text-white' : 'text-slate-300'}">Supplies</button>
                            <button onclick="switchView('history')" class="px-3 py-1 text-sm whitespace-nowrap rounded ${currentView==='history' ? 'bg-sky-600 text-white' : 'text-slate-300'}">History</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderTimer() {
            const el = document.getElementById("timerDisplay");
            if (!el) return;
            
            if (!timerState.label && timerState.remainingMs === 0) {
                el.innerHTML = `
                    <div class="flex items-center gap-2 justify-center opacity-50 hover:opacity-100 transition-opacity">
                        <i data-lucide="timer" class="w-4 h-4 text-slate-400"></i>
                        <button class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white border border-slate-700" onclick="startTimer(15, 'Huddle')">15m Huddle</button>
                        <button class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white border border-slate-700" onclick="startTimer(45, 'Pallet Goal')">45m Goal</button>
                    </div>
                `;
            } else {
                el.innerHTML = `
                    <div class="flex items-center gap-4 justify-center bg-slate-900/80 px-4 py-2 rounded-xl border border-sky-500/30 shadow-lg shadow-sky-500/10">
                        <div class="text-right">
                            <p class="text-xs text-slate-400 uppercase tracking-wider">${timerState.label}</p>
                            <p class="text-xl font-mono font-bold ${timerState.remainingMs < 60000 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}">
                                ${formatTimer(timerState.remainingMs)}
                            </p>
                        </div>
                        <button onclick="stopTimer()" class="btn p-2 rounded-full hover:bg-white/10 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
                    </div>
                `;
            }
            lucide.createIcons();
        }

        function renderRosterSelector(dept, label) {
            return `
                <div class="col-span-1 border border-slate-800/50 rounded-xl p-3 bg-slate-900/20">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-sm font-semibold text-slate-300">${label}</h3>
                        <span class="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">${shiftData.associates[dept].length}</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${roster.map(name => {
                            const active = shiftData.associates[dept].includes(name);
                            // Check if assigned elsewhere
                            let assignedElsewhere = false;
                            Object.keys(shiftData.associates).forEach(k => {
                                if (k !== dept && shiftData.associates[k].includes(name)) assignedElsewhere = true;
                            });

                            let classes = "opacity-50 grayscale";
                            if (active) classes = "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 border-emerald-500";
                            else if (assignedElsewhere) classes = "bg-slate-800 text-slate-500 border-slate-700 opacity-30 cursor-not-allowed";
                            else classes = "glass text-slate-300 hover:bg-slate-700";

                            return `<button onclick="toggleAssociate('${dept}', '${name}')" class="px-2 py-1 text-xs rounded border transition-all ${classes}">${name}</button>`;
                        }).join("")}
                        ${!roster.length ? `<span class="text-xs text-slate-500 italic">Add names to Roster &rarr;</span>` : ''}
                    </div>
                </div>
            `;
        }

        function renderInputView() {
            const problems = [
                "Deli cooking prep behind", "Produce not maxed/full", "Meat not maxed/full",
                "Frozen/Dairy daily tasks", "Water/Topstock issues", "Grocery freight behind pace"
            ];

            return `
                ${renderHeader()}
                <div class="grid lg:grid-cols-3 gap-6">
                    <div class="card rounded-2xl p-6 lg:col-span-2 space-y-6">
                        <div class="flex flex-wrap gap-4 justify-between items-end">
                            <div class="w-full sm:w-auto">
                                <label class="text-xs text-slate-400 uppercase tracking-wider">Date</label>
                                <input type="date" value="${shiftData.date}" onchange="updateInput('date', this.value)" class="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white">
                            </div>
                            <div class="w-full sm:w-auto">
                                <label class="text-xs text-slate-400 uppercase tracking-wider">Weather</label>
                                <select onchange="updateInput('weather', this.value)" class="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white">
                                    ${["Sunny","Rain","Snow"].map(w => `<option ${shiftData.weather===w?'selected':''}>${w}</option>`).join('')}
                                </select>
                            </div>
                            <div class="w-full sm:w-auto flex-1">
                                <label class="text-xs text-slate-400 uppercase tracking-wider">Pallet Count</label>
                                <input type="number" value="${shiftData.palletCount}" onchange="updateInput('palletCount', Number(this.value))" class="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white">
                            </div>
                        </div>

                        <div>
                            <div class="mb-2 flex justify-between">
                                <h2 class="text-lg font-bold text-white">Team Assignments</h2>
                                <span class="text-sm text-sky-400">Total: ${getTotalAssociates()}</span>
                            </div>
                            <div class="grid md:grid-cols-2 gap-4">
                                ${renderRosterSelector("grocery", "Grocery")}
                                ${renderRosterSelector("produce", "Produce")}
                                ${renderRosterSelector("meat", "Meat")}
                                ${renderRosterSelector("frozenDairy", "Frozen/Dairy")}
                                ${renderRosterSelector("deliBakery", "Deli/Bakery")}
                            </div>
                        </div>

                        <div>
                             <h2 class="text-lg font-bold text-white mb-2">Problem Areas</h2>
                             <div class="grid sm:grid-cols-3 gap-2">
                                ${problems.map(p => `
                                    <button onclick="toggleProblemArea('${p}')" class="text-left text-xs p-2 rounded border ${shiftData.problemAreas.includes(p) ? 'bg-rose-600 text-white border-rose-500' : 'glass text-slate-400 border-transparent hover:border-slate-600'}">
                                        ${p}
                                    </button>
                                `).join("")}
                             </div>
                             <div class="mt-2 flex gap-2">
                                <input id="customProblemInput" placeholder="Add custom issue..." class="flex-1 bg-slate-900/50 border border-slate-700 rounded px-2 text-sm text-white">
                                <button onclick="addCustomProblem()" class="btn bg-slate-700 px-3 py-1 rounded text-xs text-white">Add</button>
                             </div>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="card rounded-2xl p-6">
                            <h2 class="text-lg font-bold text-white mb-4">Manage Roster</h2>
                            <div class="flex gap-2 mb-4">
                                <input id="rosterInput" placeholder="Name" class="flex-1 bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-white">
                                <button onclick="addRosterName()" class="btn bg-sky-600 text-white px-3 rounded"><i data-lucide="plus" class="w-4 h-4"></i></button>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${roster.map(n => `
                                    <span class="inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded text-xs text-slate-300 border border-slate-700">
                                        ${n}
                                        <button onclick="removeRosterName('${n}')" class="hover:text-rose-400"><i data-lucide="x" class="w-3 h-3"></i></button>
                                    </span>
                                `).join("")}
                                ${!roster.length ? '<p class="text-slate-500 text-sm italic">Add employees here to enable assignment.</p>' : ''}
                            </div>
                        </div>

                         <div class="card rounded-2xl p-6">
                            <h2 class="text-lg font-bold text-white mb-4">Shift Notes</h2>
                             <textarea rows="4" class="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white text-sm" 
                                placeholder="Delivery delays, VIP visits, etc."
                                onchange="updateInput('shiftNotes', this.value)">${escapeHTML(shiftData.shiftNotes)}</textarea>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderDashboardView() {
            const strat = getFreightStrategy();
            const fresh = getFreshPriorities();

            return `
                ${renderHeader()}
                
                <div class="hidden print:block mb-8 border-b-2 border-black pb-4">
                    <h1 class="text-4xl font-bold">Shift Plan</h1>
                    <p class="text-xl">${new Date(shiftData.date).toLocaleDateString()} | Manager: ________________</p>
                </div>

                <div class="grid lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 space-y-6">
                        <div class="card rounded-2xl p-6 relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-4 opacity-10"><i data-lucide="container" class="w-32 h-32"></i></div>
                            <div class="relative z-10">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="px-3 py-1 rounded text-xs font-bold text-white ${strat.color}">${strat.status}</span>
                                    <span class="text-slate-400 text-sm">${strat.pace}</span>
                                </div>
                                <h2 class="text-2xl font-bold text-white mb-2">${shiftData.palletCount} Pallets</h2>
                                <p class="text-lg text-slate-200 mb-4">${strat.strategy}</p>
                                <div class="bg-slate-900/50 p-3 rounded-lg border border-slate-700 inline-flex items-center gap-2 text-sm text-sky-300">
                                    <i data-lucide="cloud" class="w-4 h-4"></i> ${strat.weatherTip}
                                </div>
                            </div>
                        </div>

                        <div class="grid md:grid-cols-2 gap-4">
                            ${fresh.map(p => `
                                <div class="card p-4 border-l-4 ${p.priority==='HIGH'?'border-rose-500':'border-sky-500'}">
                                    <div class="flex justify-between mb-1">
                                        <span class="font-bold text-white">${p.area}</span>
                                        <span class="text-xs px-2 rounded ${p.color} text-white">${p.priority}</span>
                                    </div>
                                    <p class="text-sm text-slate-300">${p.action}</p>
                                </div>
                            `).join("")}
                        </div>

                        <div class="card rounded-2xl p-6">
                             <div class="flex justify-between items-center mb-4">
                                <h3 class="font-bold text-white">Staff Assignments</h3>
                                <div class="no-print flex gap-2">
                                    <input id="staffNameInput" placeholder="Name" class="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-sm text-white w-24">
                                    <input id="staffZoneInput" placeholder="Zone" class="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-sm text-white w-24">
                                    <button onclick="addStaffAssignmentSingle()" class="btn bg-sky-600 px-2 rounded text-white"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                </div>
                             </div>
                             <table class="w-full text-sm text-left">
                                <thead class="text-slate-500 border-b border-slate-700">
                                    <tr><th class="py-2">Name</th><th>Zone / Task</th><th class="no-print"></th></tr>
                                </thead>
                                <tbody class="text-slate-300">
                                    ${shiftData.staffAssignments.map((s, i) => `
                                        <tr class="border-b border-slate-800/50">
                                            <td class="py-2 font-medium text-white">${s.name}</td>
                                            <td class="py-2"><input class="bg-transparent w-full text-slate-300 focus:text-white" value="${s.zone}" onchange="updateAssignmentZone(${i}, this.value)" placeholder="Assign..."></td>
                                            <td class="no-print text-right"><button onclick="removeAssignment(${i})" class="text-rose-400"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
                                        </tr>
                                    `).join("")}
                                    ${!shiftData.staffAssignments.length ? `<tr><td colspan="3" class="py-4 text-center text-slate-500 italic">Use inputs above or Bulk Add in Inputs view to assign staff.</td></tr>` : ''}
                                </tbody>
                             </table>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="card rounded-2xl p-6">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="coffee" class="w-4 h-4"></i> Break Schedule</h3>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs text-slate-500 uppercase">1st Break</label>
                                    <input type="time" value="${shiftData.breakSchedule.firstBreak}" onchange="updateBreak('firstBreak', this.value)" class="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-xs text-slate-500 uppercase">Lunch</label>
                                    <input type="time" value="${shiftData.breakSchedule.lunch}" onchange="updateBreak('lunch', this.value)" class="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white">
                                </div>
                                <div>
                                    <label class="text-xs text-slate-500 uppercase">2nd Break</label>
                                    <input type="time" value="${shiftData.breakSchedule.secondBreak}" onchange="updateBreak('secondBreak', this.value)" class="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-white">
                                </div>
                            </div>
                        </div>

                         <div class="card rounded-2xl p-6 border-t-4 border-rose-500">
                             <h3 class="font-bold text-white mb-2">Active Issues</h3>
                             ${shiftData.problemAreas.length ? 
                                `<ul class="list-disc pl-4 text-sm text-slate-300 space-y-1">${shiftData.problemAreas.map(a => `<li>${a}</li>`).join("")}</ul>` 
                                : `<p class="text-slate-500 text-sm italic">None flagged.</p>`}
                        </div>

                        <div class="card rounded-2xl p-6">
                            <h3 class="font-bold text-white mb-2">Manager Notes</h3>
                            <textarea rows="4" class="w-full bg-slate-900/50 border border-slate-700 rounded p-2 text-white text-sm" onchange="updateInput('managerNotes', this.value)">${escapeHTML(shiftData.managerNotes)}</textarea>
                        </div>
                        
                        <div class="no-print grid grid-cols-2 gap-2">
                             <button onclick="copySummary()" class="btn bg-emerald-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"><i data-lucide="copy" class="w-4 h-4"></i> Copy</button>
                             <button onclick="window.print()" class="btn bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Print</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderSafetyView() {
            const cats = [
                { t: "General", i: ["Floors dry", "Trash off floor", "Spills guarded", "Walkways clear", "Exits clear"] },
                { t: "Freight", i: ["Aisles clear", "No standing on pallets", "Staged safely", "Cases secure"] },
                { t: "Equipment", i: ["Ladders safe", "Cutters retracted", "Equipment parked", "Keys off"] },
                { t: "Emergency", i: ["Doors locked", "Extinguishers clear", "Rally points known"] }
            ];
            
            let total = 0, done = 0;
            cats.forEach(c => c.i.forEach(item => { total++; if(safetyChecklist[`${c.t}-${item}`]) done++; }));
            const pct = total ? Math.round((done/total)*100) : 0;

            return `
                ${renderHeader()}
                <div class="max-w-3xl mx-auto">
                    <div class="card p-6 rounded-2xl mb-6 sticky top-4 z-20">
                        <div class="flex justify-between items-end mb-2">
                            <h2 class="text-2xl font-bold text-white">Safety Walk</h2>
                            <span class="text-xl font-mono text-emerald-400">${pct}%</span>
                        </div>
                        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-emerald-500 to-sky-500 h-full transition-all" style="width: ${pct}%"></div>
                        </div>
                        <div class="mt-4 flex justify-between">
                             <button onclick="resetChecklist()" class="text-xs text-rose-400 hover:text-rose-300">Reset Checklist</button>
                             <span class="text-xs text-slate-500">${safetyCompletedAt ? `Completed: ${new Date(safetyCompletedAt).toLocaleTimeString()}` : 'In Progress'}</span>
                        </div>
                    </div>

                    <div class="space-y-4">
                        ${cats.map(c => `
                            <div class="card rounded-xl overflow-hidden">
                                <div class="bg-slate-800/50 px-4 py-2 border-b border-slate-700 font-bold text-sky-400">${c.t}</div>
                                <div class="divide-y divide-slate-800">
                                    ${c.i.map(item => {
                                        const key = `${c.t}-${item}`;
                                        const checked = safetyChecklist[key];
                                        return `
                                            <button onclick="toggleSafetyItem('${key}')" class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors">
                                                <div class="w-6 h-6 rounded-full border flex items-center justify-center ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}">
                                                    ${checked ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}
                                                </div>
                                                <span class="${checked ? 'text-emerald-100 line-through opacity-50' : 'text-slate-200'}">${item}</span>
                                            </button>
                                        `;
                                    }).join("")}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function renderSuppliesView() {
            const items = [
                { k: "balingWire", l: "Baling Wire" }, { k: "plasticBags", l: "Plastic Bags" },
                { k: "receiptPaper", l: "Receipt Paper" }, { k: "bathroomSupplies", l: "Bathroom Supplies" }
            ];
            return `
                ${renderHeader()}
                <div class="max-w-2xl mx-auto card rounded-2xl p-8">
                    <h2 class="text-2xl font-bold text-white mb-6">Store Supplies</h2>
                    <div class="space-y-4">
                        ${items.map(i => `
                            <div class="flex items-center justify-between p-4 glass rounded-xl">
                                <span class="font-medium text-white">${i.l}</span>
                                <div class="flex gap-1">
                                    ${["Good", "Low", "Critical"].map(s => `
                                        <button onclick="updateSupply('${i.k}', '${s}'); render();" class="px-3 py-1 rounded text-sm border ${supplies[i.k]===s ? (s==='Good'?'bg-emerald-600 border-emerald-500 text-white':s==='Low'?'bg-amber-600 border-amber-500 text-white':'bg-rose-600 border-rose-500 text-white') : 'border-slate-700 text-slate-400 hover:border-slate-500'}">
                                            ${s}
                                        </button>
                                    `).join("")}
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }

        function renderHistoryView() {
             return `
                ${renderHeader()}
                <div class="max-w-4xl mx-auto card rounded-2xl p-8">
                    <h2 class="text-2xl font-bold text-white mb-6">Shift History</h2>
                    <div class="space-y-2">
                        ${shiftHistory.length ? shiftHistory.map(h => `
                            <div class="glass p-4 rounded-xl flex justify-between items-center">
                                <div>
                                    <p class="font-bold text-white">${new Date(h.date).toLocaleDateString()}</p>
                                    <p class="text-sm text-slate-400">${h.palletCount} Pallets • ${Object.values(h.associates).reduce((a,b)=>a+b.length,0)} Staff</p>
                                </div>
                                <button onclick='shiftData = ${JSON.stringify(h)}; currentView="dashboard"; render();' class="btn text-sky-400 hover:text-sky-300">Load View &rarr;</button>
                            </div>
                        `).join("") : `<p class="text-slate-500 italic">No history saved yet.</p>`}
                    </div>
                </div>
            `;
        }

        function render() {
            const app = document.getElementById("app");
            if (currentView === "input") app.innerHTML = renderInputView();
            else if (currentView === "dashboard") app.innerHTML = renderDashboardView();
            else if (currentView === "safety") app.innerHTML = renderSafetyView();
            else if (currentView === "supplies") app.innerHTML = renderSuppliesView();
            else if (currentView === "history") app.innerHTML = renderHistoryView();
            
            renderTimer(); 
            applyTheme();
            lucide.createIcons();
        }

        render();
    </script>
</body>
</html

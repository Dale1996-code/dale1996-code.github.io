const { performance } = require('perf_hooks');

function addStaffAssignmentsBulk_old(names, staffAssignments) {
    const existing = staffAssignments.map(s => s.name);
    names.forEach(name => {
        if (!existing.includes(name)) {
            staffAssignments.push({ name, zone: "" });
        }
    });
}

function addStaffAssignmentsBulk_new(names, staffAssignments) {
    const existing = new Set(staffAssignments.map(s => s.name));
    names.forEach(name => {
        if (!existing.has(name)) {
            staffAssignments.push({ name, zone: "" });
        }
    });
}

// Generate data
const initialStaffCount = 10000;
const newStaffCount = 10000;

const initialStaff = [];
for (let i = 0; i < initialStaffCount; i++) {
    initialStaff.push({ name: `Staff_${i}`, zone: "A" });
}

const namesToAdd = [];
for (let i = 0; i < newStaffCount; i++) {
    // 50% existing, 50% new
    if (i % 2 === 0) {
        namesToAdd.push(`Staff_${i}`);
    } else {
        namesToAdd.push(`NewStaff_${i}`);
    }
}

// Benchmark old
const oldStaffAssignments = JSON.parse(JSON.stringify(initialStaff));
const startOld = performance.now();
addStaffAssignmentsBulk_old(namesToAdd, oldStaffAssignments);
const endOld = performance.now();
const oldTime = endOld - startOld;

// Benchmark new
const newStaffAssignments = JSON.parse(JSON.stringify(initialStaff));
const startNew = performance.now();
addStaffAssignmentsBulk_new(namesToAdd, newStaffAssignments);
const endNew = performance.now();
const newTime = endNew - startNew;

console.log(`Old Time: ${oldTime.toFixed(2)} ms`);
console.log(`New Time: ${newTime.toFixed(2)} ms`);
console.log(`Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(2)}% faster`);

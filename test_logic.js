const assert = require('node:assert');

let shiftHistory = [
    { date: "2024-05-05", data: "a" },
    { date: "2024-05-03", data: "b" },
    { date: "2024-05-01", data: "c" }
];

const localStorage = {
    setItem: (k, v) => {}
};
const HISTORY_KEY = "test";

function saveShiftToHistory(shiftData) {
    if (!shiftData.date) return;
    // Create a copy to prevent reference issues
    const snapshot = JSON.parse(JSON.stringify(shiftData));

    const existingIndex = shiftHistory.findIndex((s) => s.date === snapshot.date);
    if (existingIndex !== -1) {
        shiftHistory[existingIndex] = snapshot;
    } else {
        let insertIndex = 0;
        while (insertIndex < shiftHistory.length && shiftHistory[insertIndex].date > snapshot.date) {
            insertIndex++;
        }
        shiftHistory.splice(insertIndex, 0, snapshot);
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(shiftHistory));
}

// Test 1: Insert newer date (top of list)
saveShiftToHistory({ date: "2024-05-10", data: "new top" });
assert.deepStrictEqual(shiftHistory, [
    { date: "2024-05-10", data: "new top" },
    { date: "2024-05-05", data: "a" },
    { date: "2024-05-03", data: "b" },
    { date: "2024-05-01", data: "c" }
]);

// Test 2: Insert middle date
saveShiftToHistory({ date: "2024-05-04", data: "middle" });
assert.deepStrictEqual(shiftHistory, [
    { date: "2024-05-10", data: "new top" },
    { date: "2024-05-05", data: "a" },
    { date: "2024-05-04", data: "middle" },
    { date: "2024-05-03", data: "b" },
    { date: "2024-05-01", data: "c" }
]);

// Test 3: Insert older date (bottom of list)
saveShiftToHistory({ date: "2024-04-30", data: "old" });
assert.deepStrictEqual(shiftHistory, [
    { date: "2024-05-10", data: "new top" },
    { date: "2024-05-05", data: "a" },
    { date: "2024-05-04", data: "middle" },
    { date: "2024-05-03", data: "b" },
    { date: "2024-05-01", data: "c" },
    { date: "2024-04-30", data: "old" }
]);

// Test 4: Replace existing date
saveShiftToHistory({ date: "2024-05-03", data: "updated b" });
assert.deepStrictEqual(shiftHistory, [
    { date: "2024-05-10", data: "new top" },
    { date: "2024-05-05", data: "a" },
    { date: "2024-05-04", data: "middle" },
    { date: "2024-05-03", data: "updated b" },
    { date: "2024-05-01", data: "c" },
    { date: "2024-04-30", data: "old" }
]);

console.log("All tests passed!");

const assert = require('node:assert');

// Mock localStorage
const localStorage = {
    setItem: (key, value) => {}
};

const HISTORY_KEY = "shiftHistoryV1";

function runBenchmark() {
    let shiftHistoryOld = [];
    let shiftHistoryNew = [];
    for (let i = 0; i < 5000; i++) {
        // padding to make it a string compare
        const dateStr = "2020-01-01 " + String(i).padStart(5, '0');
        const shift = { date: dateStr, data: "some data " + i };
        shiftHistoryOld.push(shift);
        shiftHistoryNew.push(shift);
    }

    shiftHistoryOld.sort((a, b) => (a.date < b.date ? 1 : -1));
    shiftHistoryNew.sort((a, b) => (a.date < b.date ? 1 : -1));

    const shiftData = {
        date: "2020-01-01 02500",
        data: "updated data"
    };

    function saveShiftToHistoryOld(shiftHistory, shiftData) {
        if (!shiftData.date) return;
        const snapshot = shiftData; // simplified for benchmark
        const updated = shiftHistory.filter((s) => s.date !== snapshot.date);
        updated.push(snapshot);
        updated.sort((a, b) => (a.date < b.date ? 1 : -1));
        shiftHistory = updated;
        return shiftHistory;
    }

    function saveShiftToHistoryNew(shiftHistory, shiftData) {
        if (!shiftData.date) return;
        const snapshot = shiftData; // simplified for benchmark

        const existingIndex = shiftHistory.findIndex(s => s.date === snapshot.date);
        if (existingIndex !== -1) {
            shiftHistory[existingIndex] = snapshot;
        } else {
            let insertIndex = 0;
            while (insertIndex < shiftHistory.length && shiftHistory[insertIndex].date > snapshot.date) {
                insertIndex++;
            }
            shiftHistory.splice(insertIndex, 0, snapshot);
        }

        return shiftHistory;
    }

    const ITERATIONS = 1000;

    const startOld = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        shiftHistoryOld = saveShiftToHistoryOld(shiftHistoryOld, shiftData);
    }
    const endOld = performance.now();

    const startNew = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        shiftHistoryNew = saveShiftToHistoryNew(shiftHistoryNew, shiftData);
    }
    const endNew = performance.now();

    console.log(`Old Function (array ops only): ${(endOld - startOld).toFixed(2)} ms`);
    console.log(`New Function (array ops only): ${(endNew - startNew).toFixed(2)} ms`);
}

runBenchmark();

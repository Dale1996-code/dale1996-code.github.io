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

if (typeof module !== "undefined") {
    module.exports = { getTotalAssociates, getFreightStrategy };
}

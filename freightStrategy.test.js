const test = require('node:test');
const assert = require('node:assert');
const { getFreightStrategy } = require('./freightStrategy.js');

test('getFreightStrategy() with zero associates handles edge case', () => {
    global.shiftData = {
        associates: {
            grocery: [],
            produce: [],
            meat: [],
            frozenDairy: [],
            deliBakery: []
        },
        palletCount: 12,
        weather: "Sunny"
    };

    const result = getFreightStrategy();
    assert.strictEqual(result.status, 'MODERATE');
    assert.strictEqual(result.pace, '0.0/person'); // Division by zero handled
    assert.strictEqual(result.weatherTip, 'Check temps in cases exposed to direct sun.');
});

test('getFreightStrategy() handles light load (pallets < 10)', () => {
    global.shiftData = {
        associates: {
            grocery: ['Alice', 'Bob'], // 2 people
            produce: [],
            meat: [],
            frozenDairy: [],
            deliBakery: []
        },
        palletCount: 8,
        weather: "Sunny"
    };

    const result = getFreightStrategy();
    assert.strictEqual(result.status, 'LIGHT LOAD');
    assert.strictEqual(result.pace, '4.0/person');
    assert.strictEqual(result.color, 'bg-emerald-500');
    assert.strictEqual(result.strategy, 'Freight + Deep Zoning & Topstock.');
});

test('getFreightStrategy() handles moderate load (10 <= pallets < 15)', () => {
    global.shiftData = {
        associates: {
            grocery: ['Alice', 'Bob', 'Charlie'], // 3 people
            produce: [],
            meat: [],
            frozenDairy: [],
            deliBakery: []
        },
        palletCount: 12,
        weather: "Rain"
    };

    const result = getFreightStrategy();
    assert.strictEqual(result.status, 'MODERATE');
    assert.strictEqual(result.pace, '4.0/person');
    assert.strictEqual(result.color, 'bg-amber-500');
    assert.strictEqual(result.strategy, 'Standard flow. Grocery leads freight.');
    assert.strictEqual(result.weatherTip, 'Monitor entrance mats and wet floor signs.');
});

test('getFreightStrategy() handles heavy load (pallets >= 15)', () => {
    global.shiftData = {
        associates: {
            grocery: ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve'], // 5 people
            produce: [],
            meat: [],
            frozenDairy: [],
            deliBakery: []
        },
        palletCount: 16,
        weather: "Snow"
    };

    const result = getFreightStrategy();
    assert.strictEqual(result.status, 'HEAVY LOAD');
    assert.strictEqual(result.pace, '3.2/person');
    assert.strictEqual(result.color, 'bg-rose-600');
    assert.strictEqual(result.strategy, 'All hands on freight. Prioritize high velocity.');
    assert.strictEqual(result.weatherTip, 'Prioritize cart retrieval and salt.');
});

test('getFreightStrategy() handles unknown weather conditions', () => {
    global.shiftData = {
        associates: {
            grocery: ['Alice'], // 1 person
            produce: [],
            meat: [],
            frozenDairy: [],
            deliBakery: []
        },
        palletCount: 5,
        weather: "Cloudy" // Not Sunny, Rain, or Snow
    };

    const result = getFreightStrategy();
    assert.strictEqual(result.weatherTip, ''); // Should fallback to empty string
});

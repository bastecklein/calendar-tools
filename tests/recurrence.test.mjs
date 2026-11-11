import test from "node:test";
import assert from "node:assert/strict";

import { Calendar, CalendarEvent } from "../src/index.js";

function eventOn(year, month, day, options) {
    const start = new Date(year, month, day);
    const end = new Date(year, month, day);

    return new CalendarEvent({
        startTime: start.getTime(),
        endTime: end.getTime(),
        summary: "Test event",
        ...options
    });
}

function hitsOn(evt, year, month, day) {
    const cal = new Calendar({ events: [evt] });

    return cal.getEventsForDay(new Date(year, month, day)).length > 0;
}

test("a plain event only lands on its own day", function() {
    const evt = eventOn(2026, 0, 15);

    assert.equal(hitsOn(evt, 2026, 0, 15), true);
    assert.equal(hitsOn(evt, 2026, 0, 14), false);
    assert.equal(hitsOn(evt, 2026, 0, 16), false);
    assert.equal(hitsOn(evt, 2026, 1, 15), false);
});

test("a multi-day event covers every day in its range", function() {
    const start = new Date(2026, 0, 10);
    const end = new Date(2026, 0, 12);

    const evt = new CalendarEvent({
        startTime: start.getTime(),
        endTime: end.getTime(),
        summary: "Trip"
    });

    assert.equal(hitsOn(evt, 2026, 0, 10), true);
    assert.equal(hitsOn(evt, 2026, 0, 11), true);
    assert.equal(hitsOn(evt, 2026, 0, 12), true);
    assert.equal(hitsOn(evt, 2026, 0, 13), false);
});

test("monthly without bymonthday repeats on the same day of month", function() {
    const evt = eventOn(2026, 0, 15, { rrule: { freq: "monthly" } });

    assert.equal(hitsOn(evt, 2026, 1, 15), true);
    assert.equal(hitsOn(evt, 2026, 5, 15), true);
    assert.equal(hitsOn(evt, 2026, 1, 16), false);
    assert.equal(hitsOn(evt, 2026, 1, 14), false);
});

test("monthly last day repeats on the last day of every month", function() {
    /* Regression: BYMONTHDAY was only honoured when positive, so the -1 this
       returns for "last day" was ignored and the event never repeated. */
    const evt = eventOn(2026, 0, 31, { rrule: { freq: "monthly", bymonthday: "-1" } });

    assert.equal(hitsOn(evt, 2026, 0, 31), true, "January has 31 days");
    assert.equal(hitsOn(evt, 2026, 1, 28), true, "February 2026 has 28 days");
    assert.equal(hitsOn(evt, 2026, 2, 31), true, "March has 31 days");
    assert.equal(hitsOn(evt, 2026, 3, 30), true, "April has 30 days");
    assert.equal(hitsOn(evt, 2026, 1, 27), false);
    assert.equal(hitsOn(evt, 2026, 1, 29), false);
});

test("monthly last day follows February in a leap year", function() {
    const evt = eventOn(2026, 0, 31, { rrule: { freq: "monthly", bymonthday: "-1" } });

    assert.equal(hitsOn(evt, 2028, 1, 29), true);
    assert.equal(hitsOn(evt, 2028, 1, 28), false);
});

test("monthly last day works when the event started on a 30-day month", function() {
    const evt = eventOn(2026, 3, 30, { rrule: { freq: "monthly", bymonthday: "-1" } });

    assert.equal(hitsOn(evt, 2026, 3, 30), true, "April 30");
    assert.equal(hitsOn(evt, 2026, 4, 31), true, "May 31");
    assert.equal(hitsOn(evt, 2027, 1, 28), true, "February 2027");
    assert.equal(hitsOn(evt, 2026, 4, 30), false);
});

test("a positive bymonthday selects that day of the month", function() {
    const evt = eventOn(2026, 0, 10, { rrule: { freq: "monthly", bymonthday: "15" } });

    assert.equal(hitsOn(evt, 2026, 0, 15), true);
    assert.equal(hitsOn(evt, 2026, 1, 15), true);
    assert.equal(hitsOn(evt, 2026, 1, 16), false);

    /* The original date stays part of the series, as in RFC 5545. */
    assert.equal(hitsOn(evt, 2026, 0, 10), true);
});

test("a bymonthday that does not exist in a month has no occurrence", function() {
    const evt = eventOn(2026, 0, 31, { rrule: { freq: "monthly", bymonthday: "31" } });

    assert.equal(hitsOn(evt, 2026, 0, 31), true);
    assert.equal(hitsOn(evt, 2026, 1, 28), false);
    assert.equal(hitsOn(evt, 2026, 3, 30), false);
});

test("a bymonthday rule does not also repeat on the start day", function() {
    const evt = eventOn(2026, 0, 20, { rrule: { freq: "monthly", bymonthday: "-1" } });

    assert.equal(hitsOn(evt, 2026, 1, 28), true);
    assert.equal(hitsOn(evt, 2026, 1, 20), false, "February 20 is not the last day");
});

test("yearly repeats on the same month and day", function() {
    const evt = eventOn(2026, 5, 4, { rrule: { freq: "yearly" } });

    assert.equal(hitsOn(evt, 2027, 5, 4), true);
    assert.equal(hitsOn(evt, 2028, 5, 4), true);
    assert.equal(hitsOn(evt, 2027, 5, 5), false);
    assert.equal(hitsOn(evt, 2027, 6, 4), false);
});

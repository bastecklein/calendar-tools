# Decisions

Chronological. Append only; newest last. To supersede an entry, append a
`**Resolved (YYYY-MM-DD):**` paragraph and leave the original intact.

## 2026-11-11 — BYMONTHDAY follows iCalendar semantics, and the start date stays in the series

**Decided:** In `isEventOnDate`, a monthly rule with `BYMONTHDAY` resolves to
`bymonthday > 0 ? bymonthday : monthLength + bymonthday + 1`. When `BYMONTHDAY` is
present, the monthly branch no longer adds a start-day match. The event still
appears on its own start date through the generic start/end range check, which is
left alone.

**Why:** RFC 5545 defines a positive `BYMONTHDAY` as a day of the month and a
negative one as counted back from the end, so `-1` is the last day. The previous
code only applied the rule when the value was positive and then always used the
negative formula. That meant the one value EZ Calendar Maker writes (`-1`) was
never used at all, while the values that did pass produced a day past the end of
the month. The formula was right; the guard was inverted, so the fix is in the
guard, not the arithmetic.

**Why the start date stays:** a recurrence set always includes its first
occurrence, and mainstream calendar apps behave that way. Dropping it would
silently move an event the user created on the 20th, and would change the meaning
of imported ICS files where `DTSTART` is intentionally part of the set. An app
that wants a different shape can move an event before adding the rule.

**Coverage:** `tests/recurrence.test.mjs` pins last-day behavior in 28-, 29-, 30-
and 31-day months, a positive `BYMONTHDAY`, a day of month that does not exist in a
given month, the absence of a double start-day match, and unchanged plain, monthly
and yearly behavior.

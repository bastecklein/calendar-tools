# calendar-tools changelog

## 1.0.1 - 2026-11-11

### Fixed

- Monthly recurrence now honours every `BYMONTHDAY` value. It was only applied
  when positive, so `BYMONTHDAY=-1` ("last day of the month"), which is what EZ
  Calendar Maker writes for its "Repeat Monthly (Last Day)" option, was ignored
  and the event appeared only on its start date. Positive values now also mean a
  day of the month rather than an offset past the end of it.
- A monthly rule with `BYMONTHDAY` no longer adds the event's start day on top of
  the rule. The original date still remains part of the series, as RFC 5545
  requires.

## 1.0.0 - 2025-02-04

Extracted multiple libraries from the EZ Calendar Maker app and converted to module
# Decisions

Locked 2026-08-30. Do not reopen during Pause 1–4 unless Pause 1 cannot complete a real 3-player game.

## Stack
React + Vite + TypeScript. Common, works in the browser, easy to test.

## Robot brains
Reuse the existing simulator brains (the Python robots already tuned on thousands of games), loaded in the browser later. Pause 1 uses a stand-in robot that only picks legal moves so we can prove a 3-player game finishes. The real brains arrive in Pause 3.

## Laundromat
Default is the current printed rule: 5 coins or fewer → +2; 6 or more → +1. The older “always +2” rule is available as a toggle for Pause 2+.

## Wholesaler starting coins
Always 9, plus the difficulty dial (−3 to +3). This app always has exactly one human, so the printed “7 coins if 2+ humans” case never happens.

## First table
3 seats: one human and two robots. That is the smallest table the printed game actually uses.

---
name: linear-cycle-assignment
description: "Trigger: Linear cycles, asignar cycles, sprints Linear, mapear tareas. Assign AsisTec issues to Linear cycles safely."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Linear Cycle Assignment

## Activation Contract

Use this skill when the user asks to assign AsisTec issues to Linear cycles/sprints, verify cycle setup, or recover cycle mapping after team/project changes.

## Hard Rules

- Verify Lab Assistec cycles before assigning issues.
- Do not assume future cycles exist; assign and then verify `cycleId` on representative issues.
- Keep AsisTec issues under the **AsisTec** project and **Lab Assistec** team.
- If Linear only exposes some cycles, assign only those that persist and tell the user which upcoming cycles must be enabled.
- Do not force team/project moves if Linear reports ownership or discrepancy errors; stabilize issues first.

## Decision Gates

| Situation | Action |
|---|---|
| No current cycle | Check next cycles before reporting failure |
| Cycle exists | Assign sprint tracker plus child issues |
| Assignment returns no `cycleId` | Verify with `get_issue`; treat as not persisted if absent |
| Future cycles missing | Ask user to increase Upcoming cycles in Linear UI |
| Team mismatch | Move issues back to Lab Assistec before cycle assignment |

## Execution Steps

1. List current and next cycles for Lab Assistec.
2. Confirm AsisTec belongs only to Lab Assistec before bulk assignment.
3. Map one sprint tracker and its child issues to the target cycle.
4. Verify at least the tracker and one child issue expose a `cycleId`.
5. Repeat per available cycle; stop when assignments do not persist.

## Output Contract

Return the cycle-to-issue mapping, verified assignments, failed/non-persisted assignments, and the exact Linear UI setting needed if more cycles must be created.

## References

- `AGENTS.md` — project response and review rules.

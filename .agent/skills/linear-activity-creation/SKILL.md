---
name: linear-activity-creation
description: "Trigger: Linear activity, crear actividades, tareas Linear, plan AsisTec. Create detailed Linear issues for AsisTec work."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Linear Activity Creation

## Activation Contract

Use this skill when the user asks to create, refine, or plan Linear activities for AsisTec. Treat the ERS and existing project planning as the source of truth. Do not create vague tasks; create actionable issues that can later feed SDD.

## Hard Rules

- Verify the target Linear team and project before creating issues.
- Use **Lab Assistec** for AsisTec work unless the user explicitly changes it.
- Do not touch unrelated teams such as Vimudevs or Tramitapyme without explicit confirmation.
- Prefer Spanish issue titles/descriptions for planning artifacts in this project.
- Every activity must include objective, scope/context, and acceptance criteria.
- If the task is implementation-ready, add enough context for SDD handoff.

## Decision Gates

| Need | Action |
|---|---|
| Roadmap milestone | Create a parent issue named `Hito: ...` |
| Sprint container | Create a tracker issue named `Sprint N — ...` |
| Implementable work | Create a child issue under the relevant hito |
| Bug from validation | Create a Bug issue with reproduction and validation criteria |
| Unclear ERS scope | Create/update a planning issue before implementation |

## Execution Steps

1. Fetch the Linear project and confirm it belongs to Lab Assistec.
2. Search for duplicate or related issues before creating new ones.
3. Build each issue with: `Objetivo`, `Contexto/Fuente de verdad`, `Alcance`, and `Criterio de aceptación`.
4. Set priority, due date, estimate, project, team, labels when available, and parent issue when applicable.
5. Return created issue IDs and the reasoning for grouping.

## Output Contract

Return the created or updated Linear issue IDs, their parent/sprint relationship, and any unresolved assumption. If a Linear mutation fails, report the exact failure and safe next step.

## References

- `AGENTS.md` — project response and review rules.

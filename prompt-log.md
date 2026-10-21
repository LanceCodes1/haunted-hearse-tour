# Prompt Log — Haunted Hearse Tour (W6)

### Wed Oct 21 — Scope decision + project setup
**Tool:** HQ chat (Claude)
**Prompt:** Pressure-test the W6 plan against the spec; riskiest piece + cut order.
**Why:** Lock scope before writing code.
**Result:** Wikidata = riskiest piece (name matching, coordinates two hops away, living-person guard depends on it). CRUD + Prisma/Neon parked until core works. Fallback demo must keep the search box (bad-input guard surface).
**Commit:**
**Mistake caught:** AI gave placeholder paths (`~/path/to/your/projects`) that got pasted literally. Terminal errors (`cd: too many arguments`, `mv: No such file`) caught it; no damage.
# Sun mode with improved sun (revised)

**Date:** 2026-08-10  
**Status:** Implemented (revised)  
**Approach:** New sun disc + flare + directional light lives in **sun mode** only; forward corridor has no sun.

## Behavior

- **Forward (dark):** normal fly-through, no sun / flare in frame.
- **Sun mode (toggle):** camera yaws 180°, improved sun behind the ship (upper-right), corona wash, lens flare, sun-keyed lighting, rocks stream via `sunStream`.
- `ENABLE_SUN_MODE = true`; theme toggle restored (desktop + mobile).

## Out of scope

- Volumetric god rays / EffectComposer bloom  

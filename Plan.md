# HH Goa 2026 — Frame / ID Card Generator
**Plan.md — Build Plan for Shortlisting Task**
Deadline: 11:59 PM, August 13, 2026 · Submission: live link via the [Google Form](https://forms.gle/jM5hTaGvsrfEfixPA)

---

## 1. Scope Decision (locked in now, not revisited mid-build)

| Decision | Choice | Why |
|---|---|---|
| **Format** | Build **Format B (Builder ID Card)** as the primary deliverable. Add **Format A (PFP Frame)** as a stretch goal — same photo pipeline, ~1 extra layout, cheap to bolt on if Day 2 goes well. | The brief rewards "unmistakably this event, not a generic badge." A badge with a name, role, and a generated title gives judges more surface area to see personality/on-brand execution than a plain photo frame. If time runs short, B alone is a complete, fully-scoped submission. |
| **Stack** | Next.js (App Router) + TypeScript, deployed on Vercel. Client-side canvas rendering for the graphic; one tiny serverless API route only for the share-link fallback. | Matches your existing Vercel/Next deploy pattern from Manju Foods / Calicos, so zero setup tax. Canvas rendering client-side is what makes "a few seconds, not a loading screen" achievable — there is no server round trip on the critical path. |
| **Image compositing** | Native `<canvas>` + `drawImage`/`fillText`, not a heavy library (no Fabric/Konva). | The layout is fixed (one photo slot + a few text fields), so a canvas library's editing UI is overhead you don't need. Native canvas is faster to ship and faster at runtime. |
| **HEIC handling** | Client-side conversion via `heic2any` (WASM) before anything touches canvas. | Canvas/`drawImage` cannot read HEIC directly; this has to happen up front or iPhone uploads silently break. |
| **Storage for share-link fallback** | Vercel Blob (or Supabase Storage if Blob quota is a concern), short-lived objects. | Needed only so a real HTTP URL exists for X's link-preview crawler to fetch as `og:image`. Free tier is plenty for a shortlisting-scale tool. |

---

## 2. User Flow (single pass, no dead ends)

1. **Land on page** → no login, no gate, one clear "Upload your photo" CTA above the fold.
2. **Upload** → file input (`accept="image/*,.heic"`, `capture` attr for mobile camera). If HEIC, convert client-side immediately; show a lightweight spinner state (≤1s) during conversion only.
3. **Auto-crop, don't force manual cropping** → the photo is auto-fit into the card's photo slot using `object-fit: cover` logic (center-weighted). This alone handles portrait/landscape/odd-aspect photos with zero user effort.
   - An **optional** "adjust" affordance (drag to reposition, pinch/scroll to zoom) sits below the preview, collapsed by default. Off-center subjects get a fix available, but nobody is forced through a crop screen to get a result.
4. **Fields (Format B only)** → Name, Stack/Role (free text, e.g. "Full-Stack / AI"), and a **generated Builder Title** — computed instantly client-side from keyword-matching the Stack/Role input against a curated title pool (no API call, no latency, no chance of an empty/awkward AI-generated result).
5. **Render** → canvas composites: photo (masked to slot shape) → frame/card artwork (brand PNG/SVG with a transparent cutout) → text layers, using a preloaded brand font (`FontFace` API, loaded before first draw so text never falls back to a system font).
6. **Result shown instantly** (target: <1.5s from last input to rendered preview) with two actions:
   - **Download** → `canvas.toBlob()` → real `.png` file via an `<a download>` object URL. This is an actual file, not a screenshot-only render.
   - **Share to X** → see §4.

No step requires waiting on a server. The only network call in the entire flow is the one made lazily if/when someone hits Share on a device where the direct-attach path isn't available.

---

## 3. Visual / Brand System

Treat this as its own workstream, not an afterthought bolted onto the code:

- **Source real brand assets first** (logo, event typeface, color palette, any existing HH Goa 2026 social/site graphics). If organizers haven't published a kit, reverse-engineer from whatever branded material exists (past Hacker House events, the event's own social posts) and keep it swappable — don't hard-code brand values inline in render logic; keep them in one `brand.ts` config file so a last-minute asset swap is a one-file change.
- **Card must read as an artifact of the event**, not a template: use the real event wordmark, a distinct color story (not default blue/white), and at least one graphic motif from the brand (a shape, pattern, or badge element) — not just "logo in a corner."
- **Builder Title pool**: write 15–20 on-brand, slightly cheeky titles (e.g. "Prompt Whisperer," "Ship-It Specialist," "Merge Conflict Survivor") mapped to keyword buckets (AI/ML, frontend, backend, hardware, design, generalist/fallback). This is a small, high-leverage detail that makes the card feel bespoke rather than generic.

---

## 4. Share-to-X Flow (the trickiest requirement — decided upfront)

X's `intent/tweet` URL does **not** support attaching media directly. Two paths, layered so it degrades gracefully:

**Primary — Web Share API (mobile, where most traffic will be):**
```js
if (navigator.canShare && navigator.canShare({ files: [file] })) {
  await navigator.share({ files: [file], text: caption });
}
```
This hands the actual PNG straight to the native share sheet; the user picks X and the image is genuinely attached. No OG image problem to solve here — this is the ideal path and covers the "most people are on their phone" requirement directly.

**Fallback — link with a real OG image (desktop / unsupported browsers):**
1. On Share click, upload the already-rendered PNG blob to a tiny `/api/share` route → stored in Vercel Blob with a unique ID and a short expiry (e.g. 30 days — plenty for a shortlisting demo).
2. Redirect to `https://<domain>/s/[id]`, a minimal page whose only job is correct `<meta property="og:image">` pointing at the stored PNG's public URL (served byte-for-byte, not regenerated), plus a visible "Download" link for humans who land there directly.
3. Open `https://twitter.com/intent/tweet?text=<caption>&url=https://<domain>/s/[id]` in a new tab.
4. **Every generated card gets its own unique share-page ID** — never reuse a URL, or X's crawler cache will keep serving a stale/first preview to everyone.

**Caption template (hard-code the hashtag, don't make it optional):**
> "Just built my HH Goa 2026 Builder ID 🚀 #FrameInGoa [link]"

---

## 5. Performance Budget

| Step | Target |
|---|---|
| HEIC decode | <800ms (typical iPhone photo) |
| Auto-crop + first canvas render | <300ms |
| Full composite (photo + frame + text) | <200ms |
| **Total: upload tap → visible result** | **under 2–3 seconds**, no spinner-as-loading-screen |

To hit this reliably: downscale any input image to a sane max dimension (e.g. 2000px longest side) immediately after decode, before any canvas work — this also protects older/lower-RAM phones from canvas memory issues.

---

## 6. Build Timeline (3.5 days from today)

**Day 1 — Mon Aug 10 (today)**
- Repo + Next.js scaffold, Vercel project connected.
- Lock brand assets (or best-effort reconstruction) into `brand.ts`.
- Build the card artwork (frame/badge with transparent photo cutout) as a layered PNG/SVG.
- Ship the upload → HEIC convert → downscale → auto-crop → canvas render pipeline for **one** format end-to-end (Format B).
- ✅ Checkpoint: a photo goes in, a correctly-composited (photo-only, no text yet) card comes out, downloadable.

**Day 2 — Tue Aug 11**
- Add Format B text fields + Builder Title generator + font loading + text rendering onto canvas.
- Implement Download (`toBlob` → real file).
- Implement Web Share API primary path.
- Implement `/api/share` + `/s/[id]` OG-image fallback path.
- Mobile-responsive layout pass (this is most people's only view of it).
- ✅ Checkpoint: full flow works start to finish on both iPhone Safari and Android Chrome.

**Day 3 — Wed Aug 12**
- Real-device testing: iPhone HEIC upload, off-center/portrait/landscape test photos, low-end Android.
- Performance pass against the budget in §5.
- Verify X actually unfurls the `/s/[id]` link with the real image (test via X's own card validator or a real tweet draft).
- Visual polish pass on the brand execution — this is a shortlisting criterion, not decoration.
- Stretch: Format A (PFP frame) reusing the same pipeline, if the above is solid.
- Write a short README (what it is, how it works, how to run locally).

**Day 3.5 — Thu Aug 13 (submission day)**
- Final bug bash only — no new features.
- Deploy final build, smoke-test the live link fresh (not from cache).
- Submit the form well before 11:59 PM — don't treat the deadline as the target time.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| HEIC conversion fails on some device/browser combo | `heic2any` with a try/catch fallback message: "couldn't read this photo — try a screenshot of it instead" rather than a silent dead end |
| X intent links can't attach media | Solved structurally in §4 — Web Share primary, OG-image link as fallback, not an afterthought |
| X caches a link preview after first share | Unique `/s/[id]` per generation, never reused |
| Canvas/`toBlob` memory limits on older iPhones | Downscale input before any canvas work (§5) |
| No real brand kit available from organizers | Reconstruct from any existing HH Goa material now (Day 1), keep it in one config file so swapping in official assets later is trivial |
| Off-center subjects look bad with pure auto-crop | Auto-crop is the zero-effort default; the optional drag/zoom adjuster (§2, step 3) is the escape hatch, not a required step |

---

## 8. Definition of Done (self-grade against the brief before submitting)

- [ ] No login wall, no signup gate, anywhere in the flow
- [ ] Upload → result feels instant (no visible loading screen for the render itself)
- [ ] Handles a genuinely off-center, non-square, HEIC iPhone photo correctly
- [ ] Result is unmistakably HH Goa 2026 branded, not a generic template
- [ ] Download produces a real, openable image file
- [ ] Share to X produces a pre-filled tweet with caption + **#FrameInGoa**
- [ ] If link-based, the link preview shows the actual generated graphic (verified on a real X client, not just assumed)
- [ ] Works cleanly on a phone screen, tested on a real device, not just resized desktop Chrome
- [ ] Live link is deployed and works from a fresh/incognito session
- [ ] Form submitted with the live link before the deadline

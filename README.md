# Amer Kadric — Portfolio

> **Live site:** [amerkadric.com](https://www.amerkadric.com)

A personal portfolio styled like a Minecraft title screen. A procedurally generated, slowly rotating blocky world sits behind a game-style menu; each section (Experience, Projects, About Me, Skills, Contact) opens as its own in-game screen.

Everything is drawn in code — textures, terrain, trees, animals and clouds — so no Minecraft game assets are used. Not an official Minecraft product; not approved by or associated with Mojang or Microsoft.

There's also a plain **[Quick View](https://www.amerkadric.com/quick-view/)** page: a fast, no-frills summary for recruiters and search engines.

---

## Features

- **Title screen** — block-letter logo, bouncing splash text, stone buttons with click sounds
- **Background world** — five biomes (Forest, Snowy Taiga, Desert, Mountains, Savanna), a random one per visit, with an occasional sunset
- **Minecraft-style rendering** — pixel-art textures, corner shading (ambient occlusion), see-through leaves, grid clouds, rippling water
- **Life in the world** — trees, flowers, mushrooms, pumpkins, sugar cane, lily pads, sheep, cows and pigs
- **Skills page** styled as an enchanting table, with hover tooltips
- **Advancements** — "Advancement Made!" pop-ups for exploring the site
- **Options** — sound, splash text, motion, blur, biome and time of day (remembered per visitor)

## Performance

- The world is generated in a **Web Worker**, so the page never freezes while it builds
- A **tiny custom WebGL renderer** (`src/lib/gl.js`) instead of a 3D library keeps all JavaScript to ~78 KB gzipped
- A **blurred snapshot** of the chosen scene shows instantly while the live world loads
- Only the visible circle of terrain is meshed, and only block faces that touch air
- Rendering is capped at 30 fps and drawn at reduced resolution while blurred
- Hashed assets are cached for a year (`vercel.json`)

## Tech stack

- **React 18** + **Vite**
- **WebGL2** (hand-written renderer) and **Web Workers**
- **Web Audio** for synthesized click sounds
- **Monocraft** font (SIL Open Font License — see `public/fonts/Monocraft-OFL.txt`)
- **Vercel** for hosting

## Editing content

All text lives in **[`src/data.js`](src/data.js)** — profile, experience, projects, about, skills and splash texts. Edit it and every screen (and the Quick View page) updates.

Other things you might change:

| What | Where |
|---|---|
| Resume PDF | `public/resume.pdf` |
| Profile photo | `public/profile.webp` (main) and `public/profile.png` (fallback) |
| Title logo | `public/logo.webp` |
| Biomes (terrain, trees, sky) | `src/lib/biomes.js` |
| Block and plant textures | `src/lib/textures.js` |
| Loading snapshots | `src/lib/placeholders.js` — retake these if a biome's look changes a lot |

## Project structure

```
src/
  App.jsx               screen routing, corner buttons, background
  data.js               all site content
  screens/              Title, Experience, Projects, About, Skills, Contact, Options
  components/
    Panorama.jsx        draws the 3D world and animates the camera
    Backdrop.jsx        instant blurred snapshot while the world loads
    Screen.jsx          shared layout for the sub-screens
    Toast.jsx           advancement pop-ups
  lib/
    worldgen.js         terrain, trees, plants, animals, clouds (pure maths)
    worldgen.worker.js  runs worldgen off the main thread
    sceneLoader.js      picks the biome and starts building it immediately
    gl.js               small WebGL2 renderer
    biomes.js           biome definitions
    textures.js         procedural 16×16 pixel textures
    settings.js, router.js, sound.js, advancements.js, placeholders.js
quick-view.js           build step that generates /quick-view/ from data.js
```

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173. To test the production build:

```bash
npm run build
npm run preview
```

## Deploying

Pushing to `master` deploys to Vercel automatically.

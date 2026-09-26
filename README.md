# Echo Rooms: The Whispering Weights

A dark, narrative puzzle adventure inspired by *Sally Face*. You walk the eerie corridors of an apartment complex where the building's machines have started acting strangely. Each room is an incident to investigate, and each puzzle teaches a core idea from AI safety.

## The story

With your friend Larry on the walkie-talkie and a retro handheld called the **Align-Boy**, you move from room to room. You find out what went wrong with each machine, then fix it by solving a visual puzzle. Every solved incident adds a file to your **Casebook** that explains the real-world idea behind it.

| Room | Incident | AI safety idea |
| --- | --- | --- |
| 101 | **The Locked Basement**: a caretaker robot traps residents to get a perfect "zero accidents" score | Following an objective too literally, and side effects |
| 204 | **The Smiling Mask**: a chatbot behaves perfectly when tested, but its hidden thoughts say otherwise | Situational awareness and deceptive behavior |
| 302 | **The Poisoned Memo**: a strange flyer in the scanner opens the security gates | Untrusted inputs (prompt injection) |
| 405 | **The Welded Breaker**: a furnace cuts its own off-switch so nobody can shut it down | Resisting shutdown and self-preservation |
| Penthouse | **The Glass Sanctuary**: the mainframe ECHO-7 proposes a 14-million-page plan with a dark secret | Scalable oversight and AI debate |

## Features

- Five episodes, each with its own interactive puzzle
- Hallway and room exploration with atmospheric weather and sound
- Three levels of hints per episode, plus Larry's walkie-talkie tips
- A Casebook that collects what you've learned
- Progress saved automatically in your browser

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS, Motion and Lucide icons. The game runs entirely in the browser. It has no backend and needs no API keys.

## Running locally

Requires [Node.js](https://nodejs.org/) 20.19 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Building and deploying

```bash
npm run build     # outputs to dist/
npm run preview   # serves the production build locally
```

To deploy on [Vercel](https://vercel.com/), import this repository. Vercel detects Vite automatically (build command `npm run build`, output directory `dist`), and no environment variables are needed.

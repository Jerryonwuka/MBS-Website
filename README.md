# Motion Box Studios — website

A static site for Motion Box Studios: plain HTML, CSS and JavaScript, no build step.
Animation runs on [GSAP](https://gsap.com) (ScrollTrigger, SplitText) and
[Lenis](https://lenis.darkroom.engineering) smooth scroll, both loaded from jsDelivr.

## Run it locally

Serve the folder with any static server (opening the file directly can block the videos):

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Structure

```
index.html              Homepage
project.html            Case study template — project.html?p=<slug>
assets/css/style.css    All styles; brand tokens (colours, type sizes) at the top
assets/js/projects.js   Project data: titles, copy, videos, homepage order
assets/js/main.js       Interactions, homepage builders, case study renderer
assets/img/logo/        Logo marks, favicon, app icon
assets/img/work/        Project thumbnails
assets/video/           Web-compressed films and short hover previews
MBS 01–03.png           Original logo files
```

## Editing projects

Everything about the work lives in `assets/js/projects.js` — one entry per case study.

- **Order** in the file = order in the project index and case study numbering.
- `featured: 1`–`6` puts a project in that slot of the homepage "Selected work" grid.
- `play: true` adds it to the "Made for the feed" strip.
- Videos are either `{ vimeo: '<id>' }` or `{ file: 'assets/video/<name>.mp4' }`.
  Set `ratio` to the video's real width / height.
- `summary` is the overview paragraph on the case study page.

New Vimeo thumbnails go in `assets/img/work/vimeo-<id>.jpg`.

## Brand

- Orange `#E65C00`, ink `#0B0B0B`, paper `#F4F2EE` — set as CSS variables in `style.css`.
- Typeface: Inter Tight (Google Fonts).

## Deploying

Any static host works (GitHub Pages, Netlify, Vercel, cPanel). Upload the whole folder;
`index.html` is the entry point.

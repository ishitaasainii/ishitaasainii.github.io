# Ishita Saini — portfolio website

This is a simple website for an interior and architecture designer. You do **not** need to know how to code. Day to day, you only edit the files in `data/` — `projects.json` for the work, `about.json` for the About page, and `experience.json` for the Experience page — and add or replace photos in folders.

The pages themselves (`index.html`, `project.html`, `about.html`, `experience.html`) only need changing if you want to rename the studio in the header and footer, or change the one-line statement on the homepage.

---

## How the site is organised

- **Work** (the homepage) lists every project.
- Clicking a project opens a page with photos and a short description.
- **Experience** is a separate page with studio roles, education, and certifications. That page is filled from `data/experience.json`.
- **About** is a separate page with a portrait and a bio. That page is filled from `data/about.json`.

Projects are listed in the **same order** as they appear in `data/projects.json`. Put the project you want first at the **top** of that list.

---

## How to add a project

A project is a name in `data/projects.json`, plus folders of pictures. On the project page, each block is a **title**, a short **text**, and the **folder** of images that belongs with that title. You do not type every file name.

### 1. Make a folder for the project

Inside `images/projects/`, create a folder. You can use spaces. Example: `images/projects/Samarth city/`.

Inside that folder, make one folder per group of pictures, and drop the images in. Names can be anything (`Living room.png` is fine).

```
images/projects/Samarth city/
  cover.jpg          ← the picture on the homepage
  renders/           ← pictures for one title
  board/             ← pictures for the next title
  working drawing/
```

`cover.jpg` sits in the project folder itself. It is the small picture on the Work page. JPG, JPEG, PNG, and WEBP all work. Videos (MP4) in a folder play on the page. PDF drawings in a folder become links.

### 2. Add the project to the list

Open `data/projects.json`. Copy one project block and paste it where you want it to appear. Projects are shown in this order.

```json
{
  "id": "samarth-city",
  "title": "Samarth City",
  "category": "Residential Project",
  "year": 2023,
  "location": "Gandhinagar, Gujarat",
  "tagline": "A short line under the title",
  "description": ["The opening paragraphs for the whole project."],
  "folder": "Samarth city",
  "cover": "cover.jpg",
  "sections": [
    {
      "title": "Renders",
      "text": "A sentence about this group of images.",
      "dir": "renders"
    },
    {
      "title": "Mood board",
      "text": "A sentence about this group.",
      "dir": "board"
    }
  ]
}
```

What to change:

- **`id`** — short name used in the link. Lowercase, with hyphens, no spaces (`samarth-city`).
- **`folder`** — the project directory inside `images/projects/`. This one may contain spaces (`Samarth city`). It does not have to match `id`.
- **`cover`** — file name of the homepage picture, inside that folder. If it lives in a subfolder, write the subfolder too: `renders/Living room.png`.
- **`description`** — paragraphs at the top of the project page. Each quoted line is its own paragraph.
- **`sections`** — one block per title on the page, in the order you want them read.
  - **`title`** — the heading for that group.
  - **`text`** — the sentence or paragraph under the heading. A list of strings is also fine if you want more than one paragraph.
  - **`dir`** — which folder to show. Write the folder name inside the project folder (`renders`). Use `""` when the pictures sit directly in the project folder, next to `cover.jpg`. If the pictures live somewhere else under `images/projects/`, write that path instead (`Project/rao residency/Renders`).

Put a comma between projects, but not after the last one.

### 3. Refresh the file list

The site does not scan folders by itself. After you add, remove, or rename pictures, run this in the website folder:

```
python3 scripts/index-media.py
```

That rewrites `data/media.json`. Then refresh the browser. Titles and descriptions you added on a picture are kept.

A picture with no note stays a file name. To show a title and description when someone hovers that picture, replace the name with an object. Leave the other pictures as names.

```json
"images": [
  "plain-photo.png",
  {
    "file": "Sun and Wind Path-04-03.png",
    "title": "Sun and wind",
    "description": "How sun and wind move across the site."
  }
]
```

`title` and `description` are both optional. Use either one, or both. The picture blurs on hover and the words appear. Pictures without those fields stay as they are.

If the site is on GitHub, upload the new pictures **and** the updated `data/media.json`.

Older projects that still have an `"images"` list keep working. New work should use `sections` and `dir`.

---

## How to remove a project

1. Open `data/projects.json`.
2. Delete that project’s whole `{ ... }` block, including the comma before or after it if needed, so the remaining list still has commas only *between* projects.
3. Save the file.
4. You may also delete the matching folder under `images/projects/` to free up space. The site will work either way.

If someone still has an old link to that project, they will see a short “Project not found” message instead of a broken page.

---

## How to replace photos

For a project that uses `sections`: drop the new pictures into the folder named in `dir` (for example `images/projects/saamarth-city/renders/`). File names can change. Then run `python3 scripts/index-media.py` and refresh.

For an older project that still lists `"images"`: keep the same file names when you replace a picture, or change the name in `data/projects.json` to match.

For the About page portrait, replace `images/about/portrait.jpg` with your photo. Keep the same file name unless you also change `"portrait"` in `data/about.json`.

JPG, JPEG, PNG, and WEBP are all fine. Square, landscape, or portrait photos all fit the layout.

---

## How to edit the About page

Open `data/about.json`. A typical file looks like this:

```json
{
  "name": "Ishita Saini",
  "role": "Interior designer",
  "lead": "Rooms drawn so they can be built — and lived in.",
  "portrait": "portrait.jpg",
  "description": [
    "First paragraph.",
    "Second paragraph."
  ],
  "tools": ["AutoCAD", "SketchUp", "V-Ray", "Enscape"],
  "links": [
    { "label": "LinkedIn", "url": "https://www.linkedin.com/in/ishita-s-9a9b94247/" },
    { "label": "Selected work", "url": "index.html" }
  ]
}
```

What each field does:

- **`name`**, **`role`**, **`lead`** — the heading block at the top of the page.
- **`portrait`** — file name only. The photo lives in `images/about/`.
- **`description`** — each quoted line becomes its own paragraph.
- **`tools`** — software list under the bio.
- **`resume`** — path to the PDF, for example `images/Ishita.pdf`. This becomes the Download resume button. Replace that file to update the CV.
- **`links`** — text links under the bio. Use a full `https://…` address for other sites, or `index.html` for a page on this site.

Save the file and refresh the About page.

## How to edit the Experience page

Open `data/experience.json`. A typical file looks like this:

```json
{
  "lead": "A short paragraph at the top of the page.",
  "resume": "images/Ishita.pdf",
  "resumeLabel": "Download resume",
  "roles": [
    {
      "title": "Interior Designer",
      "org": "Studio name",
      "location": "Noida, Uttar Pradesh",
      "dates": "2025 — Present",
      "highlights": [
        "First bullet.",
        "Second bullet."
      ]
    }
  ],
  "education": [
    {
      "title": "Bachelor of Interior Design",
      "org": "Unitedworld Institute of Design",
      "location": "Gandhinagar, Gujarat",
      "dates": "2020 — 2024"
    }
  ],
  "academic": [
    {
      "title": "Project name",
      "dates": "2022",
      "summary": "One line about the project."
    }
  ],
  "certifications": [
    "Certificate name, 2023"
  ]
}
```

What each field does:

- **`lead`** — the short paragraph under the heading.
- **`roles`** — jobs and internships, newest first. Each bullet in `highlights` becomes its own line.
- **`education`**, **`academic`**, **`certifications`** — listed under the studios.
- **`resume`** — path to the PDF, same idea as on the About page.

Save the file and refresh the Experience page.

## Changing the name in the header, or the homepage sentence

These are still in the HTML files, not JSON:

- Your name in the top-left of every page — edit `index.html`, `project.html`, `about.html`, and `experience.html`.
- The short sentence under the name on the homepage — edit `index.html`.

Search for the word `Ishita` if you are renaming the studio.

---

## Looking at the site on your computer before putting it online

Do not open the HTML files by double-clicking them in a folder. The project list will not load that way.

If Python is installed (it is, on most Macs):

1. Open Terminal (Mac) or Command Prompt (Windows).
2. Go into this website’s folder. On a Mac you can type `cd ` (with a space) and then drag the folder onto the window.
3. Type this and press Return:

```
python3 -m http.server
```

4. In a browser, visit: `http://localhost:8000`

Stop the preview by pressing `Ctrl+C` in that window.

---

## Putting the site on GitHub Pages (free hosting)

You will need a free GitHub account: [https://github.com](https://github.com)

### First time

1. On GitHub, click **New repository**. Give it a name (for example `ishita`). Leave it public. Do not add a README if you already have one in this folder.
2. On your computer, put all of this website’s files in that project. The easy way for a first upload:
   - Open the new empty repository on GitHub.
   - Click **uploading an existing file**.
   - Drag in **everything** in this folder: the HTML files, `css`, `js`, `data`, `images`, and `README.md`. Keep the same folder structure. Do not put them inside an extra extra folder.
   - Click **Commit changes**.
3. In the repository, open **Settings**, then **Pages** (under “Code and automation”).
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set the branch to **main** (or **master**, if that is what you see) and the folder to **/ (root)**. Click **Save**.
6. Wait a minute. GitHub will show a web address, usually:

   `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`

   Open that address. That is the live site.

### Later updates

After the site is online, you can change files on GitHub itself:

1. Open the repository.
2. Click `data/projects.json`, `data/about.json`, or a photo folder.
3. Click the pencil icon to edit, or **Add file** to upload photos.
4. Click **Commit changes**.

The live site usually updates within a minute or two.

If you prefer to work on your computer, change the files locally, then upload the changed files again the same way, or use GitHub Desktop if someone has set that up for you.

---

## If something looks wrong

- **The homepage says projects could not be loaded, or About / Experience could not be loaded.** Check that `data/projects.json`, `data/about.json`, and `data/experience.json` are in the `data` folder, not on the desktop. On GitHub, make sure you did not nest the whole site inside another folder.
- **A project page says “Project not found”.** The `id` in the JSON file must match the `?id=` part of the link.
- **A picture is missing.** Check that `dir` is the folder name you meant, then run `python3 scripts/index-media.py` so `data/media.json` includes the new files. For an older project that still lists `"images"`, the file name in JSON must match the file, including capital letters.
- **The whole list disappeared after an edit.** There is probably a missing comma, an extra comma after the last project, or a missing `{` or `"`. Compare with another project block and undo until the list looks like the others. You can paste the file into [https://jsonlint.com](https://jsonlint.com) to find the typing mistake.

You should never need to edit `js/app.js` or `css/style.css` to add or remove work, or to rewrite the About or Experience pages.
# ishitaasainii
# ishitaasainii.github.io

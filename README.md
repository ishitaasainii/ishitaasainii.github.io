# Ishita Saini — portfolio website

This is a simple website for an interior and architecture designer. You do **not** need to know how to code. Day to day, you only edit two files — `data/projects.json` for the work, and `data/about.json` for the About page — and add or replace photos in folders.

The pages themselves (`index.html`, `project.html`, `about.html`) only need changing if you want to rename the studio in the header and footer, or change the one-line statement on the homepage.

---

## How the site is organised

- **Work** (the homepage) lists every project.
- Clicking a project opens a page with photos and a short description.
- **About** is a separate page with a portrait and a bio. That page is filled from `data/about.json`.

Projects are listed in the **same order** as they appear in `data/projects.json`. Put the project you want first at the **top** of that list.

---

## How to add a project

### 1. Make a folder for the photos

Inside `images/projects/`, create a new folder. The folder name is the project’s **id** — use lowercase letters, numbers, and hyphens only, with no spaces.

Example: for a project called “Lake House”, a good folder name is `lake-house`.

### 2. Put the photos in that folder

Use ordinary JPG files. Name them exactly as you will write them in the project file, for example:

- `cover.jpg` — the small picture on the homepage list
- `001.jpg` (any format: `.jpg`, `.jpeg`, `.png`, …) — optional. Shown first on the project page, full width across both columns
- `01.jpg`, `02.jpg`, `03.jpg` — the remaining pictures, in two columns (as many as you like)

You can replace the grey placeholder pictures that are already in the sample project folders. Keep the same file names and the site will pick up the new photos automatically.

### 3. Add the project to the list

Open `data/projects.json` in a text editor (Notepad on Windows, TextEdit on a Mac, or the editor on GitHub).

Copy one of the existing project blocks and paste it where you want the project to appear. Change the words to match the new work. A block looks like this:

```json
{
  "id": "lake-house",
  "title": "Lake House",
  "category": "Residential Design",
  "year": 2026,
  "location": "Ahmedabad, Gujarat",
  "tagline": "A short line that appears under the title",
  "description": ["First paragraph.", "Second paragraph."],
  "cover": "cover.jpg",
  "images": ["01.jpg", "02.jpg"]
}
```

Rules that matter:

- **`id` must match the folder name** exactly (`lake-house` with the folder `images/projects/lake-house/`).
- **`cover` and `images`** are only file names, not full paths. The site looks for them inside that project’s folder.
- Put a **comma** between projects, but **not** after the last project in the list.
- Keep the square brackets `[ ... ]` around the whole list, and the curly braces `{ ... }` around each project.

Save the file. Refresh the website. The new project should appear in the list.

---

## How to remove a project

1. Open `data/projects.json`.
2. Delete that project’s whole `{ ... }` block, including the comma before or after it if needed, so the remaining list still has commas only *between* projects.
3. Save the file.
4. You may also delete the matching folder under `images/projects/` to free up space. The site will work either way.

If someone still has an old link to that project, they will see a short “Project not found” message instead of a broken page.

---

## How to replace the placeholder photos

Each sample project already has simple stand-in pictures (`cover.jpg`, `01.jpg`, and so on). To use real photographs:

1. Open the project’s folder, for example `images/projects/saamarth-city/`.
2. Drop in your photos using **the same file names**.
3. You do not need to edit the JSON file if the names stay the same.

For the About page portrait, replace `images/about/portrait.jpg` with your photo. Keep the same file name unless you also change `"portrait"` in `data/about.json`.

JPG is the format to use. Square, landscape, or portrait photos are all fine; the layout will fit them.

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
- **`links`** — buttons under the bio. Use a full `https://…` address for other sites, or `index.html` for a page on this site.

Save the file and refresh the About page.

## Changing the name in the header, or the homepage sentence

These are still in the HTML files, not JSON:

- Your name in the top-left of every page — edit `index.html`, `project.html`, and `about.html`.
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

- **The homepage says projects could not be loaded, or About could not be loaded.** Check that `data/projects.json` and `data/about.json` are in the `data` folder, not on the desktop. On GitHub, make sure you did not nest the whole site inside another folder.
- **A project page says “Project not found”.** The `id` in the JSON file must match the `?id=` part of the link, and must match the photo folder name.
- **A picture is missing.** The file name in JSON (`cover.jpg`, `01.jpg`, …) must match the file in that project’s folder, including capital letters.
- **The whole list disappeared after an edit.** There is probably a missing comma, an extra comma after the last project, or a missing `{` or `"`. Compare with another project block and undo until the list looks like the others. You can paste the file into [https://jsonlint.com](https://jsonlint.com) to find the typing mistake.

You should never need to edit `js/app.js` or `css/style.css` to add or remove work, or to rewrite the About page.
# ishitaasainii
# ishitaasainii.github.io

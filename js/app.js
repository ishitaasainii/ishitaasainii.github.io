(function () {
  "use strict";

  var DATA_URL = "data/projects.json";
  var ABOUT_URL = "data/about.json";
  var QUOTES_URL = "data/quotes.json";
  var QUOTE_ROTATE_MS = 8000;
  var WIKIQUOTE_PAGES = ["Architecture", "Design"];

  function qs(selector) {
    return document.querySelector(selector);
  }

  function imgPath(id, file) {
    return "images/projects/" + encodeURIComponent(id) + "/" + encodeURIComponent(file);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function coverAlt(project) {
    return project.title + " — " + project.category + ", cover view";
  }

  function viewAlt(project, n) {
    return project.title + " — " + project.category + ", view " + n;
  }

  function whichPage() {
    if (qs("#project-index")) return "index";
    if (qs("#project-root")) return "project";
    if (qs("#about-root")) return "about";
    return "other";
  }

  function loadAbout() {
    return fetch(ABOUT_URL).then(function (response) {
      if (!response.ok) {
        throw new Error("load");
      }
      return response.json();
    }).then(function (data) {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("shape");
      }
      return data;
    });
  }

  function queryId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function loadProjects() {
    return fetch(DATA_URL).then(function (response) {
      if (!response.ok) {
        throw new Error("load");
      }
      return response.json();
    }).then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error("shape");
      }
      return data;
    });
  }

  function emptyMarkup(title, message, withHomeLink) {
    var home = withHomeLink
      ? '<p><a href="index.html">Back to the project index</a></p>'
      : "";
    return (
      '<div class="empty-page">' +
        "<h1>" +
        escapeHtml(title) +
        "</h1>" +
        "<p>" +
        message +
        "</p>" +
        home +
      "</div>"
    );
  }

  function renderIndex(projects) {
    var root = qs("#project-index");
    if (!root) return;

    if (!projects.length) {
      root.innerHTML = emptyMarkup(
        "No projects yet",
        "Nothing is listed in the project file. Open <code>data/projects.json</code> and add the first project."
      );
      return;
    }

    var cards = projects
      .map(function (project) {
        return (
          '<a class="work-card" href="project.html?id=' +
          encodeURIComponent(project.id) +
          '">' +
            '<span class="work-card__media">' +
              '<img class="work-card__thumb" src="' +
              imgPath(project.id, project.cover) +
              '" alt="' +
              escapeHtml(coverAlt(project)) +
              '" width="1200" height="900">' +
            "</span>" +
            '<span class="work-card__text">' +
              '<span class="work-card__title">' +
              escapeHtml(project.title) +
              "</span>" +
              '<span class="work-card__meta">' +
              escapeHtml(project.category) +
              "  ·  " +
              escapeHtml(project.year) +
              "  ·  " +
              escapeHtml(project.location) +
              "</span>" +
            "</span>" +
          "</a>"
        );
      })
      .join("");

    root.innerHTML = '<div class="work-grid">' + cards + "</div>";
  }

  function fillProjectGallery(gallery, files, projectId) {
    var col0 = document.createElement("div");
    var col1 = document.createElement("div");
    col0.className = "gallery__col";
    col1.className = "gallery__col";
    gallery.appendChild(col0);
    if (files.length > 1) {
      gallery.appendChild(col1);
    }

    var cols = files.length > 1 ? [col0, col1] : [col0];
    var imgs = [];
    var remaining = files.length;
    var balanced = false;

    function aspect(img) {
      return img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
    }

    function balance() {
      if (balanced || cols.length < 2) return;
      balanced = true;

      var tall = [];
      var wide = [];
      imgs.forEach(function (img) {
        if (aspect(img) > 1.12) {
          tall.push(img);
        } else {
          wide.push(img);
        }
      });

      if (tall.length % 2 === 1) {
        var span = tall.shift();
        span.className = "gallery__span";
        gallery.insertBefore(span, col0);
      }

      tall.concat(wide).forEach(function (img, i) {
        cols[i % 2].appendChild(img);
      });
    }

    function oneDone() {
      remaining -= 1;
      if (remaining <= 0) {
        balance();
      }
    }

    files.forEach(function (item, i) {
      var img = document.createElement("img");
      img.src = imgPath(projectId, item.file);
      img.alt = item.alt;
      imgs.push(img);
      cols[i % cols.length].appendChild(img);
      if (img.complete) {
        oneDone();
      } else {
        img.addEventListener("load", oneDone);
        img.addEventListener("error", oneDone);
      }
    });

    window.setTimeout(function () {
      remaining = 0;
      balance();
    }, 4000);
  }

  function renderProject(projects) {
    var root = qs("#project-root");
    if (!root) return;

    var id = queryId();
    var index = -1;
    var i;
    for (i = 0; i < projects.length; i += 1) {
      if (projects[i].id === id) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      root.innerHTML = emptyMarkup(
        "Project not found",
        "This page does not match any project in the list. The project may have been removed, or the link may be incorrect.",
        true
      );
      document.title = "Project not found — Ishita Saini";
      return;
    }

    var project = projects[index];
    var prevIndex = (index - 1 + projects.length) % projects.length;
    var nextIndex = (index + 1) % projects.length;
    var prev = projects[prevIndex];
    var next = projects[nextIndex];

    document.title = project.title + " — Ishita Saini";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        (project.tagline || project.title) +
          " — " +
          project.category +
          ", " +
          project.location +
          "."
      );
    }

    var paragraphs = (project.description || [])
      .map(function (text) {
        return "<p>" + escapeHtml(text) + "</p>";
      })
      .join("");

    var files = [];
    if (project.cover) {
      files.push({
        file: project.cover,
        alt: coverAlt(project),
      });
    }
    (project.images || []).forEach(function (file, n) {
      if (file === project.cover) return;
      files.push({
        file: file,
        alt: viewAlt(project, n + 1),
      });
    });

    root.innerHTML =
      '<article class="project">' +
        '<div class="project-visuals">' +
          (files.length ? '<div class="gallery"></div>' : "") +
        "</div>" +
        '<div class="project-info">' +
          '<p class="eyebrow">' +
          escapeHtml(project.category) +
          "</p>" +
          "<h1>" +
          escapeHtml(project.title) +
          "</h1>" +
          (project.tagline
            ? '<p class="tagline">' + escapeHtml(project.tagline) + "</p>"
            : "") +
          '<p class="project-head__meta">' +
          escapeHtml(project.year) +
          "  ·  " +
          escapeHtml(project.location) +
          "</p>" +
          '<div class="project-copy">' +
          paragraphs +
          "</div>" +
        "</div>" +
      "</article>" +
      '<nav class="project-nav" aria-label="Other projects">' +
        '<a href="project.html?id=' +
        encodeURIComponent(prev.id) +
        '">' +
          '<span class="project-nav__dir">Previous</span>' +
          '<span class="project-nav__title">' +
          escapeHtml(prev.title) +
          "</span>" +
        "</a>" +
        '<a href="project.html?id=' +
        encodeURIComponent(next.id) +
        '">' +
          '<span class="project-nav__dir">Next</span>' +
          '<span class="project-nav__title">' +
          escapeHtml(next.title) +
          "</span>" +
        "</a>" +
      "</nav>";

    if (files.length) {
      fillProjectGallery(root.querySelector(".gallery"), files, project.id);
    }
  }

  function showLoadError(kind) {
    var root =
      kind === "project"
        ? qs("#project-root")
        : kind === "about"
          ? qs("#about-root")
          : qs("#project-index");
    if (!root) return;
    var file =
      kind === "about" ? "data/about.json" : "data/projects.json";
    root.innerHTML = emptyMarkup(
      kind === "about" ? "About could not be loaded" : "Projects could not be loaded",
      "The content file could not be read. If you opened these pages as files on your computer, start a local folder server instead — the README explains how. If the site is already online, check that <code>" +
        file +
        "</code> is present and saved correctly.",
      kind === "project" || kind === "about"
    );
    if (kind === "project") {
      document.title = "Projects could not be loaded — Ishita Saini";
    }
    if (kind === "about") {
      document.title = "About could not be loaded — Ishita Saini";
    }
  }

  function renderAbout(about) {
    var root = qs("#about-root");
    if (!root) return;

    var name = about.name || "About";
    document.title = "About — " + name;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        (about.lead || name) + (about.role ? " — " + about.role + "." : ".")
      );
    }

    var portraitFile = about.portrait || "portrait.jpg";
    var portraitSrc = "images/about/" + encodeURIComponent(portraitFile);

    var paragraphs = (about.description || [])
      .map(function (text) {
        return "<p>" + escapeHtml(text) + "</p>";
      })
      .join("");

    var tools =
      about.tools && about.tools.length
        ? '<p class="about__tools">' +
          about.tools
            .map(function (tool) {
              return escapeHtml(tool);
            })
            .join(" / ") +
          "</p>"
        : "";

    var links = (about.links || [])
      .map(function (link) {
        var external = /^https?:/i.test(link.url || "");
        return (
          '<a href="' +
          escapeHtml(link.url || "#") +
          '"' +
          (external ? ' rel="noopener noreferrer"' : "") +
          ">" +
          escapeHtml(link.label || link.url) +
          "</a>"
        );
      })
      .join("");

    root.innerHTML =
      '<article class="about">' +
        '<div class="about-hero">' +
          '<figure class="about__portrait">' +
            '<img src="' +
            portraitSrc +
            '" alt="' +
            escapeHtml(name + (about.role ? ", " + about.role : "")) +
            '" width="800" height="1000">' +
          "</figure>" +
          '<div class="about__copy">' +
            (about.role
              ? '<p class="about__role">' + escapeHtml(about.role) + "</p>"
              : "") +
            "<h1>" +
            escapeHtml(name) +
            "</h1>" +
            (about.lead
              ? '<p class="about__lead">' + escapeHtml(about.lead) + "</p>"
              : "") +
            paragraphs +
            tools +
            (links ? '<p class="about__cta">' + links + "</p>" : "") +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function quoteKey(quote) {
    return String(quote.text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function isUsableQuote(quote) {
    var text = quote && quote.text ? String(quote.text).trim() : "";
    if (text.length < 28 || text.length > 140) return false;
    if (text.split(/\s+/).length > 28) return false;
    if (/https?:|File:|Category:|thumb\|/i.test(text)) return false;
    return true;
  }

  function mergeQuotes(lists) {
    var seen = {};
    var out = [];
    var i;
    var j;
    var quote;
    var key;

    for (i = 0; i < lists.length; i += 1) {
      if (!lists[i]) continue;
      for (j = 0; j < lists[i].length; j += 1) {
        quote = lists[i][j];
        if (!isUsableQuote(quote)) continue;
        key = quoteKey(quote);
        if (seen[key]) continue;
        seen[key] = true;
        out.push({
          text: String(quote.text).trim(),
          author: String(quote.author || "Unknown").trim()
        });
      }
    }
    return out;
  }

  function stripWiki(value) {
    return String(value || "")
      .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
      .replace(/\{\{[^}]+\}\}/g, "")
      .replace(/'{2,}/g, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseWikiQuotes(wikitext) {
    var quotes = [];
    var lines = String(wikitext || "").split("\n");
    var current = null;
    var i;
    var line;
    var author;

    for (i = 0; i < lines.length; i += 1) {
      line = lines[i];
      if (/^\* (?!\*)/.test(line)) {
        current = { text: stripWiki(line.replace(/^\*\s*/, "")), author: "" };
      } else if (/^\*\*/.test(line) && current) {
        author = stripWiki(line.replace(/^\*\*\s*/, "").split(",")[0]);
        author = author.replace(/\s*\([^)]*\)\s*$/, "").trim();
        current.author = author || "Unknown";
        if (isUsableQuote(current)) {
          quotes.push(current);
        }
        current = null;
      }
    }
    return quotes;
  }

  function loadLocalQuotes() {
    return fetch(QUOTES_URL).then(function (response) {
      if (!response.ok) {
        throw new Error("load");
      }
      return response.json();
    }).then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error("shape");
      }
      return data;
    });
  }

  function loadWikiQuotes() {
    var requests = WIKIQUOTE_PAGES.map(function (pageName) {
      var url =
        "https://en.wikiquote.org/w/api.php?action=parse&page=" +
        encodeURIComponent(pageName) +
        "&prop=wikitext&format=json&origin=*";
      return fetch(url)
        .then(function (response) {
          if (!response.ok) {
            throw new Error("wiki");
          }
          return response.json();
        })
        .then(function (payload) {
          var text =
            payload &&
            payload.parse &&
            payload.parse.wikitext &&
            payload.parse.wikitext["*"];
          return parseWikiQuotes(text);
        })
        .catch(function () {
          return [];
        });
    });

    return Promise.all(requests).then(function (pages) {
      return mergeQuotes(pages);
    });
  }

  function showQuote(quote) {
    var textEl = qs("#quote-text");
    var authorEl = qs("#quote-author");
    if (!textEl || !quote) return;
    textEl.textContent = "“" + quote.text.replace(/^["“]|["”]$/g, "") + "”";
    textEl.title = quote.text;
    if (authorEl) {
      authorEl.textContent = quote.author ? "— " + quote.author : "";
    }
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function rotateQuotes(quotes) {
    var card = qs("#quote-card");
    var index = 0;
    var timer;

    if (!quotes.length) {
      showQuote({
        text: "Rooms are planned so they can be built — and lived in.",
        author: "Ishita Saini"
      });
      return;
    }

    showQuote(quotes[0]);
    if (quotes.length < 2) return;

    function next() {
      index = (index + 1) % quotes.length;
      if (!card || prefersReducedMotion()) {
        showQuote(quotes[index]);
        return;
      }
      card.classList.add("is-away");
      window.setTimeout(function () {
        showQuote(quotes[index]);
        card.classList.remove("is-away");
      }, 400);
    }

    function start() {
      if (timer) return;
      timer = window.setInterval(next, QUOTE_ROTATE_MS);
    }

    function stop() {
      if (!timer) return;
      window.clearInterval(timer);
      timer = null;
    }

    start();
    if (card) {
      card.addEventListener("mouseenter", stop);
      card.addEventListener("mouseleave", start);
      card.addEventListener("focusin", stop);
      card.addEventListener("focusout", start);
    }
  }

  function appendQuotes(pool, incoming) {
    var extra = mergeQuotes([pool, incoming]);
    var have = pool.length;
    var i;
    for (i = have; i < extra.length; i += 1) {
      pool.push(extra[i]);
    }
  }

  function startHeroType() {
    var el = qs("#hero-role");
    var roles = [
      "Interior designer",
      "3D visualisation",
      "Working drawings",
      "Residential interiors"
    ];
    var index = 0;
    var chars = 0;
    var deleting = false;

    if (!el) return;
    if (prefersReducedMotion()) return;

    function tick() {
      var word = roles[index];
      if (!deleting) {
        chars += 1;
        el.textContent = word.slice(0, chars);
        if (chars === word.length) {
          deleting = true;
          window.setTimeout(tick, 1600);
          return;
        }
        window.setTimeout(tick, 70);
        return;
      }
      chars -= 1;
      el.textContent = word.slice(0, chars);
      if (chars === 0) {
        deleting = false;
        index = (index + 1) % roles.length;
        window.setTimeout(tick, 280);
        return;
      }
      window.setTimeout(tick, 40);
    }

    window.setTimeout(tick, 900);
  }

  function startQuotes() {
    var pool = [];
    var started = false;

    function ensureRotation() {
      if (started || !pool.length) return;
      started = true;
      rotateQuotes(pool);
    }

    loadLocalQuotes()
      .catch(function () {
        return [];
      })
      .then(function (local) {
        appendQuotes(pool, local);
        if (pool.length) {
          ensureRotation();
        } else {
          showQuote({
            text: "Rooms are planned so they can be built — and lived in.",
            author: "Ishita Saini"
          });
        }
        return loadWikiQuotes();
      })
      .then(function (remote) {
        appendQuotes(pool, remote);
        ensureRotation();
      });
  }

  var page = whichPage();
  if (page === "index" || page === "project") {
    if (page === "index") {
      startHeroType();
      startQuotes();
    }
    loadProjects()
      .then(function (projects) {
        if (page === "index") {
          renderIndex(projects);
        } else {
          renderProject(projects);
        }
      })
      .catch(function () {
        showLoadError(page === "project" ? "project" : "index");
      });
  }

  if (page === "about") {
    loadAbout()
      .then(function (about) {
        renderAbout(about);
      })
      .catch(function () {
        showLoadError("about");
      });
  }
})();

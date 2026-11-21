(function () {
  "use strict";

  var DATA_URL = "data/projects.json";
  var ABOUT_URL = "data/about.json";
  var EXPERIENCE_URL = "data/experience.json";
  var QUOTES_URL = "data/quotes.json";
  var SERVICES_URL = "data/services.json";
  var SERVICE_PACE_MS = 7000;
  var QUOTE_ROTATE_MS = 8000;
  var WIKIQUOTE_PAGES = ["Architecture", "Design"];

  function qs(selector) {
    return document.querySelector(selector);
  }

  function imgPath(id, file) {
    return joinMedia(id, file);
  }

  function joinMedia(folder, file) {
    var parts = ["images", "projects"];

    function push(value) {
      String(value || "")
        .split(/[/\\]/)
        .forEach(function (part) {
          if (part && part !== ".") parts.push(part);
        });
    }

    push(folder);
    push(file);
    return parts
      .map(function (part) {
        return encodeURIComponent(part);
      })
      .join("/");
  }

  function mediaKey(folder, dir) {
    var parts = [];

    function push(value) {
      String(value || "")
        .split(/[/\\]/)
        .forEach(function (part) {
          if (part && part !== ".") parts.push(part);
        });
    }

    push(folder);
    push(dir);
    return parts.join("/");
  }

  function projectFolder(project) {
    return project.folder || project.id;
  }

  function locateMedia(media, folder, dir) {
    var nested = mediaKey(folder, dir);
    if (media[nested]) return nested;
    var direct = mediaKey("", dir);
    if (direct && media[direct]) return direct;
    return nested;
  }

  function mediaEntry(media, key) {
    var entry = media[key];
    if (!entry || typeof entry !== "object") {
      return { images: [], videos: [], docs: [] };
    }
    return {
      images: entry.images || [],
      videos: entry.videos || [],
      docs: entry.docs || []
    };
  }

  function imageMeta(entry) {
    if (typeof entry === "string") {
      return { file: entry, title: "", description: "" };
    }
    if (!entry || typeof entry !== "object") {
      return { file: "", title: "", description: "" };
    }
    return {
      file: String(entry.file || ""),
      title: String(entry.title || "").trim(),
      description: String(entry.description || "").trim()
    };
  }

  function sectionImages(project, key, section, files) {
    var images = [];
    (files || []).forEach(function (entry) {
      var meta = imageMeta(entry);
      if (!meta.file) return;
      if (isDedicatedCover(project, section.dir, meta.file)) return;
      images.push({
        src: joinMedia(key, meta.file),
        alt: meta.title
          ? project.title + " — " + meta.title
          : section.title
            ? project.title + " — " + section.title + ", view " + (images.length + 1)
            : viewAlt(project, images.length + 1),
        title: meta.title,
        description: meta.description
      });
    });
    return images;
  }

  function isDedicatedCover(project, dir, file) {
    if (!project.cover) return false;
    var coverKey = mediaKey(projectFolder(project), project.cover);
    var here = mediaKey(mediaKey(projectFolder(project), dir), file);
    var direct = mediaKey(dir, file);
    return here === coverKey || direct === coverKey;
  }

  function coverMarkup(project) {
    if (!project.cover) return "";
    return (
      '<button type="button" class="project-cover" aria-label="Zoom cover photo">' +
        '<img src="' +
        imgPath(projectFolder(project), project.cover) +
        '" alt="' +
        escapeHtml(coverAlt(project)) +
        '">' +
      "</button>"
    );
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
    if (qs("#experience-root")) return "experience";
    return "other";
  }

  function loadJsonObject(url) {
    return fetch(url).then(function (response) {
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

  function loadAbout() {
    return loadJsonObject(ABOUT_URL);
  }

  function loadExperience() {
    return loadJsonObject(EXPERIENCE_URL);
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

  function loadMedia() {
    return fetch("data/media.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("load");
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("shape");
        }
        return data;
      })
      .catch(function () {
        return {};
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

    var home = Boolean(qs("#folio-more"));
    var cards = projects
      .map(function (project) {
        var meta = [project.category, project.year, project.location]
          .filter(function (part) {
            return part;
          })
          .map(function (part) {
            return escapeHtml(part);
          })
          .join("  ·  ");
        if (home) {
          return (
            '<a class="folio-card" href="project.html?id=' +
            encodeURIComponent(project.id) +
            '">' +
              '<span class="folio-card__media">' +
                '<img src="' +
                imgPath(projectFolder(project), project.cover) +
                '" alt="' +
                escapeHtml(coverAlt(project)) +
                '" width="1200" height="900">' +
              "</span>" +
              '<span class="folio-card__title">' +
              escapeHtml(project.title) +
              "</span>" +
            "</a>"
          );
        }
        return (
          '<a class="work-card" href="project.html?id=' +
          encodeURIComponent(project.id) +
          '">' +
            '<span class="work-card__media">' +
              '<img class="work-card__thumb" src="' +
              imgPath(projectFolder(project), project.cover) +
              '" alt="' +
              escapeHtml(coverAlt(project)) +
              '" width="1200" height="900">' +
            "</span>" +
            '<span class="work-card__text">' +
              '<span class="work-card__title">' +
              escapeHtml(project.title) +
              "</span>" +
              '<span class="work-card__meta">' +
              meta +
              "</span>" +
            "</span>" +
          "</a>"
        );
      })
      .join("");

    if (home) {
      root.className = "folio-grid is-preview";
      root.innerHTML = cards;
      var more = qs("#folio-more");
      if (more && projects.length > 4) {
        more.hidden = false;
        more.addEventListener("click", function () {
          root.classList.remove("is-preview");
          more.hidden = true;
        });
      }
      return;
    }

    root.innerHTML = '<div class="work-grid">' + cards + "</div>";
  }

  function publicPath(path) {
    return String(path || "")
      .split("/")
      .filter(function (part) {
        return part && part !== ".";
      })
      .map(function (part) {
        return encodeURIComponent(part);
      })
      .join("/");
  }

  function loadServices() {
    return fetch(SERVICES_URL).then(function (response) {
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

  function renderServices(items) {
    var root = qs("#services");
    if (!root) return;
    var list = (items || []).filter(function (item) {
      return item && (item.title || item.image);
    });
    if (!list.length) {
      root.innerHTML =
        '<p class="status">Nothing is listed yet. Add a service in <code>data/services.json</code>.</p>';
      return;
    }

    var cards = list
      .map(function (item) {
        var sheet =
          String(item.fit || "").toLowerCase() === "contain"
            ? ' class="service-card__sheet"'
            : "";
        var src = publicPath(item.image);
        return (
          '<article class="service-card">' +
            (src
              ? '<img' +
                sheet +
                ' src="' +
                src +
                '" alt="' +
                escapeHtml(item.alt || item.title || "") +
                '" width="640" height="640">'
              : "") +
            "<h3>" +
            escapeHtml(item.title || "") +
            "</h3>" +
            (item.text ? "<p>" + escapeHtml(item.text) + "</p>" : "") +
          "</article>"
        );
      })
      .join("");

    root.innerHTML =
      '<div class="services">' +
        '<div class="services__viewport" id="services-viewport">' +
          '<div class="services__track" id="services-track">' +
          cards +
          "</div>" +
        "</div>" +
        '<div class="services__controls">' +
          '<button type="button" class="skills-nav" id="services-prev" aria-label="Previous service">' +
            '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.2 3.2 5.4 8l4.8 4.8"/></svg>' +
          "</button>" +
          '<div class="services__dots" id="services-dots"></div>' +
          '<button type="button" class="skills-nav" id="services-next" aria-label="Next service">' +
            '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.8 3.2 10.6 8l-4.8 4.8"/></svg>' +
          "</button>" +
        "</div>" +
      "</div>";
    startServicesCarousel();
  }

  function startServicesCarousel() {
    var track = qs("#services-track");
    var viewport = qs("#services-viewport");
    var dots = qs("#services-dots");
    var prev = qs("#services-prev");
    var next = qs("#services-next");
    if (!track || !viewport) return;

    var real = Array.prototype.slice.call(track.children);
    var count = real.length;
    var index = 0;
    var head = 0;
    var snapTo = null;
    var timer = 0;

    function gap() {
      var styles = window.getComputedStyle(track);
      return parseFloat(styles.columnGap || styles.gap) || 0;
    }

    function perView() {
      var card = real[0];
      if (!card) return 1;
      var cardWidth = card.getBoundingClientRect().width;
      var view = viewport.getBoundingClientRect().width;
      if (!cardWidth) return 1;
      return Math.max(1, Math.min(count, Math.round((view + gap()) / (cardWidth + gap()))));
    }

    function loops() {
      return count > perView();
    }

    function stepSize() {
      var card = real[0];
      return card ? card.getBoundingClientRect().width + gap() : 0;
    }

    function mount() {
      Array.prototype.forEach.call(track.querySelectorAll("[data-clone]"), function (node) {
        node.remove();
      });
      head = 0;
      if (!loops()) return;
      var view = perView();
      var i;
      for (i = 0; i < view; i += 1) {
        var before = real[(count - view + i) % count].cloneNode(true);
        before.setAttribute("data-clone", "1");
        before.setAttribute("aria-hidden", "true");
        track.insertBefore(before, real[0]);
      }
      for (i = 0; i < view; i += 1) {
        var after = real[i].cloneNode(true);
        after.setAttribute("data-clone", "1");
        after.setAttribute("aria-hidden", "true");
        track.appendChild(after);
      }
      head = view;
    }

    function place(physical, animate) {
      var motion = animate && !prefersReducedMotion();
      track.style.transition = motion ? "transform 1.6s ease" : "none";
      track.style.transform = "translateX(" + -physical * stepSize() + "px)";
    }

    function settle() {
      if (snapTo == null) return;
      var dest = snapTo;
      snapTo = null;
      place(dest, false);
      void track.offsetWidth;
    }

    function paintDots() {
      if (!dots) return;
      var stops = loops() ? count : 1;
      var html = "";
      var i;
      for (i = 0; i < stops; i += 1) {
        html +=
          '<button type="button" class="services__dot" data-index="' +
          i +
          '"' +
          (i === index ? ' aria-current="true"' : "") +
          ' aria-label="Show service ' +
          (i + 1) +
          '"></button>';
      }
      dots.innerHTML = html;
    }

    function go(nextIndex, animate) {
      settle();
      if (!loops()) {
        index = 0;
        place(0, false);
        paintDots();
        return;
      }
      var target = ((nextIndex % count) + count) % count;
      var motion = animate && !prefersReducedMotion();
      var physical = head + target;
      snapTo = null;
      if (motion && index === count - 1 && target === 0) {
        physical = head + count;
        snapTo = head;
      } else if (motion && index === 0 && target === count - 1) {
        physical = head - 1;
        snapTo = head + count - 1;
      }
      index = target;
      place(physical, motion);
      paintDots();
    }

    function stop() {
      window.clearInterval(timer);
      timer = 0;
    }

    function arm() {
      stop();
      if (prefersReducedMotion() || !loops()) return;
      timer = window.setInterval(function () {
        go(index + 1, true);
      }, SERVICE_PACE_MS);
    }

    track.addEventListener("transitionend", function (event) {
      if (event.target !== track || event.propertyName !== "transform") return;
      settle();
    });

    if (prev) {
      prev.addEventListener("click", function () {
        go(index - 1, true);
        arm();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        go(index + 1, true);
        arm();
      });
    }
    if (dots) {
      dots.addEventListener("click", function (event) {
        var button = event.target.closest
          ? event.target.closest(".services__dot")
          : null;
        if (!button) return;
        go(Number(button.getAttribute("data-index")) || 0, true);
        arm();
      });
    }
    viewport.addEventListener("mouseenter", stop);
    viewport.addEventListener("mouseleave", arm);
    viewport.addEventListener("focusin", stop);
    viewport.addEventListener("focusout", function (event) {
      if (!viewport.contains(event.relatedTarget)) arm();
    });
    window.addEventListener("resize", function () {
      mount();
      go(index, false);
      arm();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else arm();
    });
    mount();
    go(0, false);
    arm();
  }

  function isLeadImage(file) {
    return /^001\./i.test(file);
  }

  var lightboxEl = null;
  var lightboxSlides = [];
  var lightboxIndex = 0;
  var lightboxFocus = null;
  var lightboxTouchX = null;
  var lightboxZoom = 1;
  var lightboxPanX = 0;
  var lightboxPanY = 0;
  var lightboxDrag = null;

  function lightboxParts() {
    return {
      img: lightboxEl.querySelector(".lightbox__img"),
      note: lightboxEl.querySelector(".lightbox__note"),
      noteTitle: lightboxEl.querySelector(".lightbox__note-title"),
      noteText: lightboxEl.querySelector(".lightbox__note-text"),
      count: lightboxEl.querySelector(".lightbox__count"),
      prev: lightboxEl.querySelector(".lightbox__prev"),
      next: lightboxEl.querySelector(".lightbox__next"),
      close: lightboxEl.querySelector(".lightbox__close")
    };
  }

  function applyLightboxZoom() {
    var img = lightboxParts().img;
    img.style.transform =
      "translate(" + lightboxPanX + "px, " + lightboxPanY + "px) scale(" + lightboxZoom + ")";
    img.classList.toggle("is-zoomed", lightboxZoom > 1);
  }

  function resetLightboxZoom() {
    lightboxZoom = 1;
    lightboxPanX = 0;
    lightboxPanY = 0;
    lightboxDrag = null;
    if (lightboxEl) applyLightboxZoom();
  }

  function lightboxIsOpen() {
    return lightboxEl && lightboxEl.classList.contains("is-open");
  }

  function showLightboxSlide(i) {
    if (!lightboxSlides.length) return;
    var parts = lightboxParts();
    lightboxIndex = (i + lightboxSlides.length) % lightboxSlides.length;
    var slide = lightboxSlides[lightboxIndex];
    parts.img.src = slide.src;
    parts.img.alt = slide.alt;
    parts.noteTitle.textContent = slide.title || "";
    parts.noteText.textContent = slide.description || "";
    parts.note.hidden = !slide.title && !slide.description;
    parts.count.textContent =
      lightboxIndex + 1 + " / " + lightboxSlides.length;
    parts.prev.hidden = lightboxSlides.length < 2;
    parts.next.hidden = lightboxSlides.length < 2;
    resetLightboxZoom();
  }

  function closeLightbox() {
    if (!lightboxIsOpen()) return;
    var parts = lightboxParts();
    lightboxEl.classList.remove("is-open");
    lightboxEl.setAttribute("hidden", "");
    document.body.classList.remove("is-lightbox");
    parts.img.removeAttribute("src");
    parts.img.alt = "";
    parts.noteTitle.textContent = "";
    parts.noteText.textContent = "";
    parts.note.hidden = true;
    resetLightboxZoom();
    if (lightboxFocus && typeof lightboxFocus.focus === "function") {
      lightboxFocus.focus();
    }
    lightboxFocus = null;
  }

  function openLightbox(slides, index) {
    ensureLightbox();
    lightboxSlides = slides;
    lightboxFocus = document.activeElement;
    document.body.classList.add("is-lightbox");
    lightboxEl.classList.add("is-open");
    lightboxEl.removeAttribute("hidden");
    showLightboxSlide(index);
    lightboxParts().close.focus();
  }

  function stepLightbox(dir) {
    if (!lightboxIsOpen() || lightboxSlides.length < 2) return;
    showLightboxSlide(lightboxIndex + dir);
  }

  function ensureLightbox() {
    if (lightboxEl) return lightboxEl;

    lightboxEl = document.createElement("div");
    lightboxEl.className = "lightbox";
    lightboxEl.setAttribute("hidden", "");
    lightboxEl.setAttribute("role", "dialog");
    lightboxEl.setAttribute("aria-modal", "true");
    lightboxEl.setAttribute("aria-label", "Project photos");
    lightboxEl.innerHTML =
      '<button type="button" class="lightbox__close">Close</button>' +
      '<button type="button" class="lightbox__prev" aria-label="Previous photo">‹</button>' +
      '<img class="lightbox__img" alt="">' +
      '<p class="lightbox__note" hidden>' +
        '<span class="lightbox__note-title"></span>' +
        '<span class="lightbox__note-text"></span>' +
      "</p>" +
      '<button type="button" class="lightbox__next" aria-label="Next photo">›</button>' +
      '<p class="lightbox__count"></p>';
    document.body.appendChild(lightboxEl);

    var parts = lightboxParts();
    parts.close.addEventListener("click", closeLightbox);
    parts.prev.addEventListener("click", function () {
      stepLightbox(-1);
    });
    parts.next.addEventListener("click", function () {
      stepLightbox(1);
    });
    lightboxEl.addEventListener("click", function (event) {
      if (event.target === lightboxEl) closeLightbox();
    });
    lightboxEl.addEventListener("wheel", function (event) {
      if (!lightboxIsOpen()) return;
      event.preventDefault();
      var next = lightboxZoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15);
      lightboxZoom = Math.min(5, Math.max(1, next));
      if (lightboxZoom === 1) {
        lightboxPanX = 0;
        lightboxPanY = 0;
      }
      applyLightboxZoom();
    }, { passive: false });
    parts.img.addEventListener("pointerdown", function (event) {
      if (lightboxZoom <= 1) return;
      lightboxDrag = {
        x: event.clientX,
        y: event.clientY,
        panX: lightboxPanX,
        panY: lightboxPanY
      };
      parts.img.setPointerCapture(event.pointerId);
    });
    parts.img.addEventListener("pointermove", function (event) {
      if (!lightboxDrag) return;
      lightboxPanX = lightboxDrag.panX + (event.clientX - lightboxDrag.x);
      lightboxPanY = lightboxDrag.panY + (event.clientY - lightboxDrag.y);
      applyLightboxZoom();
    });
    function endDrag() {
      lightboxDrag = null;
    }
    parts.img.addEventListener("pointerup", endDrag);
    parts.img.addEventListener("pointercancel", endDrag);
    parts.img.addEventListener("dblclick", function () {
      if (lightboxZoom > 1) resetLightboxZoom();
      else {
        lightboxZoom = 2;
        applyLightboxZoom();
      }
    });
    lightboxEl.addEventListener("touchstart", function (event) {
      var touch = event.changedTouches[0];
      lightboxTouchX = touch ? touch.clientX : null;
    }, { passive: true });
    lightboxEl.addEventListener("touchend", function (event) {
      if (lightboxTouchX == null) return;
      var touch = event.changedTouches[0];
      var dx = touch ? touch.clientX - lightboxTouchX : 0;
      lightboxTouchX = null;
      if (dx > 48) stepLightbox(-1);
      if (dx < -48) stepLightbox(1);
    });
    document.addEventListener("keydown", function (event) {
      if (!lightboxIsOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
      }
    });
    return lightboxEl;
  }

  function fileNameOf(src) {
    var part = String(src).split("/").pop();
    try {
      return decodeURIComponent(part);
    } catch (error) {
      return part;
    }
  }

  function fillProjectGallery(gallery, items) {
    var leadItems = [];
    var restItems = [];
    items.forEach(function (item) {
      if (isLeadImage(fileNameOf(item.src))) {
        leadItems.push(item);
      } else {
        restItems.push(item);
      }
    });

    function addImage(parent, item, span, index) {
      var frame = document.createElement("button");
      frame.type = "button";
      frame.className = span ? "gallery__item gallery__span" : "gallery__item";
      frame.setAttribute("aria-label", "Zoom photo");
      var img = document.createElement("img");
      img.src = item.src;
      img.alt = item.alt || "";
      img.addEventListener("error", function () {
        frame.remove();
      });
      frame.appendChild(img);
      if (item.title || item.description) {
        frame.classList.add("gallery__item--note");
        var note = document.createElement("span");
        note.className = "gallery__note";
        if (item.title) {
          var title = document.createElement("span");
          title.className = "gallery__note-title";
          title.textContent = item.title;
          note.appendChild(title);
        }
        if (item.description) {
          var description = document.createElement("span");
          description.className = "gallery__note-text";
          description.textContent = item.description;
          note.appendChild(description);
        }
        frame.appendChild(note);
      }
      frame.addEventListener("click", function () {
        openLightbox(slides, index);
      });
      parent.appendChild(frame);
    }

    var slides = leadItems.concat(restItems);
    leadItems.forEach(function (item, i) {
      addImage(gallery, item, true, i);
    });

    if (!restItems.length) return;

    if (restItems.length === 1 && !leadItems.length) {
      addImage(gallery, restItems[0], true, 0);
      return;
    }

    var col0 = document.createElement("div");
    var col1 = document.createElement("div");
    col0.className = "gallery__col";
    col1.className = "gallery__col";
    gallery.appendChild(col0);
    if (restItems.length > 1) {
      gallery.appendChild(col1);
    }

    var cols = restItems.length > 1 ? [col0, col1] : [col0];
    restItems.forEach(function (item, i) {
      addImage(cols[i % cols.length], item, false, leadItems.length + i);
    });
  }

  function bindCoverZoom(root, project) {
    var cover = root.querySelector(".project-cover");
    if (!cover || !project.cover) return;
    cover.addEventListener("click", function () {
      openLightbox(
        [
          {
            src: imgPath(projectFolder(project), project.cover),
            alt: coverAlt(project),
            title: "",
            description: ""
          }
        ],
        0
      );
    });
  }

  function textParagraphs(text) {
    var parts = Array.isArray(text) ? text : text ? [text] : [];
    return parts
      .filter(function (part) {
        return String(part || "").trim();
      })
      .map(function (part) {
        return "<p>" + escapeHtml(part) + "</p>";
      })
      .join("");
  }

  function projectFacts(project) {
    var rows = [];
    if (project.location) rows.push(["Location", project.location]);
    if (project.plotArea) rows.push(["Total plot area", project.plotArea]);
    if (project.carpetArea) rows.push(["Total carpet area", project.carpetArea]);
    if (project.builtUpArea) rows.push(["Total built-up area", project.builtUpArea]);
    if (project.year) rows.push(["Year", String(project.year)]);
    return rows;
  }

  function projectInfoMarkup(project, paragraphs) {
    var facts = project.plotArea || project.carpetArea || project.builtUpArea ? projectFacts(project) : [];
    var metaBits = facts.length
      ? []
      : [project.year, project.location].filter(function (part) {
          return part;
        });
    return (
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
        (facts.length
          ? '<ul class="project-facts">' +
            facts
              .map(function (row) {
                return (
                  "<li><span>" +
                  escapeHtml(row[0]) +
                  "</span> " +
                  escapeHtml(row[1]) +
                  "</li>"
                );
              })
              .join("") +
            "</ul>"
          : "") +
        (metaBits.length
          ? '<p class="project-head__meta">' +
            metaBits
              .map(function (part) {
                return escapeHtml(part);
              })
              .join("  ·  ") +
            "</p>"
          : "") +
        '<div class="project-copy">' +
        paragraphs +
        "</div>" +
      "</div>"
    );
  }

  function projectNavMarkup(prev, next) {
    return (
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
      "</nav>"
    );
  }

  function sectionMediaMarkup(entry) {
    var videos = entry.videos
      .map(function (item) {
        return (
          '<video class="project-video" controls preload="metadata" src="' +
          item.src +
          '"></video>'
        );
      })
      .join("");
    var docs = entry.docs.length
      ? '<ul class="project-docs">' +
        entry.docs
          .map(function (item) {
            return (
              '<li><a href="' +
              item.src +
              '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml(item.name) +
              "</a></li>"
            );
          })
          .join("") +
        "</ul>"
      : "";
    var empty =
      !entry.images.length && !entry.videos.length && !entry.docs.length
        ? '<p class="project-section__empty">No files in this folder yet. Add them, then run <code>python3 scripts/index-media.py</code>.</p>'
        : "";
    return (
      '<div class="project-section__media">' +
        (entry.images.length ? '<div class="gallery"></div>' : "") +
        (videos ? '<div class="project-videos">' + videos + "</div>" : "") +
        docs +
        empty +
      "</div>"
    );
  }

  function renderProject(projects, media) {
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
    var paragraphs = textParagraphs(project.description);
    var sections = Array.isArray(project.sections) ? project.sections : [];

    document.title = project.title + " — Ishita Saini";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        (project.tagline || project.title) +
          " — " +
          project.category +
          (project.location ? ", " + project.location : "") +
          "."
      );
    }

    if (!sections.length) {
      var files = [];
      (project.images || []).forEach(function (file, n) {
        if (file === project.cover) return;
        files.push({
          src: imgPath(project.id, file),
          alt: viewAlt(project, n + 1)
        });
      });

    root.innerHTML =
      '<article class="project">' +
        projectInfoMarkup(project, paragraphs) +
        '<div class="project-visuals">' +
          (files.length ? '<div class="gallery"></div>' : "") +
        "</div>" +
      "</article>" +
      projectNavMarkup(prev, next);

      if (files.length) {
        fillProjectGallery(root.querySelector(".gallery"), files);
      }
      return;
    }

    var folder = projectFolder(project);
    var blocks = sections
      .map(function (section, sectionIndex) {
        var key = locateMedia(media, folder, section.dir);
        var entry = mediaEntry(media, key);
        var images = sectionImages(project, key, section, entry.images);
        var videos = entry.videos.map(function (file) {
          return { src: joinMedia(key, file), name: file };
        });
        var docs = entry.docs.map(function (file) {
          return { src: joinMedia(key, file), name: file };
        });
        var copy = textParagraphs(section.text);
        var heading = section.title
          ? "<h2>" + escapeHtml(section.title) + "</h2>"
          : "";
        var board = /mood\s*board/i.test(section.title || "");
        return (
          '<section class="project-section' +
          (board ? " project-section--board" : "") +
          '" data-section="' +
          sectionIndex +
          '">' +
            (heading || copy
              ? '<div class="project-section__copy">' +
                heading +
                (copy
                  ? '<div class="project-section__text">' + copy + "</div>"
                  : "") +
                "</div>"
              : "") +
            sectionMediaMarkup({
              images: images,
              videos: videos,
              docs: docs
            }) +
          "</section>"
        );
      })
      .join("");

    root.innerHTML =
      '<article class="project project--sections">' +
        '<div class="project-intro">' +
          projectInfoMarkup(project, paragraphs) +
          coverMarkup(project) +
        "</div>" +
        blocks +
      "</article>" +
      projectNavMarkup(prev, next);

    sections.forEach(function (section, sectionIndex) {
      var gallery = root.querySelector(
        '[data-section="' + sectionIndex + '"] .gallery'
      );
      if (!gallery) return;
      var key = locateMedia(media, folder, section.dir);
      var entry = mediaEntry(media, key);
      var images = sectionImages(project, key, section, entry.images);
      fillProjectGallery(gallery, images);
    });
    bindCoverZoom(root, project);
  }

  function showLoadError(kind) {
    var roots = {
      project: qs("#project-root"),
      about: qs("#about-root"),
      experience: qs("#experience-root"),
      index: qs("#project-index")
    };
    var files = {
      about: "data/about.json",
      experience: "data/experience.json",
      project: "data/projects.json",
      index: "data/projects.json"
    };
    var titles = {
      about: "About could not be loaded",
      experience: "Experience could not be loaded",
      project: "Projects could not be loaded",
      index: "Projects could not be loaded"
    };
    var root = roots[kind] || roots.index;
    if (!root) return;
    var file = files[kind] || files.index;
    root.innerHTML = emptyMarkup(
      titles[kind] || titles.index,
      "The content file could not be read. If you opened these pages as files on your computer, start a local folder server instead — the README explains how. If the site is already online, check that <code>" +
        file +
        "</code> is present and saved correctly.",
      kind === "project" || kind === "about" || kind === "experience"
    );
    if (kind === "project") {
      document.title = "Projects could not be loaded — Ishita Saini";
    }
    if (kind === "about") {
      document.title = "About could not be loaded — Ishita Saini";
    }
    if (kind === "experience") {
      document.title = "Experience could not be loaded — Ishita Saini";
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

    var resumeUrl = about.resume || "";
    var resumeLabel = about.resumeLabel || "Download resume";
    var resumeName =
      about.resumeName ||
      String(name || "resume").replace(/\s+/g, "-") + "-resume.pdf";
    var resumeRemote = /^https?:/i.test(resumeUrl);
    var resumeBtn = resumeUrl
      ? '<div class="about__actions">' +
        '<a class="btn btn--solid" href="' +
        escapeHtml(resumeUrl) +
        '"' +
        (resumeRemote
          ? ' rel="noopener noreferrer" target="_blank"'
          : ' download="' + escapeHtml(resumeName) + '"') +
        ">" +
        escapeHtml(resumeLabel) +
        "</a></div>"
      : "";

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
            resumeBtn +
            (links ? '<p class="about__cta">' + links + "</p>" : "") +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function listItems(items) {
    if (!items || !items.length) return "";
    return (
      "<ul>" +
      items
        .map(function (item) {
          return "<li>" + escapeHtml(item) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function metaLine(parts) {
    return parts
      .filter(function (part) {
        return part;
      })
      .map(function (part) {
        return escapeHtml(part);
      })
      .join("  ·  ");
  }

  function resumeButton(data) {
    var resumeUrl = data.resume || "";
    if (!resumeUrl) return "";
    var resumeLabel = data.resumeLabel || "Download resume";
    var resumeName = data.resumeName || "Ishita-Saini-resume.pdf";
    var resumeRemote = /^https?:/i.test(resumeUrl);
    return (
      '<a class="btn btn--solid" href="' +
      escapeHtml(resumeUrl) +
      '"' +
      (resumeRemote
        ? ' rel="noopener noreferrer" target="_blank"'
        : ' download="' + escapeHtml(resumeName) + '"') +
      ">" +
      escapeHtml(resumeLabel) +
      "</a>"
    );
  }

  function renderRole(role) {
    var meta = metaLine([role.title, role.location]);
    return (
      '<article class="xp-item">' +
        '<header class="xp-item__head">' +
          "<h2>" +
          escapeHtml(role.org || role.title || "") +
          "</h2>" +
          (role.dates
            ? '<p class="xp-item__year">' + escapeHtml(role.dates) + "</p>"
            : "") +
        "</header>" +
        (meta ? '<p class="xp-item__meta">' + meta + "</p>" : "") +
        listItems(role.highlights) +
      "</article>"
    );
  }

  function renderStudyItem(item) {
    var org = metaLine([item.org, item.location]);
    return (
      '<article class="xp-study__item">' +
        '<header class="xp-study__head">' +
          "<h3>" +
          escapeHtml(item.title || "") +
          "</h3>" +
          (item.dates
            ? '<p class="xp-study__dates">' + escapeHtml(item.dates) + "</p>"
            : "") +
        "</header>" +
        (org ? "<p>" + org + "</p>" : "") +
        (item.summary ? "<p>" + escapeHtml(item.summary) + "</p>" : "") +
      "</article>"
    );
  }

  function renderStudyCol(title, items, asList) {
    if (!items || !items.length) return "";
    var body = asList
      ? listItems(items)
      : items.map(renderStudyItem).join("");
    return (
      '<section class="xp-study__col">' +
        '<h2 class="section-label">' +
        escapeHtml(title) +
        "</h2>" +
        body +
      "</section>"
    );
  }

  function renderExperience(experience) {
    var root = qs("#experience-root");
    if (!root) return;

    document.title = "Experience — Ishita Saini";
    var meta = document.querySelector('meta[name="description"]');
    if (meta && experience.lead) {
      meta.setAttribute("content", experience.lead);
    }

    var roles = (experience.roles || [])
      .map(function (role) {
        return renderRole(role);
      })
      .join("");
    var education = renderStudyCol("Education", experience.education);
    var study =
      renderStudyCol("Academic projects", experience.academic) +
      renderStudyCol("Certifications", experience.certifications, true);
    var aside = education + study;
    var resume = resumeButton(experience);

    root.innerHTML =
      '<article class="experience">' +
        '<header class="xp-head">' +
          '<p class="eyebrow">Studios &amp; study</p>' +
          "<h1>Experience</h1>" +
          (experience.lead
            ? '<p class="xp-head__lead">' +
              escapeHtml(experience.lead) +
              "</p>"
            : "") +
          '<p class="about__actions">' +
          resume +
          '<a class="btn btn--ghost" href="index.html">View the work</a>' +
          "</p>" +
        "</header>" +
        (aside ? '<aside class="xp-aside">' + aside + "</aside>" : "") +
        '<section class="xp-list" aria-label="Roles">' +
          (roles || "<p>No roles listed yet.</p>") +
        "</section>" +
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

  function startSkills() {
    var track = qs("#skills-track");
    var prev = qs("#skills-prev");
    var next = qs("#skills-next");
    if (!track || !prev || !next) return;

    function step(dir) {
      var card = track.querySelector(".skill-card");
      var gap = 14;
      var amount = card ? card.getBoundingClientRect().width + gap : 220;
      track.scrollBy({
        left: dir * amount,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    }

    prev.addEventListener("click", function () {
      step(-1);
    });
    next.addEventListener("click", function () {
      step(1);
    });
  }

  var page = whichPage();
  if (page === "index" || page === "project") {
    if (page === "index") {
      if (qs("#hero-role")) startHeroType();
      if (qs("#quote-card")) startQuotes();
      startSkills();
      if (qs("#services")) {
        loadServices()
          .then(renderServices)
          .catch(function () {
            var root = qs("#services");
            if (root) {
              root.innerHTML =
                '<p class="status">The services list could not be loaded. Check <code>data/services.json</code>.</p>';
            }
          });
      }
    }
    Promise.all([loadProjects(), loadMedia()])
      .then(function (result) {
        var projects = result[0];
        var media = result[1];
        if (page === "index") {
          renderIndex(projects);
        } else {
          renderProject(projects, media);
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

  if (page === "experience") {
    loadExperience()
      .then(function (experience) {
        renderExperience(experience);
      })
      .catch(function () {
        showLoadError("experience");
      });
  }
})();

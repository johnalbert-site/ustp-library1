(function () {
  var L = document.getElementById("login");
  if (!L) return;

  var svg = document.getElementById("lampsvg");
  var cord = document.getElementById("cord");
  var hit = document.getElementById("cordhit");
  var cline = document.getElementById("cline");
  var sway = document.querySelector(".sway");
  var hint = document.getElementById("lhint");
  var main = document.getElementById("main");

  /* glow colors [r,g,b , text color on button] */
  var PAL = [
    ["255,45,120", "#fff"], // pink
    ["255,179,0", "#1a1200"], // amber
    ["34,211,238", "#04222a"], // cyan
    ["52,211,153", "#04261a"], // green
    ["139,92,246", "#fff"], // violet
    ["255,90,54", "#fff"], // orange
  ];
  var ci = 0,
    on = false,
    ac = null,
    drag = null;

  function setColor(i) {
    ci = i % PAL.length;
    L.style.setProperty("--g", PAL[ci][0]);
    L.style.setProperty("--gk", PAL[ci][1]);
  }

  /* small sounds (click + hum) */
  function beep(f, d, v, type) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(),
        g = ac.createGain(),
        t = ac.currentTime;
      o.type = type || "square";
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t);
      o.stop(t + d);
    } catch (e) {}
  }

  function setOn(v) {
    on = v;
    L.classList.toggle("on", on);
    cord.setAttribute("aria-pressed", on ? "true" : "false");
    hint.textContent = on
      ? "Click anywhere on the background to change the light color"
      : "Pull the cord to turn on the light";
    if (on) {
      L.classList.add("flick");
      setTimeout(function () {
        L.classList.remove("flick");
      }, 750);
      beep(900, 0.05, 0.06);
      beep(120, 0.4, 0.04, "sine");
      if (window.matchMedia && matchMedia("(pointer:fine)").matches) {
        setTimeout(function () {
          var u = document.getElementById("lu");
          if (on && u && u.offsetParent) u.focus();
        }, 900);
      }
    } else {
      beep(500, 0.05, 0.05);
    }
  }

  /* cord movement */
  function pull(dy) {
    cord.style.transform = "translateY(" + dy + "px)";
    cline.style.transform = "scaleY(" + (1 + dy / 80) + ")";
  }
  function spring(on_) {
    cord.classList.toggle("spring", on_);
    cline.classList.toggle("spring", on_);
  }
  function tug() {
    spring(true);
    pull(18);
    setTimeout(function () {
      pull(0);
    }, 140);
  }
  function scale() {
    var m = svg.getScreenCTM();
    return m ? m.a : 1;
  }

  hit.addEventListener("pointerdown", function (e) {
    drag = { y: e.clientY, dy: 0, s: scale() };
    try {
      hit.setPointerCapture(e.pointerId);
    } catch (x) {}
    spring(false);
    sway.classList.add("still");
    e.preventDefault();
    e.stopPropagation();
  });
  hit.addEventListener("pointermove", function (e) {
    if (!drag) return;
    var dy = Math.max(0, Math.min(46, (e.clientY - drag.y) / drag.s));
    drag.dy = dy;
    pull(dy);
  });
  function end(e, cancelled) {
    if (!drag) return;
    var d = drag;
    drag = null;
    sway.classList.remove("still");
    if (e) e.stopPropagation();
    if (cancelled) {
      spring(true);
      pull(0);
      return;
    }
    if (d.dy >= 16) {
      spring(true);
      pull(0);
      setOn(!on);
    } else if (d.dy < 4) {
      tug();
      setOn(!on); // simple tap also works
    } else {
      spring(true);
      pull(0);
    }
  }
  hit.addEventListener("pointerup", function (e) {
    end(e, false);
  });
  hit.addEventListener("pointercancel", function (e) {
    end(e, true);
  });
  cord.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  cord.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      tug();
      setOn(!on);
    }
  });

  /* click on background = change light color */
  L.addEventListener("click", function (e) {
    if (!on) return;
    if (e.target.closest(".lcard") || e.target.closest("#cord")) return;
    setColor(ci + 1);
    var r = document.createElement("span");
    r.className = "ripple";
    r.style.left = e.clientX + "px";
    r.style.top = e.clientY + "px";
    L.appendChild(r);
    setTimeout(function () {
      r.remove();
    }, 950);
    beep(700 + ci * 80, 0.06, 0.04);
  });

  /* when you log out the login shows again: reset lamp to OFF */
  var wasHidden = L.style.display === "none";
  new MutationObserver(function () {
    var hidden = L.style.display === "none";
    if (wasHidden && !hidden) {
      if (on) setOn(false);
      setColor(0);
    }
    if (!wasHidden && hidden) pulseEnter();
    wasHidden = hidden;
  }).observe(L, { attributes: true, attributeFilter: ["style"] });

  /* page-enter animation for student + librarian pages */
  var et;
  function pulseEnter() {
    main.classList.add("enter");
    clearTimeout(et);
    et = setTimeout(function () {
      main.classList.remove("enter");
    }, 1300);
  }
  window.addEventListener("hashchange", pulseEnter);
  pulseEnter();
})();
/* ===== MOON + STARS + SHOOTING STAR LOOP ===== */
(function () {
  var L = document.getElementById("login");
  var stage = L && L.querySelector(".stage");
  if (!stage) return;

  var sky = document.createElement("div");
  sky.className = "sky";
  sky.setAttribute("aria-hidden", "true");
  var h = '<div class="moon"></div>';
  for (var i = 0; i < 45; i++) {
    h +=
      '<i class="tstar" style="left:' +
      (Math.random() * 100).toFixed(1) +
      "%;top:" +
      (Math.random() * 60).toFixed(1) +
      "%;--t:" +
      (2 + Math.random() * 4).toFixed(1) +
      "s;--dl:-" +
      (Math.random() * 5).toFixed(1) +
      "s;transform:scale(" +
      (0.6 + Math.random() * 1.2).toFixed(2) +
      ')"></i>';
  }
  sky.innerHTML = h;
  stage.insertBefore(sky, stage.querySelector(".bgimg").nextSibling);

  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function visible() {
    return L.style.display !== "none" && !document.hidden;
  }

  function meteor(delay) {
    var m = document.createElement("span");
    m.className = "meteor";
    var toRight = Math.random() < 0.5;
    var a = toRight ? 20 + Math.random() * 20 : 140 + Math.random() * 20;
    var x = toRight ? Math.random() * 60 : 40 + Math.random() * 60;
    m.style.left = x + "%";
    m.style.top = Math.random() * 40 + "%";
    m.style.setProperty("--a", a + "deg");
    m.style.setProperty("--len", 110 + Math.random() * 100 + "px");
    m.style.setProperty("--dist", 450 + Math.random() * 450 + "px");
    m.style.animationDuration = 0.9 + Math.random() * 0.8 + "s";
    m.style.animationDelay = (delay || 0) + "ms";
    m.addEventListener("animationend", function () {
      m.remove();
    });
    sky.appendChild(m);
  }

  /* one shooting star every 2-5 seconds */
  function single() {
    if (visible() && !reduce) meteor(0);
    setTimeout(single, 2200 + Math.random() * 3300);
  }

  /* meteor shower every 10 seconds */
  function shower() {
    if (!visible() || reduce) return;
    var n = 12 + Math.floor(Math.random() * 6);
    for (var k = 0; k < n; k++) meteor(k * 130 + Math.random() * 250);
  }

  setTimeout(single, 1500);
  setInterval(shower, 10000);
})();
/* ===== FIREWORKS when a student sees the Welcome message ===== */
(function () {
  var md = document.getElementById("md");
  var mdb = document.getElementById("mdb");
  if (!md || !mdb) return;

  var reduce =
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fired = false;

  new MutationObserver(function () {
    if (md.className !== "on") {
      fired = false;
      return;
    }
    var h = mdb.querySelector("h2");
    if (!fired && h && /^Welcome,/.test(h.textContent)) {
      fired = true;
      setTimeout(fireworks, 350);
    }
  }).observe(md, { attributes: true, attributeFilter: ["class"] });

  function fireworks() {
    if (reduce) return;
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9";
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = (c.width = innerWidth * dpr);
    var H = (c.height = innerHeight * dpr);
    document.body.appendChild(c);
    var x = c.getContext("2d");

    var HUES = [45, 50, 210, 195, 330, 8, 280, 150];
    var rockets = [],
      parts = [],
      launched = 0,
      TOTAL = 9,
      nextAt = 0,
      start = performance.now(),
      last = start;

    function launch() {
      rockets.push({
        x: (0.12 + Math.random() * 0.76) * W,
        y: H,
        ty: H * (0.14 + Math.random() * 0.32),
        vy: -H * (0.0165 + Math.random() * 0.004),
      });
      launched++;
    }

    function explode(r) {
      var n = 80 + Math.floor(Math.random() * 40),
        hue = HUES[Math.floor(Math.random() * HUES.length)],
        hue2 = (hue + 40) % 360;
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + Math.random() * 0.1,
          sp = (Math.random() < 0.5 ? 5 : 2.5 + Math.random() * 2.5) * dpr;
        parts.push({
          x: r.x,
          y: r.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: 0.008 + Math.random() * 0.01,
          h: Math.random() < 0.7 ? hue : hue2,
        });
      }
    }

    function frame(now) {
      var dt = Math.min(2.5, (now - last) / 16.7);
      last = now;

      /* fade old frame = trails */
      x.globalCompositeOperation = "destination-out";
      x.fillStyle = "rgba(0,0,0,0.22)";
      x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = "lighter";

      /* launch */
      if (launched < TOTAL && now - start >= nextAt) {
        launch();
        nextAt = now - start + 450 + Math.random() * 250;
      }

      /* rockets */
      for (var i = rockets.length - 1; i >= 0; i--) {
        var r = rockets[i];
        r.y += r.vy * dt;
        x.fillStyle = "rgba(255,240,200,0.95)";
        x.beginPath();
        x.arc(r.x, r.y, 2.2 * dpr, 0, 6.283);
        x.fill();
        x.fillStyle = "rgba(255,200,120,0.4)";
        x.fillRect(r.x - dpr, r.y, 2 * dpr, 14 * dpr);
        if (r.y <= r.ty) {
          explode(r);
          rockets.splice(i, 1);
        }
      }

      /* sparks */
      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        p.vx *= Math.pow(0.985, dt);
        p.vy = p.vy * Math.pow(0.985, dt) + 0.05 * dpr * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= p.decay * dt;
        if (p.life <= 0) {
          parts.splice(j, 1);
          continue;
        }
        x.fillStyle =
          "hsla(" + p.h + ",100%," + (55 + p.life * 20) + "%," + p.life + ")";
        x.beginPath();
        x.arc(p.x, p.y, 2 * dpr * (0.5 + p.life), 0, 6.283);
        x.fill();
      }

      var done = launched >= TOTAL && !rockets.length && !parts.length;
      if (done || now - start > 9000) {
        c.remove();
        return;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
})();

(function () {
  var KEY = "ustp-cov2",
    cache = {},
    busy = {},
    sch = false;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch (e) {}

  var COL = {
    IT: ["#2F6FB5", "#0B1F4B"],
    Mathematics: ["#7B3FA0", "#3B1D54"],
    Science: ["#0F7A73", "#094A46"],
    History: ["#A8512F", "#5E2A14"],
    Filipino: ["#B8394A", "#5F1523"],
    Fiction: ["#1F7A4D", "#0E3F28"],
    Research: ["#4A5F82", "#232F45"],
    Reference: ["#B95C00", "#6A3500"],
  };

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* put the picture on every cover of this book (centered, fills the cover) */
  function apply(id, url) {
    document
      .querySelectorAll('.cover[data-cid="' + id + '"]')
      .forEach(function (el) {
        if (el.querySelector("img") || el.dataset.fx) return;
        el.dataset.fx = "1";
        var im = new Image();
        im.alt = "";
        im.onload = function () {
          if (el.querySelector("img")) return;
          el.classList.add("has");
          el.insertBefore(im, el.firstChild);
        };
        im.onerror = function () {
          delete el.dataset.fx;
        };
        im.src = url;
      });
  }

  /* test a list of image urls one by one, return the first one that loads */
  function firstGood(urls, cb, i) {
    i = i || 0;
    if (i >= urls.length) return cb(null);
    var t = new Image();
    t.onload = function () {
      if (t.naturalWidth > 60) cb(urls[i]);
      else firstGood(urls, cb, i + 1);
    };
    t.onerror = function () {
      firstGood(urls, cb, i + 1);
    };
    t.src = urls[i];
  }

  /* last option: a nice generated cover (title centered, fills the cover) */
  function gen(title, cat) {
    var c = COL[cat] || COL.IT,
      lines = [],
      cur = "";
    title.split(" ").forEach(function (w) {
      if (cur && (cur + " " + w).length > 14) {
        lines.push(cur);
        cur = w;
      } else cur = (cur ? cur + " " : "") + w;
    });
    if (cur) lines.push(cur);
    lines = lines.slice(0, 6);
    var fs = lines.length > 4 ? 25 : lines.length > 3 ? 29 : 34,
      y0 = 215 - ((lines.length - 1) * fs * 1.25) / 2;
    var tx = lines
      .map(function (l, i) {
        return (
          '<text x="161" y="' +
          (y0 + i * fs * 1.25) +
          '" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="' +
          fs +
          '" fill="#fff">' +
          esc(l) +
          "</text>"
        );
      })
      .join("");
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' +
      c[0] +
      '"/><stop offset="1" stop-color="' +
      c[1] +
      '"/></linearGradient></defs>' +
      '<rect width="300" height="400" fill="url(#g)"/>' +
      '<circle cx="250" cy="60" r="95" fill="#fff" opacity=".1"/>' +
      '<circle cx="50" cy="390" r="120" fill="#fff" opacity=".08"/>' +
      '<rect width="22" height="400" fill="#000" opacity=".25"/>' +
      '<text x="161" y="50" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" letter-spacing="4" fill="#fff" opacity=".85">USTP LIBRARY</text>' +
      '<rect x="136" y="62" width="50" height="3" rx="1.5" fill="#f2b705"/>' +
      tx +
      '<rect x="136" y="338" width="50" height="3" rx="1.5" fill="#f2b705"/>' +
      '<text x="161" y="364" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" letter-spacing="3" fill="#fff" opacity=".9">' +
      esc(String(cat).toUpperCase()) +
      "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function done(id, url, store) {
    if (store) {
      cache[id] = url;
      save();
    }
    apply(id, url);
  }

  function find(id, title, cat) {
    var q = encodeURIComponent(title);
    /* 1) Google Books */
    fetch(
      "https://www.googleapis.com/books/v1/volumes?q=intitle:" +
        q +
        "&maxResults=6&printType=books",
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var urls = (j.items || [])
          .map(function (i) {
            var l = i.volumeInfo && i.volumeInfo.imageLinks;
            return l && (l.thumbnail || l.smallThumbnail);
          })
          .filter(Boolean)
          .map(function (u) {
            return u.replace("http:", "https:").replace("&edge=curl", "");
          });
        return urls;
      })
      .catch(function () {
        return [];
      })
      .then(function (urls) {
        firstGood(urls, function (u) {
          if (u) return done(id, u, true);
          /* 2) Open Library */
          fetch(
            "https://openlibrary.org/search.json?title=" +
              q +
              "&limit=6&fields=cover_i",
          )
            .then(function (r) {
              return r.json();
            })
            .then(function (j) {
              return (j.docs || [])
                .filter(function (d) {
                  return d.cover_i;
                })
                .map(function (d) {
                  return (
                    "https://covers.openlibrary.org/b/id/" +
                    d.cover_i +
                    "-L.jpg?default=false"
                  );
                });
            })
            .catch(function () {
              return [];
            })
            .then(function (u2) {
              firstGood(u2, function (u3) {
                if (u3) return done(id, u3, true);
                /* 3) generated cover (always works, even offline) */
                done(id, gen(title, cat), false);
              });
            });
        });
      });
  }

  function scan() {
    sch = false;
    document
      .querySelectorAll(".cover[data-cid]:not(.has)")
      .forEach(function (el) {
        var id = el.dataset.cid;
        if (cache[id]) return apply(id, cache[id]);
        if (busy[id]) return;
        busy[id] = 1;
        var sp = el.querySelector("span"),
          sm = el.querySelector("small"),
          title = sp ? sp.textContent : "",
          cat = sm ? sm.textContent : "IT";
        if (!title) {
          busy[id] = 0;
          return;
        }
        /* give java.js 1.5 seconds to find its own cover first */
        setTimeout(function () {
          if (
            !document.querySelector('.cover[data-cid="' + id + '"]:not(.has)')
          ) {
            busy[id] = 0;
            return;
          }
          find(id, title, cat);
        }, 1500);
      });
  }

  new MutationObserver(function () {
    if (!sch) {
      sch = true;
      requestAnimationFrame(scan);
    }
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
/* ===== COVER FIXER v2: every book always has a picture ===== */
(function () {
  var KEY = "ustp-cov3",
    real = {}, // real covers found online (saved)
    gens = {}, // generated covers (memory)
    waiting = {},
    searching = {},
    sch = false;
  try {
    real = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch (e) {}

  var COL = {
    IT: ["#2F6FB5", "#0B1F4B"],
    Mathematics: ["#7B3FA0", "#3B1D54"],
    Science: ["#0F7A73", "#094A46"],
    History: ["#A8512F", "#5E2A14"],
    Filipino: ["#B8394A", "#5F1523"],
    Fiction: ["#1F7A4D", "#0E3F28"],
    Research: ["#4A5F82", "#232F45"],
    Reference: ["#B95C00", "#6A3500"],
  };

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(real));
    } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* put a picture on one cover (centered, fills the cover) */
  function put(el, url, isGen) {
    var old = el.querySelector("img");
    if (old) {
      if (old.dataset.g) {
        old.src = url;
        if (!isGen) delete old.dataset.g;
      }
      return;
    }
    var im = new Image();
    im.alt = "";
    if (isGen) im.dataset.g = "1";
    im.onload = function () {
      if (el.querySelector("img")) return;
      el.classList.add("has");
      el.insertBefore(im, el.firstChild);
    };
    im.src = url;
  }
  function putAll(id, url, isGen) {
    document
      .querySelectorAll('.cover[data-cid="' + id + '"]')
      .forEach(function (el) {
        put(el, url, isGen);
      });
  }

  function firstGood(urls, cb, i) {
    i = i || 0;
    if (i >= urls.length) return cb(null);
    var t = new Image();
    t.onload = function () {
      if (t.naturalWidth > 60) cb(urls[i]);
      else firstGood(urls, cb, i + 1);
    };
    t.onerror = function () {
      firstGood(urls, cb, i + 1);
    };
    t.src = urls[i];
  }

  /* generated cover: title centered, fills the whole cover */
  function gen(title, cat) {
    var c = COL[cat] || COL.IT,
      lines = [],
      cur = "";
    title.split(" ").forEach(function (w) {
      if (cur && (cur + " " + w).length > 14) {
        lines.push(cur);
        cur = w;
      } else cur = (cur ? cur + " " : "") + w;
    });
    if (cur) lines.push(cur);
    lines = lines.slice(0, 6);
    var fs = lines.length > 4 ? 25 : lines.length > 3 ? 29 : 34,
      y0 = 215 - ((lines.length - 1) * fs * 1.25) / 2;
    var tx = lines
      .map(function (l, i) {
        return (
          '<text x="161" y="' +
          (y0 + i * fs * 1.25) +
          '" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="' +
          fs +
          '" fill="#fff">' +
          esc(l) +
          "</text>"
        );
      })
      .join("");
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' +
      c[0] +
      '"/><stop offset="1" stop-color="' +
      c[1] +
      '"/></linearGradient></defs>' +
      '<rect width="300" height="400" fill="url(#g)"/>' +
      '<circle cx="250" cy="60" r="95" fill="#fff" opacity=".1"/>' +
      '<circle cx="50" cy="390" r="120" fill="#fff" opacity=".08"/>' +
      '<rect width="22" height="400" fill="#000" opacity=".25"/>' +
      '<text x="161" y="50" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" letter-spacing="4" fill="#fff" opacity=".85">USTP LIBRARY</text>' +
      '<rect x="136" y="62" width="50" height="3" rx="1.5" fill="#f2b705"/>' +
      tx +
      '<rect x="136" y="338" width="50" height="3" rx="1.5" fill="#f2b705"/>' +
      '<text x="161" y="364" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" letter-spacing="3" fill="#fff" opacity=".9">' +
      esc(String(cat).toUpperCase()) +
      "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* look for a real cover online, then replace the generated one */
  function search(id, title) {
    if (searching[id]) return;
    searching[id] = 1;
    var q = encodeURIComponent(title);
    fetch(
      "https://www.googleapis.com/books/v1/volumes?q=intitle:" +
        q +
        "&maxResults=6&printType=books",
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        return (j.items || [])
          .map(function (i) {
            var l = i.volumeInfo && i.volumeInfo.imageLinks;
            return l && (l.thumbnail || l.smallThumbnail);
          })
          .filter(Boolean)
          .map(function (u) {
            return u.replace("http:", "https:").replace("&edge=curl", "");
          });
      })
      .catch(function () {
        return [];
      })
      .then(function (urls) {
        firstGood(urls, function (u) {
          if (u) {
            real[id] = u;
            save();
            return putAll(id, u, false);
          }
          fetch(
            "https://openlibrary.org/search.json?title=" +
              q +
              "&limit=6&fields=cover_i",
          )
            .then(function (r) {
              return r.json();
            })
            .then(function (j) {
              return (j.docs || [])
                .filter(function (d) {
                  return d.cover_i;
                })
                .map(function (d) {
                  return (
                    "https://covers.openlibrary.org/b/id/" +
                    d.cover_i +
                    "-L.jpg?default=false"
                  );
                });
            })
            .catch(function () {
              return [];
            })
            .then(function (u2) {
              firstGood(u2, function (u3) {
                if (u3) {
                  real[id] = u3;
                  save();
                  putAll(id, u3, false);
                }
              });
            });
        });
      });
  }

  function scan() {
    sch = false;
    document
      .querySelectorAll(".cover[data-cid]:not(.has)")
      .forEach(function (el) {
        var id = el.dataset.cid;
        if (real[id]) return put(el, real[id], false);
        if (gens[id]) return put(el, gens[id], true);
        var sp = el.querySelector("span"),
          sm = el.querySelector("small"),
          title = sp ? sp.textContent : "",
          cat = sm ? sm.textContent : "IT";
        if (!title || waiting[id]) return;
        waiting[id] = 1;
        /* give java.js 1.5s to load its own cover first */
        setTimeout(function () {
          waiting[id] = 0;
          if (real[id]) return putAll(id, real[id], false);
          var still = document.querySelector(
            '.cover[data-cid="' + id + '"]:not(.has)',
          );
          if (!still) return;
          gens[id] = gen(title, cat);
          putAll(id, gens[id], true);
          search(id, title);
        }, 1500);
      });
  }

  new MutationObserver(function () {
    if (!sch) {
      sch = true;
      requestAnimationFrame(scan);
    }
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();

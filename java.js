(function () {
  var TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);
  var FINE = 20,
    LOST = 3000;
  var PICKUP = "John Albert Paug";
  var iso = function (d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };
  var P = function (s) {
    return new Date(s + "T00:00:00");
  };
  var F = function (s) {
    return P(s).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };
  // date AND time (used in Borrowing History)
  var FT = function (ms) {
    return new Date(ms).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  var DAY = 86400000;
  function peso(n) {
    return (
      "PHP " +
      Number(n).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  var S = {
    b: [{ id: "001", d: "2026-11-03", due: "2026-11-05", r: null }],
    rv: [],
  };
  try {
    var raw = localStorage.getItem("ustp-lib");
    if (raw) S = JSON.parse(raw);
  } catch (e) {}
  S.b = S.b || [];
  S.rv = S.rv || [];
  S.cm = S.cm || [];
  delete S.rs;
  // MIGRATION: old "waiting for pick-up" approvals now start the 7-day timer right away
  S.b.forEach(function (r) {
    if (r.sc === false) {
      r.sc = true;
      r.gv = r.gv || Date.now();
      r.dt = r.dt || r.gv + 7 * DAY;
      r.d = iso(new Date(r.gv));
      r.due = iso(new Date(r.dt));
    }
  });
  var LIBS = [
    {
      n: "John Albert Paug",
      un: "johnalbert",
      pw: "lib1234",
      role: "Librarian",
    },
    { n: "Maria Santos", un: "librarian2", pw: "lib5678", role: "Librarian" },
  ];
  S.acc = (S.acc || []).filter(function (x) {
    return (
      x.role !== "Librarian" ||
      LIBS.some(function (l) {
        return l.un === x.un;
      })
    );
  });
  LIBS.forEach(function (l) {
    var f = S.acc.filter(function (x) {
      return x.un === l.un;
    })[0];
    if (f) {
      f.role = "Librarian";
      f.n = l.n;
    } else S.acc.push({ n: l.n, un: l.un, pw: l.pw, role: l.role });
  });
  function save() {
    try {
      localStorage.setItem("ustp-lib", JSON.stringify(S));
    } catch (e) {}
  }
  save();
  function $(id) {
    return document.getElementById(id);
  }
  function say(id, t) {
    $(id).textContent = t;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function initials(n) {
    return n
      .split(" ")
      .map(function (w) {
        return w[0];
      })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  function acct() {
    return S.u
      ? (S.acc || []).filter(function (x) {
          return x.un === S.u.un;
        })[0]
      : null;
  }
  function shrink(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var sz = 256,
          c = document.createElement("canvas");
        c.width = c.height = sz;
        var m = Math.min(im.width, im.height),
          sx = (im.width - m) / 2,
          sy = (im.height - m) / 2;
        c.getContext("2d").drawImage(im, sx, sy, m, m, 0, 0, sz, sz);
        cb(c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = function () {
        toast("Could not read that image.");
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function shrinkCover(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 480 / Math.max(im.width, im.height)),
          c = document.createElement("canvas");
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.85));
      };
      im.onerror = function () {
        toast("Could not read that image.");
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function putCover(id, u) {
    COV[id] = u;
    try {
      localStorage.setItem("ustp-cov", JSON.stringify(COV));
    } catch (e) {}
    document
      .querySelectorAll('.cover[data-cid="' + id + '"]')
      .forEach(function (el) {
        var o = el.querySelector("img");
        if (o) o.remove();
        var im = new Image();
        im.alt = "";
        im.onload = function () {
          el.classList.add("has");
          el.style.setProperty("--img", 'url("' + u + '")');
          el.insertBefore(im, el.firstChild);
        };
        im.src = u;
      });
  }
  function showView(v) {
    ["login", "signup", "forgot"].forEach(function (x) {
      $("v-" + x).style.display = x === v ? "block" : "none";
    });
    ["lerr", "serr", "ferr"].forEach(function (x) {
      say(x, "");
    });
  }
  var C = {
    IT: ["#2F6FB5", "#0B1F4B"],
    Mathematics: ["#7B3FA0", "#3B1D54"],
    Science: ["#0F7A73", "#094A46"],
    History: ["#A8512F", "#5E2A14"],
    Filipino: ["#B8394A", "#5F1523"],
    Fiction: ["#1F7A4D", "#0E3F28"],
    Research: ["#4A5F82", "#232F45"],
    Reference: ["#B95C00", "#6A3500"],
  };
  var B = [
    ["001", "Python Crash Course", "Eric Matthes", "IT", "978-1593279288"],
    ["002", "Head First Java", "Kathy Sierra", "IT", "978-0596009205"],
    [
      "003",
      "Database System Concepts",
      "Abraham Silberschatz",
      "IT",
      "978-0078022159",
    ],
    [
      "004",
      "JavaScript: The Good Parts",
      "Douglas Crockford",
      "IT",
      "978-0596517748",
    ],
    [
      "005",
      "Introduction to Algorithms",
      "Thomas H. Cormen",
      "IT",
      "978-0262033848",
    ],
    [
      "006",
      "Calculus: Early Transcendentals",
      "James Stewart",
      "Mathematics",
      "978-1285741550",
    ],
    [
      "007",
      "Discrete Mathematics and Its Applications",
      "Kenneth H. Rosen",
      "Mathematics",
      "978-1259676512",
    ],
    [
      "008",
      "A Brief History of Time",
      "Stephen Hawking",
      "Science",
      "978-0553380163",
    ],
    ["009", "Cosmos", "Carl Sagan", "Science", "978-0345539434"],
    [
      "010",
      "History of the Filipino People",
      "Teodoro Agoncillo",
      "History",
      "",
    ],
    [
      "011",
      "Guns, Germs, and Steel",
      "Jared Diamond",
      "History",
      "978-0393317558",
    ],
    ["012", "Noli Me Tangere", "José Rizal", "Filipino", ""],
    ["013", "El Filibusterismo", "José Rizal", "Filipino", ""],
    [
      "014",
      "The Great Gatsby",
      "F. Scott Fitzgerald",
      "Fiction",
      "978-0743273565",
    ],
    ["015", "To Kill a Mockingbird", "Harper Lee", "Fiction", "978-0061120084"],
    [
      "016",
      "Research Design",
      "John W. Creswell",
      "Research",
      "978-1506386706",
    ],
    [
      "017",
      "Merriam-Webster’s Collegiate Dictionary",
      "Merriam-Webster",
      "Reference",
      "978-0877798095",
    ],
    [
      "018",
      "National Geographic Atlas of the World",
      "National Geographic",
      "Reference",
      "",
    ],
  ];
  var OUT = ["005", "011", "014"];
  [
    ["019", "Clean Code", "Robert C. Martin", "IT", "978-0132350884"],
    ["020", "The Pragmatic Programmer", "Andrew Hunt", "IT", "978-0135957059"],
    [
      "021",
      "Computer Networking: A Top-Down Approach",
      "James F. Kurose",
      "IT",
      "",
    ],
    ["022", "Operating System Concepts", "Abraham Silberschatz", "IT", ""],
    ["023", "Eloquent JavaScript", "Marijn Haverbeke", "IT", ""],
    ["024", "Design Patterns", "Erich Gamma", "IT", ""],
    [
      "025",
      "Linear Algebra and Its Applications",
      "David C. Lay",
      "Mathematics",
      "",
    ],
    ["026", "Elementary Statistics", "Mario F. Triola", "Mathematics", ""],
    ["027", "Precalculus", "Michael Sullivan", "Mathematics", ""],
    [
      "028",
      "Introduction to Probability",
      "Joseph K. Blitzstein",
      "Mathematics",
      "",
    ],
    ["029", "The Selfish Gene", "Richard Dawkins", "Science", ""],
    ["030", "Silent Spring", "Rachel Carson", "Science", ""],
    [
      "031",
      "A Short History of Nearly Everything",
      "Bill Bryson",
      "Science",
      "",
    ],
    [
      "032",
      "Astrophysics for People in a Hurry",
      "Neil deGrasse Tyson",
      "Science",
      "",
    ],
    ["033", "On the Origin of Species", "Charles Darwin", "Science", ""],
    [
      "034",
      "Sapiens: A Brief History of Humankind",
      "Yuval Noah Harari",
      "History",
      "978-0062316097",
    ],
    ["035", "The Diary of a Young Girl", "Anne Frank", "History", ""],
    [
      "036",
      "The Philippines: A Past Revisited",
      "Renato Constantino",
      "History",
      "",
    ],
    ["037", "Florante at Laura", "Francisco Balagtas", "Filipino", ""],
    ["038", "Dekada '70", "Lualhati Bautista", "Filipino", ""],
    ["039", "Mga Ibong Mandaragit", "Amado V. Hernandez", "Filipino", ""],
    ["040", "1984", "George Orwell", "Fiction", "978-0451524935"],
    ["041", "Pride and Prejudice", "Jane Austen", "Fiction", "978-0141439518"],
    [
      "042",
      "Harry Potter and the Sorcerer's Stone",
      "J.K. Rowling",
      "Fiction",
      "978-0590353427",
    ],
    ["043", "The Hobbit", "J.R.R. Tolkien", "Fiction", "978-0547928227"],
    [
      "044",
      "The Little Prince",
      "Antoine de Saint-Exupery",
      "Fiction",
      "978-0156012195",
    ],
    ["045", "The Alchemist", "Paulo Coelho", "Fiction", "978-0062315007"],
    ["046", "The Craft of Research", "Wayne C. Booth", "Research", ""],
    ["047", "Roget's Thesaurus", "Barbara Ann Kipfer", "Reference", ""],
    [
      "048",
      "The Chicago Manual of Style",
      "University of Chicago Press",
      "Reference",
      "",
    ],
  ].forEach(function (b) {
    B.push(b);
  });
  (S.x || []).forEach(function (b) {
    B.push(b);
  });
  var ALL = B.slice();
  B = B.filter(function (b) {
    return (S.rm || []).indexOf(b[0]) < 0;
  });
  var vres = "";
  var pendingWelcome = false;
  var fbSkip = {};
  var cat = "All",
    q = "",
    avOnly = false;
  var rd = { id: null, p: 0 },
    det = null;
  var I = {
    bell: '<path d="M6 17V11a6 6 0 0112 0v6l2 2H4z"/><path d="M10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    book: '<path d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z"/><path d="M12 6v14"/>',
    borrow:
      '<path d="M4 5h9a3 3 0 013 3v11H7a3 3 0 01-3-3z"/><path d="M17 12h4"/><path d="M19 9l3 3-3 3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    ret: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    money:
      '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
    mega: '<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M18 9a4 4 0 010 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5"/><path d="M12 17h.01"/>',
  };
  var R = [
    ["dashboard", "Dashboard", "home"],
    ["books", "Book Catalog", "book"],
    ["categories", "Categories", "grid", "S"],
    ["reservations", "Book Reservation", "mark"],
    ["borrowed", "My Borrowed Books", "ret", "S"],
    ["history", "Borrowing History", "clock", "S"],
    ["notifications", "Notifications", "bell"],
    ["announcements", "Announcements", "mega"],
    ["fines", "Fines", "money", "S"],
    ["profile", "My Profile", "user"],
    ["help", "Help", "help", "S"],
    ["lib", "Librarian Panel", "grid", "L"],
    ["loans", "Student Borrowers", "clock", "L"],
    ["manage", "Manage Books", "book", "L"],
    ["addbook", "Add Book", "borrow", "L"],
    ["verify", "Scan QR", "mark", "L"],
  ];
  var T = [
    ["books", "Book Catalog", "Search and borrow books", "#2F6FB5", "book"],
    [
      "reservations",
      "Book Reservation",
      "Reserve a borrowed book",
      "#A8512F",
      "mark",
    ],
    [
      "borrowed",
      "My Borrowed Books",
      "Due dates and live timer",
      "#0F7A73",
      "ret",
    ],
    ["history", "Borrowing History", "Past transactions", "#4A5F82", "clock"],
    [
      "notifications",
      "Notifications",
      "Replies, reminders and messages",
      "#B95C00",
      "bell",
    ],
    ["categories", "Categories", "Fiction, Science, IT", "#7B3FA0", "grid"],
    ["announcements", "Announcements", "Library news", "#1F7A4D", "mega"],
    ["profile", "My Profile", "Account information", "#B8394A", "user"],
  ];
  var LIBTILES = [
    "books",
    "reservations",
    "notifications",
    "announcements",
    "profile",
  ];
  var svg = function (k) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[k] + "</svg>";
  };
  function find(id) {
    return ALL.filter(function (b) {
      return b[0] === id;
    })[0];
  }
  function isLib() {
    return !!(S.u && S.u.role === "Librarian");
  }
  function allActive() {
    return S.b.filter(function (r) {
      return !r.r;
    });
  }
  function my() {
    if (isLib() || !S.u) return [];
    return S.b.filter(function (r) {
      return r.u === S.u.un;
    });
  }
  function active() {
    return my().filter(function (r) {
      return !r.r;
    });
  }
  function mine(id) {
    return active().filter(function (r) {
      return r.id === id;
    })[0];
  }
  function isOut(id) {
    return (
      (OUT.indexOf(id) > -1 && (S.av || []).indexOf(id) < 0) ||
      S.b.some(function (r) {
        return r.id === id && !r.r;
      })
    );
  }
  function status(id) {
    if (mine(id)) return "mine";
    return isOut(id) ? "out" : "in";
  }
  function resOf(id) {
    return (S.rv || []).filter(function (x) {
      return x.id === id;
    })[0];
  }
  function myRes(id) {
    var r = resOf(id);
    return r && S.u && r.u === S.u.un ? r : null;
  }
  function lockedForMe(id) {
    var r = resOf(id);
    return !!(r && !isLib() && S.u && r.u !== S.u.un);
  }
  function myReservations() {
    return (S.rv || []).filter(function (x) {
      return S.u && x.u === S.u.un;
    });
  }
  function notifyReserver(id) {
    var r = resOf(id),
      b = find(id);
    if (!r || !b) return;
    msg(
      r.u,
      "Good news! " +
        b[1] +
        " is now available and ready for you. It is reserved for you, so no other student can borrow it. Please press Borrow in the Book Catalog and send your request to the librarian.",
    );
  }
  function stuOnly() {
    if (isLib()) {
      toast("Librarians cannot borrow or reserve books. Students only.");
      return true;
    }
    return false;
  }
  function msg(to, m) {
    S.m = S.m || [];
    S.m.push({ to: to, t: iso(TODAY), m: m });
    if (S.m.length > 100) S.m.shift();
    save();
  }
  function inbox() {
    return (S.m || []).filter(function (x) {
      return !S.u || x.to === "all" || x.to === S.u.un;
    });
  }
  var CTYPES = [
    ["system", "Problem with the system"],
    ["book", "Problem with a book"],
    ["request", "Question about my request"],
    ["suggest", "Suggestion"],
    ["other", "Other"],
  ];
  function ctype(k) {
    var t = CTYPES.filter(function (x) {
      return x[0] === k;
    })[0];
    return t ? t[1] : "Other";
  }
  function concerns() {
    return S.cm || [];
  }
  function openConcerns() {
    return concerns().filter(function (x) {
      return x.st === "open";
    });
  }
  function myConcerns() {
    return concerns().filter(function (x) {
      return S.u && x.u === S.u.un;
    });
  }
  function when(x) {
    return x.ts
      ? new Date(x.ts).toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          hour: "numeric",
          minute: "2-digit",
        })
      : F(x.d);
  }
  function badge(k, L) {
    var n = 0;
    if (L && k === "reservations") n = pendingAll().length;
    else if (L && k === "notifications") n = openConcerns().length;
    return n
      ? '<span class="badge" aria-label="' + n + ' waiting">' + n + "</span>"
      : "";
  }
  function showReply(i) {
    var x = (S.cm || [])[i];
    if (!x) return;
    var b = x.id && find(x.id);
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">Reply to ' +
        esc(x.n) +
        "</h2>" +
        '<p class="empty" style="padding:0"><strong>' +
        esc(ctype(x.ty)) +
        "</strong>" +
        (b ? " · " + esc(b[1]) : "") +
        "<br>“" +
        esc(x.m) +
        "”</p>" +
        '<textarea id="rp" class="in" rows="4" maxlength="300" aria-label="Your reply" placeholder="Write your reply to the student" style="min-height:96px;padding:10px 12px;resize:vertical"></textarea>' +
        '<div class="racts">' +
        btn("sendreply", i, "Send reply") +
        btn("closemd", "", "Cancel", 1) +
        "</div></div>",
    );
    setTimeout(function () {
      if ($("rp")) $("rp").focus();
    }, 50);
  }
  function checkLibAlert() {
    if (!S.u || !isLib() || $("md").className === "on") return;
    var l = concerns().filter(function (x) {
      return x.st === "open" && !x.seen;
    });
    if (!l.length) return;
    l.forEach(function (x) {
      x.seen = true;
    });
    save();
    var x = l[l.length - 1],
      b = x.id && find(x.id);
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">New message from a student</h2>' +
        '<p style="margin:0"><strong>' +
        esc(x.n) +
        "</strong> · " +
        esc(ctype(x.ty)) +
        (b ? " · " + esc(b[1]) : "") +
        "</p>" +
        '<p style="margin:0;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);line-height:1.5">“' +
        esc(x.m) +
        "”</p>" +
        (l.length > 1
          ? '<p class="empty" style="padding:0">+ ' +
            (l.length - 1) +
            " more new message(s).</p>"
          : "") +
        '<div class="racts">' +
        btn("gonotif", "", "Open Notifications") +
        btn("closemd", "", "Later", 1) +
        "</div></div>",
    );
  }
  function studentForm() {
    if (isLib()) return "";
    var opts = CTYPES.map(function (t) {
      return '<option value="' + t[0] + '">' + t[1] + "</option>";
    }).join("");
    var bks = B.map(function (b) {
      return '<option value="' + b[0] + '">' + esc(b[1]) + "</option>";
    }).join("");
    var list = myConcerns()
      .slice()
      .reverse()
      .map(function (x) {
        var b = x.id && find(x.id);
        return (
          '<div class="note"><span class="nd"></span><p><strong>' +
          esc(ctype(x.ty)) +
          "</strong>" +
          (b ? " · " + esc(b[1]) : "") +
          "<small>" +
          F(x.d) +
          "</small><br>“" +
          esc(x.m) +
          "”<br>" +
          (x.st === "open"
            ? '<span class="pill me2">Waiting for the librarian</span>'
            : '<span class="pill ok">Answered</span>' +
              (x.rp
                ? '<br><span style="color:var(--mut)">Librarian: ' +
                  esc(x.rp) +
                  "</span>"
                : "")) +
          "</p></div>"
        );
      })
      .join("");
    return (
      '<div class="box"><h2>Send a message to the librarian</h2><p class="empty" style="padding:0 0 12px">Report a problem with the system or a book, ask about your request, or send a suggestion. The librarian will see it right away.</p>' +
      '<label>What is it about?<select id="ct" class="in">' +
      opts +
      "</select></label>" +
      '<label>Book (required for book problems)<select id="cb" class="in"><option value="">None</option>' +
      bks +
      "</select></label>" +
      '<label>Your message<textarea id="cmsg" class="in" rows="4" maxlength="400" placeholder="Describe what happened or what you need" style="min-height:96px;padding:10px 12px;resize:vertical"></textarea></label>' +
      btn("sendconcern", "", "Send to librarian") +
      "</div>" +
      '<div class="box"><h2>My messages</h2>' +
      (list || '<p class="empty">You have not sent any messages yet.</p>') +
      "</div>"
    );
  }
  function allAnn() {
    return (S.ann || []).concat(ANN);
  }
  function myPending() {
    return (S.q || []).filter(function (x) {
      return S.u && x.u === S.u.un && x.st === "pending" && x.ty !== "reserve";
    });
  }
  function hasPending(id) {
    return myPending().some(function (x) {
      return x.id === id;
    });
  }
  function pendingAll() {
    return (S.q || []).filter(function (x) {
      return x.st === "pending" && x.ty !== "reserve";
    });
  }
  function dlg(html) {
    $("mdb").innerHTML = html;
    $("md").className = "on";
  }
  function rulesHtml() {
    return (
      '<ul style="margin:0;padding-left:20px;line-height:1.7;text-align:left">' +
      "<li>Return the book in person to the librarian on or before the due date.</li>" +
      "<li>Late return: " +
      peso(FINE) +
      " penalty for each borrowed book.</li>" +
      "<li>Lost or damaged book: you must pay " +
      peso(LOST) +
      " for each book.</li>" +
      "<li>Penalty payments go to the school (school funds and school events).</li></ul>"
    );
  }
  // Short reminder box: where to get an approved book
  function getBox() {
    return (
      '<div class="warn"><strong>📍 Get your book from the librarian:</strong> <strong>' +
      PICKUP +
      "</strong>. Tell them your name. Your 7-day timer starts the moment your request is approved.</div>"
    );
  }
  function pickupNote() {
    return isLib() ? "" : getBox();
  }
  function showWelcome() {
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">Welcome, ' +
        esc(S.u.name) +
        "!</h2>" +
        '<p class="empty" style="padding:0">Thank you for using the USTP Library System. Please read the guidelines first:</p>' +
        '<ul style="margin:0;padding-left:20px;line-height:1.7">' +
        "<li>You can borrow up to <strong>3 books</strong> at a time.</li>" +
        "<li>Loan period is <strong>7 days</strong>.</li>" +
        "<li>Press <strong>Borrow</strong> in the Book Catalog and send a message to the librarian.</li>" +
        "<li>When the librarian <strong>approves</strong> your request, your <strong>7-day timer starts automatically</strong> and you can see it on the book.</li>" +
        "<li>Then go to the librarian <strong>" +
        PICKUP +
        "</strong> to get your book.</li>" +
        "<li>If a book is not available, press <strong>Reserve</strong>. You will see how much time is left before it is returned. When it is returned, you will get a message and only you can borrow it. One student per book.</li>" +
        "<li>Return books in person to the librarian on or before the due date.</li>" +
        "<li>Late return: " +
        peso(FINE) +
        " per book.</li>" +
        "<li>Lost or damaged book: " +
        peso(LOST) +
        " per book.</li>" +
        "<li>Found a problem or want to suggest something? Send a message to the librarian in <strong>Help</strong>.</li></ul>" +
        btn("closemd", "", "I understand") +
        "</div>",
    );
  }
  function stars(n) {
    return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
  }
  function dur(ms) {
    var s = Math.max(1, Math.round(ms / 1000));
    if (s < 60) return s + " second" + (s > 1 ? "s" : "");
    var m = Math.floor(s / 60);
    if (m < 60) {
      var r = s % 60;
      return (
        m +
        " minute" +
        (m > 1 ? "s" : "") +
        (r ? " " + r + " second" + (r > 1 ? "s" : "") : "")
      );
    }
    var h = Math.floor(m / 60);
    m = m % 60;
    return (
      h +
      " hour" +
      (h > 1 ? "s" : "") +
      (m ? " " + m + " minute" + (m > 1 ? "s" : "") : "")
    );
  }
  function showFeedback(i) {
    var x = S.q[i],
      b = find(x.id),
      st = "";
    for (var n = 1; n <= 5; n++) {
      st +=
        '<button data-a="star" data-id="' +
        i +
        '" data-n="' +
        n +
        '" aria-label="' +
        n +
        ' star" style="border:0;background:none;cursor:pointer;font-size:44px;line-height:1;padding:4px;min-height:48px;color:#c3cad9">★</button>';
    }
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:center"><h2 style="margin:0">Your request was approved!</h2>' +
        '<p style="margin:0">Your request for <strong>' +
        esc(b ? b[1] : x.id) +
        "</strong> was approved in <strong>" +
        dur(x.at - x.ts) +
        "</strong>.</p>" +
        '<p style="margin:0">⏱ Your <strong>7-day timer has started</strong>. Go to the librarian <strong>' +
        PICKUP +
        "</strong> to get your book.</p>" +
        '<p style="margin:0"><strong>How is the system and our fast service to students?</strong></p>' +
        '<div style="display:flex;justify-content:center;gap:2px">' +
        st +
        "</div>" +
        '<p class="empty" style="padding:0;text-align:center">Tap a star to rate: 1 = poor, 5 = excellent</p>' +
        btn("fblater", i, "Maybe later", 1) +
        "</div>",
    );
  }
  function checkFeedback() {
    if (!S.u || isLib() || pendingWelcome) return;
    if ($("md").className === "on") return;
    var l = S.q || [];
    for (var i = 0; i < l.length; i++) {
      var x = l[i];
      if (
        x.u === S.u.un &&
        x.ty === "borrow" &&
        x.st === "approved" &&
        x.ts &&
        x.at &&
        !x.fb &&
        !fbSkip[i]
      ) {
        showFeedback(i);
        return;
      }
    }
  }
  function showBorrowBox(id) {
    var b = find(id);
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">Approach message</h2>' +
        '<p class="empty" style="padding:0">Write a message to the librarian for <strong>' +
        esc(b[1]) +
        "</strong>. The librarian will decide if you can borrow it.</p>" +
        '<textarea id="bm" class="in" rows="4" maxlength="300" aria-label="Message to the librarian" placeholder="Example: Good day! I would like to borrow this book for my project." style="min-height:96px;padding:10px 12px;resize:vertical"></textarea>' +
        '<div class="racts">' +
        btn("sendborrow", id, "Send message") +
        btn("closemd", "", "Cancel", 1) +
        "</div></div>",
    );
    setTimeout(function () {
      if ($("bm")) $("bm").focus();
    }, 50);
  }
  function showSent(b) {
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">Message sent to the librarian</h2>' +
        '<p class="empty" style="padding:0">Your request for <strong>' +
        esc(b[1]) +
        "</strong> is waiting for the librarian’s decision. You will get a reply in Notifications.</p>" +
        '<p style="margin:0"><strong>If approved:</strong> your <strong>7-day timer starts automatically</strong> and shows on the book. Then get your book from the librarian <strong>' +
        PICKUP +
        "</strong>.</p>" +
        '<p style="margin:0"><strong>Rules:</strong></p>' +
        rulesHtml() +
        btn("closemd", "", "I understand") +
        "</div>",
    );
  }
  // popup shown right after a student presses Reserve
  function showReserved(id) {
    var b = find(id);
    if (!b) return;
    dlg(
      '<div class="qrbox" style="align-items:stretch;text-align:left"><h2 style="margin:0">Reserved: ' +
        esc(b[1]) +
        "</h2>" +
        '<p class="empty" style="padding:0">This book is still borrowed by another student. Here is how much time is left before the 7-day loan ends:</p>' +
        resTimer(id) +
        '<p style="margin:0">You will get a message when the book is returned. It will be saved for you, so no other student can borrow it. Then press <strong>Borrow</strong> to send your request.</p>' +
        '<div class="racts">' +
        btn("closemd", "", "OK") +
        "</div></div>",
    );
  }
  var COV = {},
    TRY = {};
  try {
    COV = JSON.parse(localStorage.getItem("ustp-cov") || "{}");
  } catch (e) {}
  function cover(b) {
    var c = C[b[3]],
      u = COV[b[0]];
    return (
      '<div class="cover' +
      (u ? " has" : "") +
      '" data-cid="' +
      b[0] +
      '" style="--a:' +
      c[0] +
      ";--b:" +
      c[1] +
      (u ? ";--img:url('" + u + "')" : "") +
      '">' +
      (u
        ? '<img src="' +
          u +
          '" alt="Cover of ' +
          esc(b[1]) +
          '" onerror="this.parentNode.classList.remove(\'has\');this.remove()">'
        : "") +
      "<small>" +
      b[3] +
      "</small><span>" +
      b[1] +
      "</span><em>No. " +
      b[0] +
      "</em></div>"
    );
  }
  function setCov(id, u) {
    document
      .querySelectorAll('.cover[data-cid="' + id + '"]')
      .forEach(function (el) {
        if (el.querySelector("img")) return;
        var im = new Image();
        im.alt = "";
        im.onload = function () {
          el.classList.add("has");
          el.style.setProperty("--img", 'url("' + u + '")');
          el.insertBefore(im, el.firstChild);
        };
        im.src = u;
      });
  }
  function saveCov(id, u) {
    COV[id] = u;
    try {
      localStorage.setItem("ustp-cov", JSON.stringify(COV));
    } catch (e) {}
    setCov(id, u);
  }
  function remote(b) {
    fetch(
      "https://openlibrary.org/search.json?title=" +
        encodeURIComponent(b[1]) +
        "&author=" +
        encodeURIComponent(b[2]) +
        "&limit=1&fields=cover_i",
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var d = j.docs && j.docs[0];
        if (d && d.cover_i)
          saveCov(
            b[0],
            "https://covers.openlibrary.org/b/id/" +
              d.cover_i +
              "-M.jpg?default=false",
          );
      })
      .catch(function () {});
  }
  function loadCovers() {
    B.forEach(function (b) {
      var id = b[0];
      if (COV[id] || TRY[id]) return;
      TRY[id] = 1;
      var p = "covers/" + id + ".jpg",
        t = new Image();
      t.onload = function () {
        saveCov(id, p);
      };
      t.onerror = function () {
        remote(b);
      };
      t.src = p;
    });
  }
  function btn(a, id, l, g) {
    return (
      '<button class="btn' +
      (g ? " ghost" : "") +
      '" data-a="' +
      a +
      '" data-id="' +
      id +
      '">' +
      l +
      "</button>"
    );
  }
  function sbtn(a, id, l, g) {
    return btn(a, id, l, g).replace('class="btn', 'class="sm btn');
  }
  function pill(id) {
    var s = status(id);
    if (s === "in" && lockedForMe(id))
      return '<span class="pill no">Reserved for another student</span>';
    if (s === "in" && myRes(id))
      return '<span class="pill ok">Ready for you</span>';
    return s === "in"
      ? '<span class="pill ok">Available</span>'
      : s === "mine"
        ? '<span class="pill me2">Approved · timer running</span>'
        : '<span class="pill no">Not available</span>';
  }
  function card(b) {
    var id = b[0],
      s = status(id),
      actions,
      tm = "";
    if (s === "mine") {
      actions =
        '<div class="acts"><button class="btn ghost" disabled>Borrowed</button></div>';
      tm =
        liveTimer(mine(id)) +
        '<p class="get">📍 Get it from <strong>' +
        PICKUP +
        "</strong></p>";
    } else {
      var lock = isLib();
      // NEW: live timer of the current borrower for every "Not available" book
      if (s === "out") tm = outTimer(id);
      var bor =
        s === "in" && !lock && !lockedForMe(id)
          ? btn("borrow", id, "Borrow")
          : '<button class="btn" disabled>Borrow</button>';
      var res =
        lock || s === "in"
          ? '<button class="btn ghost" disabled>Reserve</button>'
          : myRes(id)
            ? btn("unres", id, "Cancel", 1)
            : resOf(id)
              ? '<button class="btn ghost" disabled>Reserved</button>'
              : btn("res", id, "Reserve", 1);
      actions = '<div class="acts">' + bor + res + "</div>";
    }
    return (
      '<article class="bk"><button class="cb" data-a="view" data-id="' +
      id +
      '" aria-label="View details of ' +
      b[1] +
      '">' +
      cover(b) +
      "</button><h3>" +
      b[1] +
      "</h3><p>" +
      b[2] +
      "</p>" +
      tm +
      pill(id) +
      actions +
      "</article>"
    );
  }
  function daysLeft(r) {
    return Math.round((P(r.due) - TODAY) / DAY);
  }
  function fine(r) {
    var end = r.r ? P(r.r) : TODAY;
    return end > P(r.due) ? FINE : 0;
  }
  function head(t, s) {
    return '<div class="ban"><h1>' + t + "</h1><p>" + s + "</p></div>";
  }
  var CI = {
    IT: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    Mathematics:
      '<path d="M4 7h6M7 4v6"/><path d="M14 7h6"/><path d="M4 17h6"/><path d="M14 14l6 6M20 14l-6 6"/>',
    Science:
      '<path d="M9 3h6M10 3v6L4 19a2 2 0 002 3h12a2 2 0 002-3l-6-10V3"/>',
    History:
      '<path d="M3 21h18M5 21V10M10 21V10M14 21V10M19 21V10M3 10l9-6 9 6"/>',
    Filipino:
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    Fiction:
      '<path d="M12 3l2.5 6 6.5.5-5 4.3 1.6 6.4L12 17l-5.6 3.2L8 13.8 3 9.5l6.5-.5z"/>',
    Research: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    Reference: I.book,
  };
  var ANN = [
    [
      "Library closed on Nov 30",
      "Holiday break. Regular hours resume the next day.",
    ],
    ["New arrivals", "Fresh IT and Research titles are now in the catalog."],
    [
      "Return reminder",
      "Please return borrowed books on or before the due date.",
    ],
  ];
  function note(m) {
    S.n = S.n || [];
    S.n.push({ t: iso(TODAY), m: m });
    if (S.n.length > 40) S.n.shift();
  }
  // returns true when the reservation was made
  function reserve(id) {
    var b = find(id);
    if (!b || !S.u) return false;
    if (status(id) !== "out") {
      toast("This book is available. You can borrow it now.");
      return false;
    }
    if (resOf(id)) {
      toast(
        myRes(id)
          ? "You already reserved this book."
          : "Sorry, this book is already reserved by another student.",
      );
      return false;
    }
    S.rv.push({ id: id, u: S.u.un, n: S.u.name, d: iso(TODAY) });
    note("Reserved " + b[1] + ". We will message you when it is returned.");
    save();
    toast("Reserved: " + b[1]);
    return true;
  }
  function stPill(st) {
    return st === "pending"
      ? '<span class="pill me2">Pending</span>'
      : st === "approved"
        ? '<span class="pill ok">Approved</span>'
        : st === "cancelled"
          ? '<span class="pill no">Cancelled</span>'
          : st === "na"
            ? '<span class="pill no">Not available</span>'
            : '<span class="pill no">Reserved by someone else</span>';
  }
  function reqRows(mode) {
    var l = (S.q || [])
      .map(function (x, i) {
        return [x, i];
      })
      .filter(function (p) {
        return (
          p[0].ty !== "reserve" &&
          (p[0].st === "pending") === (mode === "pending")
        );
      })
      .reverse();
    return (
      l
        .map(function (p) {
          var x = p[0],
            i = p[1],
            b = find(x.id);
          return (
            '<div class="row" style="align-items:flex-start">' +
            (b ? cover(b) : "") +
            '<div class="t"><strong>' +
            esc(x.n) +
            "</strong> wants to borrow<br><strong>" +
            esc(b ? b[1] : x.id) +
            "</strong>" +
            (b
              ? ' <span style="color:var(--mut)">by ' + esc(b[2]) + "</span>"
              : "") +
            '<div style="margin:8px 0;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);line-height:1.5"><small style="color:var(--mut);display:block;margin-bottom:2px">Message from the student</small>“' +
            esc(x.m) +
            "”</div>" +
            '<small style="color:var(--mut)">' +
            when(x) +
            "</small> " +
            stPill(x.st) +
            "</div>" +
            (x.st === "pending"
              ? '<div class="racts">' +
                sbtn("qok", i, "Approve") +
                sbtn("qna", i, "Not available", 1) +
                sbtn("qtk", i, "Reserved already", 1) +
                "</div>"
              : "") +
            "</div>"
          );
        })
        .join("") ||
      '<p class="empty">' +
        (mode === "pending"
          ? "No requests waiting for your decision."
          : "No past requests yet.") +
        "</p>"
    );
  }
  function reminders() {
    var out = [];
    inbox()
      .slice()
      .reverse()
      .forEach(function (x) {
        out.push({ m: "Librarian (" + F(x.t) + "): " + x.m });
      });
    myPending().forEach(function (x) {
      var b = find(x.id);
      if (b)
        out.push({
          m:
            "Waiting for the librarian to review your request for " +
            b[1] +
            ".",
        });
    });
    active().forEach(function (r) {
      var b = find(r.id),
        d = daysLeft(r);
      if (d < 0)
        out.push({
          m:
            b[1] +
            " is overdue by " +
            -d +
            " day(s). Penalty: " +
            peso(FINE) +
            " for this book. Please return it to the librarian.",
        });
      else if (d === 0) out.push({ m: b[1] + " is due today." });
      else if (d <= 2)
        out.push({
          m: b[1] + " is due in " + d + " day(s), on " + F(r.due) + ".",
        });
      else
        out.push({
          m: b[1] + " is due on " + F(r.due) + " (" + d + " days left).",
        });
    });
    myReservations().forEach(function (r) {
      var b = find(r.id);
      if (!b) return;
      out.push(
        status(r.id) === "in"
          ? {
              m:
                "Ready for you: " +
                b[1] +
                " is now available. It is reserved for you. Go to the library and borrow it.",
            }
          : {
              m:
                "You reserved " +
                b[1] +
                ". We will message you when it is returned.",
            },
      );
    });
    return out;
  }
  function unread() {
    if (isLib()) return openConcerns().length;
    var over = active().filter(function (r) {
      return daysLeft(r) < 0;
    }).length;
    return (
      over +
      Math.max(0, (S.n || []).length - (S.seen || 0)) +
      Math.max(0, inbox().length - (S.seenm || 0))
    );
  }
  // ===== LIVE 7-DAY TIMER: starts automatically when the librarian approves =====
  function endOf(r) {
    return r.dt || P(r.due).getTime();
  }
  function startOf(r) {
    return r.gv || P(r.d).getTime();
  }
  function cd(ms) {
    var o = ms < 0;
    ms = Math.abs(ms);
    var d = Math.floor(ms / DAY),
      h = Math.floor((ms % DAY) / 36e5),
      m = Math.floor((ms % 36e5) / 6e4),
      s = Math.floor((ms % 6e4) / 1e3);
    return (
      (o ? "Overdue " : "") +
      d +
      "d " +
      h +
      "h " +
      m +
      "m " +
      s +
      "s" +
      (o ? "" : " left")
    );
  }
  // second argument "other" = timer of ANOTHER student's loan (used in Book Reservation)
  function liveTimer(r, other) {
    if (r.r) return '<span class="pill ok">Returned: timer stopped</span>';
    var bk = find(r.id);
    return (
      '<div class="tm" data-end="' +
      endOf(r) +
      '" data-start="' +
      startOf(r) +
      '" data-t="' +
      esc(bk ? bk[1] : r.id) +
      '" data-k="' +
      r.id +
      "-" +
      (r.u || "x") +
      '"' +
      (other ? ' data-o="1"' : "") +
      ' role="timer"><span class="timer"></span><span class="tbar" aria-hidden="true"><i></i></span></div>'
    );
  }
  // the current borrower's loan of a book (the one that is not returned yet)
  function loanOf(id) {
    return S.b.filter(function (r) {
      return r.id === id && !r.r;
    })[0];
  }
  // remaining time of the current borrower (same 7-day timer style as the other timers)
  function resTimer(id) {
    var l = loanOf(id);
    if (!l)
      return '<span class="pill no">Timer not started yet. The librarian will update this book.</span>';
    return (
      '<small style="color:var(--mut);display:block;margin-top:4px">Time left of the current borrower (7 days):</small>' +
      liveTimer(l, true)
    );
  }
  // NEW: live timer for the catalog card of a borrowed (Not available) book
  function outTimer(id) {
    var l = loanOf(id);
    if (!l) return "";
    return (
      '<small style="color:var(--mut);display:block;margin-top:6px">Expected return in:</small>' +
      liveTimer(l, true)
    );
  }
  var lastMs = {};
  function tick() {
    document.querySelectorAll(".tm").forEach(function (el) {
      var end = +el.dataset.end,
        st = +el.dataset.start,
        ms = end - Date.now(),
        t = el.querySelector(".timer"),
        bar = el.querySelector(".tbar i");
      t.textContent = "⏱ " + cd(ms);
      el.className =
        "tm " +
        (ms < 0 ? "over" : ms < DAY ? "low" : ms < 3 * DAY ? "mid" : "good");
      bar.style.width =
        Math.max(0, Math.min(100, (ms / Math.max(1, end - st)) * 100)) + "%";
      var k = el.dataset.k;
      if (!isLib() && !el.dataset.o && lastMs[k] > 0 && ms <= 0)
        toast(
          "⏰ Time is up for " +
            el.dataset.t +
            ". Please return it to " +
            PICKUP +
            ".",
        );
      if (!el.dataset.o) lastMs[k] = ms;
    });
  }
  setInterval(tick, 1000);
  function annBox(n) {
    return (
      '<div class="box annTop"><h2>📢 Announcements <a class="more" href="#announcements">View all</a></h2>' +
      allAnn()
        .slice(0, n || 3)
        .map(function (x) {
          return (
            '<div class="row"><div class="t"><strong>' +
            esc(x[0]) +
            '</strong><br><span style="color:var(--mut)">' +
            esc(x[1]) +
            "</span></div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  var V = {
    dashboard: function () {
      var L = isLib(),
        A = L ? allActive() : active();
      var picked = L ? [] : active();
      var fresh = picked.filter(function (r) {
        return Date.now() - startOf(r) < DAY;
      });
      var side;
      if (L) {
        side =
          '<div class="warn">Pending student requests: <strong>' +
          pendingAll().length +
          '</strong> <a href="#reservations">Review</a></div>' +
          '<div class="warn">Open student messages: <strong>' +
          openConcerns().length +
          '</strong> <a href="#notifications">Open</a></div>';
      } else {
        var row = function (r) {
          var bk = find(r.id);
          if (!bk) return "";
          return (
            '<div class="row"><div style="width:64px;flex:none">' +
            cover(bk) +
            '</div><div class="t"><strong>' +
            esc(bk[1]) +
            '</strong><br><span style="color:var(--mut)">Due ' +
            F(r.due) +
            "</span><br>" +
            liveTimer(r) +
            "</div></div>"
          );
        };
        side =
          (fresh.length
            ? '<div class="warn">✅ Approved: <strong>' +
              fresh.length +
              "</strong> book(s). Timer is running. Go to the librarian <strong>" +
              esc(PICKUP) +
              "</strong> to get your book.</div>"
            : "") +
          '<div class="box"><h2>My books & timers <a class="more" href="#borrowed">View all</a></h2>' +
          (picked.map(row).join("") ||
            '<p class="empty">No borrowed books. <a href="#books">Browse books</a></p>') +
          "</div>";
      }
      var avail = B.filter(function (x) {
        return status(x[0]) === "in" && !lockedForMe(x[0]);
      })
        .slice(0, 6)
        .map(function (b) {
          return (
            '<button class="cb" data-a="view" data-id="' +
            b[0] +
            '" aria-label="View details of ' +
            esc(b[1]) +
            '">' +
            cover(b) +
            "</button>"
          );
        })
        .join("");
      var tiles = T.filter(function (t) {
        return !L || LIBTILES.indexOf(t[0]) > -1;
      })
        .map(function (t) {
          var nm = t[1],
            sub = t[2];
          if (L && t[0] === "reservations") {
            nm = "Book Requests";
            sub = "Approve or decline borrowers";
          }
          if (L && t[0] === "notifications")
            sub = "Student messages and complaints";
          return (
            '<a class="tile" href="#' +
            t[0] +
            '" style="background:' +
            t[3] +
            '">' +
            svg(t[4]) +
            "<span>" +
            nm +
            "<small>" +
            sub +
            "</small></span></a>"
          );
        })
        .join("");
      var availN = B.filter(function (x) {
        return status(x[0]) === "in";
      }).length;
      var fineTotal = my().reduce(function (s, r) {
        return s + fine(r);
      }, 0);
      var stats = (
        L
          ? [
              ["Total Books", B.length],
              ["Available", availN],
              ["Borrowed now", A.length],
              [
                "Overdue",
                A.filter(function (r) {
                  return endOf(r) < Date.now();
                }).length,
              ],
            ]
          : [
              ["Available books", availN],
              ["Borrowed now", picked.length],
              ["Pending requests", myPending().length],
              ["Fines (PHP)", fineTotal],
            ]
      )
        .map(function (s) {
          return (
            '<div class="box st"><b data-n="' +
            s[1] +
            '">' +
            s[1] +
            "</b><span>" +
            s[0] +
            "</span></div>"
          );
        })
        .join("");
      return (
        annBox(3) +
        '<div class="ban"><h1>Welcome back, ' +
        (S.u ? esc(S.u.name) : "Student") +
        "</h1><p>What would you like to do in the library today?</p></div>" +
        '<div class="stats">' +
        stats +
        '</div><div class="cols"><section><div class="tiles">' +
        tiles +
        '</div><div class="box" style="margin-top:16px"><h2>Available Books <a class="more" href="#books">View all</a></h2><div class="strip">' +
        (avail || '<p class="empty">No books are available right now.</p>') +
        "</div></div></section><aside>" +
        side +
        "</aside></div>"
      );
    },
    books: function () {
      var n = active().length;
      var l = B.filter(function (b) {
        return (
          (cat === "All" || b[3] === cat) &&
          (!avOnly || status(b[0]) === "in") &&
          (!q ||
            (b[1] + b[2] + b[0]).toLowerCase().indexOf(q.toLowerCase()) > -1)
        );
      });
      var ch = ["All"]
        .concat(Object.keys(C))
        .map(function (c) {
          return (
            '<button class="chip" aria-pressed="' +
            (c === cat) +
            '" data-a="cat2" data-id="' +
            c +
            '">' +
            c +
            "</button>"
          );
        })
        .join("");
      return (
        head(
          "Book Catalog",
          isLib()
            ? "Browse the catalog. Only students can borrow or reserve books."
            : "Press Borrow to send a request, or Reserve if the book is taken. You have " +
                n +
                " of 3 allowed books. Loan period is 7 days.",
        ) +
        pickupNote() +
        '<div class="chips">' +
        ch +
        '<button class="chip" aria-pressed="' +
        avOnly +
        '" data-a="avf" data-id="">Available only</button></div><p class="empty">' +
        l.length +
        ' book(s) found</p><div class="grid">' +
        (l.map(card).join("") ||
          '<p class="empty">No books match your search.</p>') +
        "</div>"
      );
    },
    borrowed: function () {
      var a = active();
      return (
        head(
          "My Borrowed Books",
          "Your 7-day timer starts automatically when the librarian approves. Return books in person to the librarian: the timer stops and the book becomes available.",
        ) +
        (a.length ? getBox() : "") +
        '<div class="box">' +
        (a
          .map(function (r) {
            var b = find(r.id);
            return (
              '<div class="row">' +
              cover(b) +
              '<div class="t"><strong>' +
              b[1] +
              '</strong><br><span style="color:var(--mut)">Approved ' +
              F(r.d) +
              " · Due " +
              F(r.due) +
              "</span><br>" +
              liveTimer(r) +
              "</div></div>"
            );
          })
          .join("") ||
          '<p class="empty">You have no borrowed books. <a href="#books">Browse the catalog</a></p>') +
        "</div>"
      );
    },
    categories: function () {
      return (
        head("Categories", "Pick a category to see its books.") +
        '<div class="cats">' +
        Object.keys(C)
          .map(function (k) {
            var n = B.filter(function (b) {
              return b[3] === k;
            }).length;
            return (
              '<button class="cat" style="background:linear-gradient(135deg,' +
              C[k][0] +
              "d9," +
              C[k][1] +
              "e6),url(img/cat-" +
              k +
              ".jpg) center/cover,linear-gradient(135deg," +
              C[k][0] +
              "," +
              C[k][1] +
              ')" data-a="cat" data-id="' +
              k +
              '"><svg class="cico" viewBox="0 0 24 24" aria-hidden="true">' +
              (CI[k] || I.book) +
              "</svg><span>" +
              k +
              "<small>" +
              n +
              (n === 1 ? " book" : " books") +
              "</small></span></button>"
            );
          })
          .join("") +
        "</div>"
      );
    },
    // shows the date AND time when the book was borrowed and returned
    history: function () {
      var l = my().reverse();
      return (
        head(
          "Borrowing History",
          "Every book you have borrowed, with the exact date and time it was borrowed and returned.",
        ) +
        '<div class="box wrap"><table><tr><th>Book ID</th><th>Title</th><th>Borrowed (date & time)</th><th>Due (date & time)</th><th>Returned (date & time)</th><th>Status</th><th>Fine</th></tr>' +
        (l
          .map(function (r) {
            var bk = find(r.id);
            return (
              "<tr><td>" +
              r.id +
              "</td><td>" +
              esc(bk ? bk[1] : r.id) +
              "</td><td>" +
              (r.gv ? FT(r.gv) : F(r.d)) +
              "</td><td>" +
              FT(endOf(r)) +
              "</td><td>" +
              (r.r
                ? r.rt
                  ? FT(r.rt)
                  : F(r.r)
                : '<span style="color:var(--mut)">Not yet returned</span>') +
              "</td><td>" +
              (r.r
                ? '<span class="pill ok">Returned</span>'
                : '<span class="pill me2">Borrowed</span>') +
              "</td><td>" +
              peso(fine(r)) +
              "</td></tr>"
            );
          })
          .join("") || '<tr><td colspan="7">No records yet.</td></tr>') +
        "</table></div>"
      );
    },
    // student view shows the current borrower's live 7-day timer
    reservations: function () {
      if (isLib())
        return (
          head(
            "Book Requests",
            "Each request shows the book and the student’s message. When you press Approve, the student’s 7-day timer starts right away and the book becomes Not available.",
          ) +
          '<div class="box"><h2>Waiting for your decision (' +
          pendingAll().length +
          ")</h2>" +
          reqRows("pending") +
          '</div><div class="box"><h2>Past requests</h2>' +
          reqRows("done") +
          "</div>"
        );
      var mineRows = myReservations()
        .map(function (r) {
          var id = r.id,
            b = find(id),
            ok = status(id) === "in";
          if (!b) return "";
          return (
            '<div class="row">' +
            cover(b) +
            '<div class="t"><strong>' +
            b[1] +
            '</strong><br><span style="color:var(--mut)">' +
            b[2] +
            "</span><br>" +
            (ok
              ? '<span class="pill ok">Ready for you. Go borrow it now.</span>'
              : '<span class="pill no">Waiting for return</span>' +
                resTimer(id)) +
            '</div><div class="racts">' +
            (ok ? btn("borrow", id, "Borrow") : "") +
            btn("unres", id, "Cancel", 1) +
            "</div></div>"
          );
        })
        .join("");
      var myQ = (S.q || [])
        .filter(function (x) {
          return S.u && x.u === S.u.un && x.ty !== "reserve";
        })
        .reverse()
        .map(function (x) {
          var b = find(x.id);
          return (
            '<div class="row"><div class="t"><strong>' +
            esc(b ? b[1] : x.id) +
            '</strong><br><span style="color:var(--mut)">Borrow request · sent ' +
            F(x.d) +
            "</span><br>" +
            stPill(x.st) +
            "</div></div>"
          );
        })
        .join("");
      var canRes = B.filter(function (b) {
        return status(b[0]) === "out";
      })
        .map(function (b) {
          var id = b[0],
            right = myRes(id)
              ? '<span class="pill ok">You reserved this</span>'
              : resOf(id)
                ? '<span class="pill no">Already reserved by another student</span>'
                : '<span class="pill no">Borrowed by someone</span>';
          return (
            '<div class="row">' +
            cover(b) +
            '<div class="t"><strong>' +
            b[1] +
            '</strong><br><span style="color:var(--mut)">' +
            b[2] +
            "</span><br>" +
            right +
            resTimer(id) +
            '</div><div class="racts">' +
            '<button class="btn" disabled>Borrow</button>' +
            (myRes(id)
              ? btn("unres", id, "Cancel", 1)
              : resOf(id)
                ? '<button class="btn ghost" disabled>Reserved</button>'
                : btn("res", id, "Reserve")) +
            "</div></div>"
          );
        })
        .join("");
      return (
        head(
          "Book Reservation",
          "Want a book that someone else borrowed? Press Reserve and we will message you when it is returned. You can see how much time is left on the current borrower’s 7-day timer.",
        ) +
        '<div class="box"><h2>How it works</h2><ol style="margin:0;padding-left:22px;line-height:1.9"><li>Find a book below that is borrowed by someone. The timer shows how much time is left before it must be returned.</li><li>Press <strong>Reserve</strong>. Only one student can reserve each book.</li><li>When the book is returned, you get a message right away.</li><li>The book is saved for you. Press <strong>Borrow</strong> to send your request.</li></ol></div>' +
        '<div class="box"><h2>My reservations</h2>' +
        (mineRows || '<p class="empty">You have no reservations yet.</p>') +
        "</div>" +
        '<div class="box"><h2>Books you can reserve</h2>' +
        (canRes ||
          '<p class="empty">All books are available right now. Nothing to reserve.</p>') +
        "</div>" +
        '<div class="box"><h2>My borrow requests</h2>' +
        (myQ || '<p class="empty">No borrow requests yet.</p>') +
        "</div>"
      );
    },
    fines: function () {
      var l = my().filter(function (r) {
          return fine(r) > 0;
        }),
        t = l.reduce(function (s, r) {
          return s + fine(r);
        }, 0);
      return (
        head(
          "Fines",
          "Late return penalty is " +
            peso(FINE) +
            " for each borrowed book. Lost or damaged book: " +
            peso(LOST) +
            " each.",
        ) +
        '<div class="warn">Outstanding Fines: <strong>' +
        peso(t) +
        '</strong></div><div class="box"><h2>Instructions</h2><p style="color:var(--mut);line-height:1.6;margin:0 0 10px">The money you pay for penalties goes to the school. It is used for school funds and for events that will happen in school.</p>' +
        rulesHtml() +
        '</div><div class="box wrap"><table><tr><th>Book</th><th>Due</th><th>Returned</th><th>Fine</th></tr>' +
        (l
          .map(function (r) {
            return (
              "<tr><td>" +
              find(r.id)[1] +
              "</td><td>" +
              F(r.due) +
              "</td><td>" +
              (r.r ? F(r.r) : "Not yet") +
              "</td><td>" +
              peso(fine(r)) +
              "</td></tr>"
            );
          })
          .join("") || '<tr><td colspan="4">No fines. Keep it up!</td></tr>') +
        "</table></div>"
      );
    },
    announcements: function () {
      return (
        head("Announcements", "Latest from the library.") +
        '<div class="box">' +
        allAnn()
          .map(function (x) {
            return (
              '<div class="row"><div class="t"><strong>' +
              esc(x[0]) +
              '</strong><br><span style="color:var(--mut)">' +
              esc(x[1]) +
              "</span></div></div>"
            );
          })
          .join("") +
        "</div>"
      );
    },
    addbook: function () {
      if (!isLib())
        return head(
          "Add Book",
          "Librarian access only. Log out and sign in as Librarian.",
        );
      return (
        head(
          "Add Book",
          "Add a new book to the catalog. All students will be notified.",
        ) +
        '<div class="box" style="max-width:480px;display:grid;gap:12px"><label>Title<br><input id="nt" class="in"></label><label>Author<br><input id="na" class="in"></label><label>ISBN (optional)<br><input id="ni" class="in"></label><label>Cover picture (optional, the whole picture is shown)<br><input id="nf" type="file" accept="image/*" class="in" style="padding-top:10px"></label><label>Category<br><select id="nc" class="in">' +
        Object.keys(C)
          .map(function (k) {
            return "<option>" + k + "</option>";
          })
          .join("") +
        "</select></label>" +
        btn("add", "", "Add book") +
        "</div>"
      );
    },
    lib: function () {
      if (!isLib()) return head("Librarian Panel", "Librarian access only.");
      var al = allActive(),
        od = al.filter(function (r) {
          return endOf(r) < Date.now();
        }).length,
        soon = al.filter(function (r) {
          var m = endOf(r) - Date.now();
          return m > 0 && m < DAY;
        }).length,
        ns = (S.acc || []).filter(function (x) {
          return x.role === "Student";
        }).length;
      var st = [
        ["Books in catalog", B.length],
        ["Borrowed now", al.length],
        ["Overdue", od],
        ["Due in 24 hours", soon],
        ["Students", ns],
        ["Pending requests", pendingAll().length],
        ["Reserved books", (S.rv || []).length],
        ["Open messages", openConcerns().length],
      ]
        .map(function (s) {
          return (
            '<div class="box st"><b>' +
            s[1] +
            "</b><span>" +
            s[0] +
            "</span></div>"
          );
        })
        .join("");
      var fbs = (S.q || []).filter(function (x) {
        return x.fb;
      });
      var avg = fbs.length
        ? fbs.reduce(function (s, x) {
            return s + x.fb;
          }, 0) / fbs.length
        : 0;
      var fbRows = fbs
        .slice()
        .reverse()
        .map(function (x) {
          var b = find(x.id);
          return (
            '<div class="row"><div class="t"><strong>' +
            esc(x.n) +
            '</strong> · <span style="color:var(--acc)">' +
            stars(x.fb) +
            "</span> (" +
            x.fb +
            "/5)<br>" +
            esc(b ? b[1] : x.id) +
            '<br><span style="color:var(--mut)">Approved in ' +
            dur(x.at - x.ts) +
            "</span></div></div>"
          );
        })
        .join("");
      return (
        annBox(2) +
        head(
          "Librarian Panel",
          "Manage books, borrowers, reminders and announcements.",
        ) +
        '<div class="stats">' +
        st +
        "</div>" +
        '<div class="two"><div class="box"><h2>Reminders</h2><p class="empty">Send the return date reminder to every student who borrowed a book.</p>' +
        btn("remall", "", "Notify all borrowers") +
        '</div><div class="box"><h2>Post announcement</h2><label>Title<input id="at" class="in"></label><label>Message<input id="ax" class="in"></label>' +
        btn("post", "", "Post") +
        "</div></div>" +
        '<div class="box" style="margin-top:16px"><h2>Student feedback</h2><p class="empty" style="padding:0 0 8px">' +
        (fbs.length
          ? "Average rating: <strong>" +
            avg.toFixed(1) +
            " / 5</strong> from " +
            fbs.length +
            " rating(s)"
          : "No feedback yet.") +
        "</p>" +
        fbRows +
        "</div>"
      );
    },
    loans: function () {
      if (!isLib()) return head("Student Borrowers", "Librarian access only.");
      var rows = S.b
        .map(function (r, i) {
          return [r, i];
        })
        .filter(function (x) {
          return !x[0].r;
        })
        .map(function (x) {
          var r = x[0],
            i = x[1];
          return (
            "<tr><td>" +
            esc(r.n || "Demo student") +
            "</td><td>" +
            esc(find(r.id)[1]) +
            "</td><td>" +
            F(r.d) +
            "</td><td>" +
            F(r.due) +
            "</td><td>" +
            liveTimer(r) +
            "</td><td>" +
            peso(fine(r)) +
            '</td><td><div class="racts">' +
            sbtn("lnotify", i, "Notify") +
            sbtn("lext", i, "+7 days", 1) +
            sbtn("lret", i, "Book returned", 1) +
            "</div></td></tr>"
          );
        })
        .join("");
      var done = S.b
        .filter(function (r) {
          return r.r;
        })
        .reverse()
        .slice(0, 15)
        .map(function (r) {
          var bk = find(r.id);
          return (
            "<tr><td>" +
            esc(r.n || "Demo student") +
            "</td><td>" +
            esc(bk ? bk[1] : r.id) +
            "</td><td>" +
            (r.gv ? FT(r.gv) : F(r.d)) +
            "</td><td>" +
            (r.rt ? FT(r.rt) : F(r.r)) +
            "</td><td>" +
            (fine(r) > 0
              ? '<span class="pill no">Late · ' + peso(fine(r)) + "</span>"
              : '<span class="pill ok">On time</span>') +
            "</td></tr>"
          );
        })
        .join("");
      return (
        head(
          "Student Borrowers",
          "The 7-day timer starts automatically when you approve a request. Press Book returned to stop the timer and make the book available.",
        ) +
        '<div class="box wrap"><h2>Current loans</h2><table><tr><th>Student</th><th>Book</th><th>Approved</th><th>Due</th><th>Timer</th><th>Fine</th><th>Actions</th></tr>' +
        (rows || '<tr><td colspan="7">No active loans.</td></tr>') +
        '</table></div><div class="box wrap"><h2>Recently returned</h2><table><tr><th>Student</th><th>Book</th><th>Approved</th><th>Returned</th><th>Result</th></tr>' +
        (done || '<tr><td colspan="5">No returned books yet.</td></tr>') +
        "</table></div>"
      );
    },
    manage: function () {
      if (!isLib()) return head("Manage Books", "Librarian access only.");
      var rows = B.map(function (b) {
        var out = isOut(b[0]),
          rr = resOf(b[0]);
        return (
          "<tr><td>" +
          b[0] +
          "</td><td>" +
          esc(b[1]) +
          "</td><td>" +
          b[3] +
          "</td><td>" +
          pill(b[0]) +
          (rr
            ? '<br><small style="color:var(--mut)">Reserved by ' +
              esc(rr.n) +
              "</small>"
            : "") +
          '</td><td><div class="racts">' +
          (out
            ? sbtn("avail", b[0], "Turn on Available")
            : '<button class="sm btn" disabled>Available</button>') +
          sbtn("rmbook", b[0], "Remove", 1) +
          '<label class="sm btn ghost up">Cover<input type="file" accept="image/*" hidden data-cid="' +
          b[0] +
          '"></label></div></td></tr>'
        );
      }).join("");
      return (
        head(
          "Manage Books",
          "Books become Available automatically when you press Book returned. Use “Turn on Available” only for books that were never in the system. Use “Cover” to upload or change a book picture.",
        ) +
        '<div class="box wrap"><table><tr><th>No.</th><th>Title</th><th>Category</th><th>Status</th><th>Actions</th></tr>' +
        rows +
        "</table></div>"
      );
    },
    profile: function () {
      var ac = acct();
      if (!ac) return head("My Profile", "Please log in.");
      var L = isLib(),
        stat = function (n, l) {
          return (
            '<div class="box st"><b>' + n + "</b><span>" + l + "</span></div>"
          );
        };
      var yrs = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
        .map(function (y) {
          return (
            '<option value="' +
            y +
            '"' +
            (ac.yr === y ? " selected" : "") +
            ">" +
            (y || "Select year level") +
            "</option>"
          );
        })
        .join("");
      var info = L
        ? ""
        : '<div class="box"><h2>Information</h2><label>Full name<input id="pn" class="in" value="' +
          esc(ac.n) +
          '"></label><label>Student ID<input id="ps" class="in" value="' +
          esc(ac.sid || "") +
          '" placeholder="Your ID"></label>' +
          '<label>Program / Course<input id="pg" class="in" value="' +
          esc(ac.prog || "") +
          '" placeholder="Your program"></label><label>Year level<select id="py" class="in">' +
          yrs +
          "</select></label>" +
          '<label>Email<input id="pe" class="in" type="email" value="' +
          esc(ac.em || "") +
          '" placeholder="name@example.com"></label>' +
          btn("saveinfo", "", "Save changes") +
          "</div>";
      return (
        head("My Profile", "Account information and settings.") +
        '<div class="box prof"><div class="pav">' +
        (ac.pic
          ? '<img src="' + ac.pic + '" alt="Your photo">'
          : esc(initials(ac.n))) +
        '</div><div class="pinfo"><h2>' +
        esc(ac.n) +
        '</h2><p class="empty" style="padding:0">@' +
        esc(ac.un) +
        " · " +
        ac.role +
        '</p><div class="pbtns"><label class="btn up">Upload photo<input id="pf" type="file" accept="image/*" hidden></label>' +
        (ac.pic ? btn("rmpic", "", "Remove photo", 1) : "") +
        '</div><p class="empty">JPG or PNG. Saved only on this browser.</p></div></div>' +
        (L
          ? ""
          : '<div class="stats">' +
            stat(my().length, "Total borrowed") +
            stat(active().length, "Borrowed now") +
            stat(myReservations().length, "Reservations") +
            stat(myPending().length, "Pending requests") +
            "</div>") +
        '<div class="two">' +
        info +
        '<div class="box"><h2>Account settings</h2><label>Current password<input id="po" class="in" type="password" autocomplete="current-password"></label><label>New password<input id="pw1" class="in" type="password" autocomplete="new-password"></label>' +
        '<label>Confirm new password<input id="pw2" class="in" type="password" autocomplete="new-password"></label>' +
        btn("savepw", "", "Change password") +
        "</div></div>"
      );
    },
    details: function () {
      var b = det && find(det);
      if (!b)
        return (
          head("Book Details", "Pick a book from the catalog.") +
          '<p class="empty"><a href="#books">Go to Book Catalog</a></p>'
        );
      var id = b[0],
        s = status(id),
        r = mine(id),
        bd = window.BOOKS && window.BOOKS[id];
      var main = isLib()
        ? '<button class="btn" disabled>Students only</button><label class="btn ghost up">Change cover<input type="file" accept="image/*" hidden data-cid="' +
          id +
          '"></label>'
        : s === "in"
          ? lockedForMe(id)
            ? '<button class="btn" disabled>Reserved for another student</button>'
            : btn("borrow", id, "Borrow")
          : s === "mine"
            ? '<button class="btn" disabled>Borrowed</button>'
            : myRes(id)
              ? btn("unres", id, "Cancel reservation", 1)
              : resOf(id)
                ? '<button class="btn" disabled>Already reserved</button>'
                : btn("res", id, "Reserve");
      var hint =
        s === "in"
          ? lockedForMe(id)
            ? "This book was returned, but it is reserved for another student."
            : myRes(id)
              ? "This book is ready for you. Press Borrow to send your request."
              : "This book is on the shelf. Press Borrow to send a message to the librarian."
          : s === "mine"
            ? "Approved! Your 7-day timer is running. Get your book from the librarian " +
              PICKUP +
              " and return it before the timer ends."
            : resOf(id) && !myRes(id)
              ? "This book is checked out and another student already reserved it."
              : "This book is checked out. Reserve it and you will get a message when it is available.";
      return (
        '<div class="rbar">' +
        btn("rback", "", "← Back to catalog", 1) +
        "</div>" +
        head(
          "Book Details",
          "Check the details and availability before you borrow.",
        ) +
        '<div class="box det"><div class="dcov">' +
        cover(b) +
        '</div><div class="dinfo"><h2>' +
        esc(b[1]) +
        '</h2><p class="empty" style="padding:0 0 12px">by ' +
        esc(b[2]) +
        "</p>" +
        // NEW: borrowed books show the current borrower's live timer
        (r ? liveTimer(r) : s === "out" ? resTimer(id) : "") +
        '<table class="dt"><tr><th>Title</th><td>' +
        esc(b[1]) +
        "</td></tr><tr><th>Author</th><td>" +
        esc(b[2]) +
        "</td></tr><tr><th>ISBN</th><td>" +
        (b[4] ? esc(b[4]) : "Not listed") +
        "</td></tr><tr><th>Category</th><td>" +
        b[3] +
        "</td></tr><tr><th>Book No.</th><td>" +
        b[0] +
        "</td></tr><tr><th>Availability</th><td>" +
        pill(id) +
        "</td></tr></table>" +
        '<p class="empty">' +
        (isLib()
          ? "Librarian: you can change this book’s cover picture."
          : hint) +
        "</p>" +
        (bd ? '<p class="rtxt">' + esc(bd.about) + "</p>" : "") +
        '<div class="dact">' +
        main +
        btn("read", id, s === "mine" ? "Read book" : "Preview", 1) +
        "</div></div></div>"
      );
    },
    notifications: function () {
      if (isLib()) {
        var cl = concerns()
          .map(function (x, i) {
            return [x, i];
          })
          .reverse();
        var row = function (p) {
          var x = p[0],
            i = p[1],
            b = x.id && find(x.id);
          return (
            '<div class="row" style="align-items:flex-start"><div class="t"><strong>' +
            esc(x.n) +
            "</strong> · " +
            esc(ctype(x.ty)) +
            " · " +
            when(x) +
            (b ? "<br>Book: <strong>" + esc(b[1]) + "</strong>" : "") +
            '<div style="margin:8px 0;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--line);line-height:1.5">“' +
            esc(x.m) +
            "”</div>" +
            (x.st === "open"
              ? '<span class="pill me2">Needs reply</span>'
              : '<span class="pill ok">Done</span>' +
                (x.rp
                  ? '<br><span style="color:var(--mut)">Your reply: ' +
                    esc(x.rp) +
                    "</span>"
                  : "")) +
            "</div>" +
            (x.st === "open"
              ? '<div class="racts">' +
                sbtn("creply", i, "Reply") +
                sbtn("cdone", i, "Mark done", 1) +
                "</div>"
              : "") +
            "</div>"
          );
        };
        var op = cl.filter(function (p) {
            return p[0].st === "open";
          }),
          dn = cl.filter(function (p) {
            return p[0].st !== "open";
          });
        return (
          head(
            "Notifications",
            "Complaints, problems and suggestions that students sent from Help. Reply to the student or mark it done.",
          ) +
          '<div class="box"><h2>Needs reply (' +
          op.length +
          ")</h2>" +
          (op.map(row).join("") ||
            '<p class="empty">No new messages. You are all caught up.</p>') +
          '</div><div class="box"><h2>Done</h2>' +
          (dn.map(row).join("") || '<p class="empty">Nothing here yet.</p>') +
          "</div>"
        );
      }
      S.seen = (S.n || []).length;
      S.seenm = inbox().length;
      save();
      var rem = reminders(),
        log = (S.n || []).slice().reverse();
      var rt = my()
        .filter(function (r) {
          return r.r;
        })
        .slice(-5)
        .reverse();
      return (
        head(
          "Notifications",
          "Approvals, due dates, returned books, reservation updates and replies from the librarian. To report a problem or send a suggestion, use Help.",
        ) +
        '<div class="box"><h2>Reminders</h2>' +
        (rem
          .map(function (x) {
            return (
              '<div class="note"><span class="nd"></span><p>' +
              esc(x.m) +
              "</p></div>"
            );
          })
          .join("") || '<p class="empty">You are all caught up.</p>') +
        "</div>" +
        '<div class="box"><h2>Returned books</h2>' +
        (rt
          .map(function (r) {
            return (
              '<div class="note"><span class="nd"></span><p>' +
              esc(find(r.id)[1]) +
              " was returned on " +
              F(r.r) +
              ". Timer stopped" +
              (fine(r) ? ". Late fee " + peso(fine(r)) + "." : ". On time.") +
              "</p></div>"
            );
          })
          .join("") || '<p class="empty">No returned books yet.</p>') +
        "</div>" +
        '<div class="box"><h2>Recent activity</h2>' +
        (log
          .map(function (x) {
            return (
              '<div class="note"><span class="nd"></span><p>' +
              esc(x.m) +
              "<small>" +
              F(x.t) +
              "</small></p></div>"
            );
          })
          .join("") || '<p class="empty">No activity yet.</p>') +
        "</div>"
      );
    },
    reader: function () {
      var bk = rd.id && find(rd.id),
        bd = window.BOOKS && window.BOOKS[rd.id];
      if (!bk)
        return (
          head("Reader", "Pick a book first.") +
          '<p class="empty"><a href="#books">Go to Book Catalog</a></p>'
        );
      var back =
          '<div class="rbar">' +
          btn("rback", "", "← Back to books", 1) +
          "</div>",
        top = head(bk[1], "by " + bk[2] + " · " + bk[3] + " · No. " + bk[0]);
      if (!bd)
        return (
          back +
          top +
          '<div class="box"><p class="empty">No reading copy for this book yet.</p></div>'
        );
      var pg = bd.pages,
        s = status(rd.id);
      if (s !== "mine") {
        var words = pg[0][1].split(" ").slice(0, 38).join(" ");
        var gate =
          s === "in"
            ? "Borrow this book to unlock all " + pg.length + " pages."
            : "This book is checked out. Reserve it to read it later.";
        return (
          back +
          top +
          '<div class="box"><span class="pill no">Preview only</span><p class="rtxt" style="margin-top:12px">' +
          esc(bd.about) +
          "</p></div>" +
          '<div class="box"><h2>Contents</h2><ol class="toc">' +
          pg
            .map(function (p) {
              return (
                "<li>" + esc(p[0]) + ' <span class="lock">Locked</span></li>'
              );
            })
            .join("") +
          "</ol></div>" +
          '<div class="box"><h2>Sample from page 1</h2><div class="fade"><p class="rtxt">' +
          esc(words) +
          '…</p></div><p class="gate">' +
          gate +
          "</p>" +
          (isLib()
            ? ""
            : s === "in"
              ? lockedForMe(rd.id)
                ? ""
                : btn("borrow", rd.id, "Borrow to read")
              : myRes(rd.id)
                ? btn("unres", rd.id, "Cancel reservation", 1)
                : resOf(rd.id)
                  ? ""
                  : btn("res", rd.id, "Reserve", 1)) +
          "</div>"
        );
      }
      var i = Math.max(0, Math.min(rd.p, pg.length - 1)),
        p = pg[i];
      return (
        back +
        top +
        '<article class="box page"><p class="pno">Page ' +
        (i + 1) +
        " of " +
        pg.length +
        "</p><h2>" +
        esc(p[0]) +
        '</h2><p class="rtxt">' +
        esc(p[1]) +
        "</p></article>" +
        '<div class="rnav">' +
        (i > 0 ? btn("rpage", i - 1, "← Previous", 1) : "<span></span>") +
        '<span class="empty">Page ' +
        (i + 1) +
        " / " +
        pg.length +
        "</span>" +
        (i < pg.length - 1
          ? btn("rpage", i + 1, "Next →")
          : btn("rback", "", "Finish", 1)) +
        "</div>"
      );
    },
    help: function () {
      var h = [
        [
          "How do I borrow a book?",
          "Open Book Catalog and press Borrow. Write a message to the librarian and send it. When the librarian approves, your 7-day timer starts automatically and you can see it on the book. Then go to the librarian " +
            PICKUP +
            " to get your book. You can hold up to 3 books.",
        ],
        [
          "How long can I keep a book?",
          "7 days. A live timer on the book shows the days, hours, minutes and seconds left. Return it in person to the librarian: the timer stops and the book becomes available.",
        ],
        [
          "What if I return late?",
          "The penalty is " +
            peso(FINE) +
            " for each borrowed book. Example: 3 books returned late = " +
            peso(FINE * 3) +
            ". The money goes to the school (school funds and events).",
        ],
        [
          "What if I lose or damage a book?",
          "You must pay " + peso(LOST) + " for each book.",
        ],
        [
          "A book is not available. What now?",
          "Press Reserve. You will see how much time is left on the current borrower’s 7-day timer. When the book is returned, you will get a message right away and only you can borrow it. Only one student can reserve each book.",
        ],
      ];
      return (
        head(
          "Help",
          "Common questions, and a direct message to the librarian.",
        ) +
        '<div class="box">' +
        h
          .map(function (x) {
            return (
              "<details><summary>" +
              x[0] +
              '</summary><p style="color:var(--mut)">' +
              x[1] +
              "</p></details>"
            );
          })
          .join("") +
        "</div>" +
        studentForm() +
        '<div class="box"><button class="btn ghost" data-a="reset" data-id="">Reset demo data</button></div>'
      );
    },
  };
  function route() {
    var r = (location.hash || "#dashboard").slice(1);
    if (!V[r]) return "dashboard";
    if (
      isLib() &&
      (r === "borrowed" ||
        r === "history" ||
        r === "fines" ||
        r === "help" ||
        r === "categories")
    )
      return "dashboard";
    return r;
  }
  function render() {
    var r = route(),
      cur = r === "details" || r === "reader" ? "books" : r,
      L = isLib();
    $("nav").innerHTML =
      '<div class="logo"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#F2B705" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      I.book +
      "</svg><div>USTP<br>Library</div></div>" +
      R.filter(function (x) {
        return (
          x[0] !== "verify" &&
          (!x[3] || (x[3] === "L" && L) || (x[3] === "S" && !L))
        );
      })
        .map(function (x) {
          return (
            '<a class="nav" href="#' +
            x[0] +
            '"' +
            (x[0] === cur ? ' aria-current="page"' : "") +
            ">" +
            svg(x[2]) +
            (L && x[0] === "reservations" ? "Book Requests" : x[1]) +
            badge(x[0], L) +
            "</a>"
          );
        })
        .join("");
    $("main").innerHTML = V[r]();
    $("bdot").style.display = S.u && unread() > 0 ? "" : "none";
    $("login").style.display = S.u ? "none" : "flex";
    if (S.u) {
      $("un").textContent = S.u.name;
      $("ur").textContent = S.u.role;
      var pa = acct(),
        av = $("uav");
      if (pa && pa.pic) {
        av.textContent = "";
        av.style.backgroundImage = 'url("' + pa.pic + '")';
      } else {
        av.style.backgroundImage = "";
        av.textContent = initials(S.u.name);
      }
    }
    if (r === "dashboard") document.querySelectorAll("[data-n]").forEach(count);
    loadCovers();
    tick();
    checkFeedback();
    checkLibAlert();
  }
  function count(el) {
    var n = +el.dataset.n,
      t0 = null;
    function s(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 700, 1);
      el.textContent = Math.round(n * p);
      if (p < 1) requestAnimationFrame(s);
    }
    requestAnimationFrame(s);
  }
  function toast(m) {
    var t = $("toast");
    t.textContent = m;
    t.className = "on";
    clearTimeout(toast.h);
    toast.h = setTimeout(function () {
      t.className = "";
    }, 2800);
  }
  var RULESMSG =
    " Return it in person to the librarian. Late: PHP " +
    FINE +
    " per book. Lost or damaged: PHP " +
    LOST.toLocaleString("en-US") +
    " per book.";
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-a]");
    if (!t) return;
    var a = t.dataset.a,
      id = t.dataset.id,
      b = id && find(id);
    if (a !== "view") $("md").className = "";
    if (a === "view") {
      det = id;
      if (location.hash === "#details") render();
      else location.hash = "details";
      return;
    }
    if (a === "closemd") {
      checkFeedback();
      return;
    }
    if (a === "gonotif") {
      if (location.hash === "#notifications") render();
      else location.hash = "notifications";
      return;
    }
    if (a === "creply") {
      showReply(+id);
      return;
    }
    if (a === "fblater") {
      fbSkip[+id] = true;
      return;
    }
    if (a === "star") {
      var fx = (S.q || [])[+id];
      if (fx && !fx.fb) {
        fx.fb = +t.dataset.n;
        fx.ft = Date.now();
        save();
        toast("Thank you for your feedback! (" + fx.fb + " of 5 stars)");
      }
    } else if (a === "sendconcern") {
      if (stuOnly()) return;
      var cty = $("ct") ? $("ct").value : "other",
        cbk = $("cb") ? $("cb").value : "",
        cmt = $("cmsg") ? $("cmsg").value.trim() : "";
      if (cty === "book" && !cbk) {
        toast("Please choose the book you are reporting.");
        return;
      }
      if (cmt.length < 5) {
        toast("Please write your message.");
        return;
      }
      S.cm = S.cm || [];
      S.cm.push({
        u: S.u.un,
        n: S.u.name,
        ty: cty,
        id: cbk,
        m: cmt,
        d: iso(TODAY),
        ts: Date.now(),
        st: "open",
      });
      note("Message sent to the librarian: " + ctype(cty) + ".");
      save();
      toast("Message sent to the librarian");
    } else if (a === "sendreply") {
      var cx = (S.cm || [])[+id],
        rtx = $("rp") ? $("rp").value.trim() : "";
      if (!isLib() || !cx) return;
      if (!rtx) {
        toast("Please write a reply.");
        showReply(+id);
        return;
      }
      cx.st = "resolved";
      cx.rp = rtx;
      cx.rt = iso(TODAY);
      msg(
        cx.u,
        "Reply from the librarian about your message (" +
          ctype(cx.ty) +
          "): " +
          rtx,
      );
      save();
      toast("Reply sent to " + cx.n);
    } else if (a === "cdone") {
      var cd2 = (S.cm || [])[+id];
      if (!isLib() || !cd2) return;
      cd2.st = "resolved";
      save();
      toast("Marked as done");
    } else if (a === "avf") {
      avOnly = !avOnly;
    } else if (a === "borrow") {
      if (stuOnly()) return;
      if (status(id) !== "in") {
        toast("This book is not available.");
        return;
      }
      if (lockedForMe(id)) {
        toast("This book is reserved for another student.");
        return;
      }
      if (active().length + myPending().length >= 3) {
        toast("Limit reached: you can borrow up to 3 books.");
        return;
      }
      if (hasPending(id)) {
        toast("You already sent a request for this book.");
        return;
      }
      showBorrowBox(id);
      return;
    } else if (a === "sendborrow") {
      if (stuOnly()) return;
      var bm = $("bm") ? $("bm").value.trim() : "";
      if (!bm) {
        toast("Please write a message to the librarian.");
        showBorrowBox(id);
        return;
      }
      if (status(id) !== "in") {
        toast("This book is not available.");
        return;
      }
      if (lockedForMe(id)) {
        toast("This book is reserved for another student.");
        return;
      }
      S.q = S.q || [];
      S.q.push({
        id: id,
        u: S.u.un,
        n: S.u.name,
        m: bm,
        d: iso(TODAY),
        ts: Date.now(),
        st: "pending",
        ty: "borrow",
      });
      note("Borrow request sent to the librarian for " + b[1] + ".");
      save();
      showSent(b);
    } else if (a === "res") {
      if (stuOnly()) return;
      // after a successful reserve, a popup shows the borrower's remaining time
      if (reserve(id)) showReserved(id);
    } else if (a === "unres") {
      S.rv = (S.rv || []).filter(function (x) {
        return !(S.u && x.u === S.u.un && x.id === id);
      });
      note("Reservation cancelled: " + (b ? b[1] : ""));
      save();
      toast("Reservation cancelled");
    } else if (a === "qok" || a === "qna" || a === "qtk") {
      var rq = (S.q || [])[+id];
      if (!isLib() || !rq || rq.st !== "pending") return;
      var rb = find(rq.id),
        rt = rb ? rb[1] : rq.id;
      if (a === "qok") {
        if (status(rq.id) !== "in") {
          toast(
            "This book is still borrowed. Choose “Not available” or “Reserved already”.",
          );
          return;
        }
        var rsv = resOf(rq.id);
        if (rsv && rsv.u !== rq.u) {
          toast(
            "This book is reserved for another student (" +
              rsv.n +
              "). Choose “Reserved already”.",
          );
          return;
        }
        if (
          S.b.filter(function (r) {
            return !r.r && r.u === rq.u;
          }).length >= 3
        ) {
          toast("This student already has 3 borrowed books.");
          return;
        }
        // APPROVE = the 7-day timer starts right now
        var now = Date.now();
        S.b.push({
          id: rq.id,
          d: iso(new Date(now)),
          due: iso(new Date(now + 7 * DAY)),
          r: null,
          u: rq.u,
          n: rq.n,
          sc: true,
          gv: now,
          dt: now + 7 * DAY,
        });
        S.rv = (S.rv || []).filter(function (x) {
          return !(x.id === rq.id && x.u === rq.u);
        });
        rq.st = "approved";
        rq.at = now;
        msg(
          rq.u,
          "Approved: " +
            rt +
            ". Your 7-day timer has started. Go to the librarian " +
            PICKUP +
            " to get your book." +
            RULESMSG,
        );
        toast("Approved: " + rt + ". The student’s 7-day timer started.");
      } else if (a === "qna") {
        rq.st = "na";
        msg(rq.u, "Not available: " + rt + " is not available right now.");
        toast("Student notified: not available");
      } else {
        rq.st = "taken";
        msg(rq.u, "Sorry, " + rt + " was already reserved by another student.");
        toast("Student notified: already reserved");
      }
      save();
    } else if (a === "avail") {
      if (!isLib()) return;
      if (!isOut(id)) {
        toast("Already available.");
        return;
      }
      if (
        !confirm(
          'Turn on Available for "' +
            b[1] +
            '"? Only do this if the book has been returned.',
        )
      )
        return;
      var ol = allActive().filter(function (r) {
        return r.id === id;
      })[0];
      if (ol) {
        ol.r = iso(TODAY);
        ol.rt = Date.now(); // save the exact return time
        msg(
          ol.u || "all",
          "Return of " + b[1] + " confirmed by the librarian. Thank you!",
        );
      } else {
        S.av = (S.av || []).concat(id);
      }
      notifyReserver(id);
      save();
      toast(
        b[1] +
          " is now available" +
          (resOf(id) ? ". The student who reserved it was notified." : ""),
      );
    } else if (a === "cat" || a === "cat2") {
      cat = id;
      q = "";
      $("q").value = "";
      if (a === "cat" && route() !== "books") {
        location.hash = "books";
        return;
      }
    } else if (a === "login") {
      var lu = $("lu").value.trim().toLowerCase(),
        lp = $("lp").value;
      var ac = (S.acc || []).filter(function (x) {
        return x.un === lu && x.pw === lp;
      })[0];
      if (!ac) {
        say(
          "lerr",
          "Wrong username or password. If you are new, create an account first.",
        );
        return;
      }
      S.u = { name: ac.n, role: ac.role, un: ac.un };
      pendingWelcome = ac.role === "Student";
      S.rem = $("lrem").checked;
      try {
        if (S.rem) localStorage.setItem("ustp-user", lu);
        else localStorage.removeItem("ustp-user");
        sessionStorage.setItem("ustp-sess", "1");
      } catch (e) {}
      $("lp").value = "";
      save();
      location.hash = ac.role === "Librarian" ? "lib" : "dashboard";
      toast("Welcome, " + ac.n + " (" + ac.role + ")");
    } else if (a === "logout") {
      S.u = null;
      S.rem = false;
      save();
      try {
        sessionStorage.removeItem("ustp-sess");
      } catch (e) {}
      showView("login");
    } else if (a === "show") {
      showView(id);
      return;
    } else if (a === "signup") {
      var sn = $("sn").value.trim(),
        su = $("su").value.trim().toLowerCase(),
        sp = $("sp").value,
        sr = "Student";
      if (!sn || !su || !sp) {
        say("serr", "Please fill in all fields.");
        return;
      }
      if (sp.length < 4) {
        say("serr", "Password must be at least 4 characters.");
        return;
      }
      if (sp !== $("sp2").value) {
        say("serr", "Passwords do not match.");
        return;
      }
      S.acc = S.acc || [];
      if (
        S.acc.some(function (x) {
          return x.un === su;
        })
      ) {
        say("serr", "That username is already taken.");
        return;
      }
      S.acc.push({ n: sn, un: su, pw: sp, role: sr });
      save();
      ["sn", "su", "sp", "sp2"].forEach(function (x) {
        $(x).value = "";
      });
      $("lu").value = su;
      $("lp").value = "";
      showView("login");
      toast("Account created. You can log in now.");
      return;
    } else if (a === "forgot") {
      var fu = $("fu").value.trim().toLowerCase(),
        fp = $("fp").value;
      var fa = (S.acc || []).filter(function (x) {
        return x.un === fu;
      })[0];
      if (!fa) {
        say("ferr", "No account found with that username.");
        return;
      }
      if (fp.length < 4) {
        say("ferr", "New password must be at least 4 characters.");
        return;
      }
      fa.pw = fp;
      save();
      $("fu").value = "";
      $("fp").value = "";
      $("lu").value = fu;
      showView("login");
      toast("Password updated. Log in with your new password.");
      return;
    } else if (a === "read") {
      rd = { id: id, p: 0 };
      if (location.hash === "#reader") render();
      else location.hash = "reader";
      return;
    } else if (a === "rpage") {
      rd.p = +id;
      window.scrollTo(0, 0);
    } else if (a === "rback") {
      location.hash = "books";
      return;
    } else if (a === "rmpic") {
      var pr = acct();
      if (pr) {
        delete pr.pic;
        save();
        toast("Photo removed");
      }
    } else if (a === "saveinfo") {
      var ic = acct(),
        iname = $("pn") ? $("pn").value.trim() : "",
        iem = $("pe") ? $("pe").value.trim() : "";
      if (!$("pn")) return;
      if (!iname) {
        toast("Please enter your name");
        return;
      }
      if (iem && !/^\S+@\S+\.\S+$/.test(iem)) {
        toast("Please enter a valid email");
        return;
      }
      if (ic) {
        ic.n = iname;
        S.u.name = iname;
        ic.sid = $("ps").value.trim();
        ic.prog = $("pg").value.trim();
        ic.yr = $("py").value;
        ic.em = iem;
        save();
        toast("Profile saved");
      }
    } else if (a === "savepw") {
      var wc = acct(),
        wold = $("po").value,
        wnew = $("pw1").value;
      if (!wc) return;
      if (wold !== wc.pw) {
        toast("Current password is incorrect");
        return;
      }
      if (wnew.length < 4) {
        toast("New password must be at least 4 characters");
        return;
      }
      if (wnew !== $("pw2").value) {
        toast("New passwords do not match");
        return;
      }
      wc.pw = wnew;
      save();
      toast("Password changed");
      ["po", "pw1", "pw2"].forEach(function (x) {
        $(x).value = "";
      });
    } else if (a === "add") {
      if (!isLib()) return;
      var ti = $("nt").value.trim(),
        au = $("na").value.trim() || "Unknown",
        ct = $("nc").value,
        isbn = $("ni").value.trim();
      if (!ti) {
        toast("Please enter a title");
        return;
      }
      var nb = [String(ALL.length + 1).padStart(3, "0"), ti, au, ct, isbn];
      B.push(nb);
      ALL.push(nb);
      S.x = S.x || [];
      S.x.push(nb);
      var cfile = $("nf") && $("nf").files[0];
      if (cfile && /^image\//.test(cfile.type)) {
        TRY[nb[0]] = 1;
        shrinkCover(cfile, function (u) {
          putCover(nb[0], u);
        });
      }
      msg(
        "all",
        "New book added: " +
          ti +
          " by " +
          au +
          " (" +
          ct +
          "). Check the Book Catalog!",
      );
      save();
      toast("Added: " + ti + " (No. " + nb[0] + "). Students notified.");
      location.hash = "books";
    } else if (a === "rmbook") {
      if (!isLib()) return;
      if (
        isOut(id) ||
        S.b.some(function (r) {
          return r.id === id && !r.r;
        })
      ) {
        toast("Cannot remove: book is borrowed or approved.");
        return;
      }
      if (!confirm('Remove "' + b[1] + '" from the catalog?')) return;
      S.rm = (S.rm || []).concat(id);
      B = B.filter(function (x) {
        return x[0] !== id;
      });
      S.rv = (S.rv || []).filter(function (x) {
        return x.id !== id;
      });
      save();
      toast("Removed: " + b[1]);
    } else if (a === "lnotify" || a === "lext" || a === "lret") {
      var lr = S.b[+id];
      if (!isLib() || !lr) return;
      var lt = find(lr.id)[1],
        lw = lr.u || "all";
      if (a === "lnotify") {
        msg(
          lw,
          lt +
            " is due on " +
            F(lr.due) +
            (endOf(lr) < Date.now()
              ? " and is already overdue. Please return it now."
              : ". Please return it on or before that date.") +
            RULESMSG,
        );
        toast("Reminder sent");
      } else if (a === "lext") {
        lr.dt = endOf(lr) + 7 * DAY;
        lr.due = iso(new Date(lr.dt));
        msg(
          lw,
          "Your loan of " +
            lt +
            " was extended. New due date: " +
            F(lr.due) +
            ".",
        );
        save();
        toast("Extended by 7 days");
      } else {
        if (
          !confirm(
            'Confirm that "' +
              lt +
              '" was returned? The timer will stop and the book will become Available.',
          )
        )
          return;
        lr.r = iso(TODAY);
        lr.rt = Date.now();
        msg(
          lw,
          "Return of " +
            lt +
            " confirmed by the librarian. The timer stopped. Thank you!",
        );
        notifyReserver(lr.id);
        save();
        toast(
          "Book returned. Timer stopped and the book is available" +
            (resOf(lr.id)
              ? ". The student who reserved it was notified."
              : "."),
        );
      }
    } else if (a === "remall") {
      if (!isLib()) return;
      var n = 0;
      allActive().forEach(function (r) {
        var over = endOf(r) < Date.now();
        msg(
          r.u || "all",
          find(r.id)[1] +
            " is due on " +
            F(r.due) +
            (over ? " (overdue, penalty " + peso(FINE) + " per book)." : ".") +
            RULESMSG,
        );
        n++;
      });
      toast(
        n
          ? n + " reminder(s) sent to all borrowers"
          : "No active borrowers to notify",
      );
    } else if (a === "post") {
      if (!isLib()) return;
      var at = $("at").value.trim(),
        ax = $("ax").value.trim();
      if (!at) {
        toast("Please enter a title");
        return;
      }
      S.ann = S.ann || [];
      S.ann.unshift([at, ax || " "]);
      save();
      toast("Announcement posted");
    } else if (a === "reset") {
      var u = S.u,
        ac2 = S.acc,
        rm = S.rem;
      S = {
        b: [{ id: "001", d: "2026-11-03", due: "2026-11-05", r: null }],
        rv: [],
        x: [],
        cm: [],
        u: u,
        acc: ac2,
        rem: rm,
      };
      save();
      location.reload();
      return;
    }
    render();
    if (pendingWelcome && S.u) {
      pendingWelcome = false;
      showWelcome();
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.cid) {
      if (!isLib()) return;
      var cf = e.target.files[0],
        cid = e.target.dataset.cid;
      if (!cf) return;
      if (!/^image\//.test(cf.type)) {
        toast("Please choose an image file.");
        return;
      }
      shrinkCover(cf, function (u) {
        putCover(cid, u);
        toast("Cover updated");
      });
      return;
    }
    if (e.target.id !== "pf") return;
    var f = e.target.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) {
      toast("Please choose an image file.");
      return;
    }
    shrink(f, function (url) {
      var ac = acct();
      if (!ac) return;
      ac.pic = url;
      save();
      toast("Profile photo updated");
      render();
    });
  });
  document.addEventListener("mouseover", function (e) {
    var all = document.querySelectorAll('[data-a="star"]');
    if (!all.length) return;
    var t = e.target.closest && e.target.closest('[data-a="star"]'),
      n = t ? +t.dataset.n : 0;
    all.forEach(function (s) {
      s.style.color = +s.dataset.n <= n ? "#f2b705" : "#c3cad9";
    });
  });
  $("q").addEventListener("input", function (e) {
    q = e.target.value;
    cat = "All";
    if (route() !== "books") location.hash = "books";
    else render();
  });
  $("md").addEventListener("click", function (e) {
    if (e.target === this) this.className = "";
  });
  window.addEventListener("hashchange", function () {
    render();
    window.scrollTo(0, 0);
  });
  try {
    if (S.u && !S.rem && !sessionStorage.getItem("ustp-sess")) S.u = null;
    var ru = localStorage.getItem("ustp-user");
    if (ru) {
      $("lu").value = ru;
      $("lrem").checked = true;
    }
  } catch (e) {}
  $("login").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    var go = [].filter.call(
      document.querySelectorAll("#login .go"),
      function (x) {
        return x.offsetParent;
      },
    )[0];
    if (go) go.click();
  });
  render();
})();

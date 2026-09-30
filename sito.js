/* Vento a Favore — movimento del sito, versione 2. Nessuna libreria.
   Cosa fa: titoli parola per parola, entrate a cascata, foto che si scoprono, tacche del
   censimento, cifre che contano, linea dei passaggi, leggero parallasse, barra di lettura,
   testata che si stringe, menu del telefono, video che parte al clic.
   Reti di sicurezza: senza JavaScript la pagina è intera e ferma; con «meno movimento» nel
   telefono tutto è fermo e visibile; dopo 3 s ogni elemento in vista viene mostrato comunque. */
(function () {
  "use strict";
  var radice = document.documentElement;
  var fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, d) { return Array.prototype.slice.call((d || document).querySelectorAll(s)); };

  /* ---------- 1. titoli spezzati in parole ---------- */
  function spezza(el) {
    var n = 0;
    (function cammina(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (f) {
        if (f.nodeType === 1) return cammina(f);
        if (f.nodeType !== 3) return;
        var fr = document.createDocumentFragment();
        f.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) return fr.appendChild(document.createTextNode(p));
          var r = (n++ * 0.06).toFixed(3) + "s";
          if (/^[.,;:»]+$/.test(p)) {                    /* la punteggiatura resta attaccata */
            var wp = document.createElement("span"); wp.className = "wp"; wp.textContent = p;
            wp.style.setProperty("--r", r); return fr.appendChild(wp);
          }
          var w = document.createElement("span"), d = document.createElement("span");
          w.className = "w"; d.textContent = p; d.style.setProperty("--r", r); w.appendChild(d); fr.appendChild(w);
        });
        nodo.replaceChild(fr, f);
      });
    })(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  }
  $$(".spezza").forEach(spezza);

  /* ---------- 2. frasi a confronto: barra sulla traduzione, parole nella riscrittura ---------- */
  $$(".pair").forEach(function (p) {
    var prima = p.querySelector(".before p");
    if (prima && !prima.querySelector(".barra")) {
      var s = document.createElement("span"); s.className = "barra"; s.textContent = prima.textContent;
      prima.textContent = ""; prima.appendChild(s);
    }
    var dopo = p.querySelector(".after p:not(.why)");
    if (dopo) {
      var n = 0;
      dopo.innerHTML = dopo.textContent.split(/(\s+)/).map(function (w) {
        if (!w) return ""; if (/^\s+$/.test(w)) return " ";
        return '<span class="pw" style="--d:' + (n++ * 0.04).toFixed(3) + 's">' + w.replace(/</g, "&lt;") + "</span>";
      }).join("");
    }
  });

  /* ---------- 3. tacche del censimento ---------- */
  var tacche = document.querySelector(".tacche");
  if (tacche) $$("i", tacche).forEach(function (t, i) { t.style.setProperty("--r", (i * 0.018).toFixed(3) + "s"); });

  /* ---------- 4. cifre che contano ---------- */
  function conta(el) {
    var fine = parseFloat(el.getAttribute("data-conta")), dur = +(el.getAttribute("data-durata") || 1400);
    var testo = el.firstChild;                      /* il numero è il primo nodo di testo */
    if (fermo || !testo || testo.nodeType !== 3) return;
    var t0 = performance.now(), lineare = el.hasAttribute("data-lineare");
    (function passo() {
      var k = Math.min(1, (performance.now() - t0) / dur), e = lineare ? k : 1 - Math.pow(1 - k, 4);
      testo.textContent = String(Math.round(fine * e));
      if (k < 1) requestAnimationFrame(passo);
    })();
  }

  /* ---------- 5. chi entra in vista entra; chi entra insieme, a cascata ---------- */
  /* le foto dei settori partono tagliate (clip-path) e l'osservatore non le vedrebbe: si osserva la fila */
  var OSSERVATI = ".rv, .spezza:not(h1), .settori, .tacche, .passi, .pair, .barre, [data-conta]";
  var oss = new IntersectionObserver(function (voci) {
    var k = 0;
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      var el = v.target; oss.unobserve(el);
      if (el.matches(".rv, .settore") && !el.style.getPropertyValue("--r"))
        el.style.setProperty("--r", (k++ * 0.09).toFixed(3) + "s");
      el.classList.add("in");
      if (el.classList.contains("settori")) $$(".settore", el).forEach(function (f, i) { f.style.setProperty("--r", (i * 0.14).toFixed(2) + "s"); f.classList.add("in"); });
      if (el.hasAttribute("data-conta")) conta(el);
      if (el === tacche) { var num = document.querySelector(".cens-numero[data-conta]"); if (num) { num.classList.add("in"); conta(num); } }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
  $$(OSSERVATI).forEach(function (el) {
    if (el.matches(".cens-numero")) return;          /* parte insieme alle tacche */
    oss.observe(el);
  });

  /* l'apertura parte subito, senza aspettare lo scorrimento */
  var h1 = document.querySelector("h1.spezza");
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    if (h1) h1.classList.add("in");
    $$(".apertura .rv, .testa-pagina .rv").forEach(function (el, i) {
      el.style.setProperty("--r", (0.5 + i * 0.12).toFixed(2) + "s"); el.classList.add("in"); oss.unobserve(el);
    });
  }); });

  setTimeout(function () {                           /* rete di sicurezza */
    $$(OSSERVATI).forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && !el.classList.contains("in")) {
        el.classList.add("in");
        if (el.classList.contains("settori")) $$(".settore", el).forEach(function (f) { f.classList.add("in"); });
      }
    });
  }, 3000);

  /* ---------- 6. scorrimento: barra di lettura, testata, parallasse ---------- */
  var barra = document.querySelector(".avanzamento"), testata = document.querySelector(".testata");
  var par = fermo ? [] : $$("[data-par]");
  var inAttesa = false;
  function suScroll() {
    inAttesa = false;
    var y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (barra) barra.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ")";
    if (testata) { if (y > 90) testata.classList.add("stretta"); else if (y < 24) testata.classList.remove("stretta"); }
    par.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      var centro = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.transform = "translate3d(0," + (centro * parseFloat(el.getAttribute("data-par")) * 100).toFixed(2) + "px,0)";
    });
  }
  addEventListener("scroll", function () { if (!inAttesa) { inAttesa = true; requestAnimationFrame(suScroll); } }, { passive: true });
  addEventListener("resize", suScroll);
  suScroll();

  /* ---------- 7. menu del telefono ---------- */
  var apriT = document.querySelector(".apri-menu"), tendina = document.getElementById("tendina");
  if (apriT && tendina) {
    var chiudi = function () { radice.classList.remove("menu-aperto"); apriT.setAttribute("aria-expanded", "false"); tendina.setAttribute("aria-hidden", "true"); };
    apriT.addEventListener("click", function () {
      var ora = !radice.classList.contains("menu-aperto");
      radice.classList.toggle("menu-aperto", ora); apriT.setAttribute("aria-expanded", String(ora));
      tendina.setAttribute("aria-hidden", String(!ora));
      if (ora) { var primo = tendina.querySelector("a, summary"); if (primo) primo.focus({ preventScroll: true }); }
    });
    $$("a", tendina).forEach(function (a) { a.addEventListener("click", chiudi); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && radice.classList.contains("menu-aperto")) { chiudi(); apriT.focus(); } });
    addEventListener("resize", function () { if (innerWidth > 1320) chiudi(); });
  }

  /* ---------- 8. video: parte solo al clic, con l'audio ---------- */
  $$(".schermo").forEach(function (s) {
    var b = s.querySelector(".avvia"); if (!b) return;
    b.addEventListener("click", function () {
      var v = document.createElement("video");
      v.src = s.getAttribute("data-video"); v.controls = true; v.playsInline = true; v.preload = "auto";
      v.poster = s.querySelector("img") ? s.querySelector("img").src : "";
      v.setAttribute("aria-label", b.getAttribute("aria-label") || "Video");
      s.innerHTML = ""; s.appendChild(v); v.play().catch(function () {}); v.focus();
    });
  });

  /* ---------- 9. menu con pannelli ---------- */
  $$(".menu .con-pannello").forEach(function (li) {
    var a = li.querySelector(".voce"), timer;
    var apri = function () { clearTimeout(timer); $$(".menu .aperto").forEach(function (x) { if (x !== li) chiudiP(x); });
                             li.classList.add("aperto"); a.setAttribute("aria-expanded", "true"); };
    var chiudiP = function (x) { x.classList.remove("aperto"); x.querySelector(".voce").setAttribute("aria-expanded", "false"); };
    li.addEventListener("mouseenter", apri);
    li.addEventListener("mouseleave", function () { timer = setTimeout(function () { chiudiP(li); }, 180); });
    a.addEventListener("click", function (ev) {             /* primo clic apre, secondo segue il collegamento */
      if (!li.classList.contains("aperto")) { ev.preventDefault(); apri(); }
    });
    li.addEventListener("focusout", function (ev) { if (!li.contains(ev.relatedTarget)) chiudiP(li); });
    li.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { chiudiP(li); a.focus(); } });
  });
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".con-pannello")) $$(".menu .aperto").forEach(function (x) { x.classList.remove("aperto"); x.querySelector(".voce").setAttribute("aria-expanded", "false"); });
  });

  /* ---------- 10. modulo di contatto: prepara l'email già scritta ---------- */
  $$("form.modulo").forEach(function (f) {
    var chiesto = new URLSearchParams(location.search).get("lavoro");     /* arriva da «Chiedere…» */
    if (chiesto) $$("input[name=lavoro]", f).forEach(function (r) { if (r.value === chiesto) r.checked = true; });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var ok = true;
      $$("[required]", f).forEach(function (c) {
        var vuoto = !c.value.trim(), sbagliato = c.type === "email" && c.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.value);
        c.setAttribute("aria-invalid", String(vuoto || sbagliato));
        if (vuoto || sbagliato) { if (ok) c.focus(); ok = false; }
      });
      if (!ok) return;
      var v = function (n) { var c = f.elements[n]; return c ? (c.value || "").trim() : ""; };
      var scelta = (f.querySelector("input[name=lavoro]:checked") || {}).value || "";
      var d = f.dataset;                                  /* le pagine straniere danno le frasi nella loro lingua */
      var righe = [
        d.saluto || "Buongiorno,", "",
        v("messaggio") || d.predefinito || "vorrei sapere come lavora Vento a Favore sui nostri testi.", "",
        (d.azienda || "Azienda") + ": " + v("azienda"),
        v("pagina") ? (d.pagina || "Pagina da leggere") + ": " + v("pagina") : "",
        scelta ? (d.interesse || "Mi interessa") + ": " + scelta : "",
        v("lingua") ? (d.lingua || "Lingua") + ": " + v("lingua") : "", "",
        v("nome"), v("email")
      ].filter(function (r, i, a) { return r !== "" || (a[i - 1] !== ""); });
      var oggetto = (scelta || d.richiesta || "Richiesta") + " · " + v("azienda");
      location.href = "mailto:ventoafavorecf@gmail.com?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(righe.join("\n"));
      var esito = f.parentNode.querySelector(".modulo-esito");
      if (esito) esito.textContent = d.esito || "Si è aperto il programma di posta con il messaggio già scritto. Se non si apre, scriva a ventoafavorecf@gmail.com.";
    });
    $$("[required]", f).forEach(function (c) { c.addEventListener("input", function () { c.removeAttribute("aria-invalid"); }); });
  });

  /* ---------- 11. GSAP: fila orizzontale, manifesto, uscita dell'apertura ---------- */
  function conGsap() {
    if (!window.gsap || !window.ScrollTrigger) { radice.classList.add("no-gsap"); return; }
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();

    /* il manifesto: parola per parola si accende mentre si scorre */
    $$(".manifesto").forEach(function (m) {
      var parole = [];
      (function cammina(n) {
        Array.prototype.slice.call(n.childNodes).forEach(function (f) {
          if (f.nodeType === 1) return cammina(f);
          if (f.nodeType !== 3) return;
          var fr = document.createDocumentFragment();
          f.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) return fr.appendChild(document.createTextNode(p));
            var s = document.createElement("span"); s.className = "mp"; s.textContent = p; fr.appendChild(s); parole.push(s);
          });
          n.replaceChild(fr, f);
        });
      })(m);
      if (fermo) { parole.forEach(function (p) { p.classList.add("acceso"); }); return; }
      ScrollTrigger.create({ trigger: m, start: "top 80%", end: "bottom 45%", scrub: true,
        onUpdate: function (st) { var k = Math.round(st.progress * parole.length);
          parole.forEach(function (p, i) { p.classList.toggle("acceso", i < k); }); } });
    });

    mm.add({ largo: "(min-width: 900px)", mosso: "(prefers-reduced-motion: no-preference)" }, function (c) {
      /* la fila orizzontale: la sezione si ferma e le schede scorrono di lato */
      if (c.conditions.largo && c.conditions.mosso) {
        $$(".fila").forEach(function (fila) {
          var bin = fila.querySelector(".fila-binario");
          var corsa = function () { return Math.max(0, bin.scrollWidth - innerWidth); };
          gsap.to(bin, { x: function () { return -corsa(); }, ease: "none",
            scrollTrigger: { trigger: fila.closest("section") || fila, start: "top top", end: function () { return "+=" + corsa(); },
                             pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
        });
      }
      if (c.conditions.mosso) {
        /* l'apertura si allontana piano quando si scende */
        $$(".apertura .wrap, .testa-pagina .wrap").forEach(function (w) {
          gsap.to(w, { yPercent: -6, opacity: .35, ease: "none",
            scrollTrigger: { trigger: w, start: "top top", end: "bottom top", scrub: true } });
        });
        /* i glifi grandi di cinese e arabo girano appena */
        $$(".lingua-punta .enorme").forEach(function (g, i) {
          gsap.fromTo(g, { yPercent: 12, rotate: i % 2 ? 4 : -4 }, { yPercent: -10, rotate: 0, ease: "none",
            scrollTrigger: { trigger: g.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
        });
      }
    });
    addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
  if (document.readyState === "complete") conGsap(); else addEventListener("DOMContentLoaded", conGsap);
})();

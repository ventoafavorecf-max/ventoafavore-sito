/* Vento a Favore — movimento del sito, versione 2. Nessuna libreria.
   Cosa fa: titoli parola per parola, entrate a cascata, foto che si scoprono, tacche del
   censimento, cifre che contano, linea dei passaggi, leggero parallasse, barra di lettura,
   testata che si stringe, menu del telefono, video che parte al clic.
   Reti di sicurezza: senza JavaScript la pagina è intera e ferma; con «meno movimento» nel
   telefono tutto è fermo e visibile; dopo 3 s ogni elemento in vista viene mostrato comunque. */
window.VAF_PRONTO = true;   // 20/10: la rete di sicurezza del modello toglie «mv» se questo file non arriva
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

  /* 28/10 notte: i confronti sono cursori da trascinare; arrivando in vista, la maniglia passa una volta da «tradotto» a «riscritto» */
  $$(".cf").forEach(function (c) {
    var r = c.querySelector(".cf-range"); if (!r) return;
    var fisso = fermo, toccato = false;
    function metti(v) { c.style.setProperty("--p", v + "%"); r.value = v; }
    r.addEventListener("input", function () { toccato = true; c.style.setProperty("--p", r.value + "%"); });
    if (fisso) { metti(0); return; }
    metti(100);
    var io = new IntersectionObserver(function (voci) {
      if (!voci[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now(), dur = 2300;
      (function passo(ora) {
        if (toccato) return;
        var k = Math.min(1, ((ora || performance.now()) - t0) / dur), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        metti(Math.round(100 - 100 * e));
        if (k < 1) requestAnimationFrame(passo);
      })();
    }, { threshold: 0.6 });
    io.observe(c);
  });

  /* 28/10 notte: le foto dell'apertura cambiano piano, una ogni sei secondi */
  var apFoto = $$(".ap-foto picture");
  if (!fermo && apFoto.length > 1) {
    var apI = 0;
    setInterval(function () {
      if (document.hidden) return;
      apFoto[apI].classList.remove("on"); apI = (apI + 1) % apFoto.length; apFoto[apI].classList.add("on");
    }, 6000);
  }

  /* 28/10 notte: strisce di foto da scorrere o da trascinare, con la barra di avanzamento */
  $$(".settori").forEach(function (st) {
    var prog = document.createElement("div"); prog.className = "strip-prog"; prog.setAttribute("aria-hidden", "true");
    prog.innerHTML = "<span></span>"; st.parentNode.insertBefore(prog, st.nextSibling);
    var barra = prog.firstChild;
    function aggiorna() {
      var max = st.scrollWidth - st.clientWidth; if (max <= 0) { prog.hidden = true; return; }
      var w = st.clientWidth / st.scrollWidth * 100;
      barra.style.setProperty("--w", w.toFixed(1) + "%");
      barra.style.setProperty("--l", ((100 - w) * st.scrollLeft / max).toFixed(1) + "%");
    }
    st.addEventListener("scroll", aggiorna, { passive: true }); addEventListener("resize", aggiorna); aggiorna();
    var giu = false, x0 = 0, s0 = 0, mosso = false;
    st.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") return; giu = true; mosso = false; x0 = e.clientX; s0 = st.scrollLeft; });
    addEventListener("pointermove", function (e) {
      if (!giu) return; var d = e.clientX - x0;
      if (Math.abs(d) > 4) { mosso = true; st.classList.add("trascina"); }
      if (mosso) st.scrollLeft = s0 - d;
    });
    addEventListener("pointerup", function () { if (!giu) return; giu = false; st.classList.remove("trascina"); });
    st.addEventListener("click", function (e) { if (mosso) { e.preventDefault(); e.stopPropagation(); mosso = false; } }, true);
  });

  /* 28/10: galleria di foto: si scorre (anche trascinando), si filtra per tema, si ingrandisce */
  $$(".galleria").forEach(function (gal) {
    var scorri = gal.querySelector(".g-scorri"), voci = $$(".g-voce", gal), conta = gal.querySelector(".g-conta");
    var dlg = gal.querySelector(".g-zoom"), dimg = dlg && dlg.querySelector("img"), dcap = dlg && dlg.querySelector("figcaption");
    var nome = gal.getAttribute("data-n") || "";
    var visibili = function () { return voci.filter(function (v) { return !v.hidden; }); };
    if (conta) conta.textContent = voci.length + " " + nome;   /* il numero scritto nell'HTML non segue le foto: lo conta la pagina */
    /* frecce */
    $$(".g-freccia", gal).forEach(function (b) {
      b.addEventListener("click", function () {
        scorri.scrollBy({ left: +b.getAttribute("data-v") * scorri.clientWidth * 0.8, behavior: fermo ? "auto" : "smooth" });
      });
    });
    /* temi */
    $$(".g-filtro", gal).forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f");
        $$(".g-filtro", gal).forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var k = 0;
        voci.forEach(function (v) {
          v.hidden = !(f === "tutte" || v.getAttribute("data-cat") === f);
          v.classList.remove("entra");
          if (!v.hidden && !fermo) { void v.offsetWidth; v.style.setProperty("--i", k++); v.classList.add("entra"); }
        });
        scorri.scrollLeft = 0;
        conta.textContent = visibili().length + " " + nome;
      });
    });
    /* trascinare col mouse */
    var giu = false, x0 = 0, s0 = 0, mosso = false;
    scorri.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      giu = true; mosso = false; x0 = e.clientX; s0 = scorri.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!giu) return;
      var d = e.clientX - x0;
      if (Math.abs(d) > 5) { mosso = true; scorri.classList.add("trascina"); }
      if (mosso) scorri.scrollLeft = s0 - d;
    });
    window.addEventListener("pointerup", function () { if (giu) { giu = false; scorri.classList.remove("trascina"); } });
    scorri.addEventListener("click", function (e) { if (mosso) { e.preventDefault(); e.stopPropagation(); mosso = false; } }, true);
    /* ingrandimento */
    if (!dlg || !dlg.showModal) return;
    var corrente = null;
    function mostra(v) {
      var a = v.querySelector(".g-foto"), im = v.querySelector("img");
      corrente = v; dimg.src = a.getAttribute("href"); dimg.alt = im.alt; dcap.textContent = a.getAttribute("data-did");
    }
    function vai(passo) {
      var l = visibili(); if (!l.length) return;
      mostra(l[(l.indexOf(corrente) + passo + l.length) % l.length]);
    }
    voci.forEach(function (v) {
      v.querySelector(".g-foto").addEventListener("click", function (e) { e.preventDefault(); mostra(v); dlg.showModal(); });
    });
    dlg.querySelector(".g-chiudi").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".g-prec").addEventListener("click", function () { vai(-1); });
    dlg.querySelector(".g-succ").addEventListener("click", function () { vai(1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); vai(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); vai(1); }
    });
    dlg.addEventListener("close", function () { dimg.removeAttribute("src"); });
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
  var par = fermo || innerWidth < 900 ? [] : $$("[data-par]");   // 20/10: al telefono le foto restano ferme (scorrimento più fluido)
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
    // 20/10: col menu aperto il resto della pagina esce dal giro del tasto Tab
    var fuori = function (si) { $$("main, .piede, .briciole, .lingue-su").forEach(function (el) { el.inert = si; }); };
    // 20/10: si ricorda dove si era nella pagina, così chiudendo il menu si torna esattamente lì
    var yMenu = 0;
    var chiudi = function (torna) {
      if (!radice.classList.contains("menu-aperto")) return;
      radice.classList.remove("menu-aperto"); apriT.setAttribute("aria-expanded", "false"); tendina.setAttribute("aria-hidden", "true"); fuori(false);
      if (torna) scrollTo({ top: yMenu, behavior: "instant" });
    };
    apriT.addEventListener("click", function () {
      if (radice.classList.contains("menu-aperto")) { chiudi(true); return; }
      // 20/10, Francesco: col menu aperto la barra con «Vento a Favore» resta fissa in cima allo schermo (classe menu-aperto
      // nello stile) e le voci partono subito sotto e scorrono sotto di lei; la pagina dietro non scorre.
      yMenu = scrollY;
      var testata = document.querySelector(".testata");
      if (testata) tendina.style.paddingTop = (testata.offsetHeight + 28) + "px";
      tendina.scrollTop = 0;
      radice.classList.add("menu-aperto"); apriT.setAttribute("aria-expanded", "true");
      tendina.setAttribute("aria-hidden", "false"); fuori(true);
      var primo = tendina.querySelector("a, summary"); if (primo) primo.focus({ preventScroll: true });
    });
    $$("a", tendina).forEach(function (a) { a.addEventListener("click", function () { chiudi(false); }); });   // si va altrove: niente ritorno
    addEventListener("keydown", function (e) { if (e.key === "Escape" && radice.classList.contains("menu-aperto")) { chiudi(true); apriT.focus(); } });
    addEventListener("resize", function () { if (innerWidth > 1320) chiudi(true); });
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

  /* indirizzo dell'app web che riceve il modulo (strumenti/invio-email/Modulo.gs); vuoto = si apre la posta */
  var INVIO = "https://script.google.com/macros/s/AKfycbxPcA9uTJ1WhuptbTQZJjLeDqvwOoDypayg280ZtceJ_sPQq6qT5tNI6hy_K1HRo0gGzg/exec";

  /* ---------- 10. modulo di contatto: prepara l'email già scritta ---------- */
  $$("form.modulo:not([data-tipo])").forEach(function (f) {
    var chiesto = new URLSearchParams(location.search).get("lavoro");     /* arriva da «Chiedere…» */
    if (chiesto) $$("input[name=lavoro]", f).forEach(function (r) { if (r.value === chiesto) r.checked = true; });
    var codiceUrl = new URLSearchParams(location.search).get("codice");   /* il venditore può mandare il link con il codice già dentro */
    if (codiceUrl && f.elements.codice) f.elements.codice.value = codiceUrl.slice(0, 24);
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
        v("codice") ? "Codice: " + v("codice") : "",
        v("pagina") ? (d.pagina || "Pagina da leggere") + ": " + v("pagina") : "",
        scelta ? (d.interesse || "Mi interessa") + ": " + scelta : "",
        v("lingua") ? (d.lingua || "Lingua") + ": " + v("lingua") : "", "",
        v("nome"), v("email")
      ].filter(function (r, i, a) { return r !== "" || (a[i - 1] !== ""); });
      var oggetto = (scelta || d.richiesta || "Richiesta") + " · " + v("azienda");
      var esito = f.parentNode.querySelector(".modulo-esito");
      var conPosta = function () {                         /* com'era prima: apre il programma di posta */
        location.href = "mailto:ventoafavorecf@gmail.com?subject=" + encodeURIComponent(oggetto) + "&body=" + encodeURIComponent(righe.join("\n"));
        if (esito) esito.textContent = d.esito || "Si è aperto il programma di posta con il messaggio già scritto. Se non si apre, scriva a ventoafavorecf@gmail.com.";
      };
      if (!INVIO || !window.fetch) { conPosta(); return; }
      /* dal 12/10/2026: il modulo spedisce davvero, tramite lo script strumenti/invio-email/Modulo.gs */
      var dati = new URLSearchParams();
      ["nome", "azienda", "email", "telefono", "pagina", "lingua", "messaggio", "sito_web"].forEach(function (n) { dati.append(n, n === "messaggio" && v("codice") ? v(n) + "\n\nCodice: " + v("codice") : v(n)); });
      dati.append("lavoro", scelta);
      dati.append("provenienza", location.pathname);
      var tasto = f.querySelector("button[type=submit]");
      if (tasto) tasto.disabled = true;
      if (esito) esito.textContent = d.invio || "Invio in corso…";
      fetch(INVIO, { method: "POST", mode: "no-cors", body: dati })
        .then(function () {
          f.reset();
          if (esito) esito.textContent = d.inviato || "Messaggio arrivato. Vento a Favore risponde per email entro un giorno lavorativo.";
        })
        .catch(conPosta)
        .then(function () { if (tasto) tasto.disabled = false; });
    });
    $$("[required]", f).forEach(function (c) { c.addEventListener("input", function () { c.removeAttribute("aria-invalid"); }); });
  });

  /* ---------- 10-ter. valutazione dei clienti (20/10): voti da 1 a 5, commento, permesso di pubblicare ----------
     Il collegamento mandato al cliente può portare già azienda e lavoro: /valutazione/?azienda=…&lavoro=… */
  $$("form.modulo[data-tipo=valutazione]").forEach(function (f) {
    var q = new URLSearchParams(location.search);
    if (q.get("azienda") && f.elements.azienda) f.elements.azienda.value = q.get("azienda");
    if (q.get("lavoro") && f.elements.lavoro) f.elements.lavoro.value = q.get("lavoro");
    var esito = f.parentNode.querySelector(".modulo-esito");
    var gruppoVoto = f.querySelector("[data-voto]");
    $$("input[name=voto]", f).forEach(function (r) { r.addEventListener("change", function () { gruppoVoto.removeAttribute("aria-invalid"); }); });
    $$("[required]", f).forEach(function (c) { c.addEventListener("input", function () { c.removeAttribute("aria-invalid"); }); });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var az = f.elements.azienda, voto = f.querySelector("input[name=voto]:checked");
      az.setAttribute("aria-invalid", String(!az.value.trim()));
      gruppoVoto.setAttribute("aria-invalid", String(!voto));
      if (!az.value.trim()) { az.focus(); return; }
      if (!voto) { f.querySelector("input[name=voto]").focus(); return; }
      var scelto = function (n) { return (f.querySelector("input[name=" + n + "]:checked") || {}).value || ""; };
      var dati = new URLSearchParams();
      dati.append("tipo", "valutazione");
      ["azienda", "nome", "lavoro", "commento", "sito_web"].forEach(function (n) { dati.append(n, (f.elements[n] ? f.elements[n].value : "").trim()); });
      ["voto", "chiarezza", "tempi", "qualita"].forEach(function (n) { dati.append(n, scelto(n)); });
      dati.append("pubblicare", f.elements.pubblicare && f.elements.pubblicare.checked ? "sì" : "no");
      var tasto = f.querySelector("button[type=submit]");
      if (tasto) tasto.disabled = true;
      var d = f.dataset;                                  /* le pagine straniere danno le frasi nella loro lingua */
      if (esito) esito.textContent = d.invio || "Invio in corso…";
      var aMano = function () {
        location.href = "mailto:ventoafavorecf@gmail.com?subject=" + encodeURIComponent((d.oggetto || "Valutazione") + " · " + az.value.trim()) +
          "&body=" + encodeURIComponent(dati.toString().replace(/&/g, "\n"));
      };
      if (!INVIO || !window.fetch) { aMano(); return; }
      fetch(INVIO, { method: "POST", mode: "no-cors", body: dati })
        .then(function () { f.reset(); if (esito) esito.textContent = d.inviato || "Grazie. La valutazione è arrivata a Vento a Favore."; })
        .catch(aMano)
        .then(function () { if (tasto) tasto.disabled = false; });
    });
  });

  /* ---------- 10-bis. la fila sul telefono: segno di avanzamento e frecce (si sfoglia col dito) ---------- */
  var ETICHETTE = { it: ["Scheda precedente", "Scheda successiva"], en: ["Previous card", "Next card"],
                    de: ["Vorherige Karte", "N\u00e4chste Karte"], fr: ["Fiche pr\u00e9c\u00e9dente", "Fiche suivante"],
                    es: ["Ficha anterior", "Ficha siguiente"] };
  $$(".fila").forEach(function (fila) {
    var schede = $$(".carta", fila); if (schede.length < 2) return;
    var et = ETICHETTE[(document.documentElement.lang || "it").slice(0, 2)] || ETICHETTE.it;
    var segno = document.createElement("div"); segno.className = "fila-segno";
    segno.innerHTML = '<button type="button" data-v="-1" aria-label="' + et[0] + '">&larr;</button>' +
      '<span class="traccia" aria-hidden="true"><span class="riempi"></span></span>' +
      '<span class="conta" aria-live="polite"></span>' +
      '<button type="button" data-v="1" aria-label="' + et[1] + '">&rarr;</button>';
    fila.parentNode.insertBefore(segno, fila.nextSibling);
    var riempi = segno.querySelector(".riempi"), conta = segno.querySelector(".conta"), tasti = segno.querySelectorAll("button");
    var passo = function () { return schede[1].offsetLeft - schede[0].offsetLeft; };
    var aggiorna = function () {
      var max = fila.scrollWidth - fila.clientWidth;
      var i = Math.min(schede.length - 1, Math.round(fila.scrollLeft / Math.max(1, passo())));
      if (max > 0 && fila.scrollLeft >= max - 4) i = schede.length - 1;
      riempi.style.width = ((i + 1) / schede.length * 100) + "%";
      conta.textContent = (i + 1) + " / " + schede.length;
      tasti[0].disabled = fila.scrollLeft <= 4; tasti[1].disabled = max <= 0 || fila.scrollLeft >= max - 4;
    };
    Array.prototype.forEach.call(tasti, function (b) {
      b.addEventListener("click", function () {
        var ora = Math.round(fila.scrollLeft / Math.max(1, passo()));
        var dove = Math.max(0, Math.min(schede.length - 1, ora + +b.getAttribute("data-v")));
        fila.scrollTo({ left: schede[dove].offsetLeft - schede[0].offsetLeft, behavior: fermo ? "auto" : "smooth" });
        setTimeout(aggiorna, 450);
      });
    });
    fila.addEventListener("scroll", aggiorna, { passive: true });
    addEventListener("resize", aggiorna);
    aggiorna();
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
      if (c.conditions.mosso && c.conditions.largo) {   // 20/10: solo su schermi larghi, al telefono pesava sullo scorrimento
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

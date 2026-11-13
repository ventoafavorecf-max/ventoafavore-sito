/* Vento a Favore — navigazione e movimento, 13/11/2026 (solo copia locale, non pubblicato).
   Cosa fa: l'Indice a tutto schermo (al posto delle tendine), il marchio con la barchetta che naviga,
   il nastro delle lingue che accelera con lo scorrimento, i pulsanti che seguono appena il mouse e la luce sulle carte.
   Reti di sicurezza: senza questo file la pagina è intera (la barra ha collegamenti diretti, il piede ha tutto);
   con «meno movimento» non si muove niente. Nessuna libreria. */
(function () {
  "use strict";
  var radice = document.documentElement;
  var fermo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, d) { return Array.prototype.slice.call((d || document).querySelectorAll(s)); };

  /* ---------- 1. l'Indice ---------- */
  var bottone = document.querySelector(".apri-indice"), indice = document.getElementById("indice");
  if (bottone && indice) {
    var voci = $$(".iv", indice), viste = $$(".av", indice), chiudiB = indice.querySelector(".chiudi-indice");
    var attiva = function (i) {
      voci.forEach(function (v, k) { v.classList.toggle("sel", k === i); });
      viste.forEach(function (a, k) { a.classList.toggle("attiva", k === i); });
    };
    voci.forEach(function (v, i) {
      v.addEventListener("mouseenter", function () { attiva(i); });
      v.addEventListener("focus", function () { attiva(i); });
    });
    var resto = function (si) { $$(".testata, main, .piede, .briciole, .sezione-nav, .lingue-su, .salta, .avanzamento").forEach(function (el) { el.inert = si; }); };
    var aperto = function () { return radice.classList.contains("indice-aperto"); };
    var chiudi = function (tornaAlBottone) {
      if (!aperto()) return;
      radice.classList.remove("indice-aperto"); bottone.setAttribute("aria-expanded", "false");
      indice.setAttribute("aria-hidden", "true"); resto(false);
      if (tornaAlBottone) bottone.focus({ preventScroll: true });
    };
    var apri = function () {
      if (aperto()) return;
      // si parte dalla sezione in cui ci si trova (voce corrente nella barra), altrimenti dalla prima
      var corr = document.querySelector(".menu .voce[aria-current]"), p = 0;
      if (corr) voci.forEach(function (v, k) { if (v.getAttribute("href") === corr.getAttribute("href")) p = k; });
      attiva(p);
      radice.classList.add("indice-aperto"); bottone.setAttribute("aria-expanded", "true");
      indice.setAttribute("aria-hidden", "false"); resto(true); indice.scrollTop = 0;
      if (chiudiB) chiudiB.focus({ preventScroll: true });
    };
    bottone.addEventListener("click", function () { aperto() ? chiudi(true) : apri(); });
    if (chiudiB) chiudiB.addEventListener("click", function () { chiudi(true); });
    $$("a", indice).forEach(function (a) { a.addEventListener("click", function () { chiudi(false); }); });   // si va altrove (o a un punto della stessa pagina)
    addEventListener("keydown", function (e) { if (e.key === "Escape" && aperto()) { e.preventDefault(); chiudi(true); } });
    addEventListener("resize", function () { if (innerWidth < 1321) chiudi(false); });
  }

  /* ---------- 1-bis. il marchio: al clic la barchetta si stacca dal cerchio, naviga sulle onde lungo il nome, vira e torna a casa ----------
     La barchetta e' un elemento a parte (marchio-barca.png sopra marchio-base.png): a riposo il simbolo e' quello vero, intero.
     Il nome non viene mai sbiadito ne' coperto: sta sopra a tutto, nero e intero, e la barca gli passa dietro.
     Con «meno movimento» non si muove niente e il clic funziona come un normale collegamento. */
  (function () {
    var marchi = $$(".marchio"); if (!marchi.length) return;
    // se un'immagine del logo non arriva (rete che inciampa), si riprova una volta sola: mai un riquadro vuoto al posto del logo
    marchi.forEach(function (m) {
      [].forEach.call(m.querySelectorAll(".mc img"), function (im) {
        var riprova = function () { if (!im.getAttribute("data-r")) { im.setAttribute("data-r", "1"); im.src = im.getAttribute("src").split("?")[0] + "?r=1"; } };
        if (im.complete && !im.naturalWidth) riprova(); else im.addEventListener("error", riprova);
      });
    });
    if (fermo) return;
    var T = 6600, NS = "http://www.w3.org/2000/svg", COL = "#B0604F";
    var sin = function (k) { return -(Math.cos(Math.PI * k) - 1) / 2; };   // partenza e arrivo dolci
    var cl = function (k) { return Math.max(0, Math.min(1, k)); };
    marchi.forEach(function (m) {
      var mc = m.querySelector(".mc"), barca = mc && mc.querySelector(".mc-barca"), nome = m.querySelector(".nome");
      if (!mc || !barca || !barca.animate) return;
      var inCorso = false;
      var parti = function (ritorno) {   // ritorno = vero quando si arriva da un'altra pagina: la barca rientra da destra e si posa
        if (!barca.naturalWidth) return;   // l'immagine della barca non e' arrivata: niente corsa (mai un riquadro vuoto che naviga)
        inCorso = true;
        var mr = mc.getBoundingClientRect(), w = mc.offsetWidth || mr.width, k = mr.width / w || 1;   // k: la testata stretta rimpicciolisce il marchio
        var dir = getComputedStyle(m).direction === "rtl" ? -1 : 1;   // in arabo il logo sta a destra e la barca naviga verso sinistra
        var nr = nome && nome.getBoundingClientRect(), cm = mr.left + mr.width / 2, cy = mr.top + mr.height / 2;
        var haNome = !!(nr && nr.width);
        var fineNome = haNome ? (dir > 0 ? nr.right - cm : cm - nr.left) / k : 300;        // dal centro del cerchio alla fine del nome
        var tb = m.closest && m.closest(".testata"), tel = innerWidth < 600;
        var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "mc-onda"); svg.setAttribute("aria-hidden", "true");
        var el = function (nomeEl, att) { var n = document.createElementNS(NS, nomeEl); for (var q in att) n.setAttribute(q, att[q]); svg.appendChild(n); return n; };
        var traccia = function (f, da, a) {
          var d = "", n = 70; for (var i = 0; i <= n; i++) { var x = da + (a - da) * i / n; d += (i ? "L" : "M") + (x * dir).toFixed(1) + " " + f(x).toFixed(2); } return d;
        };
        var pd = function (f, x) { return Math.atan((f(x + 1) - f(x - 1)) / 2) * 57.3 * .8; };
        var an = [], kf = [], kA = [], kB = [], sA = [], sB = [], N = 170, i, tRit = .56, segno = false;
        /* 13/11, verdetto di Fre: la barca GRANDE si stacca davvero dal cerchio (niente dissolvenze), cresce mentre esce, naviga sulle onde
           lungo tutto il nome fino all'ultima lettera, vira e torna a posarsi nel logo. Il nome resta nero e intero, sopra a tutto: la barca
           gli passa dietro. La prua si ferma alla fine del nome e non arriva mai sul tasto Menu. Niente fermate secche fra una fase e l'altra. */
        var SC = tel ? 2 : 1.9, mezza = w * .194 * SC;      // mezza larghezza del disegno della barca
        var prua = fineNome, mn = tb && tb.querySelector(".apri-menu"), mnr = mn && mn.getBoundingClientRect();
        if (mnr && mnr.width) prua = Math.min(prua, (dir > 0 ? mnr.left - cm : cm - mnr.right) / k - 13.5);
        var D = Math.max(120, Math.min(520, prua - mezza * 1.13)), fineMare = D + mezza, xd = w * .55;   // 1.13: la barca inclinata sporge un poco di piu'
        var mare = w * (tel ? .38 : .3), lam = w * 1.3, amp = w * .07, spess = Math.max(2.4, w * .036), scafo = w * .077 * SC;   // 13/11, Fre: barca un filo piu' in alto, onde sotto ben visibili
        var onda = function (x, fase, kk) { var inc = .45 + .55 * Math.min(1, x / (D * .45)); return mare + kk * amp * inc * Math.sin(6.2832 * x / lam + fase); };   // il mare e' piu' calmo vicino al porto
        var yA = function (x) { return onda(x, 0, 1); };
        var yB = function (x) { return w * .11 + onda(x, 1.5, .8); };
        // acqua: due linee (andata, ritorno) piu' una scia di schiuma che segue la barca; in fondo due cerchi sull'acqua.
        // Il mare comincia dal bordo del cerchio (non attraversa il logo) e sta tutto sotto la base delle lettere.
        svg.setAttribute("width", Math.ceil(fineMare + 40)); svg.setAttribute("height", Math.ceil(mare + w * .35));
        var riva = function (f) { for (var x = 0; x < w; x += 1) { if (x * x + f(x) * f(x) > (w / 2 + 3) * (w / 2 + 3)) return x; } return w / 2; };
        var rA = riva(yA), rB = riva(yB), dA = traccia(yA, rA, fineMare), dB = traccia(yB, fineMare, rB);
        var scieA = el("path", { d: dA, fill: "none", stroke: "#E4B5A8", "stroke-width": spess * (tel ? 2.4 : 3.2), "stroke-linecap": "round", opacity: 0 });
        var scieB = el("path", { d: dB, fill: "none", stroke: "#E4B5A8", "stroke-width": spess * (tel ? 2.2 : 3), "stroke-linecap": "round", opacity: 0 });
        var lineaA = el("path", { d: dA, fill: "none", stroke: COL, "stroke-width": spess, "stroke-linecap": "round", opacity: 0 });
        var lineaB = el("path", { d: dB, fill: "none", stroke: COL, "stroke-width": spess * .85, "stroke-linecap": "round", opacity: 0 });
        var cer = [0, 1].map(function () { return el("ellipse", { cx: 0, cy: mare + 2, rx: 4, ry: 1.2, fill: "none", stroke: COL, "stroke-width": 1.4, opacity: 0 }); });
        mc.appendChild(svg);
        var LA = lineaA.getTotalLength(), LB = lineaB.getTotalLength(), qA = LA / (fineMare - rA), qB = LB / (fineMare - rB), sg = w * 1.3;
        lineaA.style.strokeDasharray = LA + " " + (LA + 30); lineaB.style.strokeDasharray = LB + " " + (LB + 30);   // il vuoto piu' lungo della linea: niente puntino in fondo
        scieA.style.strokeDasharray = sg + " " + (LA + sg); scieB.style.strokeDasharray = sg + " " + (LB + sg);
        var pR = function (g) { return g * g * (3 - g) / 2; };          // ritorno: parte da ferma, arriva lanciata all'attracco
        var posa = function (x, y, r, sk, sx, sc) { return "translate(" + (x * dir).toFixed(2) + "px," + y.toFixed(2) + "px) rotate(" + (r * dir).toFixed(2) + "deg) skewX(" + (sk * dir).toFixed(2) + "deg) scale(" + (sx * dir * sc).toFixed(3) + "," + sc.toFixed(3) + ")"; };
        var nd = Math.max(3, Math.min(7, (D - xd) * 1.5 / .3 * .14 / xd));   // l'attracco riparte alla stessa velocita' con cui finisce il ritorno
        var dentro = function (g) { return Math.min(1, g * 8, (1 - g) * 8); };
        for (i = 0; i <= N; i++) {
          var u = i / N, x = 0, y = 0, r = 0, sx = 1, sc = 1, sk = 0, g, lA = 0, oA = 0, lB = 0, oB = 0, fA = 0, fB = 0;
          if (u < .46) {   // si stacca dal cerchio crescendo, la vela prende vento, va fino all'ultima lettera
            var gs = sin(cl(u / .14)), go = cl((u - .04) / .42);
            x = D * sin(go); sc = 1 + (SC - 1) * gs;
            y = (yA(x) - w * .077 * sc) * gs - 4 * Math.sin(Math.PI * cl(u / .14)) - 2.2 * Math.sin(go * 10) * Math.sin(Math.PI * go) * gs;
            r = pd(yA, x) * gs + (u < .14 ? -8 * gs : -8 + 5 * sin(cl((u - .14) / .16)));
            sk = -7 * gs * (1 - cl((u - .14) / .14)) + 2.2 * Math.sin(u * 60) * gs * Math.sin(Math.PI * go);
            lA = Math.max(0, x + mezza * .6 - rA) * qA; oA = .95 * cl(lA / 8); fA = .55 * dentro(go);
          }
          else if (u < .56) {   // vira sul posto e scende sulla seconda onda
            g = (u - .46) / .1; x = D; y = yA(D) + (yB(D) - yA(D)) * sin(g) - scafo - 3 * Math.sin(Math.PI * g);
            sx = Math.cos(Math.PI * g); r = (pd(yA, D) - 3) * (1 - sin(g)) + (pd(yB, D) + 3) * sin(g) - 6 * Math.sin(Math.PI * g); sc = SC;
            lA = LA; oA = .95;
          }
          else if (u < .86) {   // torna sulla seconda onda
            g = (u - .56) / .3; x = D - (D - xd) * pR(g); y = yB(x) - scafo - 2 * Math.sin(g * 9) * Math.sin(Math.PI * g);
            r = pd(yB, x) + 3 - 1.5 * g; sx = -1; sc = SC; sk = 2 * Math.sin(u * 55) * Math.sin(Math.PI * g);
            lA = LA; oA = .95; lB = Math.max(0, fineMare - x + mezza * .6) * qB; oB = .7 * cl(g * 12) * cl(lB / 8); fB = .4 * dentro(g);
          }
          else {   // rientra nel cerchio rimpicciolendo e si posa piano
            g = (u - .86) / .14; var e5 = 1 - Math.pow(1 - g, nd), y0 = yB(xd) - scafo;
            x = xd * (1 - e5); y = y0 * (1 - e5 * e5); sc = 1 + (SC - 1) * (1 - e5) + .04 * Math.sin(Math.PI * g) * (1 - g);
            r = (pd(yB, xd) + 1.5) * (1 - e5); sx = -1 + 2 * sin(cl((g - .1) / .45));
            lA = LA; oA = .95; lB = LB; oB = .7;
          }
          if (Math.abs(sx) < .55) sx = sx < 0 ? -.55 : .55;   // alla virata la barca si stringe ma non diventa mai una riga sottile
          // il giro avviene di scatto, in un istante, mentre tutto il resto continua a muoversi: mai una barca di taglio, mai un fotogramma fermo
          if (kf.length && (sx < 0) !== segno) kf.push({ transform: posa(x, y, r, sk, segno ? -.55 : .55, sc), offset: u - .0003 });
          segno = sx < 0;
          kf.push({ transform: posa(x, y, r, sk, sx, sc), offset: u });
          kA.push({ strokeDashoffset: (LA - Math.min(LA, lA)).toFixed(2), opacity: oA.toFixed(3), offset: u });
          kB.push({ strokeDashoffset: (LB - Math.min(LB, lB)).toFixed(2), opacity: oB.toFixed(3), offset: u });
          sA.push({ strokeDashoffset: (sg - Math.max(0, x - rA) * qA).toFixed(2), opacity: fA.toFixed(3), offset: u });
          sB.push({ strokeDashoffset: (sg - Math.max(0, fineMare - x) * qB).toFixed(2), opacity: fB.toFixed(3), offset: u });
        }
        an.push(lineaA.animate(kA, { duration: T, fill: "both" }), lineaB.animate(kB, { duration: T, fill: "both" }), scieA.animate(sA, { duration: T, fill: "both" }), scieB.animate(sB, { duration: T, fill: "both" }));
        cer.forEach(function (c, j) {
          an.push(c.animate([{ opacity: 0, rx: 4, ry: 1.2, offset: 0 }, { opacity: .7, offset: .15 }, { opacity: 0, rx: w * (.5 + .3 * j), ry: w * (.1 + .05 * j), offset: 1 }], { delay: T * (.9 + .03 * j), duration: T * .1, easing: "ease-out", fill: "both" }));
        });
        an.push(svg.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: .6 }, { opacity: 0, offset: .985 }, { opacity: 0, offset: 1 }], { duration: T, fill: "forwards" }));
        var soloAndata = [lineaA, scieA];
        var corsa = barca.animate(kf, { duration: T, easing: "linear" }); an.push(corsa);
        corsa.onfinish = function () { inCorso = false; if (svg.parentNode) svg.parentNode.removeChild(svg); };
        if (ritorno) {   // si arriva da un'altra pagina: si riparte dalla virata, la barca compare e torna a casa
          soloAndata.forEach(function (p) { p.style.display = "none"; });
          an.push(barca.animate([{ opacity: 0 }, { opacity: 1 }], { duration: T * .07, delay: T * tRit, fill: "backwards" }));
          an.forEach(function (z) { z.currentTime = T * tRit; });
        }
      };
      /* 13/11, Fre: il tocco sul SOLO cerchio del logo fa partire la barchetta (parte e torna, non si cambia pagina);
         il tocco sul nome porta alla pagina principale come prima (da un'altra pagina la barca prende il largo e sulla home rientra).
         Con la tastiera il collegamento resta un collegamento alla home: la barchetta e' solo un di piu' per chi tocca o clicca. */
      var vaiA = m.getAttribute("href"), pulito = function (p) { return (p || "/").replace(/\/+$/, "") || "/"; };
      m.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        var altrove = pulito(vaiA) !== pulito(location.pathname);
        if (e.target && mc.contains(e.target)) { e.preventDefault(); if (!inCorso) parti(false); return; }
        if (inCorso) { if (!altrove) e.preventDefault(); return; }   // la barca e' gia' in giro: sul nome il collegamento fa il suo lavoro
        e.preventDefault(); parti(false);
        if (altrove) {   // da un'altra pagina: la barca prende il largo, si va alla home e la' rientra e si posa
          try { sessionStorage.setItem("vafBarca", "1"); } catch (x) { }
          setTimeout(function () { location.href = vaiA; }, 1000);
        }
      });
      /* 13/11, Fre: nella testata la barchetta riparte da sola ogni tanto (la prima volta dopo 9 secondi, poi ogni 30), cosi' chi guarda la nota.
         Non parte se la scheda non e' in vista, se il menu o l'Indice sono aperti o se e' gia' in giro; con «meno movimento» non parte mai.
         Dopo 8 ripartenze (circa 4 minuti) si ferma da sola: il tocco sul cerchio resta sempre attivo. */
      if (m.closest && m.closest(".testata")) {
        var doc = document.documentElement, giri = 0, giro = function () {
          if (!document.hidden && !inCorso && !doc.classList.contains("menu-aperto") && !doc.classList.contains("indice-aperto")) { parti(false); giri++; }
          if (giri < 8) setTimeout(giro, 30000);   // accessibilita' (WCAG 2.2.2): al massimo 8 ripartenze per pagina, poi solo col tocco sul cerchio
        };
        setTimeout(giro, 9000);
      }
      try {
        var quiO = location.pathname.replace(/\/+$/, "") || "/", destO = (m.getAttribute("href") || "/").replace(/\/+$/, "") || "/";
        if (destO === quiO && sessionStorage.getItem("vafBarca") === "1") { sessionStorage.removeItem("vafBarca"); setTimeout(function () { parti(true); }, 500); }
      } catch (x) { }
    });
  })();

  /* ---------- 2-bis. pagine lunghe (privacy, condizioni): indice laterale che segue la lettura ----------
     Si costruisce dai titoli che ci sono già; senza questo file la pagina è intera. Sotto i 1100 px non compare. */
  (function () {
    var prosa = document.querySelector(".prosa"); if (!prosa || innerWidth < 1100) return;
    var tit = $$("h2, h3", prosa); if (tit.length < 4) return;
    var lingua = (document.documentElement.lang || "it").slice(0, 2);
    var scritta = { it: "In questa pagina", en: "On this page", de: "Auf dieser Seite", fr: "Sur cette page", es: "En esta página", zh: "本页内容", ar: "في هذه الصفحة" }[lingua] || "In questa pagina";
    var nav = document.createElement("nav"); nav.className = "toc"; nav.setAttribute("aria-label", scritta);
    var html = '<p class="toc-t">' + scritta + "</p><ol>";
    tit.forEach(function (h, i) { if (!h.id) h.id = "t" + (i + 1); html += '<li><a href="#' + h.id + '">' + h.textContent.replace(/[<>&]/g, "") + "</a></li>"; });
    nav.innerHTML = html + "</ol>";
    var cont = prosa.parentNode; cont.classList.add("con-toc"); cont.appendChild(nav);
    var link = $$("a", nav);
    var attesa = false, corrente = null;
    var aggiorna = function () {
      attesa = false; var k = null, soglia = innerHeight * 0.3;
      tit.forEach(function (h) { if (h.getBoundingClientRect().top < soglia) k = h; });
      if (k === corrente) return; corrente = k;
      link.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (k) { var a = nav.querySelector('a[href="#' + k.id + '"]'); if (a) a.setAttribute("aria-current", "true"); }
    };
    addEventListener("scroll", function () { if (!attesa) { attesa = true; requestAnimationFrame(aggiorna); } }, { passive: true });
    aggiorna();
  })();

  /* ---------- 2-ter. pagina dei prezzi: riepilogo in testa, «scegli per esigenza» ----------
     Il prezzo «da» di ogni sezione sta scritto nella sezione stessa (attributo data-da, deciso a mano e uguale al listino); senza questo file la pagina è intera. */
  (function () {
    var sezioni = $$(".sez[data-da][id]"); if (sezioni.length < 3) return;
    var lingua = (document.documentElement.lang || "it").slice(0, 2);
    var T = { it: ["Scegli per esigenza", "da"], en: ["Choose by need", "from"], de: ["Nach Bedarf wählen", "ab"], fr: ["Choisir selon le besoin", "dès"], es: ["Elegir según la necesidad", "desde"], zh: ["按需求选择", "起"], ar: ["اختر حسب الحاجة", "من"] }[lingua] || ["Scegli per esigenza", "da"];
    var carte = sezioni.map(function (sez) {
      var h = sez.querySelector("h2"); if (!h) return "";
      return '<a class="rie-c" href="#' + sez.id + '"><span class="rie-p"><small>' + T[1] + '</small> ' + sez.getAttribute("data-da") + ' €</span><span class="rie-t">' + h.textContent.replace(/[<>&]/g, "") + "</span></a>";
    }).filter(Boolean);
    if (carte.length < 3) return;
    var primo = sezioni[0];
    var blocco = document.createElement("section"); blocco.className = "riepilogo"; blocco.setAttribute("aria-label", T[0]);
    blocco.innerHTML = '<div class="wrap"><p class="rie-occ">' + T[0] + '</p><div class="rie-g">' + carte.join("") + "</div></div>";
    primo.parentNode.insertBefore(blocco, primo);
  })();

  /* ---------- 3. il nastro delle lingue accelera con lo scorrimento ---------- */
  var riga = document.querySelector(".nastro-riga");
  if (riga && riga.getAnimations && !fermo) {
    var an = null, vel = 0, y1 = scrollY, vivoN = false;
    var ritmo = function () {
      an = an || riga.getAnimations()[0]; if (!an) { vivoN = false; return; }
      vel *= .93; an.playbackRate = 1 + Math.min(7, vel);
      if (vel > .02) requestAnimationFrame(ritmo); else { an.playbackRate = 1; vivoN = false; }
    };
    addEventListener("scroll", function () {
      var d = Math.abs(scrollY - y1); y1 = scrollY; vel = Math.min(7, vel + d * .05);
      if (!vivoN) { vivoN = true; requestAnimationFrame(ritmo); }
    }, { passive: true });
  }

  /* ---------- 4. pulsanti che seguono appena il mouse, luce che segue il mouse sulle carte ---------- */
  if (mouse && !fermo) {
    $$(".tasto").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--tx", (((e.clientX - r.left) / r.width - .5) * 9).toFixed(1) + "px");
        el.style.setProperty("--ty", (((e.clientY - r.top) / r.height - .5) * 6).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () { el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); });
    });
    $$(".porta, .carta").forEach(function (el) {
      el.classList.add("lume");
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      var l = document.createElement("span"); l.className = "lume-i"; l.setAttribute("aria-hidden", "true"); el.appendChild(l);
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left).toFixed(0) + "px"); el.style.setProperty("--my", (e.clientY - r.top).toFixed(0) + "px");
      });
    });
  }

  /* ---------- 5. etichetta che segue il mouse sugli elementi da trascinare ---------- */
  if (mouse && !fermo) {
    var voce = document.createElement("div"); voce.className = "cursore"; voce.setAttribute("aria-hidden", "true");
    document.body.appendChild(voce);
    var cx0 = 0, cy0 = 0, px = 0, py = 0, acceso = false, giroC = false;
    var segui = function () {
      px += (cx0 - px) * .2; py += (cy0 - py) * .2;
      voce.style.transform = "translate(" + px.toFixed(1) + "px," + py.toFixed(1) + "px) translate(-50%,-50%) scale(" + (acceso ? 1 : .2) + ")";
      if (acceso || Math.abs(cx0 - px) > .5) requestAnimationFrame(segui); else giroC = false;
    };
    $$(".cf, .settori, .galleria").forEach(function (el) {
      el.addEventListener("pointerenter", function (e) {
        voce.textContent = el.classList.contains("cf") ? "Trascina" : "Scorri";
        cx0 = px = e.clientX; cy0 = py = e.clientY; acceso = true; voce.classList.add("su");
        if (!giroC) { giroC = true; requestAnimationFrame(segui); }
      });
      el.addEventListener("pointermove", function (e) { cx0 = e.clientX; cy0 = e.clientY; });
      el.addEventListener("pointerleave", function () { acceso = false; voce.classList.remove("su"); });
      el.addEventListener("pointerdown", function () { voce.classList.add("preme"); });
    });
    addEventListener("pointerup", function () { voce.classList.remove("preme"); });
  }
})();

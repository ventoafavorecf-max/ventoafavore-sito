/* «La stessa frase»: nell'apertura della home, una frase italiana, la sua traduzione
   letterale che viene barrata, la riscrittura che entra parola per parola.
   Gli esempi si prendono dalla sezione .pairs della stessa pagina: si scrivono una volta sola.
   Da solo gira un esempio ogni dieci secondi; con le frecce comanda chi legge. si ferma al passaggio del mouse, fuori vista e a
   scheda nascosta. Chi chiede meno movimento vede l'esempio fermo e completo, con i tasti. */
(function () {
  var box = document.querySelector(".prova");
  if (!box || !document.documentElement.classList.contains("mv")) return;
  var scena = box.querySelector(".prova-scena");
  var conta = box.querySelector(".prova-conta");
  var barra = box.querySelector(".prova-tempo span");
  var fermo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var esempi = Array.prototype.map.call(document.querySelectorAll(".pairs .pair"), function (p) {
    return {
      chi: p.querySelector(".who").textContent,
      it: p.querySelector(".it").textContent,
      prima: p.querySelector(".before p").textContent,
      dopo: p.querySelector(".after p:not(.why)").textContent
    };
  });
  if (!esempi.length) return;

  /* scaletta di un esempio, in millisecondi */
  var F1 = 100, F2 = 1100, F3 = 2000, F4 = 2700, DURATA = 10000, USCITA = 350;
  var manuale = false;               /* dopo una freccia comanda chi legge: niente più giri automatici */
  var indice = 0, t = 0, pausa = false, fuori = false, ultimo = null, cambio = false;

  function parole(testo) {
    var n = 0;
    return testo.split(/(\s+)/).map(function (p) {
      if (!p) return "";
      if (/^\s+$/.test(p)) return " ";
      return '<span class="pw" style="--d:' + (n++ * 0.045).toFixed(3) + 's">' + p.replace(/</g, "&lt;") + "</span>";
    }).join("");
  }
  function riempi(i) {
    var e = esempi[i];
    scena.querySelector(".prova-chi").textContent = e.chi;
    scena.querySelector(".prova-it").textContent = e.it;
    scena.querySelector(".prova-prima p").innerHTML = '<span class="barra"></span>';
    scena.querySelector(".prova-prima .barra").textContent = e.prima;
    scena.querySelector(".prova-dopo p").innerHTML = parole(e.dopo);
    conta.textContent = (i + 1) + " / " + esempi.length;
  }
  function fasi(tutte) {
    ["f1", "f2", "f3", "f4"].forEach(function (f, k) {
      scena.classList.toggle(f, tutte || t >= [F1, F2, F3, F4][k]);
    });
  }
  /* altezza fissa sulla frase più lunga: niente salti della pagina */
  function misura() {
    scena.style.minHeight = "";
    var max = 0, tieni = indice;
    scena.classList.add("misura");
    esempi.forEach(function (e, i) { riempi(i); max = Math.max(max, scena.offsetHeight); });
    scena.classList.remove("misura");
    riempi(tieni);
    scena.style.minHeight = max + "px";
  }
  function vai(i) {
    indice = (i + esempi.length) % esempi.length;
    t = fermo ? DURATA : 0;
    scena.classList.remove("f1", "f2", "f3", "f4");
    riempi(indice);
    if (fermo) fasi(true);
  }
  function passa(verso) {
    if (cambio) return;
    cambio = true;
    scena.classList.add("via");
    setTimeout(function () { vai(indice + verso); scena.classList.remove("via"); cambio = false; }, USCITA);
  }

  function giro(ora) {
    var dt = ultimo === null ? 0 : Math.min(ora - ultimo, 100);
    ultimo = ora;
    if (!pausa && !fuori && !document.hidden && !cambio) {
      t += manuale ? dt * 4 : dt;        /* con le frecce l'esempio si compone in meno di un secondo */
      fasi(false);
      if (t >= DURATA) { if (manuale) t = DURATA; else passa(1); }
    }
    barra.style.transform = "scaleX(" + Math.min(1, t / DURATA).toFixed(4) + ")";
    requestAnimationFrame(giro);
  }

  box.querySelectorAll(".prova-tasto").forEach(function (b) {
    b.addEventListener("click", function () { manuale = true; box.classList.add("manuale"); passa(+b.getAttribute("data-verso")); });
  });
  box.addEventListener("mouseenter", function () { pausa = true; box.classList.add("in-pausa"); });
  box.addEventListener("mouseleave", function () { pausa = false; box.classList.remove("in-pausa"); });
  box.addEventListener("focusin", function () { pausa = true; box.classList.add("in-pausa"); });
  box.addEventListener("focusout", function () { pausa = false; box.classList.remove("in-pausa"); });
  new IntersectionObserver(function (v) { fuori = !v[0].isIntersecting; }).observe(box);
  addEventListener("resize", function () { clearTimeout(misura.t); misura.t = setTimeout(misura, 200); });

  misura();
  vai(0);
  if (fermo) return;
  t = -500;                          /* si parte mentre il titolo finisce di salire */
  requestAnimationFrame(giro);
})();

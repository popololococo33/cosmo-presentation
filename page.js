// La démo se pilote au défilement. Chaque scène reste à l'écran pendant qu'on fait défiler sa hauteur ; son avancement p va
// de 0 à 1. Les éléments portent leurs instants : data-a (arrivée), data-z (sortie), data-trace, data-compte, data-tape,
// data-on, data-pas. Flèche droite, espace ou télécommande : étape suivante (data-arrets). Flèche gauche : étape d'avant.
// Les noms viennent du lien (#Groupe/Société) : ils ne sont jamais écrits dans la page.
(function () {
  "use strict";
  var doc = document, $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var borne = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var t = function (p, a, b) { return borne((p - a) / (b - a)); };
  var expo = function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); };
  var doux = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var bond = function (x) { var c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var mix = function (a, b, x) { return a + (b - a) * x; };
  var euros = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); };

  // ---- Noms du lien
  function noms() {
    var h = decodeURIComponent((location.hash || "").replace(/^#/, "")).split("/").map(function (x) { return x.trim().slice(0, 40); });
    if (!h[0] || (doc.getElementById(h[0]) && h.length < 2)) return;
    var v = { groupe: h[0], societe: h[1] || h[0] };
    $$("[data-nom]").forEach(function (e) { e.textContent = v[e.dataset.nom]; });
  }
  try { noms(); } catch (e) { /* lien illisible : noms génériques */ }
  addEventListener("hashchange", function () { try { noms(); } catch (e) {} });

  // ---- Préparation des scènes
  var nombres = function (s) { return s.trim().split(/\s+/); };
  var scenes = $$("[data-scene]").map(function (el) {
    var s = { el: el, nom: el.dataset.scene, long: parseFloat(el.dataset.long), p: 0, cible: 0, plateau: $(".plateau", el), vu: null,
      stations: el.dataset.station ? nombres(el.dataset.station).map(Number) : null, arrets: nombres(el.dataset.arrets || "0.5").map(Number), effets: [] };
    $$("[data-a],[data-z]", el).forEach(function (e) {
      var a = e.dataset.a ? nombres(e.dataset.a) : null, z = e.dataset.z ? nombres(e.dataset.z) : null;
      s.effets.push({ e: e, a: a && [+a[0], +a[1]], z: z && [+z[0], +z[1]], g: (a && a[2]) || "monte", gz: (z && z[2]) || "monte" });
    });
    s.traces = $$("[data-trace]", el).map(function (e) { var n = nombres(e.dataset.trace); return [e, +n[0], +n[1]]; });
    s.comptes = $$("[data-compte]", el).map(function (e) { var n = nombres(e.dataset.compte); return [e, +n[0], +n[1], +n[2], +n[3], n[4] ? " " + n[4] : ""]; });
    s.tapes = $$("[data-tape]", el).map(function (e) { var n = nombres(e.dataset.tape), x = e.textContent; e.setAttribute("aria-label", x); return [e, +n[0], +n[1], x]; });
    s.ons = $$("[data-on]", el).map(function (e) { var n = nombres(e.dataset.on); return [e, +n[0], n[1]]; });
    s.pas = $$("[data-pas]", el).map(function (e) { var n = nombres(e.dataset.pas); return [e, +n[0], +n[1]]; });
    return s;
  });
  var par = {}; scenes.forEach(function (s) { (par[s.nom] = par[s.nom] || []).push(s); });

  var H = 1, L = 1, petit = false;
  function mesurer() {
    H = innerHeight; L = innerWidth; petit = L <= 820;
    scenes.forEach(function (s) { s.el.style.height = Math.round(s.long * H) + "px"; });
    scenes.forEach(function (s) { s.haut = s.el.offsetTop; s.course = s.el.offsetHeight - H + H * .5; });
    if (base) base = null;
  }
  var base = null;
  var versY = function (s, p) { return Math.max(0, s.haut - H * .5 + p * s.course); };

  // ---- Effets communs
  function appliquer(s, p) {
    s.effets.forEach(function (f) {
      var i = f.a ? t(p, f.a[0], f.a[1]) : 1, o = f.z ? t(p, f.z[0], f.z[1]) : 0, e = expo(i), q = doux(o), tr = "", st = f.e.style;
      st.opacity = Math.min(1, e * 1.15) * (1 - q);
      if (f.g === "pop") tr = "scale(" + mix(.6, 1, bond(i)).toFixed(4) + ")";
      else if (f.g === "gauche") tr = "translate3d(" + mix(-90, 0, e) + "px,0,0) rotateY(" + mix(26, 0, e) + "deg)";
      else if (f.g === "droite") tr = "translate3d(" + mix(90, 0, e) + "px,0,0) rotateY(" + mix(-26, 0, e) + "deg)";
      else if (f.g === "plonge") tr = "translate3d(0," + mix(70, 0, e) + "px," + mix(-260, 0, e) + "px) rotateX(" + mix(22, 0, e) + "deg)";
      else tr = "translate3d(0," + mix(34, 0, e) + "px,0)";
      if (o) tr += f.gz === "recule" ? "" : " translate3d(0," + (-34 * q) + "px,0)";
      if (f.gz === "recule") tr = "translate(-50%,-50%) scale(" + mix(1, .86, q) + ")";
      st.transform = tr;
      if (f.g === "masque") { st.filter = e < 1 ? "blur(" + mix(16, 0, e).toFixed(1) + "px)" : ""; }
      st.visibility = st.opacity < .01 ? "hidden" : "";
    });
    s.traces.forEach(function (x) { x[0].style.strokeDashoffset = 1 - doux(t(p, x[1], x[2])); x[0].style.opacity = p > x[1] ? 1 : 0; });
    s.comptes.forEach(function (x) { x[0].textContent = euros(mix(x[3], x[4], doux(t(p, x[1], x[2])))) + x[5]; });
    s.tapes.forEach(function (x) { var n = Math.round(x[3].length * t(p, x[1], x[2])); if (x.n !== n) { x.n = n; x[0].textContent = x[3].slice(0, n); } });
    s.ons.forEach(function (x) { x[0].classList.toggle(x[2], p >= x[1]); });
    s.pas.forEach(function (x) { x[0].classList.toggle("actif", p >= x[1] && p < x[2]); x[0].classList.toggle("fait", p >= x[2]); });
  }
  var rai = function (f, x) { var r = $(".rai", f); if (r) r.style.transform = "translateX(" + mix(-60, 60, x) + "%)"; };

  // ---- Scènes particulières
  var jeux = {};
  jeux.haut = function (s, p) {
    var f = $("#haut-fenetre .fenetre"), e = doux(t(p, .34, .8)), tx = $(".haut-texte");
    // p part de 0,x au premier écran : l'ouverture est déjà en place
    tx.style.transform = "translate3d(0," + (-H * .42 * e) + "px," + 0 + "px) scale(" + mix(1, .86, e) + ")"; tx.style.opacity = 1 - t(p, .5, .7);
    var libre = H * .5 - H * .02 - $("#haut-fenetre").offsetTop - f.offsetHeight * .5;
    f.style.transform = "translate3d(0," + mix(0, libre, e) + "px,0) rotateX(" + mix(petit ? 24 : 32, 0, e) + "deg) scale(" + mix(.92, 1.03, e) + ")";
    rai(f, t(p, .5, .95));
  };

  var objets = [["mail", "Mails"], ["table", "Excel"], ["doc", "Word"], ["doc", "Devis PDF"], ["agenda", "Agenda"], ["photo", "Photos"], ["calc", "Comptabilité"], ["banque", "Banque"], ["sms", "SMS"], ["boite", "Stock"], ["dossier", "Dossiers"], ["ticket", "Tickets"]];
  var nuage = $("#nuage"), posees = objets.map(function (o, i) {
    var e = doc.createElement("div"); e.className = "objet"; e.innerHTML = '<svg><use href="#i-' + o[0] + '"/></svg>'; e.appendChild(doc.createTextNode(o[1])); nuage.appendChild(e);
    var an = i / objets.length * Math.PI * 2 + .35; return { e: e, an: an, r: .34 + .1 * ((i * 7) % 5) / 4, z: -420 + ((i * 173) % 620), d: i * 1.7 };
  });
  jeux.constat = function (s, p, temps) {
    var k = doux(t(p, .66, .84)), entree = expo(t(p, 0, .12)), c = $("#coeur"), v = t(p, .78, .86);
    posees.forEach(function (o, i) {
      var ret = doux(borne(t(p, .66, .82) * 1.35 - i * .028)), haut = i % 2 ? 1 : -1, rang = Math.floor(i / 2), prof = (o.z + 420) / 620;
      var x = ((rang + .5) / 6 - .5) * L * (petit ? 1.25 : .98) + (haut > 0 ? L * .06 : -L * .04) + (p - .4) * L * .16 * (prof + .3) * haut * -1, y = haut * H * (.23 + .13 * ((rang * 3 + i) % 4) / 3) + Math.sin(temps * .7 + o.d) * 9;
      var tour = ret * 2.4, xr = (x * Math.cos(tour) - y * Math.sin(tour)) * (1 - ret), yr = (x * Math.sin(tour) + y * Math.cos(tour)) * (1 - ret), z = mix(-260 + prof * 360, -60, ret); x = xr; y = yr;
      if (ret > 0) y += -38 * ret;
      o.e.style.transform = "translate(-50%,-50%) translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px," + (z - 500 * (1 - entree)).toFixed(1) + "px) rotateY(" + (Math.sin(temps * .4 + o.d) * 12).toFixed(2) + "deg) rotateZ(" + (Math.sin(temps * .3 + o.d) * 4 + ret * 50).toFixed(2) + "deg) scale(" + mix(1, .25, ret).toFixed(3) + ")";
      o.e.style.opacity = entree * (1 - t(ret, .82, 1)) * (z < -200 ? .8 : 1);
      o.e.style.filter = z < -170 ? "blur(" + ((-170 - z) / 70).toFixed(1) + "px)" : "";
    });
    c.style.opacity = v > 0 ? 1 : 0; c.style.transform = "scale(" + (v > 0 ? bond(v) : 0).toFixed(3) + ") rotate(" + mix(-30, 0, expo(v)) + "deg)";
  };

  jeux.devis = function (s, p) {
    var src = $("#src"), cb = $("#cible"), sc = $("#scanne"), x = t(p, .14, .24);
    sc.style.opacity = x > 0 && x < 1 ? 1 : 0; sc.style.transform = "translateY(" + (x * (src.offsetHeight - 70)) + "px)";
    var k = doux(t(p, .44, .5)); $("#coef").textContent = "× " + (1 + k).toFixed(k > 0 && k < 1 ? 1 : 0).replace(".", ",");
    var f = doux(t(p, .78, .9)), ci = $(".centre-ia", s.plateau);
    ci.style.opacity = 1 - t(p, .77, .83); ci.style.visibility = p > .84 ? "hidden" : "";
    if (f > 0) { var bx = cb.parentNode; src.style.opacity = 1 - f; src.style.transform = "translate3d(" + (-40 * f) + "px,0," + (-260 * f) + "px) rotateY(" + (22 * f) + "deg)"; src.style.filter = "blur(" + 3 * f + "px)"; cb.style.transform = "translate3d(" + ((bx.offsetWidth / 2 - cb.offsetLeft - cb.offsetWidth / 2) * f) + "px,0," + (petit ? -40 * f : 110 * f) + "px) scale(" + (petit ? mix(1, 1.4, f) : 1) + ")"; }
    else src.style.filter = "";
    var fx = $("#faisceaux"); if (!fx.firstChild) for (var i = 0; i < 4; i++) { var pa = doc.createElementNS("http://www.w3.org/2000/svg", "path"), y = 96 + i * 34; pa.setAttribute("d", "M0 " + y + " C70 " + y + " 60 150 100 150 S130 " + y + " 200 " + y); pa.setAttribute("pathLength", "1"); fx.appendChild(pa); }
    $$("path", fx).forEach(function (pa, i) { var q = t(p, .49 + i * .03, .62 + i * .03); pa.style.strokeDashoffset = .22 - q * 1.22; pa.style.opacity = q > 0 && q < 1 ? 1 : 0; });
  };
  jeux.recopie = function (s, p) {
    var a = $("#r1"), b = $("#r2"), c = $("#r3"), e = expo(t(p, .06, .18)), q = doux(t(p, .3, .46)), v = doux(t(p, .58, .72)), w = petit ? .5 : 1;
    a.style.opacity = e * (1 - .85 * v); a.style.transform = "translate3d(" + (-150 * w * q - 60 * v) + "px," + 60 * (1 - e) + "px," + (-160 * v) + "px) rotateY(" + (14 * q) + "deg) rotateZ(" + (-3 * q) + "deg)";
    b.style.opacity = t(p, .3, .34) * (1 - .85 * v); b.style.transform = "translate3d(" + (150 * w * q + 60 * v) + "px,0," + (40 * q - 200 * v) + "px) rotateY(" + (-14 * q) + "deg) rotateZ(" + (3 * q) + "deg)";
    c.style.opacity = v; c.style.transform = "translate3d(0," + mix(120, 0, v) + "px,120px) rotateZ(" + mix(12, -2, v) + "deg) scale(" + mix(.8, 1.08, v) + ")";
    var d = t(p, .8, .9); c.style.filter = d > 0 && d < 1 ? "brightness(" + (1 + Math.sin(d * Math.PI) * .9) + ")" : ""; c.classList.toggle("papier", p < .85); $(".f-tete b", c).textContent = p < .85 ? "Devis 2013" : "Devis"; $(".f-tete span", c).textContent = p < .85 ? "papier" : "modifiable";
  };
  jeux.commande = function (s, p) {
    var et = p < .32 ? "Devis" : p < .52 ? "Commande" : p < .74 ? "Bon de livraison" : "Facture", n = $("#piece-type"), pi = $("#piece");
    if (n.textContent !== et) n.textContent = et;
    var tour = 0; [.32, .52, .74].forEach(function (q) { var x = t(p, q - .05, q + .05); if (x > 0 && x < 1) tour = x < .5 ? 90 * doux(x * 2) : -90 + 90 * doux((x - .5) * 2); });
    if (p > .16) pi.style.transform = "rotateY(" + tour.toFixed(1) + "deg)";
    $("#st1").textContent = p < .56 ? 4 : 3; $("#st2").textContent = p >= .4 && p < .56 ? 1 : 0; $("#st3").textContent = p < .4 ? 4 : 3;
    $("#jauge").style.transform = "scaleX(" + mix(.66, .5, doux(t(p, .38, .44))) + ")";
    $(".accord", pi).style.visibility = "";
  };
  jeux.agenda = function (s, p) {
    var r = $("#rdv"), e = bond(t(p, .18, .3)), x = t(p, .4, .56), tl = $("#tel"), ok = p > .72;
    r.style.opacity = t(p, .18, .22); r.style.transform = "translate3d(0," + mix(-60, 0, e) + "px,0) scale(" + mix(.8, 1, e) + ")";
    tl.style.opacity = t(p, .4, .46); tl.style.transform = "perspective(1200px) translate3d(" + mix(120, 0, expo(x)) + "px,0,0) rotateY(" + mix(-50, -10, expo(x)) + "deg) rotateX(4deg)";
    var b = $("#telbtn"); b.classList.toggle("oui", ok); b.textContent = ok ? "Confirmé" : "Je confirme"; b.style.transform = "scale(" + (1 - .08 * Math.sin(Math.PI * t(p, .68, .76))) + ")";
    var c = $("#conf"), k = t(p, .78, .86); c.style.opacity = k; c.style.transform = "scale(" + mix(.5, 1, bond(k)) + ")"; c.style.transformOrigin = "0 50%";
  };

  var papiers = [["Facture fournisseur", "Facture d’achat", 0], ["Devis signé", "Bon pour accord", 1], ["Ticket de péage", "Ticket", 2], ["Contrôle technique", "68 650 km", 3], ["Avoir", "Avoir fournisseur", 0]];
  var tribox = $("#tribox"), vols = papiers.map(function (x) { var e = doc.createElement("div"); e.className = "papierv"; e.innerHTML = '<svg><use href="#i-doc"/></svg><span></span><em></em>'; e.children[1].textContent = x[0]; e.children[2].textContent = x[1]; tribox.appendChild(e); return e; });
  jeux.tri = function (s, p, temps) {
    var h = tribox.offsetHeight, l = tribox.offsetWidth, cas = $$(".casier", tribox), compte = [0, 0, 0, 0], yl = h * (petit ? .38 : .46);
    vols.forEach(function (e, i) {
      var d = .1 + i * .13, a = expo(t(p, d, d + .09)), lu = t(p, d + .08, d + .13), z = doux(t(p, d + .14, d + .24)), k = papiers[i][2], c = cas[k];
      var cx = c.offsetLeft + c.offsetWidth / 2 + c.parentNode.offsetLeft - l / 2, cy = c.parentNode.offsetTop + c.offsetTop + 20;
      var x = mix((i % 2 ? 1 : -1) * 60 * (1 - a), cx, z), y = mix(mix(30, yl - 24, a), cy, z) - Math.sin(z * Math.PI) * 60;
      e.style.opacity = t(p, d, d + .02) * (1 - t(z, .82, 1)); e.style.transform = "translate(-50%,0) translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) rotateZ(" + ((1 - a) * (i % 2 ? 12 : -12)) + "deg) scale(" + mix(1, .55, z) + ")";
      e.children[2].style.opacity = lu; e.children[2].style.display = lu > 0 ? "" : "none"; if (z >= .95) compte[k]++;
    });
    cas.forEach(function (c, i) { c.classList.toggle("plein", compte[i] > 0); $("small", c).textContent = compte[i] ? compte[i] + (compte[i] > 1 ? " documents" : " document") : "Vide"; });
    var pulse = .5 + .5 * Math.sin(temps * 2.4); $("#lecteur").style.boxShadow = "0 0 " + (60 + 40 * pulse) + "px " + (4 + 10 * pulse) + "px rgba(70,120,255,.5)";
  };
  jeux.fe = function (s, p) {
    var pa = $("#fe-lum"), lt = pa.getTotalLength(), aller = doux(t(p, .12, .46)), ret = doux(t(p, .56, .86)), q = p < .52 ? aller : 1 - ret, pt = pa.getPointAtLength(lt * q);
    var sv = $("#reseau-svg"), m = sv.getScreenCTM(), box = $(".reseau").getBoundingClientRect(), pli = $("#pli");
    if (m) pli.style.transform = "translate3d(" + (pt.x * m.a + m.e - box.left) + "px," + (pt.y * m.d + m.f - box.top - 84 * Math.pow(Math.abs(2 * q - 1), 6)) + "px,0) rotate(" + Math.sin(q * 9) * 7 + "deg)";
    pli.style.opacity = t(p, .08, .13) * (1 - t(p, .84, .88)) * (1 - Math.sin(Math.PI * t(p, .48, .56)));
    pa.style.strokeDashoffset = p < .52 ? 1 - aller : -(0) + (1 - 1) ; pa.style.opacity = p < .52 ? 1 : 1 - .6 * ret;
    $("#fe-autre").textContent = p < .52 ? "Le client" : "Le fournisseur";
  };
  function monte(id, a, b, c) { return function (s, p) { var f = $(id + " .fenetre"), e = expo(t(p, a, b)); f.style.opacity = t(p, a, a + .06); f.style.transform = "translate3d(0," + mix(H * .5, 0, e) + "px,0) rotateX(" + mix(34, 0, e) + "deg) scale(" + mix(.9, 1, e) + ")"; rai(f, t(p, b - .05, c || b + .25)); }; }
  var mb = monte("#f-banque", .58, .84, 1), mr = monte("#f-relances", .46, .82, 1);
  jeux.banque = function (s, p) { $("#f-banque").style.transform = "translateX(-50%)"; mb(s, p); };
  jeux.relances = mr;
  jeux.bilan = function (s, p) { var e = $("#d-etat"), v = p < .42 ? "À traiter" : p < .72 ? "À valider" : "Terminé"; if (e.textContent !== v) e.textContent = v; e.classList.toggle("vert", p >= .72); };
  jeux.decision = function (s, p) { $("#t-case").classList.toggle("ok", p > .56); var e = $("#d2-etat"), v = p < .74 ? "Urgente" : "Terminé"; if (e.textContent !== v) e.textContent = v; e.classList.toggle("rouge", p < .74); e.classList.toggle("vert", p >= .74); };
  jeux.plongee = function (s, p) {
    var a = $("#p1"), b = $("#p2"), c = $("#p3"), e = expo(t(p, .04, .16)), z = doux(t(p, .18, .36)), y = expo(t(p, .3, .44)), z2 = doux(t(p, .52, .72)), f = expo(t(p, .66, .8));
    var fa = $(".fenetre", a), fb = $(".fenetre", b);
    a.style.transform = "translate(-50%,-50%)"; b.style.transform = "translate(-50%,-50%)";
    fa.style.transformOrigin = "44.300% 42.800%"; fa.style.transform = "translate3d(" + (5.7 * z) + "%," + (H * .3 * (1 - e) + fa.offsetHeight * .07 * z) + "px,0) rotateX(" + mix(26, 0, e) + "deg) scale(" + mix(1, petit ? 4.6 : 3.6, z) + ")";
    fa.style.opacity = t(p, .04, .08) * (1 - t(p, .3, .37)); fa.style.filter = z > .85 ? "blur(" + ((z - .85) * 40).toFixed(1) + "px)" : "";
    fb.style.transformOrigin = "33% 49%"; fb.style.opacity = t(p, .3, .37) * (1 - t(p, .64, .72)); fb.style.transform = "translate3d(" + (17 * z2) + "%,0,0) scale(" + (mix(.72, 1, y) * mix(1, petit ? 3.6 : 2.8, z2)).toFixed(3) + ")"; fb.style.filter = z2 > .85 ? "blur(" + ((z2 - .85) * 40).toFixed(1) + "px)" : "";
    c.style.opacity = t(p, .66, .72); c.style.transform = "translate(-50%,-50%) scale(" + mix(.3, 1, f).toFixed(3) + ") rotateX(" + mix(40, 0, f) + "deg)";
  };
  jeux.nuit = function (s, p) { var a = $(".arc", s.el); if (a) a.style.transform = "translate3d(0," + mix(44, 12, doux(t(p, 0, 1))) + "vh,0)"; };
  jeux.fin = function (s, p, temps) { var a = $(".arc", s.el); a.style.transform = "translate3d(0," + mix(44, 14, doux(t(p, 0, 1))) + "vh,0)"; var l = $("#fin-logo"); if (p > .72) l.style.boxShadow = "0 0 " + (120 + 30 * Math.sin(temps * 1.6)) + "px 24px rgba(80,130,255,.6)"; };

  // ---- Le fil en bas de l'écran
  var fil = $("#fil"), fp = $("#fil-plein"), fb = $("#fil-point"), fli = $$("#fil li"), hist = par.histoire[0], filPos = 0;
  function leFil(y) {
    var h = hist.p, vis = expo(t(h, .16, .26)), bas = doux(t(h, .82, .99)), fin = par.fin[0], q = 0;
    if (y > hist.haut + hist.el.offsetHeight) { vis = 1; bas = 1; }
    var op = vis * (1 - t(fin.p, .02, .16)); if (y < hist.haut - H) op = 0;
    var place = $("#place-fil").getBoundingClientRect(), dy = (place.top + place.height / 2) - (H - fil.offsetHeight / 2);
    if (bas >= 1) dy = 0;
    fil.style.opacity = op; fil.style.setProperty("--bas", bas.toFixed(2)); fil.style.visibility = op < .01 ? "hidden" : "";
    fil.style.transform = "translateX(-50%) translateY(" + (dy * (1 - bas)).toFixed(1) + "px) scale(" + mix(petit ? 1 : 1.12, 1, bas) + ")";
    // position : dans l'histoire, la lumière parcourt tout le fil ; ensuite elle suit la scène en cours
    if (bas < 1 && y < hist.haut + hist.el.offsetHeight) q = 6 * doux(t(h, .24, .56)) * (1 - doux(t(h, .78, .96)));
    else { q = 0; scenes.forEach(function (s) { if (!s.stations || s.cible <= 0) return; var n = s.stations, i = Math.min(n.length - 1, Math.floor(s.p * n.length)); if (s.nom === "commande") i = s.p < .32 ? -1 : s.p < .52 ? 0 : s.p < .74 ? 1 : 2; q = i < 0 ? 1 : n[i]; }); }
    filPos += (q - filPos) * (calme ? 1 : bas < 1 ? .5 : .09);
    if (Math.abs(q - filPos) < .002) filPos = q;
    fp.style.transform = "scaleX(" + filPos / 6 + ")"; fb.style.left = filPos / 6 * 100 + "%";
    var ici = Math.round(filPos); fli.forEach(function (l, i) { l.classList.toggle("ici", i === ici); l.classList.toggle("passe", i < ici); });
  }

  // ---- Lueurs du fond (WebGL, sans bibliothèque)
  var dessiner = (function () {
    var c = $("#lueurs"), gl = c.getContext("webgl", { antialias: false, alpha: true }); if (!gl) return function () {};
    var sh = function (ty, x) { var o = gl.createShader(ty); gl.shaderSource(o, x); gl.compileShader(o); return o; };
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "precision mediump float;uniform vec2 r;uniform float t,k;float g(vec2 p,vec2 c,float s){vec2 d=p-c;return exp(-dot(d,d)/(s*s));}void main(){vec2 p=gl_FragCoord.xy/r;float a=r.x/r.y;p.x*=a;vec3 c=vec3(.985,.988,.996);c=mix(c,vec3(.70,.82,1.),.62*k*g(p,vec2(a*(.18+.08*sin(t*.21)),.72+.1*cos(t*.17)),.46));c=mix(c,vec3(.86,.80,1.),.55*k*g(p,vec2(a*(.84+.06*cos(t*.19)),.3+.12*sin(t*.23)),.5));c=mix(c,vec3(.74,.93,.98),.5*k*g(p,vec2(a*(.52+.12*sin(t*.13)),.02+.08*cos(t*.2)),.42));c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9,78.2)))*43758.5)-.5)/200.;gl_FragColor=vec4(c,1.);}"));
    gl.linkProgram(pr); if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return function () {};
    gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var lo = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(lo); gl.vertexAttribPointer(lo, 2, gl.FLOAT, false, 0, 0);
    var ur = gl.getUniformLocation(pr, "r"), ut = gl.getUniformLocation(pr, "t"), uk = gl.getUniformLocation(pr, "k");
    return function (te, k) { var w = Math.round(L / 2), h = Math.round(H / 2); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); } gl.uniform2f(ur, w, h); gl.uniform1f(ut, te); gl.uniform1f(uk, k); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  })();

  // ---- Boucle
  var barre = $("#barre"), temps0 = $("#temps"), chapitres = ["vente", "administration", "direction"], force = false;
  function image(ms) {
    requestAnimationFrame(image);
    if (innerHeight < 60 || innerWidth < 60) return;
    if (innerHeight !== H && !petit || innerWidth !== L || H < 60) mesurer();
    var y = scrollY, temps = ms / 1000;
    scenes.forEach(function (s) {
      s.cible = borne((y - s.haut + H * .5) / s.course) || 0; if (!isFinite(s.p)) s.p = s.cible;
      var d = s.cible - s.p; s.p = calme || force || Math.abs(d) < .0004 ? s.cible : s.p + d * .16;
      var proche = y + H * 1.2 > s.haut && y < s.haut + s.el.offsetHeight + H * .2;
      if (!proche && s.vu === s.p) return;
      if (s.vu !== s.p || proche && (s.nom === "constat" || s.nom === "tri" || s.nom === "fin")) { s.vu = s.p; try { appliquer(s, s.p); if (jeux[s.nom]) jeux[s.nom](s, s.p, temps); } catch (e) { s.vu = null; } }
    });
    leFil(y);
    var mil = y + 40, sombre = false, bsombre = false, ch = -1, n;
    scenes.forEach(function (s) { var r = mil >= s.haut && mil < s.haut + s.el.offsetHeight, rb = y + H - 40 >= s.haut && y + H - 40 < s.haut + s.el.offsetHeight; if (s.el.classList.contains("nuit")) { if (r) sombre = true; if (rb) bsombre = true; } n = chapitres.indexOf(s.el.id); if (n >= 0 && y + H * .5 >= s.haut) ch = n; });
    barre.classList.toggle("sombre", sombre); fil.classList.toggle("sombre", bsombre); var tx = ch < 0 ? "" : ["Partie 1 · La vente", "Partie 2 · L’administration", "Partie 3 · La direction"][ch]; if (temps0.textContent !== tx) temps0.textContent = tx;
    dessiner(temps, y < H * 6 ? 1 : .55);
  }

  // ---- Télécommande, flèches, menu
  function arrets() { var l = [0]; scenes.forEach(function (s) { s.arrets.forEach(function (p) { l.push(versY(s, p)); }); }); return l.map(Math.round).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }); }
  var vol = null;
  function aller(y, duree) {
    var d = scrollY, t0 = null, dist = Math.abs(y - d); duree = duree || Math.min(2600, 700 + dist / H * 620); if (calme) { scrollTo(0, y); return; }
    cancelAnimationFrame(vol); (function pas(ms) { if (t0 === null) t0 = ms; var x = borne((ms - t0) / duree), q = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; scrollTo(0, d + (y - d) * q); if (x < 1) vol = requestAnimationFrame(pas); else { vol = null; but = null; } })(performance.now());
    but = y; sens = y >= d ? 1 : -1;
  }
  var but = null;
  // Diaporama : quand le défilement s'arrête, il se pose sur la diapo suivante (ou celle d'avant si on remonte)
  var sens = 1, vu = 0, repos = null, doigt = false;
  function poser() {
    if (vol || doigt || calme) return; var l = arrets(), y = scrollY, av = null, ap = null;
    l.forEach(function (v) { if (v <= y + 3) av = v; else if (ap === null) ap = v; });
    if (av === null || ap === null || Math.abs(av - y) <= 3) return;
    var q = (y - av) / (ap - av); aller(sens > 0 ? (q > .06 ? ap : av) : (q < .94 ? av : ap));
  }
  function attendre() { clearTimeout(repos); repos = setTimeout(poser, 260); }
  addEventListener("scroll", function () { var y = scrollY; if (!vol) { if (Math.abs(y - vu) > 1) sens = y > vu ? 1 : -1; attendre(); } vu = y; }, { passive: true });
  addEventListener("wheel", function (ev) { if (!ev.deltaY) return; var n = ev.deltaY > 0 ? 1 : -1; if (vol && n === sens) return; sens = n; cancelAnimationFrame(vol); vol = null; but = null; attendre(); }, { passive: true });
  addEventListener("touchstart", function () { doigt = true; cancelAnimationFrame(vol); vol = null; but = null; }, { passive: true });
  ["touchend", "touchcancel"].forEach(function (e) { addEventListener(e, function () { doigt = false; attendre(); }, { passive: true }); });
  addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var c3 = { "1": "vente", "2": "administration", "3": "direction", Home: "haut" }[e.key];
    if (c3) { e.preventDefault(); var s3 = scenes.find(function (x) { return x.el.id === c3; }); cancelAnimationFrame(vol); vol = null; but = null; force = true; scrollTo(0, c3 === "haut" ? 0 : versY(s3, s3.arrets[0])); setTimeout(function () { force = false; }, 120); return; }
 var l = arrets(), y = but !== null ? but : scrollY, c = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown" || e.key === "Enter" || (e.key === " " && !e.shiftKey)) c = l.find(function (v) { return v > y + 12; });
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp" || e.key === " ") c = l.reverse().find(function (v) { return v < y - 12; });
    else return; e.preventDefault(); if (c !== undefined && c !== null) aller(c);
  });
  $$("[data-vers]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var s = scenes.find(function (x) { return x.el.id === a.dataset.vers; }); but = null; scrollTo(0, a.dataset.vers === "haut" ? 0 : versY(s, s.arrets[0])); }); });

  mesurer(); var dl = innerWidth, dh = innerHeight;
  addEventListener("resize", function () { if (innerWidth === dl && Math.abs(innerHeight - dh) < 120 && innerWidth <= 820) return; dl = innerWidth; dh = innerHeight; mesurer(); });
  addEventListener("load", mesurer);
  window.pilot = { scenes: scenes, aller: function (id, p) { var s = scenes.find(function (x) { return x.el.id === id; }); force = true; doigt = true; cancelAnimationFrame(vol); vol = null; scrollTo(0, versY(s, p)); }, arrets: arrets };
  requestAnimationFrame(image);
})();

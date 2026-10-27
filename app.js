/* =====================================================
   CyberSOC Academy : moteur de simulation + 2 scénarios
   ===================================================== */

// ---------- DONNÉES DES SCÉNARIOS ----------
const SCENARIOS = {

  /* ===================== SCÉNARIO 1 : HAMEÇONNAGE ===================== */
  phishing: {
    title: "Le courriel de la « Banque »",
    level: "Débutant", levelClass: "tag-green",
    meta: "⏱ 10 min · 4 indices",
    context: `<b>Contexte :</b> Vous êtes analyste SOC N1 chez <b>Nordic Logistics</b>, une PME de 300 employés.
      Il est lundi matin. Julie Dupont, comptable, vient de vous signaler par le bouton « Signaler un courriel »
      un message qui lui semble étrange. Votre mission : déterminer s'il s'agit d'un hameçonnage, évaluer la portée
      et choisir les bonnes actions.`,
    alert: {
      title: "⚠ ALERTE · Sévérité : <b>MOYENNE</b>",
      text: "Une employée signale un courriel « Action requise : votre compte sera suspendu » provenant de support@banque-securite.co.",
      meta: "Reçue à 09:42 · Source : Signalement utilisateur (jdupont)"
    },
    evidence: [
      { id: "headers", label: "📧 En-têtes du courriel", key: true, text:
`$ cat headers.txt
From:        "Support Banque" <support@banque-securite.co>
Reply-To:    no-reply@mail-secure.xyz
Return-Path: bounce@mail-secure.xyz
Date:        Mon, 08:57 -0500
Subject:     Action requise : votre compte sera suspendu
SPF:         FAIL
DKIM:        NONE
DMARC:       FAIL

> Le domaine d'expédition ne correspond pas à celui de la
> banque réelle (banque.com). Les trois contrôles
> d'authentification échouent.` },
      { id: "link", label: "🔗 Analyse du lien", key: true, text:
`$ analyze-link
Texte affiché : https://banque.com/connexion
URL réelle    : http://banque-verif.top/login
Domaine créé  : il y a 2 jours
Certificat    : aucun (HTTP)
Réputation    : MALVEILLANT (3 moteurs sur 9)
Page cible    : formulaire imitant la banque (vol d'identifiants)

> Le texte du lien masque une destination différente.` },
      { id: "recipients", label: "👥 Autres destinataires", key: true, text:
`$ search-recipients --sender support@banque-securite.co
Résultats : 14 destinataires
  - 9 boîtes du département Finance
  - 5 boîtes du département RH
Courriels encore non lus : 11
Courriels ouverts       : 3

> Le message cible des profils sensibles (finance / RH).` },
      { id: "clicks", label: "🕒 Journal de clics (proxy)", key: true, text:
`$ proxy-logs --domain banque-verif.top
09:31  jdupont   GET  /login    200
09:33  jdupont   POST /login    200   (formulaire envoyé)
09:51  mlavoie   GET  /login    200
Aucun autre accès enregistré.

> Julie a SAISI ses identifiants avant de signaler.
> Marc Lavoie a ouvert la page sans soumettre de formulaire.` },
      { id: "calendar", label: "📅 Activité de l'entreprise", key: false, text:
`$ cat it-notices.txt
Aucune maintenance planifiée aujourd'hui.
Aucune campagne officielle de la banque en cours.
Dernière formation anti-hameçonnage : il y a 11 mois.

> Contexte : rien ne justifie ce message.` }
    ],
    evaluation: {
      options: [
        { id: "normal", label: "Activité normale" },
        { id: "suspect", label: "Activité suspecte (hameçonnage)" },
        { id: "insuf", label: "Informations insuffisantes pour conclure" }
      ],
      correct: "suspect", points: 20,
      explain: {
        suspect: "Les en-têtes (SPF/DKIM/DMARC en échec), le lien trompeur et le domaine récent confirment un hameçonnage.",
        normal: "Un courriel dont l'authentification échoue et dont le lien masque une autre destination n'est jamais « normal ».",
        insuf: "Les indices disponibles étaient suffisants : il fallait les consulter avant de conclure."
      }
    },
    risk: {
      correct: "high", points: 15, partial: "mid", partialPoints: 7,
      explain: "Le risque est <b>élevé</b> : des identifiants ont réellement été saisis et 14 personnes sensibles (Finance/RH) sont ciblées."
    },
    actions: [
      { id: "delete", label: "Supprimer le courriel uniquement", points: -10, type: "bad",
        why: "Insuffisant : supprimer seul ne règle rien. Des identifiants ont déjà été saisis et d'autres boîtes sont touchées." },
      { id: "checkclick", label: "Vérifier si le lien a été consulté (logs proxy)", points: 10, type: "good",
        why: "Essentiel : c'est ce qui révèle que Julie a saisi ses identifiants et que Marc a ouvert la page." },
      { id: "recipients", label: "Identifier tous les destinataires du courriel", points: 10, type: "good",
        why: "Permet de mesurer la portée (14 personnes) et d'alerter les personnes qui n'ont pas encore ouvert le message." },
      { id: "purge", label: "Retirer le courriel de toutes les boîtes et bloquer le domaine", points: 12, type: "good",
        why: "Contient la menace : évite de nouveaux clics (11 messages encore non lus) et bloque l'accès à la page malveillante." },
      { id: "reset", label: "Réinitialiser le mot de passe de Julie Dupont et révoquer ses sessions", points: 13, type: "good",
        why: "Ses identifiants sont compromis : il faut les rendre inutilisables immédiatement." },
      { id: "escalate", label: "Escalader à l'équipe de sécurité / documenter l'incident", points: 8, type: "good",
        why: "Une compromission de compte avérée doit être tracée et escaladée selon la procédure." },
      { id: "reset_all", label: "Réinitialiser les mots de passe de tous les employés", points: -5, type: "warn",
        why: "Disproportionné : cause une perturbation majeure alors que seuls les comptes réellement exposés sont à traiter." },
      { id: "ignore", label: "Ne rien faire, c'est probablement du spam", points: -15, type: "bad",
        why: "Dangereux : un compte est déjà compromis." }
    ],
    bonusKeyEvidence: 12,   // points si tous les indices clés ont été consultés
    summary: {
      great: "Excellent travail : vous avez identifié l'hameçonnage, mesuré la portée et contenu la menace.",
      ok: "Bonne base, mais certaines étapes de confinement ou d'analyse de portée manquaient.",
      low: "L'analyse est incomplète. Dans un cas réel, une compromission de compte aurait pu se propager."
    },
    lesson: "Ne vous arrêtez jamais à « supprimer le courriel » : vérifiez toujours qui l'a reçu, qui a cliqué et si des identifiants ont été saisis."
  },

  /* ===================== SCÉNARIO 2 : CONNEXION SUSPECTE ===================== */
  login: {
    title: "Connexion à 3 h du matin",
    level: "Intermédiaire", levelClass: "tag-orange",
    meta: "⏱ 15 min · 5 indices",
    context: `<b>Contexte :</b> Vous êtes analyste SOC N1 chez <b>Nordic Logistics</b>. Votre SIEM vient de lever une alerte
      sur le compte de <b>Thomas Girard</b>, responsable des achats. Une connexion a eu lieu en pleine nuit depuis une
      adresse inhabituelle. Attention : toutes les alertes ne sont pas des attaques. Examinez les faits avant d'agir.`,
    alert: {
      title: "⚠ ALERTE · Sévérité : <b>ÉLEVÉE</b>",
      text: "Connexion réussie au compte tgirard@nordic-logistics.com à 03:12 depuis une IP jamais vue (pays : Roumanie).",
      meta: "Détectée à 03:14 · Source : SIEM (règle « connexion atypique »)"
    },
    evidence: [
      { id: "auth", label: "🔐 Journal d'authentification", key: true, text:
`$ auth-logs --user tgirard --last 24h
02:58  FAIL   185.220.xx.xx  (RO)  mot de passe incorrect
03:01  FAIL   185.220.xx.xx  (RO)  mot de passe incorrect
03:04  FAIL   185.220.xx.xx  (RO)  mot de passe incorrect
03:07  FAIL   185.220.xx.xx  (RO)  mot de passe incorrect
03:09  FAIL   185.220.xx.xx  (RO)  mot de passe incorrect
03:12  OK     185.220.xx.xx  (RO)  connexion réussie
-----------------------------------------------------------
Habituel : connexions 08:00-18:00 depuis Montréal

> 5 échecs consécutifs puis un succès : typique d'une
> attaque par force brute ou « credential stuffing ».` },
      { id: "ip", label: "🌍 Réputation de l'IP", key: true, text:
`$ ip-intel 185.220.xx.xx
Pays        : Roumanie
Hébergeur   : service VPN / nœud de sortie Tor
Réputation  : MALVEILLANT (signalée 212 fois)
Première observation chez nous : aujourd'hui

> IP connue pour des campagnes de force brute.` },
      { id: "device", label: "💻 Appareil utilisé", key: true, text:
`$ device-info --session 03:12
Appareil      : Linux / Firefox 102
Appareil connu: NON (jamais enregistré)
MFA           : non demandé (exception « accès hérité » active)

Appareils habituels de Thomas :
  - Laptop Windows 11 (Montréal)
  - iPhone 14

> Appareil inconnu, et le MFA n'a pas été exigé.` },
      { id: "actions", label: "📂 Activité après connexion", key: true, text:
`$ activity --user tgirard --from 03:12
03:13  Lecture   boîte courriel
03:15  Création  règle de transfert -> ext-collect@proton.me
03:18  Accès     dossier partagé « Contrats-Fournisseurs »
03:21  Export    42 fichiers (ZIP)

> Création d'une règle de transfert externe + export massif :
> comportement d'un attaquant, pas d'un utilisateur normal.` },
      { id: "hr", label: "🧳 Informations RH / voyages", key: false, text:
`$ hr-lookup tgirard
Statut         : En poste à Montréal
Congés         : aucun
Voyage déclaré : aucun
Dernier badge  : hier 17:42 (bureau Montréal)

> Thomas n'est pas en voyage : la connexion depuis la
> Roumanie n'est pas légitime.` }
    ],
    evaluation: {
      options: [
        { id: "normal", label: "Activité normale (déplacement de l'utilisateur)" },
        { id: "suspect", label: "Compte compromis (accès non autorisé)" },
        { id: "insuf", label: "Informations insuffisantes pour conclure" }
      ],
      correct: "suspect", points: 20,
      explain: {
        suspect: "Force brute suivie d'un succès, IP malveillante, appareil inconnu, aucun voyage déclaré et activité d'exfiltration : le compte est compromis.",
        normal: "Aucun voyage n'est déclaré, l'IP est malveillante et l'activité post-connexion est typique d'un attaquant.",
        insuf: "Les indices consultables étaient largement suffisants pour conclure à une compromission."
      }
    },
    risk: {
      correct: "high", points: 15, partial: "mid", partialPoints: 5,
      explain: "Le risque est <b>élevé</b> : exfiltration en cours (42 fichiers contractuels) et règle de transfert externe qui assure la persistance de l'attaquant."
    },
    actions: [
      { id: "disable", label: "Désactiver le compte / révoquer toutes les sessions actives", points: 14, type: "good",
        why: "Coupe l'accès de l'attaquant immédiatement. C'est l'action de confinement prioritaire." },
      { id: "block_ip", label: "Bloquer l'adresse IP source au pare-feu", points: 8, type: "good",
        why: "Utile pour limiter de nouvelles tentatives, mais insuffisant seul (l'attaquant peut changer d'IP)." },
      { id: "forward_rule", label: "Supprimer la règle de transfert vers ext-collect@proton.me", points: 12, type: "good",
        why: "Sans cela, l'attaquant continue de recevoir les courriels même après le changement de mot de passe." },
      { id: "reset", label: "Réinitialiser le mot de passe et imposer le MFA", points: 10, type: "good",
        why: "Rétablit un accès sûr à Thomas et corrige la faille de l'exception MFA héritée." },
      { id: "contact", label: "Contacter Thomas par un canal fiable (téléphone) pour confirmer", points: 6, type: "good",
        why: "Bonne pratique de vérification, mais à faire en parallèle du confinement, pas à la place." },
      { id: "escalate", label: "Escalader en incident de sécurité (fuite de données potentielle)", points: 13, type: "good",
        why: "42 fichiers de contrats ont été exportés : l'équipe de réponse à incident et le juridique doivent être informés." },
      { id: "wait", label: "Attendre le matin pour voir si Thomas se manifeste", points: -15, type: "bad",
        why: "Trop lent : l'exfiltration est en cours. Chaque minute compte." },
      { id: "block_ip_only", label: "Bloquer l'IP et considérer l'incident clos", points: -8, type: "bad",
        why: "L'attaquant a déjà une règle de transfert et des données exportées : l'incident n'est pas clos." },
      { id: "wipe", label: "Formater le laptop de Thomas à distance", points: -10, type: "warn",
        why: "Inadapté : l'attaque vient d'un appareil inconnu, pas du laptop de Thomas. Perte de preuves et de données légitimes." }
    ],
    bonusKeyEvidence: 12,
    summary: {
      great: "Excellente analyse : compromission identifiée, confinement rapide et traitement de la persistance.",
      ok: "Bonne réaction, mais certains éléments (persistance, exfiltration ou escalade) ont été négligés.",
      low: "Réponse insuffisante : l'attaquant aurait conservé un accès et continué à exfiltrer des données."
    },
    lesson: "Un mot de passe réinitialisé ne suffit pas : cherchez toujours la persistance (règles de transfert, sessions, appareils) et évaluez les données déjà sorties."
  }
};

// ---------- ÉTAT ----------
let current = null;       // scénario courant
let currentKey = null;
let viewed = new Set();
let selectedRisk = null;
const results = JSON.parse(localStorage.getItem("cybersoc-results") || "{}");

// ---------- NAVIGATION ----------
const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav a");

function show(name) {
  views.forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.view === name));
  if (name === "progress") renderProgress();
  if (name === "home") renderStats();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(a => a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.view); }));
document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => show(b.dataset.goto)));
document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => startScenario(b.dataset.open)));

// ---------- LANCEMENT D'UN SCÉNARIO ----------
function startScenario(key) {
  currentKey = key;
  current = SCENARIOS[key];
  viewed = new Set();
  selectedRisk = null;

  document.getElementById("sim-title").textContent = current.title;
  const lvl = document.getElementById("sim-level");
  lvl.textContent = current.level;
  lvl.className = `tag ${current.levelClass}`;
  document.getElementById("sim-meta").textContent = current.meta;
  document.getElementById("sim-context").innerHTML = current.context;

  document.getElementById("alert-title").innerHTML = current.alert.title;
  document.getElementById("alert-text").textContent = current.alert.text;
  document.getElementById("alert-meta").textContent = current.alert.meta;
  document.getElementById("term-out").textContent = "$ Sélectionnez un indice pour l'examiner…";
  document.getElementById("form-error").textContent = "";

  // Indices
  const evList = document.getElementById("evidence-list");
  evList.innerHTML = "";
  current.evidence.forEach(ev => {
    const b = document.createElement("button");
    b.className = "evidence-item";
    b.innerHTML = `${ev.label}<span class="seen"></span>`;
    b.addEventListener("click", () => openEvidence(ev, b));
    evList.appendChild(b);
  });
  updateCounter();

  // Évaluation
  const evalList = document.getElementById("eval-list");
  evalList.innerHTML = "";
  current.evaluation.options.forEach(o => {
    evalList.insertAdjacentHTML("beforeend",
      `<label class="choice"><input type="radio" name="eval" value="${o.id}" /> ${o.label}</label>`);
  });

  // Risque
  document.querySelectorAll(".risk-btn").forEach(b => b.classList.remove("on"));

  // Actions
  const actList = document.getElementById("action-list");
  actList.innerHTML = "";
  current.actions.forEach(a => {
    actList.insertAdjacentHTML("beforeend",
      `<label class="choice"><input type="checkbox" value="${a.id}" /> ${a.label}</label>`);
  });

  document.getElementById("feedback").classList.remove("show");
  document.getElementById("feedback").innerHTML = "";
  document.getElementById("sim-layout").classList.remove("locked");
  document.getElementById("submit-btn").style.display = "";
  show("sim");
}

function openEvidence(ev, btn) {
  document.querySelectorAll(".evidence-item").forEach(b => b.classList.remove("on"));
  btn.classList.add("on", "viewed");
  btn.querySelector(".seen").textContent = "✓ vu";
  document.getElementById("term-out").textContent = ev.text;
  viewed.add(ev.id);
  updateCounter();
}

function updateCounter() {
  document.getElementById("ev-counter").textContent =
    `(${viewed.size}/${current.evidence.length} consultés)`;
}

// Risque
document.querySelectorAll(".risk-btn").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".risk-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    selectedRisk = btn.dataset.risk;
  })
);

// ---------- SOUMISSION ET NOTATION ----------
document.getElementById("submit-btn").addEventListener("click", submit);

function submit() {
  const err = document.getElementById("form-error");
  const evalChoice = document.querySelector('input[name="eval"]:checked');
  const chosen = [...document.querySelectorAll("#action-list input:checked")].map(i => i.value);

  if (!evalChoice || !selectedRisk || chosen.length === 0) {
    err.textContent = "Complétez les 3 étapes : évaluation, niveau de risque et au moins une action.";
    return;
  }
  err.textContent = "";

  const s = current;
  let score = 0;
  const rows = { analysis: [], actions: [], missed: [] };

  // 1. Évaluation
  const evOk = evalChoice.value === s.evaluation.correct;
  if (evOk) score += s.evaluation.points;
  rows.analysis.push({
    cls: evOk ? "ok" : "bad",
    pts: evOk ? `+${s.evaluation.points}` : "0",
    html: `<b>Évaluation :</b> ${s.evaluation.explain[evalChoice.value]}`
  });

  // 2. Risque
  let riskPts = 0, riskCls = "bad";
  if (selectedRisk === s.risk.correct) { riskPts = s.risk.points; riskCls = "ok"; }
  else if (selectedRisk === s.risk.partial) { riskPts = s.risk.partialPoints; riskCls = "warn"; }
  score += riskPts;
  rows.analysis.push({ cls: riskCls, pts: riskPts ? `+${riskPts}` : "0", html: `<b>Risque :</b> ${s.risk.explain}` });

  // 3. Actions choisies
  s.actions.forEach(a => {
    if (chosen.includes(a.id)) {
      score += a.points;
      const cls = a.points > 0 ? "ok" : (a.type === "warn" ? "warn" : "bad");
      rows.actions.push({ cls, pts: (a.points > 0 ? "+" : "") + a.points, html: `<b>${a.label}</b><br>${a.why}` });
    } else if (a.points >= 10) {
      rows.missed.push({ cls: "warn", pts: "", html: `<b>Action manquée :</b> ${a.label}<br>${a.why}` });
    }
  });

  // 4. Bonus d'investigation
  const keyIds = s.evidence.filter(e => e.key).map(e => e.id);
  const seenKeys = keyIds.filter(id => viewed.has(id)).length;
  const bonusOk = seenKeys === keyIds.length;
  if (bonusOk) score += s.bonusKeyEvidence;
  rows.analysis.push({
    cls: bonusOk ? "ok" : "warn",
    pts: bonusOk ? `+${s.bonusKeyEvidence}` : "0",
    html: `<b>Investigation :</b> vous avez consulté ${seenKeys}/${keyIds.length} indices clés. ` +
      (bonusOk ? "Analyse rigoureuse : vous avez examiné tous les indices essentiels."
               : "Vous avez décidé sans examiner tous les indices clés, un réflexe risqué en situation réelle.")
  });

  // Score sur 100
  const maxScore = s.evaluation.points + s.risk.points + s.bonusKeyEvidence +
    s.actions.filter(a => a.points > 0).reduce((t, a) => t + a.points, 0);
  const pct = Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));

  // Sauvegarde
  const prev = results[currentKey];
  results[currentKey] = { best: prev ? Math.max(prev.best, pct) : pct, last: pct, tries: (prev?.tries || 0) + 1 };
  localStorage.setItem("cybersoc-results", JSON.stringify(results));

  renderFeedback(pct, rows);
}

function renderFeedback(pct, rows) {
  const s = current;
  const color = pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--orange)" : "var(--red)";
  const verdict = pct >= 80 ? s.summary.great : pct >= 50 ? s.summary.ok : s.summary.low;
  const title = pct >= 80 ? "Mission réussie" : pct >= 50 ? "Peut mieux faire" : "Analyse insuffisante";

  const block = (t, list) => list.length ? `
    <div class="fb-block"><h4>${t}</h4>
      ${list.map(r => `<div class="fb-row ${r.cls}">${r.pts ? `<span class="pts">${r.pts}</span>` : ""}${r.html}</div>`).join("")}
    </div>` : "";

  const fb = document.getElementById("feedback");
  fb.innerHTML = `
    <div class="fb-top">
      <div class="fb-score" style="--p:${pct};--c:${color}"><span>${pct}%</span></div>
      <div><h3 style="color:${color}">${title}</h3><p>${verdict}</p></div>
    </div>
    ${block("Analyse", rows.analysis)}
    ${block("Vos actions", rows.actions)}
    ${block("Ce que vous auriez dû faire aussi", rows.missed)}
    <div class="fb-block"><h4>À retenir</h4><div class="fb-row ok">${s.lesson}</div></div>
    <div class="fb-actions">
      <button class="btn primary" id="retry-btn">↻ Recommencer</button>
      <button class="btn ghost" data-goto="scenarios" id="back-btn">Autres scénarios</button>
    </div>`;
  fb.classList.add("show");
  document.getElementById("sim-layout").classList.add("locked");
  document.getElementById("submit-btn").style.display = "none";
  document.getElementById("retry-btn").addEventListener("click", () => startScenario(currentKey));
  document.getElementById("back-btn").addEventListener("click", () => show("scenarios"));
  fb.scrollIntoView({ behavior: "smooth" });
}

// ---------- ACCUEIL ET PROGRESSION ----------
function renderStats() {
  const done = Object.keys(results).length;
  const avg = done ? Math.round(Object.values(results).reduce((t, r) => t + r.best, 0) / done) : null;
  const nums = document.querySelectorAll(".stats .num");
  if (nums.length === 3) {
    nums[1].textContent = done;
    nums[2].textContent = avg === null ? "--" : avg + "%";
  }
}

function renderProgress() {
  const items = document.querySelectorAll(".progress-item");
  const map = ["phishing", "login"];
  map.forEach((key, i) => {
    const r = results[key];
    const el = items[i];
    if (!el) return;
    el.querySelector("small").textContent = r
      ? `Meilleur score : ${r.best}% · ${r.tries} tentative(s)` : "Aucune tentative";
    el.querySelector(".bar div").style.width = (r ? r.best : 0) + "%";
  });
}

renderStats();
renderProgress();
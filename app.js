// Navigation entre les vues
const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav a");

function show(name) {
  views.forEach(v => v.classList.toggle("active", v.id === `view-${name}`));
  navLinks.forEach(a => a.classList.toggle("active", a.dataset.view === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(a =>
  a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.view); })
);
document.querySelectorAll("[data-goto]").forEach(b =>
  b.addEventListener("click", () => show(b.dataset.goto))
);
document.querySelectorAll("[data-open]").forEach(b =>
  b.addEventListener("click", () => {
    document.getElementById("feedback").classList.remove("show");
    show("sim");
  })
);

// Indices (contenu factice pour la maquette)
const evidence = {
  1: `$ cat headers.txt
From:     support@banque-securite.co
Reply-To: no-reply@mail-secure.xyz
Date:     Mon, 14:07 -0500
SPF:      FAIL
DKIM:     NONE`,
  2: `$ analyze-link
URL affichée : https://banque.com/connexion
URL réelle   : http://banque-verif.top/login
Domaine créé : il y a 2 jours
Réputation   : SUSPECT`,
  3: `$ search-recipients --subject "Action requise"
Résultats : 14 destinataires
  - 9 boîtes dans le département Finance
  - 5 boîtes dans le département RH`,
  4: `$ proxy-logs --url banque-verif.top
09:31  jdupont     -> GET /login   (200)
09:33  jdupont     -> POST /login  (200)
Aucun autre accès enregistré.`
};

const termOut = document.getElementById("term-out");
document.querySelectorAll(".evidence-item").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".evidence-item").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    termOut.textContent = evidence[btn.dataset.ev];
  })
);

// Boutons de risque
document.querySelectorAll(".risk-btn").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".risk-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
  })
);

// Soumission (affiche juste la maquette de feedback)
document.getElementById("submit-btn").addEventListener("click", () => {
  const fb = document.getElementById("feedback");
  fb.classList.add("show");
  fb.scrollIntoView({ behavior: "smooth" });
});
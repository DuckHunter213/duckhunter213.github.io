const DATA_FILES = {
  profile: "perfil.json",
  audiences: "perfiles.json",
  experience: "empresas.json",
  projects: "proyectos.json",
  languages: "Lenguajes.json",
  frameworks: "frameworks.json",
  tools: "herramientas.json",
  methods: "metodologias.json",
  education: "estudios.json",
  certifications: "certificaciones.json",
  courses: "cursos.json"
};

const state = {
  audience: null,
  data: null
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(path);

        if (!response.ok) {
          throw new Error(`No se pudo cargar ${path}`);
        }

        return [key, await response.json()];
      })
    );

    state.data = Object.fromEntries(entries);
    state.audience = getAudienceFromUrl() || state.data.profile.defaultAudience || state.data.audiences[0]?.id;

    bindEvents();
    render();
  } catch (error) {
    renderError(error);
  }
}

function bindEvents() {
  const shareButton = document.getElementById("share-profile-link");

  shareButton.addEventListener("click", async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("perfil", state.audience);

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      shareButton.textContent = "Link copiado";
      window.setTimeout(() => {
        shareButton.textContent = "Copiar link del perfil";
      }, 1800);
    } catch (error) {
      shareButton.textContent = "Copia manual: revisa la URL";
      window.setTimeout(() => {
        shareButton.textContent = "Copiar link del perfil";
      }, 2200);
    }
  });
}

function render() {
  renderHero();
  renderProfileButtons();
  renderExperience();
  renderProjects();
  renderEducation();
  renderSkills();
  renderSimpleSection("certifications-section", "Certificaciones", state.data.certifications, certificationTemplate);
  renderSimpleSection("courses-section", "Cursos relevantes", state.data.courses, courseTemplate);
}

function renderHero() {
  const profile = state.data.profile;
  const activeHeadline = profile.headlines[state.audience] || profile.headlines[profile.defaultAudience];
  const activeSummary = profile.summaries[state.audience] || profile.summaries[profile.defaultAudience];
  const activeAudience = state.data.audiences.find((item) => item.id === state.audience);

  document.getElementById("hero").innerHTML = `
    <div class="hero-layout reveal">
      <div>
        <p class="eyebrow">CV digital para reclutamiento tech</p>
        <h1>${profile.name} <span class="hero-title">${profile.lastNameAccent}</span></h1>
        <p class="hero-role">${activeHeadline}</p>
        <p class="hero-summary">${activeSummary}</p>
        <div class="hero-meta">
          ${pill(profile.location)}
          ${pill(`<a href="mailto:${profile.email}">${profile.email}</a>`)}
          ${profile.github ? pill(`<a href="${profile.github}" target="_blank" rel="noreferrer">GitHub</a>`) : ""}
          ${profile.linkedin ? pill(`<a href="${profile.linkedin}" target="_blank" rel="noreferrer">LinkedIn</a>`) : ""}
        </div>
      </div>
      <div class="hero-card">
        <h2>Lo que lee RH en este modo</h2>
        <ul class="compact-list">
          <li>${activeAudience.summary}</li>
          ${profile.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;
}

function renderProfileButtons() {
  const container = document.getElementById("profile-switcher");

  container.innerHTML = state.data.audiences
    .map(
      (audience) => `
        <button
          class="profile-button ${audience.id === state.audience ? "active" : ""}"
          type="button"
          data-audience="${audience.id}"
        >
          ${audience.label}
          <small>${audience.summary}</small>
        </button>
      `
    )
    .join("");

  container.querySelectorAll("[data-audience]").forEach((button) => {
    button.addEventListener("click", () => {
      state.audience = button.dataset.audience;
      const url = new URL(window.location.href);
      url.searchParams.set("perfil", state.audience);
      window.history.replaceState({}, "", url);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderExperience() {
  const section = document.getElementById("experience-section");
  const items = prioritizeByAudience(state.data.experience);

  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Experiencia</p>
        <h2>Empresas y trayectoria</h2>
        <p>Se prioriza lo mas cercano al perfil activo para facilitar el filtro de RH.</p>
      </div>
    </div>
    <div class="timeline">
      ${items.map(experienceTemplate).join("")}
    </div>
  `;
}

function renderProjects() {
  const section = document.getElementById("projects-section");
  const items = prioritizeByAudience(state.data.projects);

  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Proyectos</p>
        <h2>Resultados y contexto tecnico</h2>
        <p>Cada proyecto incluye stack, caracter del trabajo y valor para reclutamiento.</p>
      </div>
    </div>
    <div class="timeline">
      ${items.map(projectTemplate).join("")}
    </div>
  `;
}

function renderEducation() {
  const section = document.getElementById("education-section");
  const items = prioritizeByAudience(state.data.education);

  if (!items.length) {
    section.hidden = true;
    section.innerHTML = "";
    return;
  }

  section.hidden = false;

  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Educacion</p>
        <h2>Estudios</h2>
        <p>Usa el nombre exacto del grado para que RH lo valide rapido.</p>
      </div>
    </div>
    <div class="timeline">
      ${items.map(educationTemplate).join("")}
    </div>
  `;
}

function renderSkills() {
  const section = document.getElementById("skills-section");
  const groups = [
    {
      title: "Lenguajes",
      items: prioritizeByAudience(state.data.languages),
      valueField: "name",
      noteField: "level"
    },
    {
      title: "Frameworks",
      items: prioritizeByAudience(state.data.frameworks),
      valueField: "name",
      noteField: "focus"
    },
    {
      title: "Herramientas",
      items: prioritizeByAudience(state.data.tools),
      valueField: "name",
      noteField: "focus"
    },
    {
      title: "Metodologias",
      items: prioritizeByAudience(state.data.methods),
      valueField: "name",
      noteField: "focus"
    }
  ];

  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Stack</p>
        <h2>Habilidades tecnicas</h2>
      </div>
    </div>
    <div class="stack-groups">
      ${groups
        .map(
          (group) => `
            <div class="stack-group">
              <h3>${group.title}</h3>
              <div class="badge-list">
                ${group.items.map((item) => badgeTemplate(item[group.valueField], item[group.noteField])).join("")}
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderSimpleSection(sectionId, title, items, template) {
  const section = document.getElementById(sectionId);
  const prioritized = prioritizeByAudience(items);

  if (!prioritized.length) {
    section.hidden = true;
    section.innerHTML = "";
    return;
  }

  section.hidden = false;
  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">Credenciales</p>
        <h2>${title}</h2>
      </div>
    </div>
    <div class="timeline">
      ${prioritized.map(template).join("")}
    </div>
  `;
}

function experienceTemplate(item) {
  return `
    <article class="entry reveal">
      <div class="entry-header">
        <div>
          <h3>${item.role}</h3>
          <p class="entry-subtitle">${item.company}</p>
        </div>
        <span class="entry-date">${item.start} - ${item.end}</span>
      </div>
      <p>${item.summary}</p>
      <div class="tag-row">
        <span class="tag">${item.type}</span>
        <span class="tag">${item.duration}</span>
        ${item.stack.map((stack) => `<span class="tag">${stack}</span>`).join("")}
      </div>
    </article>
  `;
}

function projectTemplate(item) {
  return `
    <article class="entry reveal">
      <div class="entry-header">
        <div>
          <h3>${item.name}</h3>
          <p class="entry-subtitle">${item.character}</p>
        </div>
        <span class="entry-date">${item.timeline}</span>
      </div>
      <p>${item.description}</p>
      <div class="tag-row">
        ${item.stack.map((stack) => `<span class="tag">${stack}</span>`).join("")}
      </div>
    </article>
  `;
}

function educationTemplate(item) {
  return `
    <article class="entry reveal">
      <div class="entry-header">
        <div>
          <h3>${item.program}</h3>
          <p class="entry-subtitle">${item.institution}</p>
        </div>
        <span class="entry-date">${item.start} - ${item.end}</span>
      </div>
      <p>${item.description}</p>
    </article>
  `;
}

function certificationTemplate(item) {
  return `
    <article class="entry reveal">
      <div class="entry-header">
        <div>
          <h3>${item.name}</h3>
          <p class="entry-subtitle">${item.issuer}</p>
        </div>
        <span class="entry-date">${item.year}</span>
      </div>
      <p>${item.description}</p>
    </article>
  `;
}

function courseTemplate(item) {
  return `
    <article class="entry reveal">
      <div class="entry-header">
        <div>
          <h3>${item.name}</h3>
          <p class="entry-subtitle">${item.provider}</p>
        </div>
        <span class="entry-date">${item.year}</span>
      </div>
      <p>${item.description}</p>
    </article>
  `;
}

function badgeTemplate(title, subtitle) {
  return `
    <div class="badge reveal">
      <strong>${title}</strong>
      <span>${subtitle || "Experiencia aplicada"}</span>
    </div>
  `;
}

function prioritizeByAudience(items) {
  return [...items].sort((left, right) => audienceScore(right) - audienceScore(left) || sortByFeatured(right, left));
}

function audienceScore(item) {
  if (!item.audiences || !item.audiences.length) {
    return 0;
  }

  if (item.audiences.includes(state.audience)) {
    return 3;
  }

  if (item.audiences.includes("shared")) {
    return 1;
  }

  return 0;
}

function sortByFeatured(left, right) {
  const leftFeatured = Array.isArray(left.featuredFor) && left.featuredFor.includes(state.audience) ? 1 : 0;
  const rightFeatured = Array.isArray(right.featuredFor) && right.featuredFor.includes(state.audience) ? 1 : 0;

  return leftFeatured - rightFeatured;
}

function getAudienceFromUrl() {
  return new URLSearchParams(window.location.search).get("perfil");
}

function renderError(error) {
  document.body.innerHTML = `
    <main class="page-shell">
      <section class="panel">
        <p class="eyebrow">Error de carga</p>
        <h1>No se pudo construir el CV</h1>
        <p class="panel-copy">${error.message}</p>
      </section>
    </main>
  `;
}

function pill(content) {
  return `<span class="pill">${content}</span>`;
}

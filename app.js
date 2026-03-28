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

const SUPPORTED_LANGUAGES = ["es", "en"];

const UI_COPY = {
  es: {
    pageTitle: "CV Digital | Luis Fernando Gomez Alejandre",
    pageDescription:
      "CV digital adaptable por perfil para roles tech. Experiencia, proyectos, estudios, certificaciones y stack cargados desde JSON en una web estatica.",
    adaptable: "CV adaptable",
    focusTitle: "Enfoca tu perfil segun la vacante",
    focusCopy: "El contenido se prioriza por experiencia relevante y el enlace se puede compartir con el perfil activo.",
    copyLink: "Copiar link del perfil",
    copied: "Link copiado",
    manualCopy: "Copia manual: revisa la URL",
    heroEyebrow: "CV digital para reclutamiento tech",
    heroCardTitle: "Lo que lee RH en este modo",
    experienceEyebrow: "Experiencia",
    experienceTitle: "Empresas y trayectoria",
    experienceCopy: "Se prioriza lo mas cercaño al perfil activo para facilitar el filtro de RH.",
    projectsEyebrow: "Proyectos",
    projectsTitle: "Resultados y contexto tecnico",
    projectsCopy: "Cada proyecto incluye stack, caracter del trabajo y valor para reclutamiento.",
    educationEyebrow: "Educacion",
    educationTitle: "Estudios",
    educationCopy: "Usa el nombre exacto del grado para que RH lo valide rapido.",
    skillsEyebrow: "Stack",
    skillsTitle: "Habilidades tecnicas",
    credentialsEyebrow: "Credenciales",
    certificationsTitle: "Certificaciones",
    coursesTitle: "Cursos relevantes",
    languagesGroup: "Lenguajes",
    frameworksGroup: "Frameworks",
    toolsGroup: "Herramientas",
    methodsGroup: "Metodologias",
    appliedExperience: "Experiencia aplicada",
    errorEyebrow: "Error de carga",
    errorTitle: "No se pudo construir el CV"
  },
  en: {
    pageTitle: "Digital Resume | Luis Fernando Gomez Alejandre",
    pageDescription:
      "Digital resume tailored by target role. Experience, projects, education, certifications, and stack loaded from JSON in a static site.",
    adaptable: "Adaptive resume",
    focusTitle: "Focus your profile for the role",
    focusCopy: "Content is prioritized by relevance so you can share the exact version that fits the vacancy.",
    copyLink: "Copy profile link",
    copied: "Link copied",
    manualCopy: "Manual copy: check the URL",
    heroEyebrow: "Digital resume for tech hiring",
    heroCardTitle: "What recruiters see in this mode",
    experienceEyebrow: "Experience",
    experienceTitle: "Companies and journey",
    experienceCopy: "Entries closer to the active profile are shown first to help recruiter screening.",
    projectsEyebrow: "Projects",
    projectsTitle: "Results and technical context",
    projectsCopy: "Each project includes stack, work context, and recruiter-friendly value.",
    educationEyebrow: "Education",
    educationTitle: "Education",
    educationCopy: "Use the exact degree name so recruiters can validate it quickly.",
    skillsEyebrow: "Stack",
    skillsTitle: "Technical skills",
    credentialsEyebrow: "Credentials",
    certificationsTitle: "Certifications",
    coursesTitle: "Relevant courses",
    languagesGroup: "Languages",
    frameworksGroup: "Frameworks",
    toolsGroup: "Tools",
    methodsGroup: "Methodologies",
    appliedExperience: "Hands-on experience",
    errorEyebrow: "Load error",
    errorTitle: "The resume could not be built"
  }
};

const state = {
  language: "es",
  audience: null,
  data: null
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    state.language = getLanguageFromUrl();
    const entries = await Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => {
        const response = await fetch(getDataPath(path));

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
  document.getElementById("ats-link").addEventListener("click", () => {
    const url = new URL("ats.html", window.location.href);
    url.searchParams.set("lang", state.language);
    url.searchParams.set("perfil", state.audience);
    window.open(url.toString(), "_blank");
  });

  const shareButton = document.getElementById("share-profile-link");

  shareButton.addEventListener("click", async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("lang", state.language);
    shareUrl.searchParams.set("perfil", state.audience);

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      shareButton.textContent = t("copied");
      window.setTimeout(() => {
        shareButton.textContent = t("copyLink");
      }, 1800);
    } catch (error) {
      shareButton.textContent = t("manualCopy");
      window.setTimeout(() => {
        shareButton.textContent = t("copyLink");
      }, 2200);
    }
  });
}

function render() {
  renderPageMeta();
  renderLanguageButtons();
  renderHero();
  renderProfileButtons();
  renderExperience();
  renderProjects();
  renderEducation();
  renderSkills();
  renderSimpleSection("certifications-section", t("certificationsTitle"), state.data.certifications, certificationTemplate);
  renderSimpleSection("courses-section", t("coursesTitle"), state.data.courses, courseTemplate);

  const debugPanel = document.getElementById("debug-panel");
  debugPanel.hidden = !isDebugMode();

  if (isDebugMode()) {
    document.getElementById("share-profile-link").textContent = t("copyLink");
    document.querySelector("#debug-panel .eyebrow").textContent = t("adaptable");
    document.querySelector("#debug-panel h2").textContent = t("focusTitle");
    document.querySelector("#debug-panel .panel-copy").textContent = t("focusCopy");
  }

}

function renderPageMeta() {
  document.documentElement.lang = state.language;
  document.title = t("pageTitle");
  const description = document.querySelector('meta[name="description"]');

  if (description) {
    description.setAttribute("content", t("pageDescription"));
  }
}

function renderLanguageButtons() {
  const container = document.getElementById("language-switcher");

  container.innerHTML = SUPPORTED_LANGUAGES
    .map(
      (language) => `
        <button
          class="ghost-button language-button ${language === state.language ? "active" : ""}"
          type="button"
          data-language="${language}"
        >
          ${language.toUpperCase()}
        </button>
      `
    )
    .join("");

  container.querySelectorAll("[data-language]").forEach((button) => {
    button.addEventListener("click", async () => {
      const nextLanguage = button.dataset.language;

      if (nextLanguage === state.language) {
        return;
      }

      state.language = nextLanguage;
      const url = new URL(window.location.href);
      url.searchParams.set("lang", state.language);
      window.history.replaceState({}, "", url);
      await reloadData();
      render();
    });
  });
}

function renderHero() {
  const profile = state.data.profile;
  const activeHeadline = profile.headlines[state.audience] || profile.headlines[profile.defaultAudience];
  const activeSummary = profile.summaries[state.audience] || profile.summaries[profile.defaultAudience];
  const activeAudience = state.data.audiences.find((item) => item.id === state.audience);

  document.getElementById("hero").innerHTML = `
    <div class="hero-layout reveal">
      <div>
        <p class="eyebrow">${t("heroEyebrow")}</p>
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
      ${isDebugMode() ? `
      <div class="hero-card">
        <h2>${t("heroCardTitle")}</h2>
        <ul class="compact-list">
          <li>${activeAudience.summary}</li>
          ${profile.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}
        </ul>
      </div>` : ""}
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
      url.searchParams.set("lang", state.language);
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

  if (!items.length) {
    section.hidden = true;
    section.innerHTML = "";
    return;
  }

  const groups = groupExperienceByCompany(items);

  section.hidden = false;
  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">${t("experienceEyebrow")}</p>
        <h2>${t("experienceTitle")}</h2>
        <p>${t("experienceCopy")}</p>
      </div>
    </div>
    <div class="timeline">
      ${groups.map(({ company, roles }) =>
        roles.length === 1
          ? experienceTemplate(roles[0])
          : experienceGroupTemplate(company, roles)
      ).join("")}
    </div>
  `;
}

function groupExperienceByCompany(items) {
  const order = [];
  const map = {};

  items.forEach((item) => {
    if (!map[item.company]) {
      map[item.company] = [];
      order.push(item.company);
    }
    map[item.company].push(item);
  });

  return order.map((company) => ({ company, roles: map[company] }));
}

function renderProjects() {
  const section = document.getElementById("projects-section");
  const items = prioritizeByAudience(state.data.projects);

  if (!items.length) {
    section.hidden = true;
    section.innerHTML = "";
    return;
  }

  section.hidden = false;
  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">${t("projectsEyebrow")}</p>
        <h2>${t("projectsTitle")}</h2>
        <p>${t("projectsCopy")}</p>
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
        <p class="eyebrow">${t("educationEyebrow")}</p>
        <h2>${t("educationTitle")}</h2>
        <p>${t("educationCopy")}</p>
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
      title: t("languagesGroup"),
      items: prioritizeByAudience(state.data.languages),
      valueField: "name",
      noteField: "level"
    },
    {
      title: t("frameworksGroup"),
      items: prioritizeByAudience(state.data.frameworks),
      valueField: "name",
      noteField: "focus"
    },
    {
      title: t("toolsGroup"),
      items: prioritizeByAudience(state.data.tools),
      valueField: "name",
      noteField: "focus"
    },
    {
      title: t("methodsGroup"),
      items: prioritizeByAudience(state.data.methods),
      valueField: "name",
      noteField: "focus"
    }
  ];

  section.hidden = false;
  section.innerHTML = `
    <div class="section-title">
      <div>
        <p class="eyebrow">${t("skillsEyebrow")}</p>
        <h2>${t("skillsTitle")}</h2>
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
        <p class="eyebrow">${t("credentialsEyebrow")}</p>
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

function experienceGroupTemplate(company, roles) {
  const start = roles[roles.length - 1].start;
  const end = roles[0].end;
  return `
    <article class="entry entry-group reveal">
      <div class="entry-header">
        <h3>${company}</h3>
        <span class="entry-date">${start} - ${end}</span>
      </div>
      <div class="entry-roles">
        ${roles.map((role) => `
          <div class="entry-role">
            <div class="entry-role-header">
              <span class="entry-role-title">${role.role}</span>
              <span class="entry-date">${role.start} - ${role.end}</span>
            </div>
            <p>${role.summary}</p>
            <div class="tag-row">
              <span class="tag">${role.duration}</span>
              ${role.stack.map((s) => `<span class="tag">${s}</span>`).join("")}
            </div>
          </div>
        `).join("")}
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
      <span>${subtitle || t("appliedExperience")}</span>
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

function isDebugMode() {
  return new URLSearchParams(window.location.search).get("debug") === "true";
}

function getLanguageFromUrl() {
  const language = new URLSearchParams(window.location.search).get("lang");
  return SUPPORTED_LANGUAGES.includes(language) ? language : "es";
}

function getDataPath(fileName) {
  return `data/${state.language}/${fileName}`;
}

async function reloadData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => {
      const response = await fetch(getDataPath(path));

      if (!response.ok) {
        throw new Error(`No se pudo cargar ${getDataPath(path)}`);
      }

      return [key, await response.json()];
    })
  );

  state.data = Object.fromEntries(entries);
}

function renderError(error) {
  document.body.innerHTML = `
    <main class="page-shell">
      <section class="panel">
        <p class="eyebrow">${t("errorEyebrow")}</p>
        <h1>${t("errorTitle")}</h1>
        <p class="panel-copy">${error.message}</p>
      </section>
    </main>
  `;
}

function pill(content) {
  return `<span class="pill">${content}</span>`;
}

function t(key) {
  return UI_COPY[state.language][key] || UI_COPY.es[key] || key;
}

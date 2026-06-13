const data = window.FISHING_DATA;
const STORAGE_KEY = "tlFishingManagerProgress.v1";

const i18n = {
  ru: {
    title: "Менеджер рыбалки",
    subtitle: "Выбери рыбу или локацию, чтобы быстро увидеть места ловли, тип воды и прогресс.",
    navManager: "Менеджер",
    navInfo: "Инфо",
    navAbout: "About",
    modeFish: "Рыба",
    modeLocation: "Локация",
    searchLabel: "Поиск",
    searchPlaceholder: "Название, локация или уровень: 5, level 5, 10-15",
    waterLabel: "Тип воды",
    waterAll: "Любой",
    statusLabel: "Статус",
    statusAll: "Все",
    statusOpen: "Не completed",
    statusCompleted: "Completed",
    freshwater: "Пресная",
    saltwater: "Соленая",
    fishList: "Рыбы",
    locationList: "Локации",
    locations: "Локации",
    fishes: "Рыбы",
    waterType: "Тип воды",
    level: "Уровень",
    locationCount: "Мест",
    fishCount: "Рыб",
    progress: "Прогресс",
    completed: "Completed",
    caught: "Поймано",
    notCaught: "Не поймано",
    sourceName: "Английское название",
    note: "Заметка",
    noLocations: "Локации не указаны в таблице",
    noResultsTitle: "Ничего не найдено",
    noResultsText: "Попробуй изменить поиск или фильтр воды.",
    pickTitle: "Выбери запись",
    pickText: "Список слева обновляется по поиску, языку и типу воды.",
    generalTips: "General tips",
    rods: "Типы удочек",
    bait: "Наживка",
    howToObtain: "Как получить",
    fishingBoost: "Бонус рыбалки",
    aboutTitle: "About",
    aboutStorageTitle: "Как хранится прогресс",
    clearProgress: "Сбросить прогресс",
    progressCleared: "Прогресс сброшен",
  },
  en: {
    title: "Fishing Manager",
    subtitle: "Pick a fish or a location to see spots, water type, and progress fast.",
    navManager: "Manager",
    navInfo: "Info",
    navAbout: "About",
    modeFish: "Fish",
    modeLocation: "Location",
    searchLabel: "Search",
    searchPlaceholder: "Name, location, or level: 5, level 5, 10-15",
    waterLabel: "Water type",
    waterAll: "Any",
    statusLabel: "Status",
    statusAll: "All",
    statusOpen: "Not completed",
    statusCompleted: "Completed",
    freshwater: "Freshwater",
    saltwater: "Saltwater",
    fishList: "Fish",
    locationList: "Locations",
    locations: "Locations",
    fishes: "Fish",
    waterType: "Water type",
    level: "Level",
    locationCount: "Spots",
    fishCount: "Fish",
    progress: "Progress",
    completed: "Completed",
    caught: "Caught",
    notCaught: "Not caught",
    sourceName: "Russian name",
    note: "Note",
    noLocations: "No locations listed in the sheet",
    noResultsTitle: "No results",
    noResultsText: "Try changing the search or water filter.",
    pickTitle: "Pick an entry",
    pickText: "The list updates by search, language, and water type.",
    generalTips: "General tips",
    rods: "Fishing rods",
    bait: "Bait",
    howToObtain: "How to obtain",
    fishingBoost: "Fishing boost",
    aboutTitle: "About",
    aboutStorageTitle: "How progress is stored",
    clearProgress: "Clear progress",
    progressCleared: "Progress cleared",
  },
};

const state = {
  lang: "ru",
  view: "manager",
  mode: "fish",
  selectedId: null,
  query: "",
  water: "all",
  status: "all",
  progress: loadProgress(),
};

const els = {
  langButtons: document.querySelectorAll(".lang-button"),
  navButtons: document.querySelectorAll(".nav-button"),
  modeButtons: document.querySelectorAll(".segment"),
  viewSections: document.querySelectorAll("[data-view-section]"),
  search: document.querySelector("#searchInput"),
  water: document.querySelector("#waterFilter"),
  status: document.querySelector("#statusFilter"),
  listTitle: document.querySelector("#listTitle"),
  countBadge: document.querySelector("#countBadge"),
  resultList: document.querySelector("#resultList"),
  detailView: document.querySelector("#detailView"),
  infoView: document.querySelector("#infoView"),
  aboutView: document.querySelector("#aboutView"),
};

const byLang = (entry, lang = state.lang) => entry?.[lang] || entry?.en || "";
const otherLang = () => (state.lang === "ru" ? "en" : "ru");
const normalize = (value) => String(value || "").toLocaleLowerCase("ru-RU");
const waterClass = (water) => (water === "Freshwater" ? "pill--fresh" : "pill--salt");
const t = (key) => i18n[state.lang][key] || key;

const locations = buildLocations(data.fish);
let observer = null;

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { caught: saved.caught || {} };
  } catch {
    return { caught: {} };
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
}

function buildLocations(fish) {
  const map = new Map();

  fish.forEach((item) => {
    item.locations.forEach((location) => {
      const key = location.en;
      if (!map.has(key)) {
        map.set(key, {
          id: `loc-${map.size + 1}`,
          name: location,
          fish: [],
          waterTypes: new Set(),
        });
      }

      const record = map.get(key);
      record.fish.push(item);
      record.waterTypes.add(item.waterType.en);
    });
  });

  return Array.from(map.values())
    .map((location) => ({
      ...location,
      waterTypes: Array.from(location.waterTypes).sort(),
    }))
    .sort((a, b) => a.name.en.localeCompare(b.name.en));
}

function translatePage() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
}

function parseLevelQuery() {
  const query = normalize(state.query).trim();
  const range = query.match(/(?:level|lvl|уровень)?\s*(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    return { min: Number(range[1]), max: Number(range[2]) };
  }

  const single = query.match(/^(?:level|lvl|уровень)?\s*(\d+)$/);
  if (single) {
    return { min: Number(single[1]), max: Number(single[1]) };
  }

  return null;
}

function matchesQuery(item, ...values) {
  if (!state.query) return true;
  const query = normalize(state.query);
  const level = parseLevelQuery();

  if (level && typeof item?.level === "number") {
    return item.level >= level.min && item.level <= level.max;
  }

  return values.some((value) => normalize(value).includes(query));
}

function fishMatchesWater(item) {
  return state.water === "all" || item.waterType.en === state.water;
}

function locationMatchesWater(location) {
  return state.water === "all" || location.waterTypes.includes(state.water);
}

function matchesStatus(progress) {
  if (state.status === "completed") return progress.complete;
  if (state.status === "open") return !progress.complete;
  return true;
}

function getFishResults() {
  return data.fish
    .filter((item) => fishMatchesWater(item))
    .filter((item) => matchesStatus(fishProgress(item)))
    .filter((item) =>
      matchesQuery(
        item,
        item.name.ru,
        item.name.en,
        `level ${item.level}`,
        `lvl ${item.level}`,
        `уровень ${item.level}`,
        ...item.locations.flatMap((location) => [location.ru, location.en]),
      ),
    )
    .sort((a, b) => byLang(a.name).localeCompare(byLang(b.name), state.lang));
}

function getLocationResults() {
  return locations
    .filter((location) => locationMatchesWater(location))
    .filter((location) => matchesStatus(locationProgress(location)))
    .filter((location) =>
      matchesQuery(
        null,
        location.name.ru,
        location.name.en,
        ...location.fish.flatMap((item) => [
          item.name.ru,
          item.name.en,
          `level ${item.level}`,
          `lvl ${item.level}`,
          `уровень ${item.level}`,
        ]),
      ),
    )
    .sort((a, b) => byLang(a.name).localeCompare(byLang(b.name), state.lang));
}

function waterPill(waterEn, label) {
  return `<span class="pill ${waterClass(waterEn)}">${label}</span>`;
}

function waterLabel(waterEn) {
  return waterEn === "Freshwater" ? t("freshwater") : t("saltwater");
}

function statusPill(done, text = t("completed")) {
  return done ? `<span class="pill pill--done">${text}</span>` : "";
}

function fishImage(item, className = "fish-thumb") {
  if (item.image) {
    return `<img class="${className}" src="${item.image}" alt="${byLang(item.name)}" loading="lazy" />`;
  }

  return `<div class="${className} fish-thumb--empty" aria-hidden="true">${byLang(item.name).slice(0, 1)}</div>`;
}

function progressKey(fishId, locationEn) {
  return `${fishId}@@${locationEn}`;
}

function isCaught(fishId, locationEn) {
  return Boolean(state.progress.caught[progressKey(fishId, locationEn)]);
}

function setCaught(fishId, locationEn, caught) {
  const key = progressKey(fishId, locationEn);
  if (caught) {
    state.progress.caught[key] = true;
  } else {
    delete state.progress.caught[key];
  }
  saveProgress();
}

function fishProgress(item) {
  const total = item.locations.length;
  const caught = item.locations.filter((location) => isCaught(item.id, location.en)).length;
  return { caught, total, complete: total > 0 && caught === total };
}

function locationProgress(location) {
  const total = location.fish.length;
  const caught = location.fish.filter((item) => isCaught(item.id, location.name.en)).length;
  return { caught, total, complete: total > 0 && caught === total };
}

function renderList() {
  const results = state.mode === "fish" ? getFishResults() : getLocationResults();
  const title = state.mode === "fish" ? t("fishList") : t("locationList");
  els.listTitle.textContent = title;
  els.countBadge.textContent = results.length;

  if (!results.length) {
    state.selectedId = null;
    els.resultList.innerHTML = "";
    renderEmpty(t("noResultsTitle"), t("noResultsText"));
    return false;
  }

  if (!state.selectedId || !results.some((item) => item.id === state.selectedId)) {
    state.selectedId = results[0].id;
  }

  els.resultList.innerHTML = results.map(renderListButton).join("");
  els.resultList.querySelectorAll(".result-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      render();
    });
  });

  return true;
}

function renderListButton(item) {
  const isFish = state.mode === "fish";
  const secondary = byLang(item.name, otherLang());
  const active = item.id === state.selectedId ? " is-active" : "";
  const progress = isFish ? fishProgress(item) : locationProgress(item);
  const meta = isFish
    ? `${waterPill(item.waterType.en, byLang(item.waterType))}
       <span class="pill pill--level">${t("level")} ${item.level ?? "-"}</span>
       <span class="pill pill--progress">${progress.caught}/${progress.total}</span>
       ${statusPill(progress.complete)}`
    : `${item.waterTypes.map((water) => waterPill(water, waterLabel(water))).join("")}
       <span class="pill pill--progress">${progress.caught}/${progress.total}</span>
       ${statusPill(progress.complete)}`;
  const image = isFish ? fishImage(item) : "";

  return `
    <button class="result-button${active}" data-id="${item.id}" type="button">
      ${image}
      <span class="result-main">
        <strong>${byLang(item.name)}</strong>
        <span class="secondary-name">${secondary}</span>
        <span class="meta-row">${meta}</span>
      </span>
    </button>
  `;
}

function renderDetail() {
  const collection = state.mode === "fish" ? getFishResults() : getLocationResults();
  const selected = collection.find((item) => item.id === state.selectedId);

  if (!selected) {
    renderEmpty(t("pickTitle"), t("pickText"));
    return;
  }

  if (state.mode === "fish") {
    renderFishDetail(selected);
  } else {
    renderLocationDetail(selected);
  }
}

function renderFishDetail(item) {
  const progress = fishProgress(item);
  const locationCards = item.locations.length
    ? item.locations
        .map((location) => {
          const caught = isCaught(item.id, location.en);
          return `
            <article class="info-card action-card reveal" data-open-location="${escapeAttr(location.en)}">
              <button class="card-open" type="button">
                <h3>${byLang(location)}</h3>
                <span class="secondary-name">${byLang(location, otherLang())}</span>
              </button>
              <button class="catch-button ${caught ? "is-caught" : ""}" type="button" data-catch-fish="${item.id}" data-catch-location="${escapeAttr(location.en)}">
                ${caught ? t("caught") : t("notCaught")}
              </button>
            </article>
          `;
        })
        .join("")
    : `<article class="info-card reveal"><h3>${t("noLocations")}</h3></article>`;

  els.detailView.innerHTML = `
    <div class="detail-header reveal">
      <div>
        <h2>${byLang(item.name)}</h2>
        <p class="detail-subtitle">${byLang(item.name, otherLang())}</p>
        <div class="meta-row">${statusPill(progress.complete)}</div>
      </div>
      <div class="detail-media">
        ${fishImage(item, "fish-portrait")}
        <div class="meta-row">${waterPill(item.waterType.en, byLang(item.waterType))}</div>
      </div>
    </div>
    <div class="stat-strip reveal">
      ${renderStat(t("waterType"), byLang(item.waterType))}
      ${renderStat(t("level"), item.level ?? "-")}
      ${renderStat(t("progress"), `${progress.caught}/${progress.total}`)}
    </div>
    ${item.note ? renderNote(item.note) : ""}
    <div class="panel-heading reveal">
      <h2>${t("locations")}</h2>
    </div>
    <div class="card-grid">${locationCards}</div>
  `;
}

function renderLocationDetail(location) {
  const visibleFish = location.fish
    .filter((item) => fishMatchesWater(item))
    .sort((a, b) => byLang(a.name).localeCompare(byLang(b.name), state.lang));
  const progress = locationProgress(location);

  const fishCards = visibleFish
    .map((item) => {
      const caught = isCaught(item.id, location.name.en);
      return `
        <article class="info-card action-card reveal" data-open-fish="${item.id}">
          <button class="card-open card-open--fish" type="button">
            ${fishImage(item)}
            <span>
              <h3>${byLang(item.name)}</h3>
              <span class="secondary-name">${byLang(item.name, otherLang())}</span>
            </span>
          </button>
          <div class="meta-row">
            ${waterPill(item.waterType.en, byLang(item.waterType))}
            <span class="pill pill--level">${t("level")} ${item.level ?? "-"}</span>
          </div>
          <button class="catch-button ${caught ? "is-caught" : ""}" type="button" data-catch-fish="${item.id}" data-catch-location="${escapeAttr(location.name.en)}">
            ${caught ? t("caught") : t("notCaught")}
          </button>
        </article>
      `;
    })
    .join("");

  els.detailView.innerHTML = `
    <div class="detail-header reveal">
      <div>
        <h2>${byLang(location.name)}</h2>
        <p class="detail-subtitle">${byLang(location.name, otherLang())}</p>
        <div class="meta-row">${statusPill(progress.complete)}</div>
      </div>
      <div class="meta-row">
        ${location.waterTypes.map((water) => waterPill(water, waterLabel(water))).join("")}
      </div>
    </div>
    <div class="stat-strip reveal">
      ${renderStat(t("waterType"), location.waterTypes.map(waterLabel).join(" / "))}
      ${renderStat(t("fishCount"), visibleFish.length)}
      ${renderStat(t("progress"), `${progress.caught}/${progress.total}`)}
    </div>
    <div class="panel-heading reveal">
      <h2>${t("fishes")}</h2>
    </div>
    <div class="card-grid">${fishCards}</div>
  `;
}

function renderNote(note) {
  return `
    <article class="note-card reveal">
      <span>${t("note")}</span>
      <p>${byLang(note)}</p>
    </article>
  `;
}

function renderStat(label, value) {
  return `
    <div class="stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderEmpty(title, text) {
  els.detailView.innerHTML = `
    <div class="empty-state reveal">
      <div>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function renderInfo() {
  const tips = data.info?.tips || [];
  const baits = data.info?.baits || [];
  const rods = data.info?.rods || [];

  els.infoView.innerHTML = `
    <div class="page-heading reveal">
      <h2>${t("navInfo")}</h2>
      <p>${state.lang === "ru" ? "Полезные блоки из исходного Excel без credits-раздела." : "Useful source-sheet blocks without the credits section."}</p>
    </div>
    <section class="info-section reveal">
      <h3>${t("generalTips")}</h3>
      <div class="tip-list">
        ${tips.map((tip) => `<article class="info-card reveal"><p>${byLang(tip)}</p></article>`).join("")}
      </div>
    </section>
    <section class="info-section reveal">
      <h3>${t("bait")}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>${t("bait")}</th><th>${t("howToObtain")}</th></tr></thead>
          <tbody>
            ${baits.map((bait) => `<tr><td>${byLang(bait.name)}</td><td>${byLang(bait.source)}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="info-section reveal">
      <h3>${t("rods")}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>${t("rods")}</th><th>${t("howToObtain")}</th><th>${t("fishingBoost")}</th></tr></thead>
          <tbody>
            ${rods.map((rod) => `<tr><td>${byLang(rod.name)}</td><td>${byLang(rod.source)}</td><td>+${rod.boost}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderAbout() {
  const ru = state.lang === "ru";
  els.aboutView.innerHTML = `
    <div class="page-heading reveal">
      <h2>${t("aboutTitle")}</h2>
      <p>${ru ? "Короткая памятка по механикам сайта." : "A short guide to the app mechanics."}</p>
    </div>
    <div class="about-grid">
      <article class="info-card reveal">
        <h3>${ru ? "Поиск" : "Search"}</h3>
        <p>${ru ? "Ищи по рыбе, локации, английскому или русскому названию. По уровням работают запросы 5, level 5, lvl 5, уровень 5 и диапазоны 10-15." : "Search by fish, location, English or Russian name. Level queries support 5, level 5, lvl 5, and ranges like 10-15."}</p>
      </article>
      <article class="info-card reveal">
        <h3>${ru ? "Прогресс" : "Progress"}</h3>
        <p>${ru ? "Отметка хранится для конкретной пары рыба + локация. Если все локации рыбы отмечены, рыба становится Completed. Если все рыбы локации отмечены, локация становится Completed." : "A catch mark belongs to one fish + location pair. A fish becomes Completed when every location is marked. A location becomes Completed when every fish there is marked."}</p>
      </article>
      <article class="info-card reveal">
        <h3>${ru ? "Навигация" : "Navigation"}</h3>
        <p>${ru ? "В карточке рыбы можно нажать на локацию и перейти к ней. В карточке локации можно нажать на рыбу и перейти к её инфо." : "Click a location inside a fish page to open that location. Click a fish inside a location page to open that fish."}</p>
      </article>
      <article class="info-card reveal">
        <h3>${t("aboutStorageTitle")}</h3>
        <p>${ru ? "Прогресс хранится только в localStorage этого браузера на этом устройстве. Он не отправляется на сервер. При очистке данных сайта, смене браузера или устройства прогресс может пропасть." : "Progress is stored only in this browser's localStorage on this device. It is not sent to a server. Clearing site data or switching browser/device can remove it."}</p>
        <button class="danger-button" id="clearProgressButton" type="button">${t("clearProgress")}</button>
      </article>
    </div>
  `;

  document.querySelector("#clearProgressButton")?.addEventListener("click", () => {
    state.progress = { caught: {} };
    saveProgress();
    render();
  });
}

function navigateToFish(fishId) {
  state.view = "manager";
  state.mode = "fish";
  state.selectedId = fishId;
  state.query = "";
  const fish = data.fish.find((item) => item.id === fishId);
  if (fish && state.water !== "all" && fish.waterType.en !== state.water) {
    state.water = "all";
  }
  syncControls();
  render();
  scrollToDetail();
}

function navigateToLocation(locationEn) {
  const location = locations.find((item) => item.name.en === locationEn);
  if (!location) return;
  state.view = "manager";
  state.mode = "location";
  state.selectedId = location.id;
  state.query = "";
  if (state.water !== "all" && !location.waterTypes.includes(state.water)) {
    state.water = "all";
  }
  syncControls();
  render();
  scrollToDetail();
}

function scrollToDetail() {
  if (window.matchMedia("(max-width: 820px)").matches) {
    els.detailView.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }
}

function syncControls() {
  els.search.value = state.query;
  els.water.value = state.water;
  els.status.value = state.status;
}

function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setupRevealAnimations() {
  if (observer) observer.disconnect();
  const items = document.querySelectorAll(".reveal");
  if (prefersReducedMotion()) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -30px" },
  );
  items.forEach((item) => observer.observe(item));
}

function render() {
  translatePage();
  syncControls();

  els.viewSections.forEach((section) => {
    section.hidden = section.dataset.viewSection !== state.view;
  });

  els.langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  });

  els.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });

  els.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  renderInfo();
  renderAbout();

  if (state.view === "manager") {
    renderList();
    if (state.selectedId) {
      renderDetail();
    }
  }

  setupRevealAnimations();
}

els.langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    render();
  });
});

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  });
});

els.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.selectedId = null;
    render();
  });
});

els.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  render();
});

els.water.addEventListener("change", (event) => {
  state.water = event.target.value;
  render();
});

els.status.addEventListener("change", (event) => {
  state.status = event.target.value;
  render();
});

els.detailView.addEventListener("click", (event) => {
  const catchButton = event.target.closest("[data-catch-fish]");
  if (catchButton) {
    const fishId = catchButton.dataset.catchFish;
    const locationEn = catchButton.dataset.catchLocation;
    setCaught(fishId, locationEn, !isCaught(fishId, locationEn));
    render();
    return;
  }

  const fishCard = event.target.closest("[data-open-fish]");
  if (fishCard) {
    navigateToFish(fishCard.dataset.openFish);
    return;
  }

  const locationCard = event.target.closest("[data-open-location]");
  if (locationCard) {
    navigateToLocation(locationCard.dataset.openLocation);
  }
});

render();

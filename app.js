const data = window.FISHING_DATA;

const i18n = {
  ru: {
    title: "Менеджер рыбалки",
    subtitle: "Выбери рыбу или локацию, чтобы быстро увидеть места ловли и тип воды.",
    modeFish: "Рыба",
    modeLocation: "Локация",
    searchLabel: "Поиск",
    searchPlaceholder: "Название на русском или английском",
    waterLabel: "Тип воды",
    waterAll: "Любой",
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
    sourceName: "Английское название",
    noLocations: "Локации не указаны в таблице",
    noResultsTitle: "Ничего не найдено",
    noResultsText: "Попробуй изменить поиск или фильтр воды.",
    pickTitle: "Выбери запись",
    pickText: "Список слева обновляется по поиску, языку и типу воды.",
  },
  en: {
    title: "Fishing Manager",
    subtitle: "Pick a fish or a location to see fishing spots and water type fast.",
    modeFish: "Fish",
    modeLocation: "Location",
    searchLabel: "Search",
    searchPlaceholder: "Russian or English name",
    waterLabel: "Water type",
    waterAll: "Any",
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
    sourceName: "Russian name",
    noLocations: "No locations listed in the sheet",
    noResultsTitle: "No results",
    noResultsText: "Try changing the search or water filter.",
    pickTitle: "Pick an entry",
    pickText: "The list updates by search, language, and water type.",
  },
};

const state = {
  lang: "ru",
  mode: "fish",
  selectedId: null,
  query: "",
  water: "all",
};

const els = {
  langButtons: document.querySelectorAll(".lang-button"),
  modeButtons: document.querySelectorAll(".segment"),
  search: document.querySelector("#searchInput"),
  water: document.querySelector("#waterFilter"),
  listTitle: document.querySelector("#listTitle"),
  countBadge: document.querySelector("#countBadge"),
  resultList: document.querySelector("#resultList"),
  detailView: document.querySelector("#detailView"),
};

const byLang = (entry, lang = state.lang) => entry?.[lang] || entry?.en || "";
const otherLang = () => (state.lang === "ru" ? "en" : "ru");
const normalize = (value) => String(value || "").toLocaleLowerCase("ru-RU");
const waterClass = (water) => (water === "Freshwater" ? "pill--fresh" : "pill--salt");
const t = (key) => i18n[state.lang][key] || key;

const locations = buildLocations(data.fish);

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

function matchesQuery(...values) {
  if (!state.query) return true;
  const query = normalize(state.query);
  return values.some((value) => normalize(value).includes(query));
}

function fishMatchesWater(item) {
  return state.water === "all" || item.waterType.en === state.water;
}

function locationMatchesWater(location) {
  return state.water === "all" || location.waterTypes.includes(state.water);
}

function getFishResults() {
  return data.fish
    .filter((item) => fishMatchesWater(item))
    .filter((item) =>
      matchesQuery(
        item.name.ru,
        item.name.en,
        ...item.locations.flatMap((location) => [location.ru, location.en]),
      ),
    )
    .sort((a, b) => byLang(a.name).localeCompare(byLang(b.name), state.lang));
}

function getLocationResults() {
  return locations
    .filter((location) => locationMatchesWater(location))
    .filter((location) =>
      matchesQuery(
        location.name.ru,
        location.name.en,
        ...location.fish.flatMap((item) => [item.name.ru, item.name.en]),
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

function fishImage(item, className = "fish-thumb") {
  if (item.image) {
    return `<img class="${className}" src="${item.image}" alt="${byLang(item.name)}" loading="lazy" />`;
  }

  return `<div class="${className} fish-thumb--empty" aria-hidden="true">${byLang(item.name).slice(0, 1)}</div>`;
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
  const name = isFish ? item.name : item.name;
  const secondary = byLang(name, otherLang());
  const active = item.id === state.selectedId ? " is-active" : "";
  const meta = isFish
    ? `${waterPill(item.waterType.en, byLang(item.waterType))}<span class="pill pill--level">${t("level")} ${item.level ?? "-"}</span>`
    : item.waterTypes.map((water) => waterPill(water, waterLabel(water))).join("");
  const image = isFish ? fishImage(item) : "";

  return `
    <button class="result-button${active}" data-id="${item.id}" type="button">
      ${image}
      <span class="result-main">
        <strong>${byLang(name)}</strong>
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
  const locationCards = item.locations.length
    ? item.locations
        .map(
          (location) => `
            <article class="info-card">
              <h3>${byLang(location)}</h3>
              <span class="secondary-name">${byLang(location, otherLang())}</span>
            </article>
          `,
        )
        .join("")
    : `<article class="info-card"><h3>${t("noLocations")}</h3></article>`;

  els.detailView.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${byLang(item.name)}</h2>
        <p class="detail-subtitle">${byLang(item.name, otherLang())}</p>
      </div>
      <div class="detail-media">
        ${fishImage(item, "fish-portrait")}
        <div class="meta-row">${waterPill(item.waterType.en, byLang(item.waterType))}</div>
      </div>
    </div>
    <div class="stat-strip">
      ${renderStat(t("waterType"), byLang(item.waterType))}
      ${renderStat(t("level"), item.level ?? "-")}
      ${renderStat(t("locationCount"), item.locations.length)}
    </div>
    <div class="panel-heading">
      <h2>${t("locations")}</h2>
    </div>
    <div class="card-grid">${locationCards}</div>
  `;
}

function renderLocationDetail(location) {
  const visibleFish = location.fish
    .filter((item) => fishMatchesWater(item))
    .sort((a, b) => byLang(a.name).localeCompare(byLang(b.name), state.lang));

  const fishCards = visibleFish
    .map(
      (item) => `
        <article class="info-card">
          <h3>${byLang(item.name)}</h3>
          <span class="secondary-name">${byLang(item.name, otherLang())}</span>
          ${fishImage(item)}
          <div class="meta-row">
            ${waterPill(item.waterType.en, byLang(item.waterType))}
            <span class="pill pill--level">${t("level")} ${item.level ?? "-"}</span>
          </div>
        </article>
      `,
    )
    .join("");

  els.detailView.innerHTML = `
    <div class="detail-header">
      <div>
        <h2>${byLang(location.name)}</h2>
        <p class="detail-subtitle">${byLang(location.name, otherLang())}</p>
      </div>
      <div class="meta-row">
        ${location.waterTypes.map((water) => waterPill(water, waterLabel(water))).join("")}
      </div>
    </div>
    <div class="stat-strip">
      ${renderStat(t("waterType"), location.waterTypes.map(waterLabel).join(" / "))}
      ${renderStat(t("fishCount"), visibleFish.length)}
      ${renderStat(t("sourceName"), byLang(location.name, otherLang()))}
    </div>
    <div class="panel-heading">
      <h2>${t("fishes")}</h2>
    </div>
    <div class="card-grid">${fishCards}</div>
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
    <div class="empty-state">
      <div>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function render() {
  translatePage();

  els.langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.lang);
  });

  els.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  renderList();
  if (state.selectedId) {
    renderDetail();
  }
}

els.langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
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

render();

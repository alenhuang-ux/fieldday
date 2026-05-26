const EVENT_TYPES = [
  "100公尺",
  "200公尺",
  "400公尺",
  "800公尺",
  "1500公尺",
  "跳遠",
  "鉛球",
  "跳高",
  "400公尺接力",
  "1200公尺接力",
  "全部",
];

const GRADE_PAGE_ORDER = [
  "全部",
  "國一",
  "國二",
  "國三",
  "高一",
  "高二",
  "高三",
  "七年",
  "八年",
  "九年",
  "十年",
  "十一年",
  "十二年",
];

const TEMPLATE_LABELS = {
  T1: "中學部個人",
  T2: "雙語部個人",
  T3: "雙語部接力",
  T4: "雙語部接力 11 年級以上",
  T5: "中學部接力",
};

const SETTINGS_STORAGE_KEY = "nehs-award-certificate-settings";
const TEMPLATE_LAYOUT_STORAGE_KEY = "nehs-award-template-layouts";

const DEFAULT_CERTIFICATE_SETTINGS = {
  title: "一一五學年度全校運動大會",
  dateText: "中華民國一一五年十一月十五日",
  showBackground: true,
};

const A4_POINTS = {
  width: 595.2755905511812,
  height: 841.8897637795277,
};

const DEFAULT_TEMPLATE_LAYOUT = {
  mainUpPt: 35,
  praiseDownPt: 10,
  dateDownPt: 10,
  titleFontPt: 28,
  titleBold: true,
  eventLabelsBold: true,
  footerBold: true,
};

const TEMPLATE_LAYOUT_DEFAULTS = {
  T1: { ...DEFAULT_TEMPLATE_LAYOUT },
  T2: { ...DEFAULT_TEMPLATE_LAYOUT },
  T3: { ...DEFAULT_TEMPLATE_LAYOUT },
  T4: { ...DEFAULT_TEMPLATE_LAYOUT },
  T5: { ...DEFAULT_TEMPLATE_LAYOUT },
};

const INLINE_NAME_CENTER_X = 355;
const INDIVIDUAL_NAME_RIGHT_PT = 8;
const RELAY_NAME_COLUMNS = [332, 418];
const RELAY_NAME_UP_PT = 28;
const RELAY_CLASSMATE_X = 465;
const T5_SECOND_ROW_NAME_Y = 520;
const T4_NAME_RIGHT_PT = 12;
const T5_NAME_RIGHT_PT = 10;
const RELAY_EVENT_LINES_UP_PT = 20;
const BILINGUAL_RELAY_EVENT_LINES_EXTRA_UP_PT = 10;
const AWARD_LIST_ROWS_PER_PAGE = 16;

const awards = (window.AWARD_RECORDS ?? []).map(normalizeAward);

const state = {
  type: "全部",
  eventName: "全部",
  gradePage: "全部",
  department: "全部",
  query: "",
  selected: new Set(),
  focusedId: null,
  previewIndex: 0,
  tuningTemplate: "T1",
  certificateSettings: loadCertificateSettings(),
  templateLayouts: loadTemplateLayouts(),
};

const els = {
  adminSettings: document.querySelector("#adminSettings"),
  templatePreview: document.querySelector("#templatePreview"),
  templateTuning: document.querySelector("#templateTuning"),
  searchInput: document.querySelector("#searchInput"),
  typeButtons: document.querySelector("#typeButtons"),
  gradePages: document.querySelector("#gradePages"),
  eventPicker: document.querySelector("#eventPicker"),
  eventPickerCount: document.querySelector("#eventPickerCount"),
  awardRows: document.querySelector("#awardRows"),
  emptyState: document.querySelector("#emptyState"),
  visibleCount: document.querySelector("#visibleCount"),
  selectedCountTop: document.querySelector("#selectedCountTop"),
  selectedCountToolbar: document.querySelector("#selectedCountToolbar"),
  metricVisible: document.querySelector("#metricVisible"),
  metricSelected: document.querySelector("#metricSelected"),
  metricTemplates: document.querySelector("#metricTemplates"),
  metricEvents: document.querySelector("#metricEvents"),
  resultSubtitle: document.querySelector("#resultSubtitle"),
  selectAll: document.querySelector("#selectAll"),
  clearSelection: document.querySelector("#clearSelection"),
  awardListPrint: document.querySelector("#awardListPrint"),
  previewPrint: document.querySelector("#previewPrint"),
  previewDialog: document.querySelector("#previewDialog"),
  printPreview: document.querySelector("#printPreview"),
  awardListDialog: document.querySelector("#awardListDialog"),
  awardListCount: document.querySelector("#awardListCount"),
  awardListPreview: document.querySelector("#awardListPreview"),
  awardListName: document.querySelector("#awardListName"),
  awardListDetail: document.querySelector("#awardListDetail"),
  printAwardList: document.querySelector("#printAwardList"),
  resultTitle: document.querySelector("#resultTitle"),
  previewTemplate: document.querySelector("#previewTemplate"),
  certificatePreviewList: document.querySelector("#certificatePreviewList"),
  certificatePrintStack: document.querySelector("#certificatePrintStack"),
  printRoot: document.querySelector("#printRoot"),
  previewName: document.querySelector("#previewName"),
  previewDetail: document.querySelector("#previewDetail"),
  templateDialog: document.querySelector("#templateDialog"),
  templateGallery: document.querySelector("#templateGallery"),
  tuningDialog: document.querySelector("#tuningDialog"),
  tuneTemplateSelect: document.querySelector("#tuneTemplateSelect"),
  tuneMainUp: document.querySelector("#tuneMainUp"),
  tunePraiseDown: document.querySelector("#tunePraiseDown"),
  tuneDateDown: document.querySelector("#tuneDateDown"),
  tuneTitleSize: document.querySelector("#tuneTitleSize"),
  tuneTitleBold: document.querySelector("#tuneTitleBold"),
  tuneEventLabelsBold: document.querySelector("#tuneEventLabelsBold"),
  tuneFooterBold: document.querySelector("#tuneFooterBold"),
  tunePreviewBadge: document.querySelector("#tunePreviewBadge"),
  tunePreviewTitle: document.querySelector("#tunePreviewTitle"),
  tunePreviewDetail: document.querySelector("#tunePreviewDetail"),
  tunePreviewStage: document.querySelector("#tunePreviewStage"),
  tunePreviewOverlay: document.querySelector("#tunePreviewOverlay"),
  resetTune: document.querySelector("#resetTune"),
  saveTune: document.querySelector("#saveTune"),
  settingsDialog: document.querySelector("#settingsDialog"),
  certificateTitleInput: document.querySelector("#certificateTitleInput"),
  certificateDateInput: document.querySelector("#certificateDateInput"),
  showBackgroundInput: document.querySelector("#showBackgroundInput"),
  saveSettings: document.querySelector("#saveSettings"),
  resetSettings: document.querySelector("#resetSettings"),
};

function loadCertificateSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CERTIFICATE_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      title: cleanSetting(parsed.title, DEFAULT_CERTIFICATE_SETTINGS.title),
      dateText: cleanSetting(parsed.dateText, DEFAULT_CERTIFICATE_SETTINGS.dateText),
      showBackground:
        typeof parsed.showBackground === "boolean"
          ? parsed.showBackground
          : DEFAULT_CERTIFICATE_SETTINGS.showBackground,
    };
  } catch {
    return { ...DEFAULT_CERTIFICATE_SETTINGS };
  }
}

function loadTemplateLayouts() {
  try {
    const raw = localStorage.getItem(TEMPLATE_LAYOUT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return Object.fromEntries(
      Object.keys(TEMPLATE_LAYOUT_DEFAULTS).map((template) => [
        template,
        normalizeTemplateLayout(parsed[template], TEMPLATE_LAYOUT_DEFAULTS[template]),
      ]),
    );
  } catch {
    return cloneTemplateLayoutDefaults();
  }
}

function cloneTemplateLayoutDefaults() {
  return Object.fromEntries(
    Object.entries(TEMPLATE_LAYOUT_DEFAULTS).map(([template, layout]) => [
      template,
      { ...layout },
    ]),
  );
}

function normalizeTemplateLayout(layout, fallback) {
  return {
    mainUpPt: cleanNumber(layout?.mainUpPt, fallback.mainUpPt),
    praiseDownPt: cleanNumber(layout?.praiseDownPt, fallback.praiseDownPt),
    dateDownPt: cleanNumber(layout?.dateDownPt, fallback.dateDownPt),
    titleFontPt: cleanNumber(layout?.titleFontPt, fallback.titleFontPt),
    titleBold:
      typeof layout?.titleBold === "boolean" ? layout.titleBold : fallback.titleBold,
    eventLabelsBold:
      typeof layout?.eventLabelsBold === "boolean"
        ? layout.eventLabelsBold
        : fallback.eventLabelsBold,
    footerBold:
      typeof layout?.footerBold === "boolean" ? layout.footerBold : fallback.footerBold,
  };
}

function cleanNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanSetting(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeAward(record) {
  const people = record.members
    ? record.members.map(splitName)
    : [splitName(record.rawName)];
  const template = getTemplate({ ...record, people });

  return {
    ...record,
    people,
    name: people[0]?.name ?? "",
    ename: people[0]?.ename ?? "",
    template,
  };
}

function splitName(raw) {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const chineseParts = cleaned.match(/[\u3400-\u9fff·．・]+/g) ?? [];
  const name = chineseParts.join("");
  const ename = cleaned
    .replace(/[\u3400-\u9fff·．・]/g, " ")
    .replace(/[\/,，、]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    raw: cleaned,
    name: name || cleaned,
    ename: name ? ename : "",
  };
}

function getTemplate(record) {
  const isRelay = Boolean(record.members?.length || record.people?.length > 1);

  if (record.department === "雙語部" && isRelay && record.gradeNumber >= 11) {
    return "T4";
  }

  if (record.department === "雙語部" && isRelay) {
    return "T3";
  }

  if (record.department === "中學部" && isRelay) {
    return "T5";
  }

  if (record.department === "雙語部") {
    return "T2";
  }

  return "T1";
}

function init() {
  renderTypeButtons();
  bindEvents();
  render();
}

function renderTypeButtons() {
  els.typeButtons.innerHTML = EVENT_TYPES.map((type) => {
    const active = type === state.type ? " active" : "";
    return `<button class="type-button${active}" data-type="${type}" type="button">${type}</button>`;
  }).join("");
}

function renderEventPicker() {
  const gradePages = getGradePages();
  const events = getEventPickerData();
  const baseCount = awards.filter(
    (item) => matchesTypeDepartmentQuery(item) && matchesGradePage(item),
  ).length;

  els.eventPickerCount.textContent = `${events.length} 項`;
  els.gradePages.innerHTML = gradePages
    .map((grade) => {
      const active = grade === state.gradePage ? " active" : "";
      return `<button class="grade-tab${active}" data-grade-page="${escapeHtml(grade)}" type="button">${escapeHtml(grade)}</button>`;
    })
    .join("");

  if (!events.length) {
    els.eventPicker.innerHTML = `<div class="event-picker-empty">此條件下沒有比賽項目</div>`;
    return;
  }

  const allActive = state.eventName === "全部" ? " active" : "";
  const allButton = `
    <button class="event-filter-button${allActive}" data-event-name="全部" type="button">
      <span>
        <strong>全部比賽</strong>
        <small>${baseCount} 筆名單</small>
      </span>
    </button>
  `;

  const eventButtons = events
    .map((event) => {
      const active = state.eventName === event.name ? " active" : "";
      const noteBadge =
        event.noteCount > 0
          ? `<b class="event-note-badge">紀錄 ${event.noteCount}</b>`
          : "";
      return `
        <button class="event-filter-button${active}" data-event-name="${escapeHtml(event.name)}" type="button">
          <span>
            <strong>${escapeHtml(event.name)}</strong>
            <small>${escapeHtml(event.type)} · ${event.count} 筆名單</small>
          </span>
          ${noteBadge}
        </button>
      `;
    })
    .join("");

  els.eventPicker.innerHTML = allButton + eventButtons;
}

function bindEvents() {
  els.templatePreview.addEventListener("click", () => {
    renderTemplateGallery();
    els.templateDialog.showModal();
  });

  els.templateTuning.addEventListener("click", () => {
    hydrateTuningForm();
    renderTuningPreview();
    els.tuningDialog.showModal();
  });

  els.adminSettings.addEventListener("click", () => {
    hydrateSettingsForm();
    els.settingsDialog.showModal();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });

  els.typeButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    state.type = button.dataset.type;
    state.eventName = "全部";
    state.gradePage = "全部";
    state.focusedId = null;
    renderTypeButtons();
    render();
  });

  els.gradePages.addEventListener("click", (event) => {
    const button = event.target.closest("[data-grade-page]");
    if (!button) return;
    state.gradePage = button.dataset.gradePage;
    state.eventName = "全部";
    state.focusedId = null;
    render();
  });

  els.eventPicker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-name]");
    if (!button) return;
    state.eventName = button.dataset.eventName;
    state.focusedId = null;
    render();
  });

  document.querySelectorAll("[data-department]").forEach((button) => {
    button.addEventListener("click", () => {
      state.department = button.dataset.department;
      state.eventName = "全部";
      state.gradePage = "全部";
      state.focusedId = null;
      document
        .querySelectorAll("[data-department]")
        .forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  els.selectAll.addEventListener("change", () => {
    const visible = getVisibleAwards();
    if (els.selectAll.checked) {
      visible.forEach((item) => state.selected.add(item.id));
    } else {
      visible.forEach((item) => state.selected.delete(item.id));
    }
    state.focusedId = visible[0]?.id ?? null;
    render();
  });

  els.clearSelection.addEventListener("click", () => {
    state.selected.clear();
    state.focusedId = null;
    render();
  });

  els.previewPrint.addEventListener("click", () => {
    state.previewIndex = 0;
    renderPreview();
    els.previewDialog.showModal();
  });

  els.printPreview.addEventListener("click", () => {
    const items = getPreviewAwards();
    if (!items.length) return;
    renderCertificatePrintRoot(items);
    waitForImages(els.printRoot).then(() => {
      window.print();
    });
  });

  els.awardListPrint.addEventListener("click", () => {
    renderAwardListDialog();
    els.awardListDialog.showModal();
  });

  els.printAwardList.addEventListener("click", () => {
    const items = getAwardListItems();
    if (!items.length) return;
    renderAwardListPrintRoot(items);
    window.print();
  });

  els.saveSettings.addEventListener("click", () => {
    state.certificateSettings = {
      title: cleanSetting(
        els.certificateTitleInput.value,
        DEFAULT_CERTIFICATE_SETTINGS.title,
      ),
      dateText: cleanSetting(
        els.certificateDateInput.value,
        DEFAULT_CERTIFICATE_SETTINGS.dateText,
      ),
      showBackground: els.showBackgroundInput.checked,
    };
    persistCertificateSettings();
    renderPreview();
    renderTemplateGallery();
    els.settingsDialog.close();
  });

  els.resetSettings.addEventListener("click", () => {
    state.certificateSettings = { ...DEFAULT_CERTIFICATE_SETTINGS };
    persistCertificateSettings();
    hydrateSettingsForm();
    renderPreview();
    renderTemplateGallery();
    renderTuningPreview();
  });

  els.tuneTemplateSelect.addEventListener("change", () => {
    state.tuningTemplate = els.tuneTemplateSelect.value;
    hydrateTuningForm();
    renderTuningPreview();
  });

  [
    els.tuneMainUp,
    els.tunePraiseDown,
    els.tuneDateDown,
    els.tuneTitleSize,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      updateTemplateLayoutFromForm();
    });
  });

  [els.tuneTitleBold, els.tuneEventLabelsBold, els.tuneFooterBold].forEach((input) => {
    input.addEventListener("change", () => {
      updateTemplateLayoutFromForm();
    });
  });

  els.resetTune.addEventListener("click", () => {
    state.templateLayouts[state.tuningTemplate] = {
      ...TEMPLATE_LAYOUT_DEFAULTS[state.tuningTemplate],
    };
    persistTemplateLayouts();
    hydrateTuningForm();
    renderTuningPreview();
    renderPreview();
    renderTemplateGallery();
  });

  els.saveTune.addEventListener("click", () => {
    updateTemplateLayoutFromForm();
    els.tuningDialog.close();
  });
}

function hydrateSettingsForm() {
  els.certificateTitleInput.value = state.certificateSettings.title;
  els.certificateDateInput.value = state.certificateSettings.dateText;
  els.showBackgroundInput.checked = state.certificateSettings.showBackground;
}

function persistCertificateSettings() {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.certificateSettings));
}

function hydrateTuningForm() {
  const layout = getTemplateLayout(state.tuningTemplate);
  els.tuneTemplateSelect.value = state.tuningTemplate;
  els.tuneMainUp.value = layout.mainUpPt;
  els.tunePraiseDown.value = layout.praiseDownPt;
  els.tuneDateDown.value = layout.dateDownPt;
  els.tuneTitleSize.value = layout.titleFontPt;
  els.tuneTitleBold.checked = layout.titleBold;
  els.tuneEventLabelsBold.checked = layout.eventLabelsBold;
  els.tuneFooterBold.checked = layout.footerBold;
}

function updateTemplateLayoutFromForm() {
  state.templateLayouts[state.tuningTemplate] = normalizeTemplateLayout(
    {
      mainUpPt: els.tuneMainUp.value,
      praiseDownPt: els.tunePraiseDown.value,
      dateDownPt: els.tuneDateDown.value,
      titleFontPt: els.tuneTitleSize.value,
      titleBold: els.tuneTitleBold.checked,
      eventLabelsBold: els.tuneEventLabelsBold.checked,
      footerBold: els.tuneFooterBold.checked,
    },
    TEMPLATE_LAYOUT_DEFAULTS[state.tuningTemplate],
  );
  persistTemplateLayouts();
  renderTuningPreview();
  renderPreview();
  renderTemplateGallery();
}

function persistTemplateLayouts() {
  localStorage.setItem(TEMPLATE_LAYOUT_STORAGE_KEY, JSON.stringify(state.templateLayouts));
}

function getTemplateLayout(template) {
  return state.templateLayouts[template] ?? TEMPLATE_LAYOUT_DEFAULTS[template];
}

function matchesTypeDepartmentQuery(item) {
  const matchesType = state.type === "全部" || item.type === state.type;
  const matchesDepartment = state.department === "全部" || item.department === state.department;
  return matchesType && matchesDepartment && matchesSearch(item);
}

function matchesGradePage(item) {
  return state.gradePage === "全部" || item.gradeLabel === state.gradePage;
}

function getVisibleAwards() {
  return awards
    .filter((item) => {
      const matchesEvent = state.eventName === "全部" || item.eventName === state.eventName;
      return matchesTypeDepartmentQuery(item) && matchesGradePage(item) && matchesEvent;
    })
    .sort((a, b) => {
      if (a.eventName !== b.eventName) return a.eventName.localeCompare(b.eventName, "zh-Hant");
      return a.rank - b.rank;
    });
}

function matchesSearch(item) {
  const haystack = [
    item.department,
    item.schoolUnit,
    item.gradeLabel,
    item.className,
    item.eventName,
    item.type,
    item.score,
    ...item.people.flatMap((person) => [person.name, person.ename, person.raw]),
  ]
    .join(" ")
    .toLowerCase();
  return !state.query || haystack.includes(state.query);
}

function getGradePages() {
  const pages = new Set(
    awards.filter(matchesTypeDepartmentQuery).map((item) => item.gradeLabel),
  );
  return ["全部", ...[...pages].sort(compareGradePages)];
}

function compareGradePages(a, b) {
  const ai = GRADE_PAGE_ORDER.indexOf(a);
  const bi = GRADE_PAGE_ORDER.indexOf(b);
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }
  return a.localeCompare(b, "zh-Hant");
}

function getEventPickerData() {
  const byEvent = new Map();
  awards
    .filter((item) => matchesTypeDepartmentQuery(item) && matchesGradePage(item))
    .forEach((item) => {
      const current = byEvent.get(item.eventName) ?? {
        name: item.eventName,
        type: item.type,
        eventEn: item.eventEn,
        count: 0,
        noteCount: 0,
      };
      current.count += 1;
      if (item.note) current.noteCount += 1;
      byEvent.set(item.eventName, current);
    });

  return [...byEvent.values()].sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
}

function ensureEventFilters() {
  const gradePages = getGradePages();
  if (!gradePages.includes(state.gradePage)) state.gradePage = "全部";

  const events = getEventPickerData();
  if (
    state.eventName !== "全部" &&
    !events.some((event) => event.name === state.eventName)
  ) {
    state.eventName = "全部";
  }
}

function getSelectedAwards() {
  return awards.filter((item) => state.selected.has(item.id));
}

function getPreviewAward() {
  const visible = getVisibleAwards();
  const selectedVisible = visible.find((item) => state.selected.has(item.id));
  const focusedVisible = visible.find((item) => item.id === state.focusedId);
  return selectedVisible ?? focusedVisible ?? getSelectedAwards()[0] ?? visible[0];
}

function getPreviewAwards() {
  const selected = getSelectedAwards();
  if (selected.length) return selected;
  const focused = getPreviewAward();
  return focused ? [focused] : [];
}

function render() {
  ensureEventFilters();
  const visible = getVisibleAwards();

  renderTypeButtons();
  renderEventPicker();

  els.visibleCount.textContent = visible.length;
  els.selectedCountTop.textContent = state.selected.size;
  els.selectedCountToolbar.textContent = state.selected.size;
  els.awardListPrint.disabled = state.selected.size === 0;
  els.metricVisible.textContent = visible.length;
  els.metricSelected.textContent = state.selected.size;
  els.metricTemplates.textContent = new Set(visible.map((item) => item.template)).size;
  els.metricEvents.textContent = new Set(visible.map((item) => item.eventName)).size;
  els.resultTitle.textContent = buildResultTitle();
  els.resultSubtitle.textContent = buildResultSubtitle(visible);
  els.emptyState.hidden = visible.length > 0;

  els.selectAll.checked = visible.length > 0 && visible.every((item) => state.selected.has(item.id));
  els.selectAll.indeterminate =
    visible.some((item) => state.selected.has(item.id)) && !els.selectAll.checked;

  els.awardRows.innerHTML = visible.map(renderRow).join("");
  bindRowEvents();
  renderPreview();
}

function buildResultSubtitle(visible) {
  const types = new Set(visible.map((item) => item.type)).size;
  const events = new Set(visible.map((item) => item.eventName)).size;
  return `${events} 個比賽項目 · ${types} 種類型 · ${visible.length} 筆名單`;
}

function buildResultTitle() {
  const parts = [];
  if (state.type !== "全部") parts.push(state.type);
  if (state.gradePage !== "全部") parts.push(state.gradePage);
  if (state.eventName !== "全部") parts.push(state.eventName);
  if (state.department !== "全部") parts.push(state.department);
  if (state.query) parts.push(`搜尋：${state.query}`);
  return parts.length ? parts.join(" · ") : "全部名單";
}

function renderRow(item) {
  const selected = state.selected.has(item.id) ? " selected" : "";
  const focused = state.focusedId === item.id ? " focused" : "";
  const peopleText = item.people.map((person) => person.name).join("、");
  const enameText = item.people
    .map((person) => person.ename)
    .filter(Boolean)
    .join(" / ");
  const checked = state.selected.has(item.id) ? "checked" : "";
  const rankClass = item.rank <= 3 ? ` rank-${item.rank}` : "";
  const classText = `${item.schoolUnit} ${
    item.department === "雙語部" ? formatBilingualClass(item) : formatMiddleClass(item)
  }`;
  const noteHtml = item.note ? `<span class="record-note">${escapeHtml(item.note)}</span>` : "";

  return `
    <article class="record-card${selected}${focused}" data-id="${item.id}">
      <label class="record-select" aria-label="選取 ${escapeHtml(peopleText)}">
        <input type="checkbox" data-select="${item.id}" ${checked} />
      </label>
      <div><span class="rank${rankClass}">${item.rank}</span></div>
      <div class="name-cell">
        <strong>${escapeHtml(peopleText)}</strong>
        <span>${escapeHtml(enameText || item.eventName)}</span>
        <span class="record-event">${escapeHtml(item.eventName)}</span>
      </div>
      <div class="class-cell">${escapeHtml(classText)}</div>
      <div class="score-cell">
        <strong>${escapeHtml(item.score)}</strong>
        ${noteHtml}
      </div>
      <div><span class="template-badge">${item.template}</span></div>
    </article>
  `;
}

function bindRowEvents() {
  els.awardRows.querySelectorAll("[data-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selected.add(checkbox.dataset.select);
      } else {
        state.selected.delete(checkbox.dataset.select);
      }
      state.focusedId = checkbox.dataset.select;
      render();
    });
  });

  els.awardRows.querySelectorAll(".record-card[data-id]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.matches("input")) return;
      state.focusedId = row.dataset.id;
      render();
    });
  });
}

function renderPreview() {
  const items = getPreviewAwards();

  if (!items.length) {
    state.previewIndex = 0;
    els.previewTemplate.textContent = "T1";
    els.certificatePreviewList.innerHTML = "";
    els.certificatePrintStack.innerHTML = "";
    els.printRoot.innerHTML = "";
    els.previewName.textContent = "請先勾選一筆名單";
    els.previewDetail.textContent = "選取後會顯示模板判斷與文字位置預覽。";
    els.printPreview.textContent = "列印選取獎狀";
    els.printPreview.disabled = true;
    return;
  }

  const active = items[0];
  const selectedCount = state.selected.size;
  els.previewTemplate.textContent = items.length === 1 ? active.template : `${items.length} 張`;
  els.previewName.textContent =
    items.length === 1
      ? active.people.map((person) => person.name).join("、")
      : `已選取 ${items.length} 筆名單`;
  els.previewDetail.textContent = `${
    state.certificateSettings.showBackground ? "含底圖" : "純文字"
  } · ${selectedCount > 0 ? `已選取 ${selectedCount} 張` : "目前預覽 1 張"}，下方可向下滑動檢查；列印時會自動分頁`;
  els.printPreview.disabled = false;
  els.printPreview.textContent =
    selectedCount > 0 ? `批量列印選取 ${selectedCount} 張` : "列印目前預覽 1 張";
  const printHtml = items.map(renderCertificateStage).join("");
  els.certificatePreviewList.innerHTML = items
    .map((item, index) => renderPreviewCertificateItem(item, index, items.length))
    .join("");
  els.certificatePrintStack.innerHTML = printHtml;
  renderCertificatePrintRoot(items);
}

function renderCertificatePrintRoot(items) {
  els.printRoot.innerHTML = items.map(renderCertificateStage).join("");
}

function getAwardListItems() {
  return getSelectedAwards();
}

function renderAwardListDialog() {
  const items = getAwardListItems();

  if (!items.length) {
    els.awardListCount.textContent = "0 筆";
    els.awardListPreview.innerHTML = `
      <div class="award-list-empty">請先勾選要放入頒獎清單的名單</div>
    `;
    els.awardListName.textContent = "請先勾選名單";
    els.awardListDetail.textContent = "勾選後可產生 A4 頒獎清單，列印或存成 PDF。";
    els.printAwardList.disabled = true;
    return;
  }

  els.awardListCount.textContent = `${items.length} 筆`;
  els.awardListName.textContent = `已選取 ${items.length} 筆頒獎資料`;
  els.awardListDetail.textContent = `${summarizeAwardList(items)}。每頁最多 ${AWARD_LIST_ROWS_PER_PAGE} 筆，列印時會自動分頁。`;
  els.printAwardList.disabled = false;
  els.awardListPreview.innerHTML = renderAwardListPages(items);
  renderAwardListPrintRoot(items);
}

function renderAwardListPrintRoot(items) {
  els.printRoot.innerHTML = renderAwardListPages(items);
}

function summarizeAwardList(items) {
  const eventCount = new Set(items.map((item) => item.eventName)).size;
  const typeCount = new Set(items.map((item) => item.type)).size;
  const departments = [...new Set(items.map((item) => item.department))].join("、");
  return `${eventCount} 個比賽項目、${typeCount} 種類型、${departments || "全部部別"}`;
}

function renderAwardListPages(items) {
  const pages = chunk(items, AWARD_LIST_ROWS_PER_PAGE);
  return pages
    .map((pageItems, pageIndex) =>
      renderAwardListPage(pageItems, pageIndex, pages.length, items.length),
    )
    .join("");
}

function renderAwardListPage(items, pageIndex, pageTotal, totalCount) {
  const rows = items
    .map((item, index) =>
      renderAwardListRow(item, pageIndex * AWARD_LIST_ROWS_PER_PAGE + index),
    )
    .join("");
  return `
    <section class="award-list-page">
      <header class="award-list-page-header">
        <div>
          <p>National Experimental High School at Hsinchu Science Park</p>
          <h1>一一五學年度全校運動大會頒獎清單</h1>
        </div>
        <div>
          <strong>${pageIndex + 1} / ${pageTotal}</strong>
          <span>共 ${totalCount} 筆</span>
        </div>
      </header>
      <table class="award-list-table">
        <thead>
          <tr>
            <th>序</th>
            <th>比賽名稱</th>
            <th>名次</th>
            <th>姓名 / 隊伍</th>
            <th>班級</th>
            <th>成績 / 備註</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <footer class="award-list-page-footer">
        <span>列印日期：${escapeHtml(state.certificateSettings.dateText)}</span>
        <span>勾選名單產生</span>
      </footer>
    </section>
  `;
}

function renderAwardListRow(item, index) {
  const people = item.people
    .map((person) => {
      const ename = person.ename ? ` ${person.ename}` : "";
      return `${person.name}${ename}`;
    })
    .join("、");
  const classText = `${item.schoolUnit} ${
    item.department === "雙語部" ? formatBilingualClass(item) : formatMiddleClass(item)
  }`;
  const score = [item.score, item.note].filter(Boolean).join(" / ");
  return `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.eventName)}</td>
      <td>${escapeHtml(`${item.rankText} ${item.rankEn}`.trim())}</td>
      <td>${escapeHtml(people)}</td>
      <td>${escapeHtml(classText)}</td>
      <td>${escapeHtml(score)}</td>
    </tr>
  `;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function waitForImages(root) {
  const images = [...root.querySelectorAll("img")];
  return Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}

function renderPreviewCertificateItem(item, index, total) {
  const names = item.people.map((person) => person.name).join("、");
  return `
    <article class="preview-certificate-item">
      <div class="preview-certificate-head">
        <span>${index + 1} / ${total}</span>
        <strong>${escapeHtml(names)}</strong>
        <small>${escapeHtml(item.eventName)} · ${escapeHtml(item.rankText)}</small>
      </div>
      ${renderCertificateStage(item)}
    </article>
  `;
}

function renderCertificateStage(item) {
  const textOnlyClass = state.certificateSettings.showBackground ? "" : " is-text-only";
  return `
    <div class="certificate-stage print-certificate${textOnlyClass}">
      <img src="./assets/certificate-background.png" alt="${escapeHtml(item.template)} 獎狀背景預覽" />
      <div class="certificate-overlay">${buildCertificateOverlay(item)}</div>
    </div>
  `;
}

function renderTemplateGallery() {
  const samples = ["T1", "T2", "T3", "T4", "T5"]
    .map((template) => awards.find((item) => item.template === template))
    .filter(Boolean);
  const textOnlyClass = state.certificateSettings.showBackground ? "" : " is-text-only";

  els.templateGallery.innerHTML = samples
    .map((item) => {
      const names = item.people.map((person) => person.name).join("、");
      return `
        <article class="template-preview-card">
          <div class="template-preview-head">
            <span class="template-badge">${item.template}</span>
            <div>
              <strong>${escapeHtml(TEMPLATE_LABELS[item.template])}</strong>
              <small>${escapeHtml(names)} · ${escapeHtml(item.eventName)}</small>
            </div>
          </div>
          <div class="certificate-stage template-certificate${textOnlyClass}">
            <img src="./assets/certificate-background.png" alt="${item.template} 獎狀背景預覽" />
            <div class="certificate-overlay">${buildCertificateOverlay(item)}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTuningPreview() {
  if (!els.tunePreviewOverlay) return;
  const item = awards.find((award) => award.template === state.tuningTemplate);
  if (!item) return;

  const names = item.people.map((person) => person.name).join("、");
  els.tunePreviewBadge.textContent = item.template;
  els.tunePreviewTitle.textContent = TEMPLATE_LABELS[item.template];
  els.tunePreviewDetail.textContent = `${names} · ${item.eventName}`;
  els.tunePreviewStage.classList.toggle(
    "is-text-only",
    !state.certificateSettings.showBackground,
  );
  els.tunePreviewOverlay.innerHTML = buildCertificateOverlay(item);
}

function buildCertificateOverlay(item) {
  const isRelay = item.people.length > 1;
  const people = item.people;
  const layout = getTemplateLayout(item.template);
  const title = certCenter(
    state.certificateSettings.title,
    A4_POINTS.width / 2,
    mainY(item.template, 600),
    layout.titleFontPt,
    layout.titleBold ? "bold" : "",
  );

  if (isRelay && item.department === "雙語部") {
    const [leftX, rightX] = RELAY_NAME_COLUMNS;
    const nameRightShift = item.template === "T4" ? T4_NAME_RIGHT_PT : 0;
    const namePositions = [
      [leftX + nameRightShift, 520 + RELAY_NAME_UP_PT, leftX + nameRightShift, 496 + RELAY_NAME_UP_PT],
      [rightX + nameRightShift, 520 + RELAY_NAME_UP_PT, rightX + nameRightShift, 496 + RELAY_NAME_UP_PT],
      [leftX + nameRightShift, 468 + RELAY_NAME_UP_PT, leftX + nameRightShift, 444 + RELAY_NAME_UP_PT],
      [rightX + nameRightShift, 468 + RELAY_NAME_UP_PT, rightX + nameRightShift, 444 + RELAY_NAME_UP_PT],
    ];

    return [
      title,
      certLeft(item.schoolUnit, 135, mainY(item.template, 550), 20),
      certLeft(formatBilingualClass(item), 215, mainY(item.template, 550), 20),
      certLeft("同學", RELAY_CLASSMATE_X, mainY(item.template, 550), 20),
      ...people.flatMap((person, index) => {
        const [nameX, nameY, enameX, enameY] = namePositions[index];
        const nameMaxWidth =
          item.template === "T4"
            ? Math.min(70, Math.max(42, (RELAY_CLASSMATE_X - nameX) * 2))
            : 70;
        const enameMaxWidth =
          item.template === "T4"
            ? Math.min(86, Math.max(60, (RELAY_CLASSMATE_X - enameX) * 2))
            : 86;
        return [
          certNameCenter(person.name, nameX, mainY(item.template, nameY), 21, nameMaxWidth),
          certNameCenter(person.ename, enameX, mainY(item.template, enameY), 12, enameMaxWidth),
        ];
      }),
      ...eventLines(item, 135, 215, [395, 355, 315]),
      ...relayFooterLines(item),
    ].join("");
  }

  if (isRelay) {
    const relayNameColumns = RELAY_NAME_COLUMNS.map((x) => x + T5_NAME_RIGHT_PT);

    return [
      title,
      certLeft(item.schoolUnit, 135, mainY(item.template, 550), 20),
      certLeft(formatMiddleClass(item), 215, mainY(item.template, 550), 20),
      certLeft("同學", RELAY_CLASSMATE_X, mainY(item.template, 550), 20),
      certNameCenter(people[0]?.name ?? "", relayNameColumns[0], mainY(item.template, 550), 20, 76),
      certNameCenter(people[1]?.name ?? "", relayNameColumns[1], mainY(item.template, 550), 20, 76),
      certNameCenter(people[2]?.name ?? "", relayNameColumns[0], mainY(item.template, T5_SECOND_ROW_NAME_Y), 20, 76),
      certNameCenter(people[3]?.name ?? "", relayNameColumns[1], mainY(item.template, T5_SECOND_ROW_NAME_Y), 20, 76),
      ...eventLines(item, 135, 215, [455, 415, 375]),
      ...relayFooterLines(item),
    ].join("");
  }

  if (item.department === "雙語部") {
    return [
      title,
      certLeft(item.schoolUnit, 135, mainY(item.template, 550), 20),
      certLeft(formatBilingualClass(item), 215, mainY(item.template, 550), 20),
      certNameCenter(
        item.name,
        INLINE_NAME_CENTER_X + INDIVIDUAL_NAME_RIGHT_PT,
        mainY(item.template, 550),
        22,
        110,
      ),
      certLeft("同學", 430, mainY(item.template, 550), 20),
      item.ename ? certNameCenter(item.ename, 355, mainY(item.template, 520), 16, 150) : "",
      ...eventLines(item, 135, 215, [475, 435, 395]),
      ...singleFooterLines(item),
    ].join("");
  }

  return [
    title,
    certLeft(item.schoolUnit, 135, mainY(item.template, 550), 20),
    certLeft(formatMiddleClass(item), 215, mainY(item.template, 550), 20),
    certNameCenter(
      item.name,
      INLINE_NAME_CENTER_X + INDIVIDUAL_NAME_RIGHT_PT,
      mainY(item.template, 550),
      22,
      110,
    ),
    certLeft("同學", 430, mainY(item.template, 550), 20),
    ...eventLines(item, 135, 215, [505, 465, 425]),
    ...singleFooterLines(item),
  ].join("");
}

function formatMiddleClass(item) {
  const grade = item.gradeLabel.replace(/^高/, "").replace(/^國/, "");
  return `${grade}年${item.className}`;
}

function formatBilingualClass(item) {
  return `${item.gradeLabel}${item.className.replace(/\s+/g, "")}`;
}

function eventLines(item, labelX, valueX, [eventY, rankY, scoreY]) {
  const layout = getTemplateLayout(item.template);
  const labelWeight = layout.eventLabelsBold ? "bold" : "";
  const eventLineShift =
    ["T3", "T4", "T5"].includes(item.template) ? RELAY_EVENT_LINES_UP_PT : 0;
  const bilingualRelayExtraShift =
    ["T3", "T4"].includes(item.template) ? BILINGUAL_RELAY_EVENT_LINES_EXTRA_UP_PT : 0;
  const totalEventLineShift = eventLineShift + bilingualRelayExtraShift;
  const scoreLineY = mainY(item.template, scoreY + totalEventLineShift);
  return [
    certLeft("參  加", labelX, mainY(item.template, eventY + totalEventLineShift), 22, labelWeight),
    certLeft(item.eventName, valueX, mainY(item.template, eventY + totalEventLineShift), 22),
    certLeft("榮  獲", labelX, mainY(item.template, rankY + totalEventLineShift), 22, labelWeight),
    certLeft(`${item.rankText}  ${item.rankEn}`, valueX, mainY(item.template, rankY + totalEventLineShift), 22),
    certLeft("成  績", labelX, scoreLineY, 22, labelWeight),
    certLeft(item.score, valueX, scoreLineY, 22),
    item.note ? certNoteLeft(item.note, valueX + 118, scoreLineY, 15, 220) : "",
  ];
}

function singleFooterLines(item) {
  const weight = getTemplateLayout(item.template).footerBold ? "bold" : "";
  return [
    certCenter("表現優異，特頒發獎狀，以資鼓勵。", A4_POINTS.width / 2, praiseY(item.template, 350), 23, weight),
    certCenter(state.certificateSettings.dateText, A4_POINTS.width / 2, dateY(item.template, 68), 23, weight),
  ];
}

function relayFooterLines(item) {
  const weight = getTemplateLayout(item.template).footerBold ? "bold" : "";
  return [
    certCenter("表現優異，特頒發獎狀，以資鼓勵。", A4_POINTS.width / 2, praiseY(item.template, 236), 23, weight),
    certCenter(state.certificateSettings.dateText, A4_POINTS.width / 2, dateY(item.template, 68), 23, weight),
  ];
}

function mainY(template, y) {
  return y + getTemplateLayout(template).mainUpPt;
}

function praiseY(template, y) {
  return y - getTemplateLayout(template).praiseDownPt;
}

function dateY(template, y) {
  return y - getTemplateLayout(template).dateDownPt;
}

function certCenter(text, x, y, fontSize, weight = "") {
  return certText(text, x, y, fontSize, "center", weight);
}

function certLeft(text, x, y, fontSize, weight = "") {
  return certText(text, x, y, fontSize, "left", weight);
}

function certNoteLeft(text, x, y, fontSize, maxWidthPt) {
  return certText(text, x, y, fontSize, "left", "bold", "note", maxWidthPt);
}

function certNameCenter(text, x, y, fontSize, maxWidthPt, weight = "") {
  const adjustedFontSize = fitNameFontSize(text, fontSize, maxWidthPt);
  return certText(text, x, y, adjustedFontSize, "center", weight, "name", maxWidthPt);
}

function fitNameFontSize(text, fontSize, maxWidthPt) {
  const normalized = String(text ?? "").trim();
  const asciiCount = (normalized.match(/[A-Za-z0-9]/g) ?? []).length;
  const wideCount = normalized.length - asciiCount;
  const estimatedWidth = wideCount * fontSize + asciiCount * fontSize * 0.56;
  if (estimatedWidth <= maxWidthPt) return fontSize;
  const scaled = Math.floor((fontSize * maxWidthPt) / estimatedWidth);
  return Math.max(Math.min(fontSize, scaled), Math.max(9, Math.floor(fontSize * 0.58)));
}

function certText(text, x, y, fontSize, align, weight, variant = "", maxWidthPt = null) {
  const left = (x / A4_POINTS.width) * 100;
  const top = ((A4_POINTS.height - y) / A4_POINTS.height) * 100;
  const weightClass = weight === "bold" ? " cert-bold" : "";
  const variantClass = variant ? ` cert-${variant}` : "";
  const widthStyle = maxWidthPt ? ` --maxw:${maxWidthPt};` : "";
  return `<span class="cert-text cert-${align}${weightClass}${variantClass}" style="left:${left}%; top:${top}%; --pt:${fontSize};${widthStyle}">${escapeHtml(text)}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();

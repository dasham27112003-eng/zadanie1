/**
 * Чек-лист действий при задымлении с фильтром по этапу.
 * Состояние сохраняется в localStorage (только факт отметки, без персональных данных).
 */

(function () {
  "use strict";

  // Данные чек-листа
  var checklistData = [
    { id: "b1", stage: "before", text: "Установите автономный пожарный извещатель в жилых помещениях." },
    { id: "b2", stage: "before", text: "Изучите план эвакуации и пути выхода из здания." },
    { id: "b3", stage: "before", text: "Держите на видном месте номер экстренных служб: 101 или 112." },
    { id: "b4", stage: "before", text: "Не загромождайте балконы, лоджии и лестничные клетки." },
    { id: "d1", stage: "during", text: "Позвоните в пожарную охрану по телефону 101 или 112." },
    { id: "d2", stage: "during", text: "Закройте дверь в помещении, где начался пожар." },
    { id: "d3", stage: "during", text: "Заделайте щели в дверях и вентиляционные отверстия мокрой тканью." },
    { id: "d4", stage: "during", text: "Дышите через мокрую ткань, держитесь ближе к полу." },
    { id: "d5", stage: "during", text: "Не пользуйтесь лифтом. Выходите по лестнице." },
    { id: "d6", stage: "during", text: "Если дым в подъезде, вернитесь в квартиру и ждите пожарных." },
    { id: "a1", stage: "after", text: "После эвакуации оставайтесь на безопасном расстоянии от здания." },
    { id: "a2", stage: "after", text: "Сообщите прибывшим пожарным о возможных оставшихся в здании людях." },
    { id: "a3", stage: "after", text: "При наличии симптомов отравления дымом обратитесь к врачу." }
  ];

  var STORAGE_KEY = "zadymlenie-checklist";
  var listEl = document.getElementById("checklist");
  var statusEl = document.getElementById("checklist-status");
  var filterButtons = document.querySelectorAll(".filter-btn");
  var resetBtn = document.getElementById("reset-checklist");

  var currentFilter = "all";

  // --- Безопасные DOM-операции ---
  function createChecklistItem(item) {
    var li = document.createElement("li");
    li.dataset.stage = item.stage;

    var input = document.createElement("input");
    input.type = "checkbox";
    input.id = item.id;
    input.dataset.id = item.id;

    var label = document.createElement("label");
    label.htmlFor = item.id;

    var textSpan = document.createElement("span");
    textSpan.textContent = item.text; // безопасно: textContent

    var stageTag = document.createElement("span");
    stageTag.className = "stage-tag stage-" + item.stage;
    stageTag.textContent = stageLabel(item.stage);

    label.appendChild(textSpan);
    label.appendChild(stageTag);

    li.appendChild(input);
    li.appendChild(label);
    return li;
  }

  function stageLabel(stage) {
    if (stage === "before") return "до";
    if (stage === "during") return "во время";
    if (stage === "after") return "после";
    return "";
  }

  // --- Состояние ---
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // localStorage может быть недоступен — ничего не сохраняем.
    }
  }

  function updateStatus() {
    var checked = listEl.querySelectorAll("input[type='checkbox']:checked").length;
    var total = listEl.querySelectorAll("input[type='checkbox']").length;
    var visible = listEl.querySelectorAll("li:not([hidden])").length;

    var msg = "Отмечено " + checked + " из " + total + ".";
    if (currentFilter !== "all") {
      msg += " Показано пунктов: " + visible + ".";
    }
    statusEl.textContent = msg;
  }

  function applyFilter(filter) {
    currentFilter = filter;
    var items = listEl.querySelectorAll("li");
    items.forEach(function (li) {
      if (filter === "all" || li.dataset.stage === filter) {
        li.removeAttribute("hidden");
      } else {
        li.setAttribute("hidden", "");
      }
    });

    filterButtons.forEach(function (btn) {
      var isActive = btn.dataset.filter === filter;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    updateStatus();
  }

  // --- Инициализация ---
  function init() {
    var saved = loadState();

    checklistData.forEach(function (item) {
      var li = createChecklistItem(item);
      var input = li.querySelector("input");
      if (saved[item.id]) {
        input.checked = true;
      }
      input.addEventListener("change", function () {
        var state = loadState();
        if (input.checked) {
          state[item.id] = true;
        } else {
          delete state[item.id];
        }
        saveState(state);
        updateStatus();
      });
      listEl.appendChild(li);
    });

    filterButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyFilter(btn.dataset.filter);
      });
    });

    resetBtn.addEventListener("click", function () {
      listEl.querySelectorAll("input[type='checkbox']").forEach(function (cb) {
        cb.checked = false;
      });
      saveState({});
      updateStatus();
    });

    applyFilter("all");
  }

  // Запуск после загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
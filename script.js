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
})();/**
 * Подсветка активного раздела в навигации при прокрутке.
 * Использует IntersectionObserver — без тяжёлых обработчиков scroll.
 */
(function () {
  "use strict";

  var navLinks = document.querySelectorAll(".site-nav__link");
  if (!navLinks.length) return; // навигации нет — выходим

  // Собираем пары «ссылка → секция»
  var pairs = [];
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href") || "";
    if (href.charAt(0) !== "#") return;
    var id = href.slice(1);
    var target = document.getElementById(id);
    if (target) pairs.push({ link: link, target: target });
  });

  if (!pairs.length) return;

  function setActive(activeLink) {
    pairs.forEach(function (p) {
      var isActive = p.link === activeLink;
      p.link.classList.toggle("is-active", isActive);
      if (isActive) {
        p.link.setAttribute("aria-current", "true");
      } else {
        p.link.removeAttribute("aria-current");
      }
    });
  }

  // Отслеживаем, какие разделы видны
  var visible = new Map(); // id -> пересечение (0..1)

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (entry.isIntersecting) {
          visible.set(id, entry.intersectionRatio);
        } else {
          visible.delete(id);
        }
      });

      // Выбираем раздел с наибольшим пересечением
      var bestId = null;
      var bestRatio = -1;
      visible.forEach(function (ratio, id) {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      if (bestId) {
        var pair = pairs.find(function (p) { return p.target.id === bestId; });
        if (pair) setActive(pair.link);
      }
    },
    {
      // Срабатываем, когда раздел проходит через верхнюю треть экрана
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1]
    }
  );

  pairs.forEach(function (p) { observer.observe(p.target); });

  // Плавный скролл и обновление адресной строки
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      var target = document.getElementById(href.slice(1));
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", href);

      // Фокус на секции для клавиатурных пользователей (без визуальной рамки на блоке)
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });
})();/**
 * Кнопка «Наверх» в стиле «пламя».
 * - Появляется после прокрутки на 400px.
 * - Плавно скроллит страницу в начало.
 * - Скрыта от скринридеров, пока не видна.
 */
(function () {
  "use strict";

  var btn = document.getElementById("back-to-top");
  if (!btn) return;

  var SHOW_AFTER = 400; // px прокрутки, после которого кнопка появляется
  var isVisible = false;

  function updateVisibility() {
    var shouldShow = window.scrollY > SHOW_AFTER;

    if (shouldShow === isVisible) return;
    isVisible = shouldShow;

    if (isVisible) {
      // Сначала снимаем hidden, потом включаем анимацию появления
      btn.hidden = false;
      // Форсируем перерасчёт, чтобы transition сработал
      void btn.offsetWidth;
      btn.classList.add("is-visible");
      btn.removeAttribute("aria-hidden");
      btn.removeAttribute("tabindex");
    } else {
      btn.classList.remove("is-visible");
      btn.setAttribute("aria-hidden", "true");
      btn.setAttribute("tabindex", "-1");
      // Скрываем из потока после завершения анимации
      window.setTimeout(function () {
        if (!isVisible) btn.hidden = true;
      }, 260);
    }
  }

  function scrollToTop() {
    var prefersReduced = window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Возвращаем фокус на начало страницы — важно для клавиатуры и скринридеров
    var skip = document.querySelector(".skip-link");
    var target = skip || document.querySelector("h1");
    if (target) {
      // h1 не фокусируется по умолчанию — даём tabindex
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
    }
  }

  btn.addEventListener("click", scrollToTop);

  // Обработка прокрутки с троттлингом через requestAnimationFrame
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateVisibility();
      ticking = false;
    });
  }, { passive: true });

  // Проверяем при загрузке: если пользователь открыл страницу уже прокрученной
  updateVisibility();
})();
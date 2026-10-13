// Search & Filter
    const search = document.querySelector("#department-search");
    const cards = [...document.querySelectorAll(".department-card")];
    const status = document.querySelector("#search-status");
    const emptyState = document.querySelector(".empty-state");
    const grid = document.querySelector(".department-grid");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function filterDepartments() {
      const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let count = 0;

      cards.forEach((card) => {
        const matches = words.every((word) => card.dataset.search.includes(word));
        card.hidden = !matches;
        if (matches) count++;
      });

      emptyState.hidden = count > 0;
      grid.classList.toggle("is-filtered", words.length > 0);

      const departmentLabel = count === 1 ? "department" : "departments";
      const resultLabel = words.length > 0 ? "found" : "to explore";
      status.textContent = `${count} ${departmentLabel} ${resultLabel}`;
    }

    search.addEventListener("input", filterDepartments);
    document.querySelector(".search-form").addEventListener("submit", (e) => {
      e.preventDefault();
      filterDepartments();
      document.querySelector("#departments").scrollIntoView({
        behavior: reducedMotion.matches ? "instant" : "smooth"
      });
    });

    document.querySelector("#clear-search").addEventListener("click", () => {
      search.value = "";
      filterDepartments();
      search.focus({ preventScroll: true });
    });

    // Motion Pause
    const motionButton = document.querySelector(".motion-toggle");
    let isMotionPaused = reducedMotion.matches;

    function setPaused(paused) {
      isMotionPaused = paused;
      document.body.classList.toggle("motion-paused", paused);
      motionButton.setAttribute("aria-pressed", String(paused));
      motionButton.textContent = paused ? "Resume motion ▷" : "Pause motion Ⅱ";
    }

    setPaused(reducedMotion.matches);
    reducedMotion.addEventListener("change", (e) => setPaused(e.matches));
    motionButton.addEventListener("click", () => setPaused(!isMotionPaused));

    // Parallax Effect
    const parallaxElements = document.querySelectorAll("[data-parallax-speed]");

    window.addEventListener("scroll", () => {
      if (isMotionPaused) return;
      const scrollY = window.pageYOffset;
      if (scrollY > 900) return;

      parallaxElements.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax-speed")) || 0;
        const offset = scrollY * speed;
        if (el.classList.contains("photo-tech")) {
          el.style.transform = `translateY(${offset}px) rotate(-12deg)`;
        } else if (el.classList.contains("photo-fruit")) {
          el.style.transform = `translateY(${offset}px) rotate(12deg)`;
        } else if (el.classList.contains("photo-plant")) {
          el.style.transform = `translateY(${offset}px) rotate(-4deg)`;
        } else if (el.classList.contains("round-stamp")) {
          el.style.transform = `translateY(${offset}px) rotate(12deg)`;
        } else {
          el.style.transform = `translateY(${offset}px)`;
        }
      });
    }, { passive: true });

    // Odometer Counter
    const odometers = document.querySelectorAll(".odometer-number");
    let odometersTriggered = false;

    function animateOdometer(el, target, duration = 1800) {
      const startTime = performance.now();
      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target.toLocaleString();
        }
      }
      requestAnimationFrame(update);
    }

    const odometerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !odometersTriggered) {
          odometersTriggered = true;
          odometers.forEach((el) => {
            const target = parseInt(el.getAttribute("data-target"), 10);
            animateOdometer(el, target);
          });
        }
      });
    }, { threshold: 0.35 });

    const odometerSection = document.querySelector(".odometer-metrics-section");
    if (odometerSection) odometerObserver.observe(odometerSection);

    // Scroll Reveals
    const revealItems = document.querySelectorAll(".reveal-item");
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealItems.forEach((item) => revealObserver.observe(item));

    // Sticky Laptop View Content Sync (Steps 1, 2, 3)
    const stepCards = document.querySelectorAll(".step-card");
    const laptopIcon = document.querySelector("#laptop-icon");
    const laptopTag = document.querySelector("#laptop-tag");
    const laptopTitle = document.querySelector("#laptop-title");
    const laptopDesc = document.querySelector("#laptop-desc");

    const stepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          stepCards.forEach(c => c.classList.remove("active-step"));
          entry.target.classList.add("active-step");

          const step = entry.target.dataset.step;
          const icon = entry.target.dataset.icon;
          const title = entry.target.dataset.title;
          const desc = entry.target.dataset.desc;

          if (laptopIcon) laptopIcon.textContent = icon;
          if (laptopTag) laptopTag.textContent = `STEP 0${step}`;
          if (laptopTitle) laptopTitle.textContent = title;
          if (laptopDesc) laptopDesc.textContent = desc;
        }
      });
    }, { threshold: 0.6 });

    stepCards.forEach((card) => stepObserver.observe(card));

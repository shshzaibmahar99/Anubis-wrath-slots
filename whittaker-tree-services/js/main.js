/* Louis Whittaker Tree Services — landing page interactions */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile navigation ---- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });

  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---- Sticky header shadow ---- */
  var header = document.getElementById("header");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile call bar: show after scrolling past the hero ---- */
  var callbar = document.querySelector(".callbar");
  var hero = document.querySelector(".hero");
  if (callbar && hero && "IntersectionObserver" in window) {
    document.body.classList.add("has-callbar");
    new IntersectionObserver(function (entries) {
      var pastHero = !entries[0].isIntersecting;
      var contactInView = false;
      var contact = document.getElementById("contact");
      if (contact) {
        var r = contact.getBoundingClientRect();
        contactInView = r.top < window.innerHeight && r.bottom > 0;
      }
      callbar.classList.toggle("is-visible", pastHero && !contactInView);
    }, { rootMargin: "-120px 0px 0px 0px" }).observe(hero);
  }

  /* ---- Scroll-reveal animations ---- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---- Animated stat counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var duration = 1400;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
    } else {
      requestAnimationFrame(frame);
    }
  }

  var statEls = document.querySelectorAll(".stat__num");
  if ("IntersectionObserver" in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    statEls.forEach(function (el) { statObserver.observe(el); });
  } else {
    statEls.forEach(animateCount);
  }

  /* ---- Quote form (demo: client-side confirmation only) ---- */
  var form = document.getElementById("quoteForm");
  var success = document.getElementById("formSuccess");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var valid = true;
    form.querySelectorAll("[required]").forEach(function (input) {
      if (!input.value.trim()) {
        input.style.borderColor = "#c0533a";
        valid = false;
      } else {
        input.style.borderColor = "";
      }
    });
    if (!valid) return;

    success.hidden = false;
    form.querySelector('button[type="submit"]').disabled = true;
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.disabled = true;
    });
    success.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
  });

  /* ---- Footer year ---- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();

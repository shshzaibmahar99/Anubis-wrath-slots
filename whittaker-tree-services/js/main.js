/* Louis Whittaker Tree Services : landing page interactions */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---- Preloader ---- */
  var preloader = document.getElementById("preloader");
  if (preloader) {
    var hidePreloader = function () {
      preloader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      setTimeout(function () { preloader.remove(); }, 650);
    };
    var minDelay = new Promise(function (r) { setTimeout(r, prefersReducedMotion ? 150 : 950); });
    var pageLoaded = new Promise(function (r) {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r, { once: true });
    });
    var maxDelay = new Promise(function (r) { setTimeout(r, 2600); });
    Promise.race([Promise.all([minDelay, pageLoaded]), maxDelay]).then(hidePreloader);
  }

  /* ---- Falling-leaves canvas (premium, dependency-free, reused hero + footer) ---- */
  function createLeafField(canvas, opts) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var host = canvas.parentElement;
    var colors = opts.colors;
    var vein = opts.vein;
    var baseAlpha = opts.baseAlpha;
    var density = opts.density;
    var leaves = [];
    var cw = 0, ch = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = false, rafId = null;

    function makeLeaf(initial) {
      var size = 6 + Math.random() * 11;
      return {
        x: Math.random() * cw,
        y: initial ? Math.random() * ch : -20,
        size: size,
        speed: 0.22 + Math.random() * 0.5,
        sway: 0.6 + Math.random() * 1.1,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.008 + Math.random() * 0.014,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        color: colors[(Math.random() * colors.length) | 0],
        alpha: baseAlpha + Math.random() * 0.32
      };
    }

    function resize() {
      cw = host.clientWidth;
      ch = host.clientHeight;
      if (!cw || !ch) return;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.round((window.innerWidth < 760 ? density * 0.55 : density));
      while (leaves.length < target) leaves.push(makeLeaf(true));
      leaves.length = target;
    }

    function draw(l) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rot);
      ctx.globalAlpha = l.alpha;
      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.moveTo(0, -l.size);
      ctx.bezierCurveTo(l.size * 0.7, -l.size * 0.5, l.size * 0.7, l.size * 0.5, 0, l.size);
      ctx.bezierCurveTo(-l.size * 0.7, l.size * 0.5, -l.size * 0.7, -l.size * 0.5, 0, -l.size);
      ctx.fill();
      ctx.strokeStyle = vein;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -l.size);
      ctx.lineTo(0, l.size);
      ctx.stroke();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, cw, ch);
      for (var i = 0; i < leaves.length; i++) {
        var l = leaves[i];
        l.swayPhase += l.swaySpeed;
        l.x += Math.sin(l.swayPhase) * l.sway * 0.5;
        l.y += l.speed;
        l.rot += l.rotSpeed;
        if (l.y - l.size > ch) { leaves[i] = makeLeaf(false); leaves[i].x = Math.random() * cw; }
        draw(l);
      }
      rafId = requestAnimationFrame(tick);
    }

    var start = function () { if (!running) { running = true; tick(); } };
    var stop = function () { running = false; if (rafId) cancelAnimationFrame(rafId); };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else start();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) start(); else stop();
      }, { threshold: 0 }).observe(host);
    } else {
      start();
    }
  }

  if (!prefersReducedMotion) {
    createLeafField(document.getElementById("heroLeaves"), {
      colors: ["#4f9e6b", "#3c8254", "#6fb886", "#2f6b46", "#b8862e"],
      vein: "rgba(20,56,38,0.35)", baseAlpha: 0.28, density: 16
    });
    createLeafField(document.getElementById("footerLeaves"), {
      colors: ["#6fb886", "#4f9e6b", "#9ad0ab", "#e9d9b8"],
      vein: "rgba(255,255,255,0.25)", baseAlpha: 0.2, density: 14
    });
  }

  /* ---- Magnetic buttons (fine pointers only) ---- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 0.32;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + (mx * strength).toFixed(1) + "px," + (my * strength).toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- Continuous marquee ticker: clone the set for a seamless loop ---- */
  var tickerTrack = document.getElementById("tickerTrack");
  if (tickerTrack) {
    var firstSet = tickerTrack.querySelector(".ticker__set");
    if (firstSet) {
      var clone = firstSet.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      tickerTrack.appendChild(clone);
    }
  }

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

  /* ---- Scroll-stacked service cards: scale back as the next card covers ---- */
  var stackCards = Array.prototype.slice.call(document.querySelectorAll(".stack__card"));
  if (stackCards.length && !prefersReducedMotion) {
    var stackTicking = false;
    var updateStack = function () {
      stackTicking = false;
      for (var i = 0; i < stackCards.length - 1; i++) {
        var card = stackCards[i];
        var rect = card.getBoundingClientRect();
        var nextRect = stackCards[i + 1].getBoundingClientRect();
        var p = (rect.bottom - nextRect.top + 26) / (rect.height + 26);
        p = Math.max(0, Math.min(1, p));
        if (p > 0) {
          card.style.transform = "scale(" + (1 - p * 0.055) + ") translateY(" + (p * -6) + "px)";
          card.style.filter = "brightness(" + (1 - p * 0.07) + ")";
        } else {
          card.style.transform = "";
          card.style.filter = "";
        }
      }
    };
    var requestStack = function () {
      if (!stackTicking) {
        stackTicking = true;
        requestAnimationFrame(updateStack);
      }
    };
    window.addEventListener("scroll", requestStack, { passive: true });
    window.addEventListener("resize", requestStack);
    requestStack();
  }

  /* ---- Scroll-driven effects: gallery parallax, growing vine, process timeline ---- */
  var parallaxImgs = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var rootsWrap = document.querySelector(".locations__wrap");
  var processEl = document.getElementById("processTimeline");
  var processSteps = processEl ? Array.prototype.slice.call(processEl.querySelectorAll(".process__step")) : [];

  var clamp01 = function (v) { return Math.max(0, Math.min(1, v)); };

  /* The vine + its leaves, for each (mobile / desktop) variant */
  var vines = Array.prototype.slice.call(document.querySelectorAll(".roots")).map(function (svg) {
    var leaves = Array.prototype.slice.call(svg.querySelectorAll(".leaf")).map(function (g) {
      var inner = g.querySelector(".leaf__s") || g;
      if (!prefersReducedMotion) inner.setAttribute("transform", "scale(0)");
      return { el: inner, p: parseFloat(g.getAttribute("data-p")) || 0 };
    });
    return { svg: svg, vine: svg.querySelector(".vine"), leaves: leaves, len: 0 };
  });

  var isShown = function (el) { return el.getClientRects().length > 0; };

  /* progress of an element travelling up through the viewport */
  var viewProgress = function (el, lead) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp01((vh - rect.top - (lead || 0)) / (rect.height + vh * 0.3));
  };

  if (prefersReducedMotion) {
    vines.forEach(function (v) {
      v.leaves.forEach(function (lf) { lf.el.setAttribute("transform", "scale(1.35)"); });
      var rv = v.vine;
      if (rv) rv.style.strokeDashoffset = 0;
    });
  }

  if (!prefersReducedMotion && (parallaxImgs.length || vines.length || processEl)) {
    var fxTicking = false;
    var updateFX = function () {
      fxTicking = false;
      var vh = window.innerHeight;

      parallaxImgs.forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        var center = (box.top + box.height / 2 - vh / 2) / vh;
        img.style.setProperty("--py", (center * -22).toFixed(1) + "px");
      });

      if (rootsWrap && vines.length) {
        var rp = viewProgress(rootsWrap, 40);
        vines.forEach(function (v) {
          if (!v.vine || !isShown(v.svg)) return;
          if (!v.len) {
            v.len = v.vine.getTotalLength();
            v.vine.style.strokeDasharray = v.len;
            v.vine.style.strokeDashoffset = v.len;
          }
          var vp = clamp01(rp * 1.12);
          v.vine.style.strokeDashoffset = v.len * (1 - vp);
          v.leaves.forEach(function (lf) {
            var s = clamp01((rp - lf.p) * 6) * 1.35;
            lf.el.setAttribute("transform", "scale(" + s.toFixed(3) + ")");
          });
        });
      }

      if (processEl) {
        var tp = viewProgress(processEl, 120);
        processEl.style.setProperty("--p", tp.toFixed(3));
        processSteps.forEach(function (step, i) {
          step.classList.toggle("is-active", tp >= (i + 0.55) / processSteps.length);
        });
      }
    };
    var requestFX = function () {
      if (!fxTicking) {
        fxTicking = true;
        requestAnimationFrame(updateFX);
      }
    };
    window.addEventListener("scroll", requestFX, { passive: true });
    window.addEventListener("resize", requestFX);
    requestFX();
  } else if (processEl) {
    processEl.style.setProperty("--p", "1");
    processSteps.forEach(function (s) { s.classList.add("is-active"); });
  }

  /* ---- 3D tilt on hover (pointer devices only) ---- */
  if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(900px) rotateX(" + (py * -5).toFixed(2) + "deg) rotateY(" +
          (px * 6).toFixed(2) + "deg) translateY(-4px)";
        el.style.transition = "transform 0.08s linear";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transition = "transform 0.4s ease";
        el.style.transform = "";
      });
    });
  }

  /* ---- Animated stat counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var suffix = el.dataset.suffix || "";
    var duration = 2300;
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
    }, { threshold: 0.35 });
    statEls.forEach(function (el) { statObserver.observe(el); });
  } else {
    statEls.forEach(animateCount);
  }

  /* ---- Reviews slider: snap scroll, arrows, dots, drag, autoplay ---- */
  var track = document.getElementById("reviewTrack");
  if (track) {
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = document.getElementById("revPrev");
    var nextBtn = document.getElementById("revNext");
    var dotsBox = document.getElementById("revDots");
    var autoTimer = null;

    var slideStep = function () {
      if (slides.length < 2) return track.clientWidth;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    };
    var maxScroll = function () { return track.scrollWidth - track.clientWidth; };
    var currentIndex = function () {
      return Math.min(slides.length - 1, Math.round(track.scrollLeft / slideStep()));
    };

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to review " + (i + 1));
      dot.addEventListener("click", function () {
        track.scrollTo({ left: i * slideStep(), behavior: prefersReducedMotion ? "auto" : "smooth" });
        restartAuto();
      });
      dotsBox.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsBox.children);

    var syncUI = function () {
      var idx = currentIndex();
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
      prevBtn.disabled = track.scrollLeft <= 4;
      nextBtn.disabled = track.scrollLeft >= maxScroll() - 4;
    };

    var go = function (dir) {
      var target = (currentIndex() + dir) * slideStep();
      track.scrollTo({ left: target, behavior: prefersReducedMotion ? "auto" : "smooth" });
    };

    prevBtn.addEventListener("click", function () { go(-1); restartAuto(); });
    nextBtn.addEventListener("click", function () { go(1); restartAuto(); });

    var scrollTicking = false;
    track.addEventListener("scroll", function () {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(function () { scrollTicking = false; syncUI(); });
      }
    }, { passive: true });

    /* Drag to scroll with the mouse (touch scrolls natively) */
    if (finePointer) {
      var dragging = false, startX = 0, startScroll = 0, moved = false;
      track.addEventListener("pointerdown", function (e) {
        if (e.pointerType !== "mouse") return;
        dragging = true; moved = false;
        startX = e.clientX;
        startScroll = track.scrollLeft;
        track.classList.add("is-dragging");
        track.setPointerCapture(e.pointerId);
      });
      track.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 4) moved = true;
        track.scrollLeft = startScroll - dx;
      });
      var endDrag = function (e) {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        if (moved) {
          track.scrollTo({ left: currentIndex() * slideStep(), behavior: "smooth" });
          restartAuto();
        }
      };
      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
    }

    /* Gentle autoplay, paused on interaction and when off screen */
    var startAuto = function () {
      if (prefersReducedMotion || autoTimer) return;
      autoTimer = setInterval(function () {
        if (track.scrollLeft >= maxScroll() - 4) {
          track.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          go(1);
        }
      }, 4800);
    };
    var stopAuto = function () {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    };
    var restartAuto = function () { stopAuto(); startAuto(); };

    track.addEventListener("pointerenter", stopAuto);
    track.addEventListener("pointerleave", startAuto);
    track.addEventListener("touchstart", stopAuto, { passive: true });
    track.addEventListener("touchend", startAuto, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) startAuto(); else stopAuto();
      }, { threshold: 0.3 }).observe(track);
    } else {
      startAuto();
    }

    syncUI();
    window.addEventListener("resize", syncUI);
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

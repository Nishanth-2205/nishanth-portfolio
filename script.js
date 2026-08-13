(function () {
    const board = document.getElementById("portfolioBoard");
    const wireLayer = document.getElementById("wireLayer");
    const progressBar = document.getElementById("progressBar");
    const siteHeader = document.querySelector(".site-header");
    const navToggle = document.querySelector(".nav-toggle");
    const primaryNav = document.getElementById("primaryNav");
    const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
    const themeRoot = document.documentElement;
    const themeToggle = document.querySelector("[data-theme-toggle]");
    const themeToggleText = themeToggle ? themeToggle.querySelector(".theme-toggle-text") : null;
    const themeCallout = document.querySelector("[data-mode-callout]");
    const darkAudio = document.querySelector("[data-dark-audio]");
    const audioToggle = document.querySelector("[data-audio-toggle]");
    const audioToggleText = audioToggle ? audioToggle.querySelector(".audio-toggle-text") : null;
    const modeCopyTargets = Array.from(document.querySelectorAll("[data-dark-text]"));
    const notes = Array.from(document.querySelectorAll(".post-it"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compactNavigation = window.matchMedia("(max-width: 1024px)");
    const sectionTargets = Array.from(new Map(navLinks
        .filter((link) => link.hash && document.querySelector(link.hash))
        .map((link) => [link.hash, {
            id: link.hash.slice(1),
            target: document.querySelector(link.hash)
        }])
    ).values());

    const wires = [
        ["about", "education"],
        ["education", "experience"],
        ["about", "projects"],
        ["projects", "certifications"],
        ["projects", "publications"],
        ["experience", "certifications"],
        ["experience", "community"],
        ["certifications", "publications"],
        ["projects", "life"],
        ["publications", "contact"],
        ["community", "contact"],
        ["life", "contact"]
    ];

    let activePopover = null;
    let fallTimer = null;
    let resizeFrame = 0;
    let navAutoHideTimer = 0;
    let navOpenedAtScrollY = 0;
    let activeNavId = "";
    let hapticsReady = false;
    let lastHapticAt = 0;
    let themeCopyTargets = modeCopyTargets;
    let themeApplyTimer = 0;
    let themeTransitionTimer = 0;
    let themeCalloutTimer = 0;
    let audioFadeFrame = 0;
    let audioMuted = false;
    let audioRequested = false;
    let audioNeedsGesture = false;
    const darkAudioTargetVolume = 0.24;

    const casualHighlights = [
        "five tools are doing one job",
        "final_final_v7",
        "history, politics",
        "evidence wall",
        "messy systems",
        "Suspicious, but useful",
        "lore board",
        "group chat to survive",
        "stakeholder and stack trace",
        "legacy system",
        "Legacy systems",
        "why though",
        "training montage",
        "support ticket",
        "ancient spells",
        "business users",
        "main-character energy",
        "process map",
        "public speaking",
        "different hat",
        "side quests",
        "Side quests",
        "manual work",
        "farewell cake",
        "psychological thriller",
        "dashboard pretending to be destiny",
        "not a forecasting method",
        "people are complicated",
        "boss level",
        "boss and did not rage quit",
        "tabs",
        "research arc unlocked",
        "academic lore",
        "main character",
        "dashboard",
        "last-minute panic",
        "walking LinkedIn post",
        "quick sync",
        "workflow is held together",
        "one person named",
        "before that person goes on vacation",
        "Proof I fought the documentation boss",
        "the actual plot",
        "trap",
        "the research side quest became canon",
        "not every useful system has an API",
        "anti-burnout stack",
        "Morse code does not"
    ];

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function escapeHtml(value) {
        return value.replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[character]));
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlightCasualPhrases(text) {
        let html = escapeHtml(text);

        casualHighlights.forEach((phrase) => {
            const safePhrase = escapeHtml(phrase);
            const expression = new RegExp(escapeRegExp(safePhrase), "gi");
            html = html.replace(expression, (match) => `<span class="casual-highlight">${match}</span>`);
        });

        return html;
    }

    function isDarkTheme() {
        return themeRoot.classList.contains("theme-dark");
    }

    function setModeCopy(scope) {
        const targets = scope
            ? Array.from(scope.querySelectorAll("[data-dark-text]"))
            : themeCopyTargets;
        const dark = isDarkTheme();

        targets.forEach((element) => {
            if (!element.dataset.lightHtml) {
                element.dataset.lightHtml = element.innerHTML;
            }

            if (dark) {
                element.innerHTML = highlightCasualPhrases(element.dataset.darkText);
            } else {
                element.innerHTML = element.dataset.lightHtml;
            }
        });
    }

    function updateThemeToggle() {
        if (!themeToggle) {
            return;
        }

        const dark = isDarkTheme();
        themeToggle.setAttribute("aria-pressed", String(dark));
        themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");

        if (themeToggleText) {
            themeToggleText.textContent = dark ? "Light Mode" : "Dark Mode";
        }
    }

    function showThemeCallout(duration) {
        if (!themeCallout) {
            return;
        }

        window.clearTimeout(themeCalloutTimer);
        themeCallout.classList.add("is-visible");
        themeCalloutTimer = window.setTimeout(() => {
            themeCallout.classList.remove("is-visible");
        }, duration);
    }

    function storeThemePreference(dark) {
        try {
            localStorage.setItem("portfolioTheme", dark ? "dark" : "light");
        } catch (error) {
            return;
        }
    }

    function loadAudioPreference() {
        try {
            audioMuted = localStorage.getItem("portfolioDarkAudioMuted") === "true";
        } catch (error) {
            audioMuted = false;
        }
    }

    function storeAudioPreference() {
        try {
            localStorage.setItem("portfolioDarkAudioMuted", audioMuted ? "true" : "false");
        } catch (error) {
            return;
        }
    }

    function updateAudioToggle() {
        if (!audioToggle) {
            return;
        }

        const dark = isDarkTheme();
        const waiting = dark && !audioMuted && audioNeedsGesture;
        audioToggle.classList.toggle("is-muted", audioMuted);
        audioToggle.classList.toggle("is-waiting", waiting);
        audioToggle.setAttribute("aria-hidden", String(!dark));
        audioToggle.setAttribute("aria-pressed", String(dark && !audioMuted && !waiting));
        audioToggle.setAttribute("aria-label", waiting ? "Play dark mode music" : (audioMuted ? "Unmute dark mode music" : "Mute dark mode music"));

        if (audioToggleText) {
            audioToggleText.textContent = waiting ? "Play" : (audioMuted ? "Unmute" : "Mute");
        }
    }

    function fadeDarkAudio(targetVolume, pauseAfterFade) {
        if (!darkAudio) {
            return;
        }

        window.cancelAnimationFrame(audioFadeFrame);
        const startVolume = darkAudio.volume;
        const duration = reducedMotion ? 0 : 1200;
        const startTime = performance.now();

        const finish = () => {
            darkAudio.volume = targetVolume;
            if (pauseAfterFade && targetVolume === 0) {
                darkAudio.pause();
            }
            updateAudioToggle();
        };

        if (!duration) {
            finish();
            return;
        }

        const step = (now) => {
            const progress = clamp((now - startTime) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            darkAudio.volume = startVolume + (targetVolume - startVolume) * eased;

            if (progress < 1) {
                audioFadeFrame = window.requestAnimationFrame(step);
                return;
            }

            finish();
        };

        audioFadeFrame = window.requestAnimationFrame(step);
    }

    function primeDarkAudio() {
        if (!darkAudio || audioMuted) {
            return;
        }

        audioRequested = true;
        audioNeedsGesture = false;
        darkAudio.loop = true;
        darkAudio.volume = 0;

        const playAttempt = darkAudio.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(() => {
                audioRequested = false;
                audioNeedsGesture = isDarkTheme();
                updateAudioToggle();
            });
        }
    }

    function syncDarkAudio(fade) {
        if (!darkAudio) {
            return;
        }

        const dark = isDarkTheme();
        if (!dark || audioMuted) {
            audioNeedsGesture = false;
            fadeDarkAudio(0, true);
            updateAudioToggle();
            return;
        }

        if (!audioRequested && darkAudio.paused) {
            audioNeedsGesture = true;
            updateAudioToggle();
            return;
        }

        const playAttempt = darkAudio.paused ? darkAudio.play() : Promise.resolve();
        if (playAttempt && typeof playAttempt.then === "function") {
            playAttempt
                .then(() => {
                    audioNeedsGesture = false;
                    if (fade) {
                        fadeDarkAudio(darkAudioTargetVolume, false);
                    } else {
                        darkAudio.volume = darkAudioTargetVolume;
                        updateAudioToggle();
                    }
                })
                .catch(() => {
                    audioRequested = false;
                    audioNeedsGesture = true;
                    updateAudioToggle();
                });
            return;
        }

        if (fade) {
            fadeDarkAudio(darkAudioTargetVolume, false);
        } else {
            darkAudio.volume = darkAudioTargetVolume;
            updateAudioToggle();
        }
    }

    function toggleDarkAudioMute() {
        if (!darkAudio) {
            return;
        }

        if (audioMuted || audioNeedsGesture) {
            audioMuted = false;
            audioNeedsGesture = false;
            storeAudioPreference();
            primeDarkAudio();
            syncDarkAudio(true);
            return;
        }

        audioMuted = true;
        storeAudioPreference();
        syncDarkAudio(true);
    }

    function setTheme(dark, animate) {
        if (isDarkTheme() === dark && !themeRoot.classList.contains("theme-changing")) {
            updateThemeToggle();
            setModeCopy();
            syncDarkAudio(false);
            return;
        }

        window.clearTimeout(themeApplyTimer);
        window.clearTimeout(themeTransitionTimer);
        themeRoot.classList.remove("theme-changing", "theme-to-dark", "theme-to-light");

        if (dark && !audioMuted) {
            primeDarkAudio();
        }

        const applyTheme = () => {
            themeRoot.classList.toggle("theme-dark", dark);
            storeThemePreference(dark);
            updateThemeToggle();
            setModeCopy();
            syncDarkAudio(true);
            layoutNotes(false);
            drawWires();
            showThemeCallout(5000);
        };

        if (!animate || reducedMotion) {
            applyTheme();
            return;
        }

        themeRoot.classList.add("theme-changing", dark ? "theme-to-dark" : "theme-to-light");
        themeApplyTimer = window.setTimeout(applyTheme, 250);
        themeTransitionTimer = window.setTimeout(() => {
            themeRoot.classList.remove("theme-changing", "theme-to-dark", "theme-to-light");
        }, 880);
    }

    function setNavOpen(open) {
        if (!siteHeader || !navToggle) {
            return;
        }

        window.clearTimeout(navAutoHideTimer);
        siteHeader.classList.toggle("is-nav-open", open);
        navToggle.setAttribute("aria-expanded", String(open));

        if (open && compactNavigation.matches) {
            navOpenedAtScrollY = window.scrollY;
            centerActiveRailLink();
            navAutoHideTimer = window.setTimeout(() => setNavOpen(false), 6000);
        }
    }

    function centerActiveRailLink() {
        if (!primaryNav || !compactNavigation.matches) {
            return;
        }

        const activeLink = primaryNav.querySelector(".is-active");
        if (!activeLink) {
            return;
        }

        const targetTop = activeLink.offsetTop - (primaryNav.clientHeight - activeLink.offsetHeight) / 2;
        primaryNav.scrollTo({
            top: Math.max(0, targetTop),
            behavior: reducedMotion ? "auto" : "smooth"
        });
    }

    function triggerSectionFeedback(activeLink) {
        if (!activeLink || !compactNavigation.matches) {
            return;
        }

        activeLink.classList.remove("section-pulse");
        requestAnimationFrame(() => activeLink.classList.add("section-pulse"));
        window.setTimeout(() => activeLink.classList.remove("section-pulse"), 460);

        const now = Date.now();
        if (hapticsReady && !reducedMotion && "vibrate" in navigator && now - lastHapticAt > 320) {
            navigator.vibrate(8);
            lastHapticAt = now;
        }
    }

    function updateActiveNavigation() {
        if (!navLinks.length || !sectionTargets.length) {
            return;
        }

        const scrollPosition = window.scrollY + 132;
        let activeId = "";

        sectionTargets.forEach(({ id, target }) => {
            const targetTop = target.getBoundingClientRect().top + window.scrollY;
            if (targetTop <= scrollPosition) {
                activeId = id;
            }
        });

        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
            activeId = "contact";
        }

        let activeLink = null;
        navLinks.forEach((link) => {
            const isActive = link.hash === `#${activeId}`;
            link.classList.toggle("is-active", isActive);
            if (isActive) {
                link.setAttribute("aria-current", "location");
                activeLink = link;
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (activeId && activeId !== activeNavId) {
            activeNavId = activeId;
            triggerSectionFeedback(activeLink);
            if (siteHeader && siteHeader.classList.contains("is-nav-open")) {
                centerActiveRailLink();
            }
        }
    }

    function updatePageChrome() {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
        progressBar.style.width = `${progress}%`;

        if (siteHeader) {
            siteHeader.classList.toggle("is-scrolled", window.scrollY > 8);
        }

        updateActiveNavigation();
    }

    function layoutNotes(force) {
        if (!board) {
            return;
        }

        const rect = board.getBoundingClientRect();
        const mobile = window.innerWidth < 720;
        const narrowMobile = window.innerWidth <= 540;
        const tablet = window.innerWidth >= 720 && window.innerWidth <= 1024;

        notes.forEach((note, index) => {
            if (note.dataset.userMoved === "true" && !force) {
                return;
            }

            let x = Number(note.dataset.x);
            let y = Number(note.dataset.y);

            let left;
            let top;

            if (mobile && narrowMobile) {
                const availableHeight = Math.max(0, rect.height - note.offsetHeight - 24);
                const step = notes.length > 1 ? availableHeight / (notes.length - 1) : 0;
                left = clamp((rect.width - note.offsetWidth) / 2, 14, rect.width - note.offsetWidth - 14);
                top = clamp(12 + step * index, 14, rect.height - note.offsetHeight - 14);
            } else if (mobile) {
                const col = index % 2;
                const row = Math.floor(index / 2);
                x = col === 0 ? 7 : 54;
                y = 4 + row * 20;
            } else if (tablet) {
                const col = index % 3;
                const row = Math.floor(index / 3);
                x = 6 + col * 31;
                y = 6 + row * 28;
            }

            if (left === undefined || top === undefined) {
                left = clamp((x / 100) * rect.width, 16, rect.width - note.offsetWidth - 16);
                top = clamp((y / 100) * rect.height, 16, rect.height - note.offsetHeight - 16);
            }

            note.style.left = `${left}px`;
            note.style.top = `${top}px`;
        });

        drawWires();
    }

    function noteCenter(note) {
        const boardRect = board.getBoundingClientRect();
        const noteRect = note.getBoundingClientRect();
        return {
            x: noteRect.left - boardRect.left + noteRect.width / 2,
            y: noteRect.top - boardRect.top + noteRect.height / 2
        };
    }

    function drawWires() {
        if (!board || !wireLayer) {
            return;
        }

        const rect = board.getBoundingClientRect();
        wireLayer.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
        wireLayer.innerHTML = "";

        wires.forEach(([from, to]) => {
            const fromNote = document.querySelector(`[data-note="${from}"]`);
            const toNote = document.querySelector(`[data-note="${to}"]`);
            if (!fromNote || !toNote) {
                return;
            }

            const start = noteCenter(fromNote);
            const end = noteCenter(toNote);
            const midX = (start.x + end.x) / 2;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`);
            wireLayer.appendChild(path);
        });
    }

    function closePopover(skipFall) {
        if (!activePopover) {
            return;
        }

        clearTimeout(fallTimer);
        const popover = activePopover;
        activePopover = null;

        if (skipFall || reducedMotion) {
            popover.remove();
            document.body.classList.remove("detail-open");
            return;
        }

        popover.classList.add("is-falling");
        window.setTimeout(() => {
            popover.remove();
            document.body.classList.remove("detail-open");
        }, 920);
    }

    function openPopover(noteName) {
        const template = document.getElementById(`detail-${noteName}`);
        if (!template) {
            return;
        }

        closePopover(true);

        const popover = document.createElement("aside");
        popover.className = "detail-popover";
        popover.setAttribute("role", "dialog");
        popover.setAttribute("aria-live", "polite");
        popover.innerHTML = '<button class="detail-close" type="button" aria-label="Close detail">&times;</button>';
        popover.appendChild(template.content.cloneNode(true));
        document.body.appendChild(popover);
        document.body.classList.add("detail-open");
        setModeCopy(popover);

        activePopover = popover;
        popover.querySelector(".detail-close").addEventListener("click", () => closePopover(false));
        popover.querySelectorAll("a[href^='#']").forEach((link) => {
            link.addEventListener("click", () => closePopover(true));
        });

        fallTimer = window.setTimeout(() => closePopover(false), 8000);
    }

    notes.forEach((note) => {
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let originLeft = 0;
        let originTop = 0;
        let moved = false;

        note.addEventListener("pointerdown", (event) => {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            originLeft = note.offsetLeft;
            originTop = note.offsetTop;
            moved = false;
            note.setPointerCapture(pointerId);
            note.classList.add("is-dragging");
            note.setAttribute("aria-grabbed", "true");
        });

        note.addEventListener("pointermove", (event) => {
            if (pointerId !== event.pointerId) {
                return;
            }

            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                moved = true;
            }

            const rect = board.getBoundingClientRect();
            const left = clamp(originLeft + dx, 12, rect.width - note.offsetWidth - 12);
            const top = clamp(originTop + dy, 12, rect.height - note.offsetHeight - 12);
            note.style.left = `${left}px`;
            note.style.top = `${top}px`;
            note.dataset.userMoved = "true";
            drawWires();
        });

        note.addEventListener("pointerup", (event) => {
            if (pointerId !== event.pointerId) {
                return;
            }

            note.releasePointerCapture(pointerId);
            note.classList.remove("is-dragging");
            note.setAttribute("aria-grabbed", "false");
            pointerId = null;

            if (!moved) {
                openPopover(note.dataset.note);
            }
        });

        note.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPopover(note.dataset.note);
            }
        });
    });

    if (navToggle && siteHeader) {
        navToggle.addEventListener("click", () => {
            const open = !siteHeader.classList.contains("is-nav-open");
            setNavOpen(open);
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            hapticsReady = true;
            setTheme(!isDarkTheme(), true);
        });
    }

    if (audioToggle) {
        audioToggle.addEventListener("click", () => {
            hapticsReady = true;
            toggleDarkAudioMute();
        });
    }

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            triggerSectionFeedback(link);
            setNavOpen(false);
        });
    });

    document.addEventListener("pointerdown", () => {
        hapticsReady = true;
    }, { once: true, passive: true });

    if (primaryNav) {
        primaryNav.addEventListener("pointerdown", () => {
            window.clearTimeout(navAutoHideTimer);
        }, { passive: true });

        primaryNav.addEventListener("pointerup", () => {
            if (siteHeader && siteHeader.classList.contains("is-nav-open") && compactNavigation.matches) {
                navAutoHideTimer = window.setTimeout(() => setNavOpen(false), 6000);
            }
        }, { passive: true });
    }

    document.addEventListener("click", (event) => {
        if (!siteHeader || !siteHeader.classList.contains("is-nav-open")) {
            return;
        }

        if (!siteHeader.contains(event.target)) {
            setNavOpen(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closePopover(true);
            setNavOpen(false);
        }
    });

    document.querySelectorAll(".education-details").forEach((details) => {
        const summary = details.querySelector("summary");
        const body = details.querySelector(".education-detail-body");
        if (!summary || !body || reducedMotion) {
            return;
        }

        body.style.height = details.open ? "auto" : "0px";
        body.style.opacity = details.open ? "1" : "0";

        summary.addEventListener("click", (event) => {
            event.preventDefault();
            if (details.dataset.animating === "true") {
                return;
            }

            if (details.open) {
                closeEducationDetails(details, body);
            } else {
                openEducationDetails(details, body);
            }
        });
    });

    function openEducationDetails(details, body) {
        details.open = true;
        body.style.height = "0px";
        body.style.opacity = "0";
        body.style.transition = "none";

        requestAnimationFrame(() => {
            body.style.transition = "height 360ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease";
            body.style.height = `${body.scrollHeight}px`;
            body.style.opacity = "1";
            details.dataset.animating = "true";
        });

        body.addEventListener("transitionend", function handleOpen(event) {
            if (event.propertyName !== "height") {
                return;
            }
            body.style.height = "auto";
            body.style.transition = "";
            delete details.dataset.animating;
            body.removeEventListener("transitionend", handleOpen);
        });
    }

    function closeEducationDetails(details, body) {
        body.style.height = `${body.scrollHeight}px`;
        body.style.opacity = "1";
        body.style.transition = "none";

        requestAnimationFrame(() => {
            body.style.transition = "height 320ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease";
            body.style.height = "0px";
            body.style.opacity = "0";
            details.dataset.animating = "true";
        });

        body.addEventListener("transitionend", function handleClose(event) {
            if (event.propertyName !== "height") {
                return;
            }
            details.open = false;
            body.style.transition = "";
            delete details.dataset.animating;
            body.removeEventListener("transitionend", handleClose);
        });
    }

    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            if (window.innerWidth > 1024) {
                setNavOpen(false);
            }
            layoutNotes(false);
            drawWires();
            updateActiveNavigation();
        });
    });

    window.addEventListener("scroll", () => {
        updatePageChrome();
        if (compactNavigation.matches && siteHeader && siteHeader.classList.contains("is-nav-open") && Math.abs(window.scrollY - navOpenedAtScrollY) > 6) {
            setNavOpen(false);
        }
    }, { passive: true });

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.14, rootMargin: "0px 0px -80px 0px" });

        document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    } else {
        document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    }

    document.querySelectorAll("[data-carousel]").forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll("img"));
        if (!slides.length) {
            return;
        }

        let index = 0;
        slides[0].classList.add("is-active");

        if (slides.length === 1 || reducedMotion) {
            return;
        }

        window.setInterval(() => {
            slides[index].classList.remove("is-active");
            index = (index + 1) % slides.length;
            slides[index].classList.add("is-active");
        }, 3600);
    });

    window.addEventListener("load", () => {
        layoutNotes(true);
        updatePageChrome();
    });

    loadAudioPreference();
    if (darkAudio) {
        darkAudio.volume = 0;
        darkAudio.loop = true;
        audioNeedsGesture = isDarkTheme() && !audioMuted;
    }

    layoutNotes(true);
    updateThemeToggle();
    setModeCopy();
    updateAudioToggle();
    layoutNotes(true);
    updatePageChrome();
    window.setTimeout(() => showThemeCallout(5000), 900);
})();

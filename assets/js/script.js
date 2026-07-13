const documentHeight = () => {
    const doc = document.documentElement;
    doc.style.setProperty("--doc-height", `${window.innerHeight}px`);
};

const slider = () => {
    const slider = document.getElementById("slider");
    const sliderTrack = slider.querySelector(".slider-track");
    const slides = sliderTrack.querySelectorAll(".slide");
    const sliderClose = slider.querySelector(".slider-close");
    const tabs = document.querySelectorAll(".sidebar-tab");

    // Honour reduced-motion: fall back to instant show/hide with no tweens.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let isOpen = false;
    let openTween = null;

    // Reveal the contents of a slide with a soft, staggered rise.
    const revealSlide = (target) => {
        if (!target || reduceMotion) return;
        gsap.fromTo(
            target.children,
            { autoAlpha: 0, y: 24 },
            { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.08, delay: 0.15 }
        );
    };

    // Smoothly glide the track to the requested slide.
    const scrollToSlide = (target) => {
        if (!target) return;
        gsap.to(sliderTrack, {
            scrollLeft: target.offsetLeft,
            duration: 0.7,
            ease: "power3.inOut",
        });
    };

    const openSlider = (index) => {
        const target = document.getElementById(`slide-${index}`);

        if (isOpen) {
            // Already open — just slide across to the chosen panel.
            scrollToSlide(target);
            revealSlide(target);
            return;
        }

        isOpen = true;
        slider.hidden = false;
        // Jump the track to the target before the panel slides in.
        if (target) sliderTrack.scrollLeft = target.offsetLeft;

        if (reduceMotion) {
            gsap.set(slider, { xPercent: 0 });
            return;
        }

        openTween = gsap.fromTo(
            slider,
            { xPercent: 100, x: 0 },
            { xPercent: 0, x: 0, duration: 0.6, ease: "power3.out", onComplete: () => revealSlide(target) }
        );
    };

    const closeSlider = () => {
        if (!isOpen) return;
        openTween?.kill();

        const finish = () => {
            slider.hidden = true;
            isOpen = false;
        };

        if (reduceMotion) {
            gsap.set(slider, { xPercent: 100 });
            finish();
            return;
        };

        gsap.to(slides.children, {
            autoAlpha: 0,
            y: 24,
            onComplete: finish,
        });

        gsap.to(slider, {
            xPercent: 100,
            duration: 0.5,
            ease: "power3.in",
            onComplete: finish,
        });

    };

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            [...tabs].filter(i => i !== tab).forEach(i => i.classList.remove("open"));
            tab.classList.add("open");
            openSlider(tab.dataset.slide);
        });
    });

    sliderClose.addEventListener("click", () => {
        closeSlider();
        tabs.forEach((tab) => tab.classList.remove("open"));
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isOpen) {
            closeSlider();
            tabs.forEach((tab) => tab.classList.remove("open"));
        }
    });
};

const backgroundParallax = () => {
    // Respect users who prefer reduced motion — skip the effect entirely.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const range = 50; // max shift in px, in each direction
    let tx = 0, ty = 0; // target offset (-0.5..0.5 from center)
    let cx = 0, cy = 0; // current, eased offset
    let rafId = null;

    const tick = () => {
        // Ease the current offset toward the cursor for a gentle, gooey follow.
        cx += (tx - cx) * 0.05;
        cy += (ty - cy) * 0.05;
        root.style.setProperty("--bg-px", `${(cx * range).toFixed(2)}px`);
        root.style.setProperty("--bg-py", `${(cy * range).toFixed(2)}px`);

        // Keep ticking until we've essentially caught up, then idle.
        if (Math.abs(tx - cx) > 0.0005 || Math.abs(ty - cy) > 0.0005) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
        }
    };

    window.addEventListener("mousemove", (e) => {
        tx = e.clientX / window.innerWidth - 0.5;
        ty = e.clientY / window.innerHeight - 0.5;
        if (rafId === null) rafId = requestAnimationFrame(tick);
    });
};

window.addEventListener("load", () => {
    history.scrollRestoration = "manual";
    documentHeight();
    slider();
    // backgroundParallax();
});

window.addEventListener("resize", () => {
    documentHeight();
});
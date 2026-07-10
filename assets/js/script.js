const documentHeight = () => {
    const doc = document.documentElement;
    doc.style.setProperty("--doc-height", `${window.innerHeight}px`);
};

const slider = () => {
    const slider = document.getElementById("slider");
    const sliderTrack = slider.querySelector(".slider-track");
    const sliderClose = slider.querySelector(".slider-close");
    const tabs = document.querySelectorAll(".sidebar-tab");

    const openSlider = (index) => {
        slider.hidden = false;
        // Wait a frame so the element is laid out (still translated off-screen)
        // before adding .open, so the transform transition actually runs.
        requestAnimationFrame(() => {
            slider.classList.add("open");
            const target = document.getElementById(`slide-${index}`);
            if (target) target.scrollIntoView({ behavior: "auto", inline: "start" });
        });
    }

    const closeSlider = () => {
        slider.classList.remove("open");
        // Slide back out to the right, then hide once the transition ends.
        slider.addEventListener("transitionend", () => {
            slider.hidden = true;
        }, { once: true });
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", (e) => {
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
        if (e.key === "Escape" && !slider.hidden) closeSlider();
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
    documentHeight();
    slider();
    // backgroundParallax();
});

window.addEventListener("resize", () => {
    documentHeight();
});
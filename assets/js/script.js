gsap.registerPlugin(ScrollTrigger);

const documentHeight = () => {
    const doc = document.documentElement;
    doc.style.setProperty("--doc-height", `${window.innerHeight}px`);
};

const handleSections = () => {
    const sections = [...document.querySelectorAll(".section")];
    if (!sections.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // The deck has one slot per section. Slot 0 is the right-most, front-most card;
    // every slot after it sits 5rem further left, which is exactly the width of a tab —
    // so a card can never cover the tab of the card behind it.
    let slotWidth = 0;
    const measure = () => {
        slotWidth = parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;
    };
    const slotX = (slot) => -slot * slotWidth;

    // The active card owns slot 0; the rest keep their DOM order in the slots behind it.
    const slotOf = (section, active) => {
        const rest = sections.filter((s) => s !== active);
        return section === active ? 0 : rest.indexOf(section) + 1;
    };

    // Lay the deck out. `animate` is false on load and on resize, true on a click.
    const layout = (active, animate) => {
        sections.forEach((section) => {
            const slot = slotOf(section, active);
            // Front-most card needs the highest z-index, so count down from the back.
            gsap.set(section, { zIndex: sections.length - slot, transformOrigin: "left center" });
            if (section === active || !animate) {
                gsap.set(section, { x: slotX(slot) });
            } else {
                gsap.to(section, { x: slotX(slot), duration: 0.6, ease: "power3.out" });
            }
        });
    };

    const activate = (section) => {
        if (section.classList.contains("current")) return;

        sections.forEach((s) => s.classList.toggle("current", s === section));
        section.scrollTop = 0;

        if (reduced) {
            layout(section, false);
            return;
        }

        // The other cards slide across to their new slots while the clicked one
        // rises out of the deck: a short push right, then an ease back into slot 0.
        layout(section, true);
        gsap.timeline()
            .fromTo(section,
                { x: slotX(0) + 64, scale: 0.98 },
                { x: slotX(0), scale: 1, duration: 0.7, ease: "power3.out" })
            .fromTo(section.querySelectorAll(".section-header, .section-content > *"),
                { y: 24, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "all" },
                0.15);
    };

    // Each card is its own scroll container. Once a card's header has scrolled past
    // its top edge, the card wears `.scrolled` and the CSS fades its tab back in.
    sections.forEach((section) => {
        const header = section.querySelector(".section-header");
        if (!header) return;

        let ticking = false;
        const update = () => {
            ticking = false;
            // offsetTop is measured against .section itself, which is the offset parent.
            const headerBottom = header.offsetTop + header.offsetHeight;
            section.classList.toggle("scrolled", section.scrollTop >= headerBottom);
        };

        section.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        }, { passive: true });

        update();
    });

    measure();
    layout(sections.find((s) => s.classList.contains("current")) || sections[0], false);

    document.querySelector(".main").addEventListener("click", (e) => {
        const wrapper = e.target.closest(".section-nav-wrapper");
        if (wrapper) activate(wrapper.closest(".section"));
    });

    // Slot width is in rem, so it only changes if the root font size does.
    window.addEventListener("resize", () => {
        measure();
        layout(document.querySelector(".section.current") || sections[0], false);
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
    handleSections();
});

window.addEventListener("resize", () => {
    documentHeight();
});
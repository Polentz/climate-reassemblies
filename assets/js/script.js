gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

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

const handleCollection = () => {
    const EXCERPT_LENGTH = 500;
    const STORAGE_KEY = "climate-reassemblies.collection";

    // Only the source ids are stored — every item is rebuilt from the page on load,
    // so edits to the copy show up in a collection saved before the edit.
    const readStore = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(stored) ? stored : [];
        } catch {
            return [];
        }
    };

    const writeStore = (ids) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch {
            // Private browsing and full quotas both throw here. The collection still
            // works for this visit; it just won't come back after a refresh.
        }
    };

    const excerpt = (text, limit = EXCERPT_LENGTH) => {
        const clean = text.replace(/\s+/g, " ").trim();
        if (clean.length <= limit) return clean;
        const cut = clean.slice(0, limit);
        // Back up to the last space so the excerpt never ends mid-word.
        return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
    };

    const container = document.querySelector("#collection-container");
    const template = document.querySelector("#collection-item-template");
    if (!container || !template) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const plainText = (el) => el.textContent.replace(/\s+/g, " ").trim();

    // A collected text item shows a 500-character excerpt and stashes both versions,
    // so clicking its header can swap between them. Copy that already fits gets no toggle.
    const fillText = (source, content, item) => {
        const blocks = [...source.querySelectorAll("h3, p, blockquote")]
            .filter((el) => !el.closest(".interactive-item"))
            // A quotation's attribution is a <p> nested in the blockquote. The blockquote
            // brings it along, so picking it up on its own would print it twice.
            .filter((el) => el.tagName === "BLOCKQUOTE" || !el.closest("blockquote"))
            .filter((el) => plainText(el));

        // Quotes keep their own markup so they still read as quotes in the collection;
        // everything else is flattened to a paragraph.
        const full = blocks
            .map((el) => (el.tagName === "BLOCKQUOTE" ? el.outerHTML : `<p>${plainText(el)}</p>`))
            .join("");

        const text = blocks.map(plainText).join(" ");
        if (text.length <= EXCERPT_LENGTH) {
            content.innerHTML = full;
            return;
        }

        const short = `<p>${excerpt(text)}</p>`;
        content.innerHTML = short;
        content.dataset.full = full;
        content.dataset.excerpt = short;
        content.classList.add("text-style-p");

        const toggle = item.querySelector(".interactive-item");
        toggle.setAttribute("role", "button");
        toggle.setAttribute("tabindex", "0");
        toggle.setAttribute("aria-expanded", "false");
    };

    // An image item shows a thumbnail of the source image — same file, sized down by CSS.
    const fillImage = (source, content) => {
        const image = source.querySelector("img");
        if (!image) return;

        // const caption = source.querySelector("figcaption")?.textContent.trim();

        const thumbnail = document.createElement("img");
        thumbnail.className = "collection-thumbnail";
        thumbnail.src = image.getAttribute("src");
        thumbnail.alt = image.getAttribute("alt") || "";
        thumbnail.loading = "lazy";
        content.append(thumbnail);

        // if (!caption) return;
        // const figcaption = document.createElement("p");
        // figcaption.className = "text-style-caption";
        // figcaption.textContent = caption;
        // content.append(figcaption);
    };

    const collect = (source) => {
        const item = template.content.firstElementChild.cloneNode(true);
        const { type = "", category = "" } = source.dataset;

        item.dataset.type = type;
        item.querySelector("[data-label='category']").textContent = category;
        item.querySelector("[data-label='type']").textContent = type;

        // data-type names the section the source came from, so the medium is read off
        // the markup instead: carry an image and you get a thumbnail, otherwise text.
        const content = item.querySelector(".collection-content");
        if (source.querySelector("img")) {
            fillImage(source, content);
        } else {
            fillText(source, content, item);
        }

        container.append(item);
        return item;
    };

    const revealItem = (item) => {
        if (reduced) return;

        // Unroll the card from nothing, then let its contents settle in behind it.
        gsap.timeline({ onComplete: () => gsap.set(item, { clearProps: "all" }) })
            .from(item, {
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                opacity: 0,
                overflow: "hidden",
                duration: 0.55,
                ease: "power3.out",
            })
            .from(item.children,
                { opacity: 0, y: 16, duration: 0.4, stagger: 0.1, ease: "power2.out" },
                "-=0.2");
    };

    const toggleExcerpt = (item) => {
        const content = item.querySelector(".collection-content");
        const toggle = item.querySelector(".interactive-item");
        if (!content?.dataset.full) return;

        const expanded = item.classList.toggle("expanded");
        toggle.setAttribute("aria-expanded", String(expanded));

        // Measure the height we're leaving, swap the copy, then measure the height
        // we're heading to — gsap animates between the two.
        const from = content.offsetHeight;
        content.innerHTML = expanded ? content.dataset.full : content.dataset.excerpt;

        if (reduced) return;

        gsap.set(content, { height: "auto" });
        const to = content.offsetHeight;

        gsap.fromTo(content,
            { height: from },
            { height: to, duration: 0.6, ease: "power3.inOut", overwrite: true, clearProps: "height" });
        gsap.fromTo(content.children,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", delay: 0.12, clearProps: "all" });
    };

    container.addEventListener("click", (e) => {
        const toggle = e.target.closest(".interactive-item");
        if (toggle) toggleExcerpt(toggle.closest(".collection-item"));
    });

    container.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const toggle = e.target.closest(".interactive-item");
        if (!toggle) return;
        e.preventDefault(); // Space would otherwise scroll the card.
        toggleExcerpt(toggle.closest(".collection-item"));
    });

    const markCollected = (source) => {
        source.dataset.collected = "true";
        const button = source.querySelector("[data-action='add-to-slide']");
        if (button) button.textContent = "Collected";
    };

    // Rebuild the saved collection, dropping any id whose source is no longer on the
    // page, then write the surviving ids back so the stale ones don't linger in storage.
    const restore = () => {
        const restored = readStore().filter((id) => {
            const source = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
            if (!source || source.dataset.collected === "true") return false;
            markCollected(source);
            collect(source);
            return true;
        });
        writeStore(restored);
        return restored;
    };

    const collected = restore();

    // Collecting is delegated from the page, so any source added later works for free.
    // The asterisk and the "Collect" button are the same gesture — either one collects.
    document.querySelector(".main").addEventListener("click", (e) => {
        const trigger = e.target.closest(".interactive-icon, [data-action='add-to-slide']");
        if (!trigger || container.contains(trigger)) return;

        // The asterisk in the intro copy is decorative: it sits in no source, so it collects nothing.
        const source = trigger.closest("[data-id]");
        if (!source || source.dataset.collected === "true") return;

        markCollected(source);
        revealItem(collect(source));

        collected.push(source.dataset.id);
        writeStore(collected);
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
    handleCollection();
});

window.addEventListener("resize", () => {
    documentHeight();
});
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

    // Nothing on the page is its own scroller any more: the window is, and the current card
    // is pinned in front of it. Scrolling the window drags that card's content up through
    // it, and the moment the content runs out the deck unpins and the very same gesture
    // keeps going into the footer. One scroller means the browser never has to hand a
    // scroll from one box to another — which is what made the footer feel like a second,
    // separate movement.
    const root = document.documentElement;
    const currentSection = () => document.querySelector(".section.current") || sections[0];
    const wrapperOf = (section) => section.querySelector(".section-layout-wrapper");

    // How far the current card's content has to travel. That distance, handed to the CSS,
    // is exactly the extra height the deck gets — so the page runs out of scroll at the
    // same instant the content does, and there is never a stretch of scrolling that does
    // nothing. A card that already fits gets 0 and the footer sits right below it.
    let travel = 0;
    const measureScroll = () => {
        const section = currentSection();
        travel = Math.max(0, wrapperOf(section).offsetHeight - section.clientHeight);
        root.style.setProperty("--scroll-length", `${travel}px`);
    };

    const applyScroll = () => {
        const section = currentSection();
        const offset = Math.min(window.scrollY, travel);
        gsap.set(wrapperOf(section), { y: -offset });

        // The tab fades back in once the header has gone past the top of the card. The
        // card has no scrollTop to read now, so the offset we just applied stands in for it.
        const header = section.querySelector(".section-header");
        if (!header) return;
        const headerBottom = header.offsetTop + header.offsetHeight - 100;
        section.classList.toggle("scrolled", offset >= headerBottom);
    };

    // Switching cards hands the page's scroll to a different piece of content, so the old
    // card's content is put back where it started and the runway is re-cut for the new one.
    const resetScroll = () => {
        sections.forEach((section) => {
            if (section === currentSection()) return;
            gsap.set(wrapperOf(section), { y: 0 });
            section.classList.remove("scrolled");
        });
        measureScroll();
        applyScroll();
    };

    let scrolling = false;
    window.addEventListener("scroll", () => {
        if (scrolling) return;
        scrolling = true;
        requestAnimationFrame(() => {
            scrolling = false;
            applyScroll();
        });
    }, { passive: true });

    // The card's content changes height under us — collection items open and close, images
    // arrive late, cards get collected and removed. Each of those changes how much runway
    // the page needs, so the deck is re-cut whenever it happens rather than only on resize.
    const observer = new ResizeObserver(() => {
        measureScroll();
        applyScroll();
    });
    sections.forEach((section) => observer.observe(wrapperOf(section)));

    const activate = (section) => {
        if (section.classList.contains("current")) return;

        sections.forEach((s) => s.classList.toggle("current", s === section));

        // A new card starts at its top, and the page's scroll is that card's scroll now —
        // so the window goes back to 0 with it. Jumped, not smoothed: the card is already
        // playing an entrance animation, and a scroll tween underneath it would fight that.
        window.scrollTo({ top: 0, behavior: "auto" });
        resetScroll();

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
            const headerBottom = header.offsetTop + header.offsetHeight - 150;
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
    resetScroll();

    document.querySelector(".main").addEventListener("click", (e) => {
        const wrapper = e.target.closest(".section-nav-wrapper");
        if (wrapper) activate(wrapper.closest(".section"));
    });

    // Slot width is in rem, so it only changes if the root font size does. The runway is a
    // different matter: a narrower window reflows the copy taller, so it is re-cut here too.
    window.addEventListener("resize", () => {
        measure();
        layout(currentSection(), false);
        measureScroll();
        applyScroll();
    });
};

const handleCollection = async () => {
    const EXCERPT_LENGTH = 500;
    const STORAGE_KEY = "climate-reassemblies.collection";

    // A source only exists in the markup of the page that declares it, so an entry names
    // its page alongside its id: to show the whole collection on every page, a page has to
    // be able to go and fetch the markup of the ones it isn't.
    const PAGE = location.pathname.split("/").pop() || "index.html";

    // Nothing but ids is stored — every item is rebuilt from its source, so edits to the
    // copy show up in a collection saved before the edit.
    const readStore = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (!Array.isArray(stored)) return [];
            // Collections saved before the site had a second page are bare ids with no
            // page to attribute them to, so they are dropped rather than guessed at.
            return stored.filter((entry) => typeof entry?.id === "string" && typeof entry?.page === "string");
        } catch {
            return [];
        }
    };

    const writeStore = (entries) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
        } catch {
            // Private browsing and full quotas both throw here. The collection still
            // works for this visit; it just won't come back after a refresh.
        }
    };

    // The site's other pages, taken off its own nav — a page added to the nav later is
    // reachable here for free.
    const pages = new Set([PAGE, ...[...document.querySelectorAll("a[href$='.html']")]
        .map((link) => new URL(link.href, location.href))
        .filter((url) => url.origin === location.origin)
        .map((url) => url.pathname.split("/").pop())]);

    // Each page's markup is parsed once and held, so restoring twenty items off another
    // page costs one request, not twenty. A page that can't be fetched — the site opened
    // straight off the filesystem, a request that fails — resolves to null, and its
    // entries are left alone rather than treated as gone.
    const documents = new Map([[PAGE, document]]);
    const fetches = new Map();

    const loadPage = (page) => {
        // Storage is the user's to edit, so only a page the site itself links to is fetched.
        if (!pages.has(page)) return Promise.resolve(null);
        if (documents.has(page)) return Promise.resolve(documents.get(page));
        if (fetches.has(page)) return fetches.get(page);

        const pending = fetch(page)
            .then((response) => (response.ok ? response.text() : Promise.reject(response.status)))
            .then((html) => {
                const parsed = new DOMParser().parseFromString(html, "text/html");
                documents.set(page, parsed);
                return parsed;
            })
            .catch(() => null);

        fetches.set(page, pending);
        return pending;
    };

    // Collected items carry their source id too, so rule them out of the lookup.
    const sourceOf = (id, doc = document) => doc.querySelector(`[data-id="${CSS.escape(id)}"]:not(.collection-item)`);

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

    // Marks an item's header as the thing you click to reveal the rest of it. The CSS
    // hangs the pointer cursor and the arrow rotation off aria-expanded, so an item
    // with nothing to reveal never gets this and stays inert.
    const enableToggle = (item) => {
        const toggle = item.querySelector(".interactive-item");
        toggle.setAttribute("role", "button");
        toggle.setAttribute("tabindex", "0");
        toggle.setAttribute("aria-expanded", "false");
    };

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
            .map((el) => (el.tagName === "BLOCKQUOTE" ? el.outerHTML : `<p class="text-style-p">${plainText(el)}</p>`))
            .join("");

        const text = blocks.map(plainText).join(" ");
        if (text.length <= EXCERPT_LENGTH) {
            content.innerHTML = full;
            return;
        }

        const short = `<p class="text-style-p">${excerpt(text)}</p>`;
        content.innerHTML = short;
        content.dataset.full = full;
        content.dataset.excerpt = short;

        enableToggle(item);
    };

    // A media item shows a thumbnail of the source image or video — the same file, sized
    // down by CSS. Its header opens the thumbnail out to the full width of the card. The
    // thumbnail is a plain looping video, not the player: a card is something you look at
    // and reorder, and a second set of controls in it would just fight the drag.
    const fillMedia = (source, media, content, item, page) => {
        enableToggle(item);

        const video = media.tagName === "VIDEO";
        const thumbnail = document.createElement(video ? "video" : "img");
        thumbnail.className = "collection-thumbnail";
        // The source's src is written relative to the page it sits on, which is not
        // necessarily the page doing the rendering, so it is resolved against its own.
        thumbnail.src = new URL(media.getAttribute("src"), new URL(page, location.href)).href;

        if (video) {
            // Muted is what buys the autoplay: a browser will refuse to start a video that
            // could make noise. Set as attributes as well as properties, since Safari reads
            // muted and playsinline off the markup when it decides whether to allow it.
            ["autoplay", "muted", "loop", "playsinline", "disablepictureinpicture"]
                .forEach((attribute) => thumbnail.setAttribute(attribute, ""));
            thumbnail.muted = true;

            // A silent clip says little about itself, so the video keeps the heading it
            // was filed under. It stands above the thumbnail and stays there, expanded or
            // not — unlike the caption, which only comes out with the enlarged media.
            const heading = source.querySelector("h3")?.textContent.trim();
            if (heading) {
                const title = document.createElement("h3");
                title.className = "collection-title text-style-h3";
                title.textContent = heading;
                content.append(title);
            }
        } else {
            thumbnail.alt = media.getAttribute("alt") || "";
            thumbnail.loading = "lazy";
        }

        // Media drags itself by default, which would hijack the card's own drag.
        thumbnail.draggable = false;
        content.append(thumbnail);

        const caption = source.querySelector("figcaption")?.textContent.trim();
        if (!caption) return;

        // The caption rides along with the enlarged image, so it starts out of the flow.
        const figcaption = document.createElement("p");
        figcaption.className = "collection-caption text-style-caption";
        figcaption.textContent = caption;
        figcaption.hidden = true;
        content.append(figcaption);
    };

    // `source` can belong to a page other than this one — it is only ever read from, so a
    // source parsed out of fetched markup builds exactly the same card as a live one.
    const collect = (source, page) => {
        const item = template.content.firstElementChild.cloneNode(true);
        const { type = "", category = "" } = source.dataset;

        // The item carries its source id and page, so the running order can be read
        // straight off the DOM after a drag and written back to storage.
        item.dataset.id = source.dataset.id;
        item.dataset.page = page;
        item.dataset.type = type;
        item.querySelector("[data-label='category']").textContent = category;
        item.querySelector("[data-label='type']").textContent = type;

        const content = item.querySelector(".collection-content");
        const media = source.querySelector("img, video");
        if (media) {
            fillMedia(source, media, content, item, page);
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
            // Only what is on show at rest gets tweened. Anything waiting on a hover — the
            // remove button, the arrow — rests at opacity 0, and a `from` tween would end by
            // pinning that 0 into the inline style, where it outranks the hover rule and the
            // thing could never appear at all.
            .from(item.querySelectorAll(".collection-header, .collection-content"),
                { opacity: 0, y: 16, duration: 0.4, stagger: 0.1, ease: "power2.out", clearProps: "all" },
                "-=0.2");
    };

    // Expanded, the thumbnail fills the card and the caption appears beneath it; collapsed,
    // the image falls back to the max-width the stylesheet gives it and the caption leaves
    // the flow. Only the width is animated — the height follows the aspect ratio on its
    // own, so the card grows with it.
    const growThumbnail = (content, expanded) => {
        const thumbnail = content.querySelector(".collection-thumbnail");
        const caption = content.querySelector(".collection-caption");
        const from = thumbnail.getBoundingClientRect().width;

        gsap.set(thumbnail, expanded ? { maxWidth: "100%" } : { clearProps: "maxWidth" });
        if (caption && (expanded || reduced)) caption.hidden = !expanded;

        if (reduced) return;

        const to = thumbnail.getBoundingClientRect().width;
        gsap.fromTo(thumbnail,
            { width: from },
            { width: to, duration: 0.6, ease: "power3.inOut", overwrite: true, clearProps: "width" });

        if (!caption) return;

        // Coming in, the caption waits for the image to make room for it; going out, it
        // clears off first and only leaves the flow once it has faded.
        if (expanded) {
            gsap.fromTo(caption,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, delay: 0.25, ease: "power2.out", clearProps: "all" });
        } else {
            gsap.to(caption, {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: "power2.in",
                onComplete: () => {
                    caption.hidden = true;
                    gsap.set(caption, { clearProps: "all" });
                },
            });
        }
    };

    // The copy swap: measure the height we're leaving, swap the copy, then measure the
    // height we're heading to — gsap animates between the two.
    const swapCopy = (content, expanded) => {
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

    const toggleItem = (item) => {
        const toggle = item.querySelector(".interactive-item");
        // Only items that were given a toggle have something to reveal.
        if (toggle.getAttribute("aria-expanded") === null) return;

        const content = item.querySelector(".collection-content");
        const expanded = item.classList.toggle("expanded");
        toggle.setAttribute("aria-expanded", String(expanded));

        if (content.querySelector(".collection-thumbnail")) {
            growThumbnail(content, expanded);
        } else {
            swapCopy(content, expanded);
        }
    };

    container.addEventListener("click", (e) => {
        const toggle = e.target.closest(".interactive-item");
        if (toggle) toggleItem(toggle.closest(".collection-item"));
    });

    container.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const toggle = e.target.closest(".interactive-item");
        if (!toggle) return;
        e.preventDefault(); // Space would otherwise scroll the card.
        toggleItem(toggle.closest(".collection-item"));
    });

    const markCollected = (source) => {
        source.dataset.collected = "true";
        const button = source.querySelector("[data-action='add-to-collection']");
        if (button) button.textContent = "Collected";
        if (button) button.style.pointerEvents = "none";
        if (button) button.classList.add("collected");
    };

    // Hand the source back: its asterisk can collect it again.
    const releaseSource = (id) => {
        const source = sourceOf(id);
        if (!source) return;

        delete source.dataset.collected;
        const button = source.querySelector("[data-action='add-to-collection']");
        if (button) button.textContent = "Collect";
        if (button) button.style.pointerEvents = "all";
        if (button) button.classList.remove("collected");
    };

    // Entries whose page could not be fetched, held at the index they occupied. They have
    // no card on this page to read an order back off, so they are carried, not rebuilt.
    const orphans = [];

    // Rebuild the whole collection, whichever pages it was gathered from: an entry's source
    // is looked up in its own page's markup, fetched if that page isn't this one. An entry
    // is only stale — and only then dropped — if its page loaded and no longer holds it.
    const restore = async () => {
        const entries = readStore();
        const docs = await Promise.all(entries.map((entry) => loadPage(entry.page)));

        const kept = entries.filter((entry, index) => {
            const doc = docs[index];
            if (!doc) {
                orphans.push({ index, entry });
                return true;
            }

            const source = sourceOf(entry.id, doc);
            if (!source || source.dataset.collected === "true") return false;

            // Marking the source of a fetched page has no visible effect — nobody is
            // looking at it — but it still guards the same id being restored twice.
            markCollected(source);
            collect(source, entry.page);
            return true;
        });

        writeStore(kept);
    };

    await restore();

    // Storage holds the running order, so re-read it off the DOM whenever that changes.
    // Every collected item has a card here now, so the DOM is the order, in full.
    const saveOrder = () => {
        const entries = [...container.children]
            .map((item) => ({ id: item.dataset.id, page: item.dataset.page }));

        orphans.forEach(({ index, entry }) => entries.splice(index, 0, entry));
        writeStore(entries);
    };

    // Roll the card up and take it out of the list. Because it collapses in the flow, the
    // cards below it close the gap as it goes rather than jumping once it's gone.
    const removeItem = (item) => {
        const done = () => {
            // The card is flat by now, but the list's 2rem gap still sits where it was.
            // Taking it out through slideIntoPlace lets the cards below close that too.
            slideIntoPlace(() => item.remove());
            releaseSource(item.dataset.id);
            saveOrder();
        };

        if (reduced) {
            done();
            return;
        }

        gsap.to(item, {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginBottom: 0,
            opacity: 0,
            overflow: "hidden",
            duration: 0.45,
            ease: "power3.inOut",
            overwrite: true,
            onComplete: done,
        });
    };

    container.addEventListener("click", (e) => {
        const remove = e.target.closest("[data-action='remove']");
        if (remove) removeItem(remove.closest(".collection-item"));
    });

    // Reorder by dragging. The card follows the cursor as the browser's drag image; what
    // moves in the DOM is the real card, slotting in wherever the cursor currently is.
    let dragged = null;

    // The card the cursor is above the top half of — the one to drop in front of.
    // Nothing means the cursor is past the last card, so the drop goes at the end.
    const cardAfter = (y) => [...container.children]
        .filter((item) => item !== dragged)
        .find((item) => {
            const box = item.getBoundingClientRect();
            return y < box.top + box.height / 2;
        }) ?? null;

    // Run a DOM move, then walk the cards back from where they were to where they now are
    // and let gsap play that gap out — so they slide aside instead of snapping.
    const slideIntoPlace = (move) => {
        const cards = [...container.children];
        const before = new Map(cards.map((card) => [card, card.getBoundingClientRect().top]));

        move();
        if (reduced) return;

        cards.forEach((card) => {
            // The dragged card is already under the cursor; animating it would fight that.
            // A card the move took out of the list has nowhere to slide to.
            if (card === dragged || !card.isConnected) return;

            const delta = before.get(card) - card.getBoundingClientRect().top;
            if (!delta) return;

            gsap.fromTo(card, { y: delta }, {
                y: 0,
                duration: 0.35,
                ease: "power2.out",
                overwrite: true,
                // The card's CSS transition on transform would smear gsap's per-frame
                // writes, so it stands down until the tween is finished.
                onStart: () => card.classList.add("settling"),
                onComplete: () => {
                    card.classList.remove("settling");
                    gsap.set(card, { clearProps: "transform" });
                },
            });
        });
    };

    container.addEventListener("dragstart", (e) => {
        dragged = e.target.closest(".collection-item");
        if (!dragged) return;

        e.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag unless the transfer carries something.
        e.dataTransfer.setData("text/plain", dragged.dataset.id ?? "");
        // Held to the next frame so the browser snapshots the card at full strength.
        requestAnimationFrame(() => dragged?.classList.add("dragging"));
    });

    container.addEventListener("dragover", (e) => {
        if (!dragged) return;
        e.preventDefault(); // Without this the container refuses the drop.
        e.dataTransfer.dropEffect = "move";

        const next = cardAfter(e.clientY);
        if (next === dragged.nextElementSibling || next === dragged) return;
        slideIntoPlace(() => container.insertBefore(dragged, next));
    });

    // The drop itself is already done — the card moved on dragover. This just stops the
    // browser treating the drag as a navigation.
    container.addEventListener("drop", (e) => e.preventDefault());

    container.addEventListener("dragend", () => {
        if (!dragged) return;
        dragged.classList.remove("dragging");
        dragged = null;
        saveOrder();
    });

    // Collecting is delegated from the page, so any source added later works for free.
    // The asterisk and the "Collect" button are the same gesture — either one collects.
    document.querySelector(".main").addEventListener("click", (e) => {
        const trigger = e.target.closest(".interactive-icon, [data-action='add-to-collection']");
        if (!trigger || container.contains(trigger)) return;

        // The asterisk in the intro copy is decorative: it sits in no source, so it collects nothing.
        const source = trigger.closest("[data-id]");
        if (!source || source.dataset.collected === "true") return;

        markCollected(source);
        revealItem(collect(source, PAGE));
        saveOrder();
    });
};

const handleVideoPlayers = () => {
    const players = [...document.querySelectorAll(".video-player")];
    if (!players.length) return;

    const clock = (seconds) => {
        // Duration is NaN until the browser has read the file's metadata.
        if (!Number.isFinite(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const rest = Math.floor(seconds % 60);
        return `${minutes}:${String(rest).padStart(2, "0")}`;
    };

    players.forEach((player) => {
        const video = player.querySelector("video");
        const playButton = player.querySelector("[data-action='toggle-play']");
        const muteButton = player.querySelector("[data-action='toggle-mute']");
        const fullscreenButton = player.querySelector("[data-action='toggle-fullscreen']");
        const scrub = player.querySelector(".video-scrub");
        const time = player.querySelector(".video-time");
        if (!video) return;

        // While the thumb is being dragged it belongs to the user, so playback stops
        // writing to it until they let go.
        let scrubbing = false;

        // The video autoplays muted, and a browser may still refuse that — so the buttons
        // read their state off the video rather than assuming it.
        const syncPlay = () => {
            player.classList.toggle("is-playing", !video.paused);
            playButton.setAttribute("aria-label", video.paused ? "Play" : "Pause");
        };

        const syncMute = () => {
            player.classList.toggle("is-muted", video.muted);
            muteButton.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
        };

        const syncTime = () => {
            const played = video.duration ? (video.currentTime / video.duration) * 100 : 0;
            if (!scrubbing) scrub.value = played;
            // The track is a gradient with its stop parked at the playhead.
            player.style.setProperty("--video-progress", `${played}%`);
            time.textContent = `${clock(video.currentTime)} / ${clock(video.duration)}`;
        };

        const syncFullscreen = () => {
            const full = document.fullscreenElement === player;
            player.classList.toggle("is-fullscreen", full);
            fullscreenButton.setAttribute("aria-label", full ? "Exit full screen" : "Enter full screen");
        };

        const togglePlay = () => {
            if (video.paused) video.play(); else video.pause();
        };

        const toggleFullscreen = () => {
            if (document.fullscreenElement === player) {
                document.exitFullscreen();
            } else if (player.requestFullscreen) {
                // A refusal (no permission, already exiting) is the browser's call to make,
                // and the controls just stay as they are.
                player.requestFullscreen().catch(() => { });
            } else if (video.webkitEnterFullscreen) {
                // iPhone Safari can only fullscreen the video itself, not its wrapper —
                // so it gets the native player rather than this bar.
                video.webkitEnterFullscreen();
            }
        };

        playButton.addEventListener("click", togglePlay);
        video.addEventListener("click", togglePlay);

        muteButton.addEventListener("click", () => {
            video.muted = !video.muted;
        });

        fullscreenButton.addEventListener("click", toggleFullscreen);
        // Fires for Escape and the browser's own exit too, not just the button.
        document.addEventListener("fullscreenchange", syncFullscreen);

        scrub.addEventListener("pointerdown", () => { scrubbing = true; });
        scrub.addEventListener("input", () => {
            if (video.duration) video.currentTime = (scrub.value / 100) * video.duration;
        });
        // Dragging can end anywhere on the page, so the release is caught on the window.
        window.addEventListener("pointerup", () => { scrubbing = false; });

        video.addEventListener("play", syncPlay);
        video.addEventListener("pause", syncPlay);
        video.addEventListener("volumechange", syncMute);
        video.addEventListener("timeupdate", syncTime);
        video.addEventListener("loadedmetadata", syncTime);

        syncPlay();
        syncMute();
        syncTime();
        syncFullscreen();
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
    handleVideoPlayers();
});

window.addEventListener("resize", () => {
    documentHeight();
});
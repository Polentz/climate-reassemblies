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
        tab.addEventListener("click", () => {
            openSlider(tab.dataset.slide);
        });
    });

    sliderClose.addEventListener("click", closeSlider);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !slider.hidden) closeSlider();
    });
};

window.addEventListener("load", () => {
    documentHeight();
    slider();
});

window.addEventListener("resize", () => {
    documentHeight();
});
<header class="header">
    <h1 id="line" aria-label="<?= $site->title()->esc('attr') ?>"><?= $site->title()->esc() ?></h1>
</header>

<nav class="nav" aria-label="Main navigation">
    <?php foreach ($site->navLinks()->toStructure() as $link): ?>
        <a class="button nav-button" href="<?= $link->url()->esc('attr') ?>" target="_blank"
            rel="noopener"><?= $link->label()->esc() ?></a>
    <?php endforeach ?>
    <?php foreach ($site->children()->listed()->not($page) as $item): ?>
        <a class="button nav-button" href="<?= $item->url() ?>" data-page-link><?= $item->title()->esc() ?></a>
    <?php endforeach ?>
    <a id="info-button" class="button nav-button js-href" href="#footer" aria-expanded="false">
        <span class="info-label">Info</span>
        <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M4 4L20 20M20 4L4 20" />
        </svg>
    </a>
</nav>
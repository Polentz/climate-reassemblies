<?php
/**
 * Document head, animated title and main navigation.
 *
 * @var Kirby\Cms\Site $site
 * @var Kirby\Cms\Page $page
 */
$description = $page->description()->or($site->description());
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page->isHomePage() ? $site->title()->esc() : $page->title()->esc() . ' | ' . $site->title()->esc() ?></title>
    <?php if ($description->isNotEmpty()): ?>
    <meta name="description" content="<?= $description->esc('attr') ?>">
    <?php endif ?>
    <link rel="stylesheet" href="https://use.typekit.net/gof7fem.css">
    <?= css([
        'assets/css/base.css',
        'assets/css/font.css',
        'assets/css/variables.css',
        'assets/css/style.css',
    ]) ?>
    <noscript>Please turn on JS to navigate this website</noscript>
    <noscript>
        <style>
            body {
                opacity: 1;
            }
        </style>
    </noscript>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15/dist/SplitText.min.js" defer></script>
    <?= js([
        'assets/js/script.js',
        'assets/js/app.js',
    ], ['defer' => true]) ?>
</head>

<body>

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
            <svg class="info-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true">
                <path d="M4 4L20 20M20 4L4 20" />
            </svg>
        </a>
    </nav>

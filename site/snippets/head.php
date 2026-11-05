<?php
$description = $page->description()->or($site->description());
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $page->isHomePage() ? $site->title()->esc() : $page->title()->esc() . ' | ' . $site->title()->esc() ?>
    </title>
    <?php if ($description->isNotEmpty()): ?>
        <meta name="description" content="<?= $description->esc('attr') ?>">
    <?php endif ?>
    <link rel="stylesheet" href="https://use.typekit.net/gof7fem.css">
    <?= css([
        'assets/css/base.css',
        'assets/css/font.css',
        'assets/css/variables.css',
        'assets/css/style.css',
        '@auto',
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
        '@auto',
    ], ['defer' => true]) ?>
</head>

<body></body>
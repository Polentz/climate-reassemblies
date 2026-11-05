<?php
$sections = $page->children()->listed();
?>
<?php snippet('head') ?>
<?php snippet('header') ?>

<main class="main">
    <?php if ($sections->isEmpty()): ?>
        <section id="<?= $page->slug() ?>-section" class="section current">
            <div class="section-nav-wrapper">
                <h2 class="section-nav-tab" role="tab" tabindex="0"><?= $page->title()->esc() ?></h2>
            </div>
            <div class="section-layout-wrapper">
                <div class="section-header">
                    <h2 class="text-style-h2"><?= $page->title()->esc() ?></h2>
                </div>
                <div class="section-content">
                    <div class="section-content-body">
                        <div class="flex-column">
                            <div class="flex-column-item">
                                <?= retag($page->text()->value(), 'h3', 'text-style-h3') ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    <?php endif ?>

    <?php foreach ($sections as $section): ?>
        <?php snippet('section', ['section' => $section, 'current' => $section->isFirst($sections)]) ?>
    <?php endforeach ?>

    <?php snippet('collection-section') ?>
</main>

<?php snippet('footer') ?>
<?php snippet('foot') ?>
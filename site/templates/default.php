<?php
$sections = $page->children()->listed();

// One card per section page, or one fallback card when there are none,
// plus the "Collect & ReAssemble" card at the end.
$sectionCount = max($sections->count(), 1) + 1;
?>
<?php snippet('head') ?>
<?php snippet('header') ?>

<main class="main" style="--section-count: <?= $sectionCount ?>">
    <?php if ($sections->isEmpty()): ?>
        <section id="<?= $page->slug() ?>-section" class="section current" style="--slot: 0">
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

    <?php foreach ($sections->values() as $i => $section): ?>
        <?php snippet('section', ['section' => $section, 'tab' => $i, 'current' => $i === 0]) ?>
    <?php endforeach ?>

    <?php snippet('collection-section', ['tab' => $sectionCount - 1]) ?>
</main>

<?php snippet('footer') ?>
<?php snippet('foot') ?>
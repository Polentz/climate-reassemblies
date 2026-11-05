<section id="<?= $section->slug() ?>-section" class="section<?= $current ? ' current' : '' ?>">
    <div class="section-nav-wrapper">
        <h2 class="section-nav-tab" role="tab" tabindex="0"><?= $section->title()->esc() ?></h2>
    </div>
    <div class="section-layout-wrapper">
        <div class="section-header">
            <h2 class="text-style-h2"><?= $section->title()->esc() ?></h2>
        </div>
        <div class="section-content">
            <div class="section-content-body">
                <?php foreach (groupBlocks($section->blocks()->toBlocks()) as $group): ?>
                    <?php if ($group['wrapper']): ?>
                        <div class="<?= $group['wrapper'] ?>">
                            <?php foreach ($group['blocks'] as $block): ?>
                                <?= $block ?>
                            <?php endforeach ?>
                        </div>
                    <?php else: ?>
                        <?php foreach ($group['blocks'] as $block): ?>
                            <?= $block ?>
                        <?php endforeach ?>
                    <?php endif ?>
                <?php endforeach ?>
            </div>
        </div>
    </div>
</section>
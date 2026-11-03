<?php /** @var Kirby\Cms\Block $block — a quote between two rules, with its source */ ?>
<div class="flex-column-item"<?= collectAttr($block) ?>>
    <blockquote class="text-style-quote">
        &ldquo;<?= $block->text()->esc() ?>&rdquo;
        <?php if ($block->source()->isNotEmpty()): ?>
        <p class="text-style-label"><?= nl2br($block->source()->esc()) ?></p>
        <?php endif ?>
    </blockquote>
    <?php if (isCollectable($block)) snippet('collect-button') ?>
</div>

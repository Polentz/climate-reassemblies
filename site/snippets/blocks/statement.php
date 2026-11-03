<?php /** @var Kirby\Cms\Block $block — large text (h3) with optional body copy */ ?>
<div class="flex-column-item"<?= collectAttr($block) ?>>
    <?= retag($block->lead()->value(), 'h3', 'text-style-h3') ?>
    <?php if ($block->body()->isNotEmpty()): ?>
    <?= retag($block->body()->value(), 'p', 'text-style-p') ?>
    <?php endif ?>
    <?php if (isCollectable($block)) snippet('collect-button') ?>
</div>

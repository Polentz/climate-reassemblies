<?php /** @var Kirby\Cms\Block $block — bordered box in the 4-column grid */ ?>
<div class="grid-item<?= $block->width()->value() === 'wide' ? ' span-2' : '' ?>"<?= collectAttr($block) ?>>
    <h3 class="text-style-h3"><?= $block->heading() ?></h3>
    <?php if ($block->body()->isNotEmpty()): ?>
    <?= retag($block->body()->value(), 'p', 'text-style-p') ?>
    <?php endif ?>
    <?php if (isCollectable($block)) snippet('collect-button') ?>
</div>

<?php
/**
 * @var Kirby\Cms\Block $block — 3-column image grid. Caption, alt text and
 * "collectable" are set per image (click an image in the Panel to edit them).
 */
$images = $block->images()->toFiles();
if ($images->isEmpty()) return;
?>
<div class="gallery-grid">
    <?php foreach ($images as $image): ?>
    <figure class="gallery-item"<?= collectAttr($image) ?>>
        <img src="<?= $image->thumb(['width' => 1200])->url() ?>" srcset="<?= $image->srcset() ?>"
            sizes="(max-width: 900px) 100vw, 33vw" alt="<?= $image->alt()->esc('attr') ?>" loading="lazy"
            decoding="async">
        <figcaption class="text-style-caption" hidden><?= $image->caption()->esc() ?></figcaption>
        <?php if (isCollectable($image)) snippet('collect-button') ?>
    </figure>
    <?php endforeach ?>
</div>

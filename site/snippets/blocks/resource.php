<?php
/**
 * @var Kirby\Cms\Block $block — a resource with a video or image preview.
 * Resources are always collectable.
 */
$video  = $block->media()->value() === 'video' ? $block->video()->toFile() : null;
$image  = $video ? null : $block->image()->toFile();
$link   = $block->link()->toUrl();
?>
<div class="gallery-grid list-item"<?= collectAttr($block, true) ?>>
    <div class="list-item-wrapper list-item-preview">
        <?php if ($video): ?>
        <?php snippet('video-player', ['video' => $video, 'poster' => $block->poster()->toFile()]) ?>
        <?php elseif ($image): ?>
        <?php $img = '<img src="' . $image->thumb(['width' => 1200])->url() . '" srcset="' . $image->srcset() . '" sizes="(max-width: 900px) 100vw, 33vw" alt="' . $image->alt()->esc('attr') . '" loading="lazy" decoding="async">' ?>
        <?php if ($link): ?>
        <a href="<?= $link ?>" target="_blank" rel="noopener noreferrer"><?= $img ?></a>
        <?php else: ?>
        <?= $img ?>
        <?php endif ?>
        <?php endif ?>
        <?php snippet('collect-button') ?>
    </div>
    <div class="list-item-wrapper list-item-content">
        <div class="list-item-header">
            <?php if ($block->category()->isNotEmpty()): ?>
            <p class="text-style-label"><?= $block->category()->esc() ?></p>
            <?php endif ?>
            <h3 class="text-style-h3"><?= $block->heading()->esc() ?></h3>
            <?php if ($block->subheading()->isNotEmpty()): ?>
            <p class="text-style-p"><?= $block->subheading()->esc() ?></p>
            <?php endif ?>
        </div>
        <?php if ($block->description()->isNotEmpty()): ?>
        <div class="list-item-description text-style-caption">
            <?= $block->description() ?>
        </div>
        <?php endif ?>
    </div>
</div>

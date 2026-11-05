<?php
/**
 * "Collect & ReAssemble": the visitor's personal collection, filled in the
 * browser by handleCollection() in assets/js/script.js. Its texts are edited
 * in the "Collection" tab of the Site settings.
 *
 * @var Kirby\Cms\Site $site
 */
$icon = '<span class="interactive-icon">' . snippet('icons/collect', return: true) . '</span>';
?>
<section id="interactive-section" class="section" style="--tab: <?= $tab ?? 0 ?>">
    <div class="section-nav-wrapper">
        <h2 class="section-nav-tab" role="tab" tabindex="0">
            <?= $site->collectionTitle()->or('Collect & ReAssemble')->esc() ?></h2>
    </div>
    <div class="section-layout-wrapper">
        <div class="section-header">
            <h2 class="text-style-h2"><?= $site->collectionTitle()->or('Collect & ReAssemble')->esc() ?></h2>
        </div>
        <div class="section-content">
            <div class="section-content-body">
                <div class="flex-column">
                    <div class="flex-column-item">
                        <?= str_replace('{icon}', $icon, retag($site->collectionIntro()->value(), 'h3', 'text-style-h3')) ?>
                    </div>
                </div>
                <div id="collection" class="flex-column">
                    <ul id="collection-container" class="flex-column-item">
                        <li class="collection-empty">
                            <p class="text-style-label">
                                <?= $site->collectionEmpty()->or('Your collection is still empty')->esc() ?></p>
                        </li>
                    </ul>
                    <?php snippet('collection-template') ?>
                </div>
            </div>
        </div>
    </div>
</section>
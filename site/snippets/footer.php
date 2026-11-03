<?php
/**
 * Footer, revealed by the Info button. All content comes from the
 * "Footer" tab of the Site settings in the Panel.
 *
 * @var Kirby\Cms\Site $site
 */
?>
    <footer id="footer" class="footer">
        <div class="footer-layout-wrapper">
            <div class="footer-top">
                <div class="footer-block footer-contact">
                    <h2 class="text-style-h2">
                        <?= $site->contactTitle()->or($site->title())->esc() ?>
                    </h2>
                    <?php if ($site->contactText()->isNotEmpty()): ?>
                    <h3 class="text-style-h3">
                        <?= nl2br($site->contactText()->esc()) ?>
                    </h3>
                    <?php endif ?>
                    <?php if ($site->email()->isNotEmpty()): ?>
                    <ul class="footer-links">
                        <li><?= Html::email($site->email()->value(), null, ['class' => 'text-style-p']) ?></li>
                    </ul>
                    <?php endif ?>
                </div>

                <?php $partners = $site->partners()->toStructure() ?>
                <?php if ($partners->isNotEmpty()): ?>
                <div class="footer-block footer-partners">
                    <h2 class="text-style-label">Partners</h2>
                    <ul class="footer-partner-list">
                        <?php foreach ($partners as $partner): ?>
                        <li class="footer-partner">
                            <?php if ($logo = $partner->logo()->toFile()): ?>
                            <img src="<?= $logo->url() ?>" alt="<?= $logo->alt()->or($partner->name())->esc('attr') ?>">
                            <?php endif ?>
                            <figcaption class="text-style-caption">
                                <?php if ($partner->link()->isNotEmpty()): ?>
                                <a href="<?= $partner->link()->esc('attr') ?>" target="_blank"
                                    rel="noopener noreferrer"><?= $partner->name()->esc() ?></a>
                                <?php else: ?>
                                <?= $partner->name()->esc() ?>
                                <?php endif ?>
                            </figcaption>
                        </li>
                        <?php endforeach ?>
                    </ul>
                </div>
                <?php endif ?>

                <?php $credits = $site->credits()->toStructure() ?>
                <?php if ($credits->isNotEmpty()): ?>
                <div class="footer-block footer-credits">
                    <h2 class="text-style-label">Credits</h2>
                    <ul class="footer-credit-list">
                        <?php foreach ($credits as $credit): ?>
                        <li class="text-style-caption"><span class="text-style-label"><?= $credit->role()->esc() ?></span><br><?= $credit->name()->esc() ?></li>
                        <?php endforeach ?>
                    </ul>
                </div>
                <?php endif ?>
            </div>

            <div class="footer-bottom">
                <p class="text-style-caption">&copy; <?= date('Y') ?> <?= $site->copyright()->or($site->title() . '. All rights reserved.')->esc() ?></p>
                <?php $legal = $site->legalLinks()->toStructure() ?>
                <?php if ($legal->isNotEmpty()): ?>
                <ul class="footer-legal">
                    <?php foreach ($legal as $link): ?>
                    <li><a class="text-style-caption" href="<?= $link->link()->toUrl() ?? '#' ?>"><?= $link->label()->esc() ?></a></li>
                    <?php endforeach ?>
                </ul>
                <?php endif ?>
            </div>
        </div>
    </footer>

</body>

</html>

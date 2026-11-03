<?php
/**
 * Sections only exist as tabs on their parent page, so visiting
 * one directly redirects to the parent.
 *
 * @var Kirby\Cms\Page $page
 */
go($page->parent()->url());

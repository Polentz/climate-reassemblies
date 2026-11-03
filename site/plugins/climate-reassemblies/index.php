<?php

use Kirby\Cms\App as Kirby;
use Kirby\Cms\Block;
use Kirby\Cms\Blocks;
use Kirby\Cms\File;

Kirby::plugin('climate-reassemblies/site', []);

/**
 * Data attributes that make an item collectable by the
 * "Collect & ReAssemble" feature (assets/js/script.js).
 *
 * - data-type:     the section the item lives in, e.g. "UK Assemblies"
 * - data-category: e.g. "Quotation", "Article", "Tool"
 * - data-id:       a stable id, so a collection saved in the browser
 *                  survives edits to the content
 *
 * Returns an empty string for items that are not collectable,
 * unless $always is true (resources are always collectable).
 */
function collectAttr(Block|File $item, bool $always = false): string
{
    if ($always === false && $item->collectable()->toBool() === false) {
        return '';
    }

    $id = $item instanceof File ? $item->uuid()->id() : $item->id();

    return ' ' . attr([
        'data-type'     => $item->parent()->title()->value(),
        'data-category' => $item->category()->value() ?: null,
        'data-id'       => $id,
    ]);
}

/**
 * Whether the item should show the "Collect" button.
 */
function isCollectable(Block|File $item): bool
{
    return $item->collectable()->toBool();
}

/**
 * Turns the <p> tags that the writer field outputs into another tag
 * and/or adds a class, e.g. retag($html, 'h3', 'text-style-h3').
 */
function retag(string $html, string $tag = 'p', ?string $class = null): string
{
    $open = '<' . $tag . ($class ? ' class="' . $class . '"' : '') . '>';

    $html = preg_replace('/<p(\s[^>]*)?>/', $open, $html);
    return str_replace('</p>', '</' . $tag . '>', $html);
}

/**
 * Groups consecutive blocks that share the same wrapper, so the editor
 * can just list blocks in the Panel and the page still gets the
 * flex-column / grid containers the stylesheet expects.
 *
 * @return array<int, array{wrapper: string|null, blocks: Block[]}>
 */
function groupBlocks(Blocks $blocks): array
{
    $wrappers = [
        'statement' => 'flex-column',
        'quotation' => 'flex-column',
        'card'      => 'grid',
    ];

    $groups = [];

    foreach ($blocks as $block) {
        $wrapper = $wrappers[$block->type()] ?? null;
        $last    = array_key_last($groups);

        if ($wrapper !== null && $last !== null && $groups[$last]['wrapper'] === $wrapper) {
            $groups[$last]['blocks'][] = $block;
            continue;
        }

        $groups[] = ['wrapper' => $wrapper, 'blocks' => [$block]];
    }

    return $groups;
}

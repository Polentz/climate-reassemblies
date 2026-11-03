<?php

/**
 * Kirby configuration
 * https://getkirby.com/docs/reference/system/options
 *
 * Settings that only apply to local development live in config.localhost.php,
 * which Kirby loads on top of this file when the host is "localhost".
 */
return [
    'debug' => false,

    'panel' => [
        'language' => 'en',
    ],

    'thumbs' => [
        'quality' => 80,
        'format'  => 'webp',
        'srcsets' => [
            'default' => [400, 800, 1200, 1800],
        ],
    ],
];

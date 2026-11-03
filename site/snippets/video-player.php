<?php
/**
 * Custom video player, wired up by handleVideoPlayers() in assets/js/script.js
 *
 * @var Kirby\Cms\File      $video
 * @var Kirby\Cms\File|null $poster
 */
?>
<div class="video-player">
    <video class="video" src="<?= $video->url() ?>"<?php if ($poster ?? null): ?> poster="<?= $poster->thumb(['width' => 1600])->url() ?>"<?php endif ?>>
        Your browser does not support the video tag.
    </video>
        <div class="video-controls">
            <button class="video-button" data-action="toggle-play" aria-label="Pause">
                <svg class="video-icon video-icon-play" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M8 5v14l11-7z" fill="currentColor"></path>
                </svg>
                <svg class="video-icon video-icon-pause" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" fill="currentColor">
                    </path>
                </svg>
            </button>
            <input class="video-scrub" type="range" min="0" max="100" step="0.1"
                value="0" aria-label="Seek">
            <span class="video-time text-style-caption">0:00 / 0:00</span>
            <button class="video-button" data-action="toggle-mute" aria-label="Unmute">
                <svg class="video-icon video-icon-sound" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"></path>
                    <path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12"
                        fill="none" stroke="currentColor" stroke-width="1.75"
                        stroke-linecap="round">
                    </path>
                </svg>
                <svg class="video-icon video-icon-muted" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"></path>
                    <path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor"
                        stroke-width="1.75" stroke-linecap="round"></path>
                </svg>
            </button>
            <button class="video-button" data-action="toggle-fullscreen"
                aria-label="Enter full screen">
                <svg class="video-icon video-icon-expand" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" fill="none"
                        stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
                        stroke-linejoin="round"></path>
                </svg>
                <svg class="video-icon video-icon-collapse" viewBox="0 0 24 24"
                    aria-hidden="true">
                    <path d="M4 9h5V4m11 5h-5V4M15 20v-5h5M9 20v-5H4" fill="none"
                        stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
                        stroke-linejoin="round"></path>
                </svg>
            </button>
        </div>
</div>

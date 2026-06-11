#!/usr/bin/env node
/**
 * Download a representative photo for each dish from Unsplash.
 *
 * Why Unsplash: pro-grade food photography in a consistent style. Free for
 * apps as long as we credit photographers (CREDITS.txt). Rate limit is
 * 50 requests/hour on the demo tier — fine for 55 dishes.
 *
 * Auth: read access key from frontend/.unsplash_key (gitignored).
 * Get yours at https://unsplash.com/oauth/applications -> Keys -> Access Key.
 *
 * Usage: node scripts/fetch_unsplash_images.mjs [--force]
 *   --force re-downloads even if a file already exists.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(FRONTEND_ROOT, 'assets', 'dishes');
const CREDITS_PATH = path.join(ASSETS_DIR, 'CREDITS.txt');
const KEY_PATH = path.join(FRONTEND_ROOT, '.unsplash_key');

const FORCE = process.argv.includes('--force');

if (!fs.existsSync(KEY_PATH)) {
    console.error(`No Unsplash key file found at ${KEY_PATH}`);
    console.error('Create it with: echo "YOUR_ACCESS_KEY" > frontend/.unsplash_key');
    process.exit(1);
}
const ACCESS_KEY = fs.readFileSync(KEY_PATH, 'utf8').trim();
if (!ACCESS_KEY) {
    console.error('Unsplash key file is empty');
    process.exit(1);
}

// Same dish list as Wikimedia script — slug stays the same so dishes.ts
// require()s keep working. Each search query is tuned for Unsplash, which
// indexes English food terms well.
const DISHES = [
    // EASY
    { slug: 'omelette',           q: 'vegetable omelette' },
    { slug: 'tomato-eggs',        q: 'tomato fried eggs' },
    { slug: 'okroshka',           q: 'okroshka cold soup' },
    { slug: 'vitamin-salad',      q: 'cabbage carrot salad' },
    { slug: 'beetroot-salad',     q: 'beetroot salad garlic' },
    { slug: 'carrot-apple',       q: 'carrot apple salad' },
    { slug: 'greek-salad',        q: 'greek salad' },
    { slug: 'caprese',            q: 'caprese salad' },
    { slug: 'spinach-salad',      q: 'spinach salmon salad' },
    { slug: 'bruschetta',         q: 'tomato bruschetta' },
    { slug: 'berry-smoothie',     q: 'berry smoothie' },
    { slug: 'green-smoothie',     q: 'green smoothie spinach' },
    { slug: 'fruit-salad',        q: 'fruit salad bowl' },
    { slug: 'watermelon-feta',    q: 'watermelon feta salad' },
    { slug: 'broccoli-garlic',    q: 'steamed broccoli plate' },
    { slug: 'asparagus-grilled',  q: 'grilled asparagus' },
    { slug: 'mushrooms-onion',    q: 'fried mushrooms pan' },
    { slug: 'fried-courgettes',   q: 'fried zucchini' },
    { slug: 'cheese-tomato-toast',q: 'cheese tomato toast' },
    { slug: 'yoghurt-parfait',    q: 'berry yogurt parfait' },
    // MEDIUM
    { slug: 'borscht',            q: 'borscht soup bowl' },
    { slug: 'shchi',              q: 'cabbage soup russian' },
    { slug: 'chicken-noodle',     q: 'chicken noodle soup' },
    { slug: 'rassolnik',          q: 'rassolnik soup pickles' },
    { slug: 'vinegret',           q: 'beet salad russian' },
    { slug: 'olivier',            q: 'olivier potato salad' },
    { slug: 'herring-fur-coat',   q: 'russian herring salad' },
    { slug: 'golubtsy',           q: 'cabbage rolls dish' },
    { slug: 'draniki',            q: 'potato pancakes' },
    { slug: 'roast-chicken',      q: 'roast chicken potatoes' },
    { slug: 'veg-stew',           q: 'vegetable stew bowl' },
    { slug: 'pumpkin-soup',       q: 'pumpkin cream soup' },
    { slug: 'mash-mushrooms',     q: 'mashed potatoes mushrooms' },
    { slug: 'shakshuka',          q: 'shakshuka' },
    { slug: 'ratatouille',        q: 'ratatouille' },
    { slug: 'mushroom-pasta',     q: 'mushroom pasta plate' },
    { slug: 'pasta-pomodoro',     q: 'pasta pomodoro' },
    { slug: 'mushroom-risotto',   q: 'mushroom risotto' },
    { slug: 'chicken-curry',      q: 'chicken curry bowl' },
    { slug: 'egg-fried-rice',     q: 'egg fried rice' },
    { slug: 'minestrone',         q: 'minestrone soup' },
    { slug: 'moussaka',           q: 'moussaka greek' },
    { slug: 'chicken-apple',      q: 'chicken salad apple' },
    { slug: 'cauli-bake',         q: 'cauliflower bake cheese' },
    { slug: 'apple-charlotte',    q: 'apple charlotte cake' },
    // HARD
    { slug: 'beef-stroganoff',    q: 'beef stroganoff' },
    { slug: 'beef-steak',         q: 'beef steak vegetables plate' },
    { slug: 'plov',               q: 'pilaf rice meat' },
    { slug: 'lasagne',            q: 'lasagne bolognese' },
    { slug: 'stuffed-peppers',    q: 'stuffed bell peppers' },
    { slug: 'duck-apple',         q: 'roast duck apples orange' },
    { slug: 'paella',             q: 'paella spanish' },
    { slug: 'parmigiana',         q: 'eggplant parmigiana' },
    { slug: 'aubergine-rolls',    q: 'eggplant rolls cheese' },
    { slug: 'quiche',             q: 'quiche lorraine' },
];

const UNSPLASH_API = 'https://api.unsplash.com';
const TARGET_W = 800; // we want ~800px wide images for app thumbnails

async function searchPhoto(query) {
    const url = new URL(`${UNSPLASH_API}/search/photos`);
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', '5');
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high');

    const r = await fetch(url, {
        headers: {
            Authorization: `Client-ID ${ACCESS_KEY}`,
            'Accept-Version': 'v1',
        },
    });
    if (r.status === 401) throw new Error('Unauthorized — check your Unsplash access key');
    if (r.status === 403) throw new Error('Rate-limited or forbidden — wait an hour');
    if (!r.ok) throw new Error(`Unsplash search HTTP ${r.status}`);
    const json = await r.json();
    return json.results || [];
}

async function downloadImage(url, dest) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Image download HTTP ${r.status}`);
    const buffer = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    return buffer.length;
}

// Per Unsplash guidelines, hit the photo's `download_location` so we register
// the use against the photographer's stats. Doesn't actually return the photo.
async function trackDownload(downloadLocation) {
    try {
        await fetch(downloadLocation, {
            headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
        });
    } catch {
        // best-effort; not critical if it fails
    }
}

async function main() {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
    const credits = [
        '# ReceptAI dish image credits',
        '',
        'All images from Unsplash, free under the Unsplash License (https://unsplash.com/license).',
        'Photographers credited below.',
        '',
    ];
    let success = 0;
    const failed = [];

    for (const dish of DISHES) {
        const dest = path.join(ASSETS_DIR, `${dish.slug}.jpg`);
        if (!FORCE && fs.existsSync(dest)) {
            console.log(`SKIP ${dish.slug} (already exists; use --force to redo)`);
            success += 1;
            continue;
        }

        try {
            const results = await searchPhoto(dish.q);
            if (results.length === 0) {
                console.log(`MISS ${dish.slug} — no results for "${dish.q}"`);
                failed.push(dish);
                continue;
            }
            const photo = results[0];
            // Use the "regular" size (~1080px), good balance of quality/size.
            const imageUrl = photo.urls.regular || photo.urls.small;
            const bytes = await downloadImage(imageUrl, dest);
            await trackDownload(photo.links.download_location);

            const author = photo.user.name;
            const authorLink = `https://unsplash.com/@${photo.user.username}?utm_source=ReceptAI&utm_medium=referral`;
            credits.push(`## ${dish.slug}`);
            credits.push(`- query:  "${dish.q}"`);
            credits.push(`- by:     ${author} (${authorLink})`);
            credits.push(`- source: ${photo.links.html}`);
            credits.push('');

            console.log(`OK   ${dish.slug.padEnd(22)} ${(bytes / 1024).toFixed(0)} KB  by ${author}`);
            success += 1;
            // Be gentle with rate limit — 50/hr means ~1.2s between calls
            await new Promise(r => setTimeout(r, 1300));
        } catch (e) {
            console.log(`FAIL ${dish.slug}: ${e.message}`);
            failed.push(dish);
        }
    }

    fs.writeFileSync(CREDITS_PATH, credits.join('\n'));

    console.log();
    console.log(`Done: ${success}/${DISHES.length}`);
    if (failed.length) {
        console.log(`Failed (${failed.length}):`);
        failed.forEach(d => console.log(`  - ${d.slug}`));
    }
    console.log();
    console.log(`Images in: ${ASSETS_DIR}`);
    console.log(`Credits:   ${CREDITS_PATH}`);
}

main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});

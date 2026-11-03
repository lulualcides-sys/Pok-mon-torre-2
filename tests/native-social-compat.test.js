import test from 'node:test';
import assert from 'node:assert/strict';
import {stripNativeSocialFooterLinks,disableNativeTitleSocialLinks}
 from '../tools/pokearena/torre2-native-social-compat.mjs';

test('solo build removes only external social footer anchors, not Privacy/game links',()=>{
 const html='<footer><a href="/privacy">Privacy</a>'+
 '<a href="https://discord.gg/RyB7s7pKdM">Discord</a>'+
 '<a target="_blank" href="https://www.youtube.com/@pokearena2d"><span>YouTube</span></a>'+
 "<a href='https://www.instagram.com/pokearena2d'>Instagram</a>"+
 '<a href="https://www.tiktok.com/@pokearena2d">TikTok</a>'+
 '<a href="./arena2d/index.html">Play</a></footer>';
 const result=stripNativeSocialFooterLinks(html);
 assert.match(result,/href="\/privacy"/);
 assert.match(result,/href="\.\/arena2d\/index\.html"/);
 assert.doesNotMatch(result,/discord\.gg|youtube\.com|instagram\.com|tiktok\.com/);
 assert.equal((result.match(/<a\b/g)||[]).length,2);
});
test('solo social stripping is idempotent and leaves unknown domains untouched',()=>{
 const html='<a href="https://example.com/reference">Reference</a>';
 assert.equal(stripNativeSocialFooterLinks(stripNativeSocialFooterLinks(html)),html);
 assert.throws(()=>stripNativeSocialFooterLinks(null),TypeError);
});
test('title disables its native social call without touching fullscreen controls',()=>{
 const source='this.redes();this.fullscreen();';
 assert.equal(disableNativeTitleSocialLinks(source).includes('this.redes()'),false);
 assert.match(disableNativeTitleSocialLinks(source),/this\.fullscreen\(\)/);
});

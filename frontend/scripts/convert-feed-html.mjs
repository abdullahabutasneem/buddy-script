import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const repoRoot = path.join(frontendRoot, "..");
const htmlPath = path.join(repoRoot, "appifylab-project", "feed.html");
const outPath = path.join(frontendRoot, "src", "components", "feed", "FeedMarkup.tsx");

if (!fs.existsSync(htmlPath)) {
  console.error("Missing appifylab-project/feed.html — add the reference folder locally.");
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, "utf8");
const bodyStart = html.indexOf("<body>");
const bodyEnd = html.lastIndexOf("</body>");
if (bodyStart === -1 || bodyEnd === -1) {
  console.error("Could not find body");
  process.exit(1);
}
html = html.slice(bodyStart + 6, bodyEnd);

const scriptIdx = html.lastIndexOf("<script");
if (scriptIdx !== -1) {
  html = html.slice(0, scriptIdx);
}

function htmlCommentToJsx(s) {
  return s.replace(/<!--([\s\S]*?)-->/g, (_, inner) => {
    const t = inner.trim();
    if (!t) return "";
    return `{/* ${t.replace(/\*\//g, "* /")} */}`;
  });
}

let s = htmlCommentToJsx(html);

const attrMap = [
  [/\sclass=/g, " className="],
  [/\sfor=/g, " htmlFor="],
  [/\stabindex=/gi, " tabIndex="],
  [/\sclip-rule=/g, " clipRule="],
  [/\sfill-rule=/g, " fillRule="],
  [/\sfill-opacity=/g, " fillOpacity="],
  [/\sstroke-opacity=/g, " strokeOpacity="],
  [/\sstroke-width=/g, " strokeWidth="],
  [/\sstroke-linecap=/g, " strokeLinecap="],
  [/\sstroke-linejoin=/g, " strokeLinejoin="],
  [/\sstroke-miterlimit=/g, " strokeMiterlimit="],
  [/\sstop-color=/g, " stopColor="],
  [/\sstop-opacity=/g, " stopOpacity="],
  [/\sxlink:href=/g, " xlinkHref="],
];

for (const [re, rep] of attrMap) {
  s = s.replace(re, rep);
}

s = s.replace(/\sclas=/g, " className=");

s = s.replace(/src="assets\//g, 'src="/assets/');
s = s.replace(/href="feed\.html"/g, 'href="/feed"');
s = s.replace(/href="profile\.html"/g, 'href="/profile"');
s = s.replace(/href="profile\.html\s+"/g, 'href="/profile"');
s = s.replace(/href="#0"/g, 'href="#"');
s = s.replace(/href="friend-request\.html"/g, 'href="#"');
s = s.replace(/href="chat\.html"/g, 'href="#"');
s = s.replace(/href="find-friends\.html"/g, 'href="#"');
s = s.replace(/href="group\.html"/g, 'href="#"');
s = s.replace(/href="event\.html"/g, 'href="#"');
s = s.replace(/href="event-single\.html"/g, 'href="#"');
s = s.replace(/href="chat_list\(for_mbl\)\.html"/g, 'href="#"');
s = s.replace(/href="no"/g, 'href="#"');

s = s.replace(/<button([^>]*)\s+href="[^"]*"/g, "<button$1");

// Self-closing void tags for JSX
s = s.replace(/<img([^>]*?)>/g, (_, a) => `<img${a} />`);
s = s.replace(/<hr([^>]*?)>/g, (_, a) => `<hr${a} />`);
s = s.replace(/<input([^>]*?)>/g, (_, a) => `<input${a} />`);
s = s.replace(/<br>/g, "<br />");
s = s.replace(/<br\s*>/g, "<br />");

// Empty SVG elements written with explicit close tags
s = s.replace(/<circle([^>]*)><\/circle>/g, "<circle$1 />");
s = s.replace(/<path([^>]*)><\/path>/g, "<path$1 />");
s = s.replace(/<polyline([^>]*)><\/polyline>/g, "<polyline$1 />");
s = s.replace(/<rect([^>]*)><\/rect>/g, "<rect$1 />");

// Fix nested <a><a> (invalid) — unwrap inner duplicate from feed mobile stories
s = s.replace(
  /<a href="#" className="_feed_inner_ppl_card_area_link">\s*<a href="#" className="_feed_inner_ppl_card_area_link">/g,
  '<a href="#" className="_feed_inner_ppl_card_area_link">',
);
s = s.replace(
  /<\/a>\s*<\/a>\s*<\/li>\s*<li className="_feed_inner_ppl_card_area_item">\s*<a href="#" className="_feed_inner_ppl_card_area_link">\s*<a href="#" className="_feed_inner_ppl_card_area_link">/g,
  "</a></li>\n<li className=\"_feed_inner_ppl_card_area_item\">\n<a href=\"#\" className=\"_feed_inner_ppl_card_area_link\">",
);
// Simpler: remove duplicate closing after inner blocks — run two-pass for known pattern
s = s.replace(
  /(<a href="#" className="_feed_inner_ppl_card_area_link">)\s*<a href="#" className="_feed_inner_ppl_card_area_link">([\s\S]*?)<\/a>\s*<\/a>/g,
  "$1$2</a>",
);

// Wire props: root layout
s = s.replace(
  /<div className="_layout _layout_main_wrapper">/,
  "<div className={layoutClassName}>",
);

// Dark mode toggle button
s = s.replace(
  /<button type="button" className="_layout_swithing_btn_link">/,
  '<button type="button" className="_layout_swithing_btn_link" onClick={onDarkModeClick} aria-label="Toggle theme">',
);

// Notification bell (span -> button-like interaction)
s = s.replace(
  /<span id="_notify_btn" className="nav-link _header_nav_link _header_notify_btn">/,
  '<span id="_notify_btn" role="button" tabIndex={0} className="nav-link _header_nav_link _header_notify_btn" onClick={onNotifyClick} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNotifyClick(); } }}>',
);

s = s.replace(
  /<div id="_notify_drop" className="_notification_dropdown">/,
  '<div id="_notify_drop" className={notifyDropdownClassName}>',
);

s = s.replace(
  /<button id="_profile_drop_show_btn" className="_header_nav_dropdown_btn _dropdown_toggle" type="button">/,
  '<button id="_profile_drop_show_btn" className="_header_nav_dropdown_btn _dropdown_toggle" type="button" onClick={onProfileToggleClick} aria-expanded="false">',
);

s = s.replace(
  /<div id="_prfoile_drop" className="_nav_profile_dropdown _profile_dropdown">/,
  '<div id="_prfoile_drop" className={profileDropdownClassName}>',
);

s = s.replace(
  /<button type="button" id="_timeline_show_drop_btn" className="_feed_timeline_post_dropdown_link">/,
  '<button type="button" id="_timeline_show_drop_btn" className="_feed_timeline_post_dropdown_link" onClick={onTimelineToggleClick} aria-expanded="false">',
);

// Original used invalid: <button href="#0" id="_timeline_show_drop_btn"
s = s.replace(
  /<button href="#0" id="_timeline_show_drop_btn" className="_feed_timeline_post_dropdown_link">/,
  '<button type="button" id="_timeline_show_drop_btn" className="_feed_timeline_post_dropdown_link" onClick={onTimelineToggleClick} aria-expanded="false">',
);

s = s.replace(
  /<div id="_timeline_drop" className="_feed_timeline_dropdown _timeline_dropdown">/,
  '<div id="_timeline_drop" className={timelineDropdownClassName}>',
);

const header = `/* eslint-disable @next/next/no-img-element */
/* Auto-generated from appifylab-project/feed.html — run: node scripts/convert-feed-html.mjs */
export type FeedMarkupProps = {
  layoutClassName: string;
  notifyDropdownClassName: string;
  profileDropdownClassName: string;
  timelineDropdownClassName: string;
  onDarkModeClick: () => void;
  onNotifyClick: () => void;
  onProfileToggleClick: () => void;
  onTimelineToggleClick: () => void;
};

export function FeedMarkup({
  layoutClassName,
  notifyDropdownClassName,
  profileDropdownClassName,
  timelineDropdownClassName,
  onDarkModeClick,
  onNotifyClick,
  onProfileToggleClick,
  onTimelineToggleClick,
}: FeedMarkupProps) {
  return (
`;

const footer = `  );
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header + s.trim() + "\n" + footer, "utf8");
console.log("Wrote", outPath);

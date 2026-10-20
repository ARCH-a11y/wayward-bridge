// wb-slice3.js ? ?????? ?????: ?????, ????????, ??????????, ?????? ??????, ?????-????
const fs = require('fs'), path = require('path');

const IN = path.join(__dirname, '_analysis', 'tags.txt');
const OUT = path.join(__dirname, '_analysis', 'tags3');
fs.mkdirSync(OUT, { recursive: true });

const lines = fs.readFileSync(IN, 'utf8').split(/\r?\n/).filter(l => l.trim());
console.log('????? ?????:', lines.length);

const unesc = s => s.replace(/\\\\/g, '\\').replace(/""/g, '"');

// 1) ??????? ????????? ????? ?? parenthetical-?????: ???_(?????)
const series = new Set();
for (const raw of lines) {
  const m = unesc(raw).match(/_\(([^()]*)\)$/);
  if (m) series.add(m[1].toLowerCase());
}
console.log('?????????? ????? ?? ??????:', series.size);

const BUCKETS = [
  ['00-composition', ['1girl','2girls','3girls','4girls','5girls','6+girls','1boy','2boys','3boys','multiple_girls','multiple_boys','solo','solo_focus','male_focus','female_focus','hetero','yuri','yaoi','bisexual','comic','censored','uncensored','original','alternate_costume','official_alternate_costume']],
  ['01-hair-head', ['hair','bangs','ponytail','twintails','braid','ahoge','sidelock','hime_cut','bob_cut','hairband','hair_ornament','hair_bow','hair_ribbon','horns','animal_ears','cat_ears','tail','wings','halo']],
  ['02-face', ['eye','iris','eyelash','eyebrow','mouth','teeth','tongue','blush','freckles','glasses','nose','ear','fang','eyepatch','mole','parted_lips','grin','smile',':d','sweat']],
  ['03-body', ['breast','nipple','areola','cleavage','hip','thigh','leg','arm','hand','finger','navel','ass','butt','belly','muscle','abs','skin','tan','collarbone','shoulder','back','neck','waist','foot','feet','toe','stomach','midriff','body']],
  ['04-nude', ['nude','naked','topless','bottomless','undress','lingerie','bikini','swimsuit','strip','unbuttoned','see-through','wet_clothes','open_clothes','clothes_lift']],
  ['05-clothes', ['dress','skirt','shirt','blouse','sweater','hoodie','jacket','coat','cape','socks','stockings','thighhighs','pantyhose','glove','mitten','hat','cap','helmet','boot','shoe','sandal','heel','underwear','bra','panties','uniform','kimono','yukata','robe','apron','suit','tie','scarf','ribbon','bow','belt','necklace','earring','bracelet','ring','jewelry','armor','cloak','vest','shorts','pants','jeans','leotard','bodysuit','corset','garter','choker','hairpin','crown','tiara']],
  ['11-clothes-detail', ['frill','sleeve','collar','neckline','hem','pleat','lace','embroidery','sash','obi','fur','trim','button','zipper','buckle','strap','harness','suspenders','sarashi','shawl','pinafore','overalls','tunic','tabard','japanese_clothes','serafuku','sailor_collar','crop_top','hood','pocket','seam','ruffle','ribbon_']],
  ['06-pose', ['standing','sitting','lying','kneeling','crouch','walking','running','jumping','lean','spread','crossed','arms_up','hand_on','hands_on','looking','pose','bent_over','arched','stretch','hug','holding','carrying','sleeping','resting']],
  ['07-sex', ['sex','penis','vagina','pussy','cum','semen','anal','oral','fellatio','cunnilingus','penetration','cowgirl','doggystyle','missionary','masturbat','orgasm','clitoris','testicle','scrotum','erection','fingering','creampie','bukkake','deepthroat','ahegao','69','grinding','humping','kiss']],
  ['08-place-bg', ['background','indoors','outdoors','forest','room','bed','window','sky','water','ocean','beach','night','day','sunset','sunrise','city','street','building','garden','field','mountain','snow','rain','cloud','star','moon','sun','floor','wall','chair','table','couch','grass','tree','flower_field','ruins','cave','tavern','inn']],
  ['09-style', ['anime','manga','chibi','pixel','sketch','watercolor','monochrome','greyscale','grayscale','sepia','realistic','photorealistic','3d','cgi','lineart','flat_color','retro','vintage','impressionism','oil_painting','style','perspective','close-up','portrait','full_body','upper_body','lower_body','cowboy_shot','from_','facing_']],
  ['10-objects-animal', ['food','fruit','cake','bread','meat','drink','cup','bottle','tea','coffee','animal','cat','dog','bird','horse','wolf','fox','dragon','snake','fish','rabbit','weapon','sword','spear','gun','shield','staff','book','flower','rose','plant','leaf','bag','box','lamp','candle','mirror','jewel','gem']],
  ['12-text-meta', ['signature','artist_name','twitter_username','character_name','english_text','speech_bubble','commentary','watermark','dated','logo','copyright_name','web_address','artist_logo','translation','bad_']],
  ['15-quality', ['absurdres','highres','lowres','resolution','commentary_request','translated','translation_request','check_translation','hard_translated','blurry','jpeg_artifacts','depth_of_field']],
  ['14-grooming', ['nail_polish','makeup','lipstick','eyeliner','tattoo','piercing','hair_flower','earrings']],
];

const buckets = {};
const add = (k, l) => { (buckets[k] = buckets[k] || []).push(l); };

const RE_SERIES = /_\([^()]*\)$/;
const RE_META = /[\\"]|\/|^\(|\)$/;

for (const raw of lines) {
  const t = unesc(raw);
  const bare = t.replace(/^_+|_+$/g, '');

  if (RE_SERIES.test(t)) { add('20-series-character', t); continue; }
  if (series.has(bare)) { add('13-franchise', t); continue; }

  let hit = null;
  for (const [name, kws] of BUCKETS) {
    if (kws.some(k => t.includes(k))) { hit = name; break; }
  }
  if (!hit) hit = RE_META.test(t) ? '30-artist-meta' : '99-other';
  add(hit, t);
}

const report = [];
let otherTop = [];
for (const k of Object.keys(buckets).sort()) {
  const arr = buckets[k];
  fs.writeFileSync(path.join(OUT, k + '.txt'), arr.join('\n') + '\n');
  report.push(k + ': ' + arr.length + '  (' + (arr.length / lines.length * 100).toFixed(1) + '%)');
  if (k === '99-other') otherTop = arr.slice(0, 400);
}

console.log('\n' + report.join('\n'));
if (otherTop.length) {
  fs.writeFileSync(path.join(OUT, '_other-top400.txt'), otherTop.join('\n') + '\n');
  console.log('\n???-80 ?? other:');
  console.log(otherTop.slice(0, 80).join(', '));
}

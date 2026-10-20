// wb-slice4.js ? ????? ??????? + ???????? ?? ???????
const fs = require('fs'), path = require('path');

const IN = path.join(__dirname, '_analysis', 'tags.txt');
const SRC = path.join(__dirname, '_analysis', 'tags3');
const OUT = path.join(__dirname, '_analysis', 'tags4');
fs.mkdirSync(OUT, { recursive: true });

const EXTRA = [
  ['16-expression', ['smile','grin','frown','crying','tears','expressionless','happy','sad','angry','surprised','embarrassed','pout','smirk','laugh','blush','parted_lips','open_mouth','closed_mouth','tongue_out','wink','stare','glare','sigh','trembling','shy','smug','worried','scared','determined','serious','calm','gloom','pensive','annoyed',':d',':o',':3',':p',':q',':t',';d','^_^','^o^','o_o','>_<','._.','x_x']],
  ['17-effects', ['sparkle','glowing','glow','shadow','petals','blood','wet','border','feathers','particles','steam','smoke','bubbles','reflection','silhouette','backlighting','lens_flare','motion_blur','wind','fire','ice','magic','rainbow','light','darkness','fog','mist']],
  ['18-view-angle', ['from_','pov','dutch_angle','profile','multiple_views','two_side_up','one_side_up','head_tilt','close-up','portrait','full_body','upper_body','cowboy_shot','foreshortening','perspective','symmetry','silhouette_']],
  ['19-meta-misc', ['4koma','parody','no_humans','chibi','meme','bad_id','bad_','commentary','spot_color','colorized','limited_palette','high_contrast','artist_request','character_request','series_request','quality','absurdres','highres','lowres','official_art','scan','jpeg_artifacts','twitter','pixiv','danbooru','traditional_media','anime_coloring']],
  ['05-clothes', ['wrist_cuffs','cuffs','ascot','beret','cardigan','kneehighs','headband','scrunchie','chinese_clothes','plaid_clothes','clothing_cutout','torn_clothes','clothes_pull','zettai_ryouiki','playboy_bunny','bell','bandages','chain','tassel','brooch','pendant','amulet','medal']],
  ['03-body', ['flat_chest','groin','sideboob','underboob','loli','muscular','soles','lips','anus','saliva','scar','bara','body_hair','happy_trail','pubic_hair','puffy_nipples','huge_breasts','small_breasts','wide_hips']],
  ['06-pose', ['squatting','on_side','wariza','groping','eating','sleeping','hugging','carrying','piggyback','straddling','lying','sitting','standing','kneeling','crawling','dancing','fighting','reading','writing','drinking']],
];

const MAP = {}; for (const [f] of EXTRA) MAP[f] = f;

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.txt') && !f.startsWith('_'));
const content = {};
for (const f of files) content[f] = fs.readFileSync(path.join(SRC, f), 'utf8');

const other = content['99-other.txt'].split(/\r?\n/).filter(l => l.trim());
const rest = [];
const added = {};

for (const raw of other) {
  const t = raw.trim();
  let hit = null;
  for (const [name, kws] of EXTRA) if (kws.some(k => t.includes(k))) { hit = name; break; }
  if (hit) { (added[hit] = added[hit] || []).push(t); }
  else rest.push(t);
}

for (const [name, arr] of Object.entries(added)) {
  content[MAP[name] + '.txt'] = (content[MAP[name] + '.txt'] || '') + arr.join('\n') + '\n';
}
content['99-other.txt'] = rest.join('\n') + '\n';

for (const [f, txt] of Object.entries(content)) fs.writeFileSync(path.join(OUT, f), txt);

// ???????? ?? ???????
const bands = path.join(OUT, '_bands');
fs.mkdirSync(bands, { recursive: true });
const all = fs.readFileSync(IN, 'utf8').split(/\r?\n/).filter(l => l.trim());
for (const n of [500, 2000, 5000, 10000, 20000]) {
  fs.writeFileSync(path.join(bands, 'top-' + n + '.txt'), all.slice(0, n).join('\n') + '\n');
}

const rep = [];
for (const f of Object.keys(content).sort()) {
  const c = content[f].split(/\r?\n/).filter(Boolean).length;
  rep.push(f.replace('.txt', '') + ': ' + c + '  (' + (c / all.length * 100).toFixed(1) + '%)');
}
console.log(rep.join('\n'));
console.log('\n????????? ?? ???????:', Object.entries(added).map(([k, v]) => k + '=' + v.length).join(', '));
console.log('???????? ? 99-other:', rest.length, '(' + (rest.length / all.length * 100).toFixed(1) + '%)');
console.log('\n???-60 ???????:'); console.log(rest.slice(0, 60).join(', '));
console.log('\n????????? ?????? ? _analysis/tags4/_bands/');


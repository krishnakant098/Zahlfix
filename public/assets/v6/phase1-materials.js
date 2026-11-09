/** R3 Gold Observatory. Static SVG material definitions; no runtime filter, network or clock.
 * IDs are explicitly namespaced. The same definitions build the stage and editable SVG masters.
 * Lighting is upper-left in scene space; documents remain upright in the repaired orbit model.
 */
export const MATERIALS = Object.freeze({
  gold:'#C39438', darkGold:'#A06E19', champagne:'#E3C57E', ink:'#191C16',
  paper:'#F1EDE1', space:'#0A0E19', light:'#FFF1C8',
});
export function materialDefinitions(prefix='p1m',master='p1-z-master') {
  const linear=(id,attrs,stops)=>`<linearGradient id="${prefix}-${id}" ${attrs}>${stops.map(([offset,color,opacity=1])=>`<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('')}</linearGradient>`;
  const radial=(id,attrs,stops)=>`<radialGradient id="${prefix}-${id}" ${attrs}>${stops.map(([offset,color,opacity=1])=>`<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('')}</radialGradient>`;
  return [
    linear('gold-face','x1="12%" y1="0%" x2="82%" y2="100%"',[[0,'#FFEDAF'],[.20,'#E5C36E'],[.42,'#C39438'],[.61,'#B17B24'],[.79,'#E3BD60'],[1,'#775015']]),
    linear('gold-edge','x1="0%" y1="0%" x2="100%" y2="85%"',[[0,'#FFF6D2'],[.30,'#E3C57E'],[.52,'#6C4A1B'],[.72,'#A87B30'],[1,'#3A2B15']]),
    linear('gold-side','x1="0%" y1="0%" x2="75%" y2="100%"',[[0,'#C49A4D'],[.45,'#836026'],[1,'#332817']]),
    linear('ink-face','x1="0%" y1="0%" x2="85%" y2="100%"',[[0,'#746442'],[.24,'#373B30'],[.60,'#151A17'],[.81,'#424736'],[1,'#171E19']]),
    linear('ink-edge','x1="0%" y1="0%" x2="95%" y2="100%"',[[0,'#F1DFA0'],[.22,'#BBA26A'],[.45,'#76683D'],[1,'#151B15']]),
    radial('gold-bloom','cx="50%" cy="48%" r="50%"',[[0,'#EAC36A',.30],[.2,'#D3A44C',.20],[.52,'#B7862E',.07],[1,'#996A24',0]]),
    radial('space-atmosphere','cx="54%" cy="48%" r="50%"',[[0,'#16202C',.58],[.56,'#111B26',.38],[1,'#0A0E19',0]]),
    radial('recess','cx="50%" cy="55%" r="50%"',[[0,'#3A351F',.20],[.55,'#605021',.09],[1,'#68582B',0]]),
    radial('gold-light','cx="41%" cy="32%" r="60%"',[[0,'#FFE3A0',.25],[.45,'#E8C571',.09],[1,'#C39438',0]]),
    radial('bead','cx="37%" cy="30%" r="70%" fx="27%" fy="22%"',[[0,'#FFF5CE'],[.16,'#F1D58C'],[.40,'#C79D44'],[.73,'#8C6420'],[1,'#342C17']]),
    radial('bead-ink','cx="35%" cy="28%" r="74%" fx="25%" fy="20%"',[[0,'#F7E1A4'],[.18,'#BFA25F'],[.44,'#6B633D'],[.72,'#293227'],[1,'#141D18']]),
    radial('bead-halo','cx="50%" cy="50%" r="50%"',[[0,'#FFE3A0',.5],[.32,'#D9AE51',.17],[1,'#C39438',0]]),
    radial('shadow','cx="50%" cy="50%" r="50%"',[[0,'#000000',.55],[.6,'#000000',.17],[1,'#000000',0]]),
    linear('paper','x1="0%" y1="0%" x2="95%" y2="100%"',[[0,'#FBF8EE'],[.42,'#EEEADD'],[1,'#C5C4B7']]),
    linear('paper-edge','x1="0%" y1="0%" x2="90%" y2="100%"',[[0,'#FFF7DB'],[.48,'#BCB8A7'],[1,'#746D59']]),
    linear('paper-side','x1="0%" y1="0%" x2="100%" y2="100%"',[[0,'#D7CFB9'],[1,'#827E6E']]),
    linear('orbit-metal','gradientUnits="userSpaceOnUse" x1="-320" y1="-240" x2="310" y2="260"',[[0,'#B89950'],[.23,'#6F5930'],[.51,'#CDB370'],[.68,'#E9D79B'],[1,'#80602A']]),
    linear('orbit-glint','gradientUnits="userSpaceOnUse" x1="-260" y1="-190" x2="260" y2="230"',[[0,'#FFEBB3',.80],[.36,'#E8C779',.16],[.63,'#E3C57E',.65],[1,'#AF842E',.02]]),
    linear('engraving','gradientUnits="userSpaceOnUse" x1="-240" y1="-200" x2="230" y2="235"',[[0,'#4A3E21'],[.37,'#242A1F'],[.65,'#51482D'],[1,'#1C251E']]),
    linear('engraving-light','gradientUnits="userSpaceOnUse" x1="-220" y1="-210" x2="250" y2="230"',[[0,'#FFF0BB',.74],[.30,'#EDCE87',.48],[.63,'#FFF1C1',.40],[1,'#EBCA7E',.08]]),
    linear('module-face','x1="0%" y1="0%" x2="100%" y2="100%"',[[0,'#202729',.84],[.35,'#151A1D',.70],[1,'#0D1014',.46]]),
    linear('aperture-rim','x1="0%" y1="0%" x2="95%" y2="100%"',[[0,'#F6E3A8'],[.28,'#AE8534'],[.57,'#473920'],[.78,'#C9A85E'],[1,'#3B311F']]),
    radial('aperture-depth','cx="41%" cy="45%" r="65%"',[[0,'#010204'],[.66,'#040608'],[1,'#292619']]),
    `<clipPath id="${prefix}-core-clip"><use href="#${master}"/></clipPath>`,
  ].join('');
}

/** R4: original ribbon artwork and a registered vector silhouette. Not a traced surface. */
export function coreArtwork({prefix='p1m',master='p1-z-master',ink=false,compact=false,halo=true}={}) {
  return `${halo?'<g data-material-halo opacity="0"></g>':''}
  <g class="p1-metal" data-material="ribbon-master">
    <use href="#${master}" fill="${ink?'#221A0C':'#AE7F2F'}" opacity="${ink?'.5':'.2'}"/>
    <image class="ribbon-z-image" data-ribbon-image href="/assets/brand/zahlfix-ribbon-${compact?'192':'384'}.webp" x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
}

export function documentArtwork(motif,{prefix='p1m',compact=false}={}) {
  // Silhouette fits inside the original 64x88 engineering envelope, including the sidewall.
  return `<g class="p1-document" data-material="ivory-plate">
  <path d="M5 5H58Q61 5 61 8V83Q61 86 58 86H7Q4 86 4 83V7Z" fill="url(#${prefix}-paper-side)"/>
  <rect x="2.4" y="1.7" width="57.6" height="82.4" rx="2.1" fill="url(#${prefix}-paper)" stroke="url(#${prefix}-paper-edge)" stroke-width="1.15"/>
  <path d="M4 81.5V4H57.8" fill="none" stroke="#FFFBEF" stroke-width=".75" stroke-opacity=".88"/>
  <path d="M59 9V82H9" fill="none" stroke="#888471" stroke-width=".65" stroke-opacity=".48"/>
  <path d="M3 16.5H59" stroke="#ADA790" stroke-width=".8"/><path d="M3.3 17.3H59" stroke="#FFFAE8" stroke-width=".55"/>
  <rect x="8" y="6.2" width="${compact?'18':'19.5'}" height="3.3" rx=".5" fill="url(#${prefix}-gold-face)"/>
  ${compact?'':`<path d="M42 7.5H53M46 10.5H53" stroke="#7D806F" stroke-width=".7" opacity=".6"/>`}
  ${motif}
  <path d="M9 71H49" stroke="#8D9181" stroke-width="${compact?'1.15':'.85'}" stroke-opacity=".65"/>
  ${compact?'':`<path d="M9 75H37" stroke="#B0AF9F" stroke-width=".8"/><path d="M44 76V79M47 74V79M50 76V79M53 75V79" stroke="#817B65" stroke-width=".75" opacity=".6"/>`}
  <path d="M8 79H18" stroke="#B79346" stroke-width="1"/>
  </g>`;
}

export function apertureArtwork(prefix='p1m') {
  return `<ellipse cx="69" cy="60" rx="37" ry="54" fill="url(#${prefix}-gold-bloom)"/>
  <ellipse cx="60" cy="60" rx="20" ry="41" fill="url(#${prefix}-aperture-depth)" stroke="#594722" stroke-width=".8"/>
  <ellipse cx="60" cy="60" rx="23" ry="45" fill="none" stroke="url(#${prefix}-aperture-rim)" stroke-width="2.8"/>
  <ellipse cx="60" cy="60" rx="27" ry="48" fill="none" stroke="#96773A" stroke-width=".6" opacity=".62"/>
  <path d="M60 15C43 19 37 39 37 60S46 102 60 105" fill="none" stroke="#F0D394" stroke-width=".85"/>
  <path d="M62 23C49 27 44 43 44 60S49 91 59 98" fill="none" stroke="#C39438" stroke-width=".6" opacity=".68"/>
  <path d="M81 30l4 -2M85 44l5 -1M86 60h7M85 76l5 1M81 90l4 2" fill="none" stroke="#A88746" stroke-width=".8"/>
  <ellipse cx="60" cy="60" rx="14" ry="32" fill="url(#${prefix}-aperture-depth)"/>
  <path d="M71 36Q77 60 71 84" stroke="#DABA71" stroke-width=".55" fill="none" opacity=".62"/>`;
}

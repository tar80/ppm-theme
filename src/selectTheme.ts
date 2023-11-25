/* @file Launch the theme selection PPc */

import {info, useLanguage} from '@ppmdev/modules/data.ts';
import {pathSelf} from '@ppmdev/modules/path.ts';
import {isEmptyStr} from '@ppmdev/modules/guard.ts';
import {ppm} from '@ppmdev/modules/ppm.ts';
import {langSelectTheme} from './mod/language.ts';

const THEME_SUBID = 'th_name';
const STYLE_SUBID = 'th_style';
const {parentDir} = pathSelf();
const lang = langSelectTheme[useLanguage()];

const pwd = parentDir.replace(/^(.+)\\dist/, '$1');
const path = `${pwd}\\themes\\screenshots`;
const keyTbl = ppm.setkey(
  'ENTER',
  `*ifmatch ".."%%:*stop%bn%bt%%:*ifmatch !C${info.ppmID},%%n%%:%%K"@ENTER"%%:*stop%bn%bt*script ${parentDir}\\applyTheme.js,%%FX`,
  true
);

const ppcOptions = `-max -lock:on -restoretab:off -single -mps -bootid:${info.ppmID}`;
const mask = '%%:*maskentry -temp ".png"';
const viewstyle = ((): string => {
  let value = ppm.user(STYLE_SUBID);

  return isEmptyStr(value) ? '' : `%%:*viewstyle ${value}`;
})();
const showTheme = ((): string => {
  let value = ppm.user(THEME_SUBID);

  return isEmptyStr(value) ? '' : `%%:*linemessage !"${lang.currentTheme} ${value}`;
})();
PPx.Execute(`*ppc ${ppcOptions} ${path} -k *mapkey use,${keyTbl}${mask}${viewstyle}${showTheme}`);
ppm.linecust({
  label: 'KC_main',
  id: 'CLOSEEVENT',
  sep: ',',
  value: `*ifmatch C${info.ppmID},%n%:*deletecust "${keyTbl}"`,
  esc: true
});

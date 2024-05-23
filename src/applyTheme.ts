/* @file Get colors and apply theme to PPx
 * @arg 0 {string}  - Specify the path of the theme file
 * @arg 1 {string?} - Specify whether the background is dark or not with "yes" or "no"
 */

import '@ppmdev/polyfills/objectKeys.ts';
import {tmp, useLanguage} from '@ppmdev/modules/data.ts';
import fso from '@ppmdev/modules/filesystem.ts';
import {isEmptyStr, isError} from '@ppmdev/modules/guard.ts';
import {readLines, writeLines} from '@ppmdev/modules/io.ts';
import {pathSelf} from '@ppmdev/modules/path.ts';
import {ppm} from '@ppmdev/modules/ppm.ts';
import {langApplyTheme} from './mod/language.ts';
import {getTheme} from './mod/core.ts';

type DarkMode = 'yes' | 'no' | undefined;

const PLUGIN_NAME = 'ppm-theme';
const THEME_SUBID = 'th_name';
const AUTO_MODE = 'th_automode';
const {parentDir} = pathSelf();
const lang = langApplyTheme[useLanguage()];

const main = (): void => {
  const {fileName, hasMode} = adjustArgs();
  const [ok, path] = getJsonPath(fileName);

  if (!ok) {
    ppm.linemessage('.', path, true);
  }

  const resp = hasMode ?? ppm.choice('.', PLUGIN_NAME, `${lang.question} -> ${fileName}`, 'Ync', lang.yes, lang.no);

  if (resp === 'cancel') {
    PPx.Quit(1);
  }

  let [error, data] = readLines({path});

  if (isError(error, data)) {
    throw new Error(data);
  }

  const [themeName, theme] = getTheme(resp, data.lines);

  if (isEmptyStr(themeName)) {
    throw new Error(lang.failedToGetName);
  }

  const tmpDataPath = tmp().file;
  [error, data] = writeLines({path: tmpDataPath, data: theme, overwrite: true, linefeed: '\n'});

  if (error) {
    throw new Error(data);
  }

  const automode = resp === 'yes' ? '0' : '-3';
  const cornerShape = ppm.getcust('X_uxt')[1].replace(/^.+,/, '');
  ppm.user(AUTO_MODE) === '1' && ppm.setcust(`X_uxt=${automode},${cornerShape}`);
  ppm.setuser(THEME_SUBID, themeName);
  ppm.setcust('@%sgu"ppmcache"\\ppm\\unset\\ppm-theme.cfg');
  ppm.setcust(`@${tmpDataPath}`);
  ppm.setcust('@%sgu"ppmcache"\\ppm\\setup\\ppm-theme.cfg');
  loadcustAll();

  !hasMode && ppm.linemessage('.', lang.finish, true);
};

const adjustArgs = (args = PPx.Arguments): {fileName: string; hasMode: DarkMode} => {
  const arr: [string, DarkMode] = ['iceberg-dark', undefined];

  for (let i = 0, k = args.length; i < k; i++) {
    arr[i] = args.Item(i);
  }

  if (!!arr[1]) {
    arr[1] = /^(yes|no)$/.test(arr[1]) ? arr[1] : 'yes';
  }

  return {fileName: arr[0], hasMode: arr[1]};
};

const getJsonPath = (fileName: string): [boolean, string] => {
  const pwd = parentDir.replace(/^(.+)\\dist/, '$1');
  const themeDir = `${pwd}\\themes\\windowsterminal`;
  let path = `${themeDir}\\${fileName}.json`;

  if (!fso.FileExists(path)) {
    const pwd = fso.GetParentFolderName(path);
    const name = fso.GetFileName(path);
    const rgx = /[_-]/g;
    path = `${pwd}\\${name.replace(rgx, ' ')}`;

    if (!fso.FileExists(path)) {
      path = `${pwd}\\${name.replace(rgx, '')}`;

      if (!fso.FileExists(path)) {
        return [false, lang.couldNotGet];
      }
    }
  }

  return [true, path];
};

const loadcustAll = (): void => {
  const ids = PPx.Extract('%*ppxlist(-)').split(',');

  for (const id of ids) {
    if (~id.indexOf('_')) {
      ppm.execute(id, '%%K"@LOADCUST');
    }
  }
};

main();

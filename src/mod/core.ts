const rgxNames = /^(BACKGROUND|FOREGROUND|CURSORCOLOR|SELECTIONBACKGROUND|BRIGHT)/;
const rgxColorCode = /^#[0-9a-zA-Z]{6}$/;
const rgxHex = /^#(..)(..)(..)$/;

export const createShader = (att: BgAttribute, ratio: number): Function => {
  const isLight = att !== 'yes';

  return (b: string, t: string): string => {
    const bHex = parseInt(b, 16);
    const tHex = parseInt(t, 16);
    const shadeHex = isLight ? bHex - (bHex - tHex) * ratio : bHex + (tHex - bHex) * ratio;
    return `0${Math.floor(shadeHex).toString(16)}`.slice(-2);
  };
};

const setShade = (att: BgAttribute, bg: string): Function | void => {
  if (!rgxColorCode.test(bg)) {
    return;
  }

  const SHADE_RATIO = 0.4;
  const base = bg.replace(rgxHex, '$3;$2;$1').split(';');
  const shader = createShader(att, SHADE_RATIO);

  return (item: string): string | void => {
    if (!rgxColorCode.test(item)) {
      return;
    }

    const target = item.replace(rgxHex, '$3;$2;$1').split(';');

    const blue = shader(base[0], target[0]);
    const green = shader(base[1], target[1]);
    const red = shader(base[2], target[2]);

    return `H${blue}${green}${red}`.toUpperCase();
  };
};

export const nameReplacer = (name: string): string =>
  name.replace(rgxNames, (m): string => {
    return {
      BACKGROUND: 'BG',
      FOREGROUND: 'FG',
      CURSORCOLOR: 'CURSOR',
      SELECTIONBACKGROUND: 'SELECTION',
      BRIGHT: 'B'
    }[m as 'BACKGROUND' | 'FOREGROUND' | 'CURSORCOLOR' | 'SELECTIONBACKGROUND' | 'BRIGHT'];
  });

export const valueReplacer = (value: string): string | void => {
  value = value.toUpperCase();

  if (!rgxColorCode.test(value)) {
    return;
  }

  return value.replace(rgxHex, 'H$3$2$1');
};

type BgAttribute = 'yes' | 'no';
export const getTheme = (att: BgAttribute, lines: string[]): [string, string[]] => {
  let themeName = '';
  const theme: string[] = ['A_color\t= {'];
  const colors: Record<string, string> = {};
  const rgx = /^\s*"([^"]+)": "([^"]+)",?$/;

  for (let i = 1, k = lines.length - 1; i < k; i++) {
    const line = lines[i];

    if (~line.indexOf('"name":')) {
      themeName = line.replace(rgx, '$2');
      continue;
    }

    let [name, value] = line.replace(rgx, '$1;$2').split(';');
    name = name.toUpperCase();
    colors[name] = value;
    const hexColor = valueReplacer(value);

    if (!hexColor) {
      throw new Error(`An invalid color was detected. ${themeName}: ${value}`);
    }

    theme.push(`${nameReplacer(name)}\t= ${hexColor}`);
  }

  if (!colors.BACKGROUND) {
    throw new Error(`Could not get the ${themeName} background color.`);
  }

  const shadeColor = setShade(att, colors.BACKGROUND);

  if (!shadeColor) {
    throw new Error(`${themeName} background color shows invalid value`);
  }

  for (const item of Object.keys(colors)) {
    if (rgxNames.test(item)) {
      continue;
    }

    const v = shadeColor(colors[item]);

    if (!v) {
      throw new Error(`${themeName} ${item} shows invalid value`);
    }

    theme.push(`S${item}\t= ${shadeColor(colors[item])}`);
  }

  theme.push('}');

  return [themeName, theme];
};

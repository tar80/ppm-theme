import PPx from '@ppmdev/modules/ppx';
global.PPx = Object.create(PPx);
import {createShader, nameReplacer, valueReplacer, getTheme} from '../core.ts';

describe('createShader()', function () {
  it('non shade', () => {
    const shader = createShader('yes', 1);
    expect(shader('ff', 'ef')).toBe('ef');
  });
  it('shade on dark backgrounds', () => {
    const shader = createShader('yes', 0.2);
    expect(shader('00', 'a0')).toBe('20');
  });
  it('shade on light backgrounds', () => {
    const shader = createShader('no', 0.3);
    expect(shader('ff', '5f')).toBe('cf');
  });
});

describe('nameReplacer()', function () {
  it('various patterns', () => {
    expect(nameReplacer('BACKGROUND')).toBe('BG');
    expect(nameReplacer('BACKGROUNDBRIGHT')).toBe('BGBRIGHT');
    expect(nameReplacer('BRIGHTBACKGROUND')).toBe('BBACKGROUND');
    expect(nameReplacer('BRIGHTBRIGHT')).toBe('BBRIGHT');
  });
});

describe('valueReplacer()', function () {
  it('correct patterns', () => {
    expect(valueReplacer('#123456')).toBe('H563412');
    expect(valueReplacer('#aabbcc')).toBe('HCCBBAA');
  });
  it('invalid patterns', () => {
    expect(valueReplacer('123456')).toBe(undefined);
    expect(valueReplacer('#1234567890')).toBe(undefined);
  });
});

describe('getTheme()', function () {
  const themeItem = [
    '{',
    '"name": "test"',
    '"black": "#000000"',
    '"red": "#a00000"',
    '"green": "#00a000"',
    '"blue": "#0000a0"',
    '"white": "#FFFFFF"',
    '"brightBlack": "#222222"',
    '"brightRed": "#ff0000"',
    '"brightGreen": "#00ff00"',
    '"brightBlue": "#0000ff"',
    '"background": "#111111"',
    '"foreground": "#eeeeee"',
    '"cursorColor": "#bbbbbb"',
    '"selectionBackground": "#eeeeee"',
    '}'
  ];
  const extractedItem = [
    'A_color	= {',
    'BLACK	= H000000',
    'RED	= H0000A0',
    'GREEN	= H00A000',
    'BLUE	= HA00000',
    'WHITE	= HFFFFFF',
    'BBLACK	= H222222',
    'BRED	= H0000FF',
    'BGREEN	= H00FF00',
    'BBLUE	= HFF0000',
    'BG	= H111111',
    'FG	= HEEEEEE',
    'CURSOR	= HBBBBBB',
    'SELECTION	= HEEEEEE',
    'SBLACK	= H0A0A0A',
    'SRED	= H0A0A4A',
    'SGREEN	= H0A4A0A',
    'SBLUE	= H4A0A0A',
    'SWHITE	= H707070',
    '}'
  ];
  it('get dark theme', () => {
    expect(getTheme('yes', themeItem)).toEqual(['test', extractedItem]);
  });
  it('no background color specified in the theme', () => {
    const nobgItem = ['{', '"name": "test"', '"black": "#000000"', '"red": "#a00000"', '}'];
    const receive = 'Could not get the test background color';
    expect(() => getTheme('yes', nobgItem)).toThrow(receive);
  });
  it('invalid hex code', () => {
    const invalidItem = [
      '{',
      '"name": "test"',
      '"black": "#@@??11"',
      '"red": "#a00000"',
      '"background": "#111111"',
      '}'
    ];
    const receive = 'An invalid color was detected. test: #@@??11';
    expect(() => getTheme('yes', invalidItem)).toThrow(receive);
  });
});

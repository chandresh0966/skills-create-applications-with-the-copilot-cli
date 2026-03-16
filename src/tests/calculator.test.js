'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const {
  getHelpText,
  parseNumber,
  normalizeOp,
  parseExpression,
  calculate,
} = require('../calculator');

const SCRIPT = path.resolve(__dirname, '../calculator.js');

function run(...args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
}

// ---------------------------------------------------------------------------
// getHelpText
// ---------------------------------------------------------------------------
describe('getHelpText', () => {
  test('includes all seven operations', () => {
    const help = getHelpText();
    expect(help).toMatch(/addition/i);
    expect(help).toMatch(/subtraction/i);
    expect(help).toMatch(/multiplication/i);
    expect(help).toMatch(/division/i);
    expect(help).toMatch(/modulo/i);
    expect(help).toMatch(/exponentiation/i);
    expect(help).toMatch(/square root/i);
  });
});

// ---------------------------------------------------------------------------
// normalizeOp
// ---------------------------------------------------------------------------
describe('normalizeOp', () => {
  const cases = [
    ['+', 'add'], ['add', 'add'], ['plus', 'add'],
    ['-', 'sub'], ['sub', 'sub'], ['minus', 'sub'],
    ['*', 'mul'], ['x', 'mul'], ['×', 'mul'], ['mul', 'mul'], ['times', 'mul'],
    ['/', 'div'], ['÷', 'div'], ['div', 'div'], ['divide', 'div'],
    ['%', 'mod'], ['mod', 'mod'], ['modulo', 'mod'],
    ['^', 'pow'], ['**', 'pow'], ['pow', 'pow'], ['power', 'pow'],
    ['sqrt', 'sqrt'], ['squareroot', 'sqrt'],
  ];
  test.each(cases)('normalizeOp("%s") → "%s"', (input, expected) => {
    expect(normalizeOp(input)).toBe(expected);
  });

  test('throws for unsupported operator', () => {
    expect(() => normalizeOp('unknown')).toThrow();
    expect(() => normalizeOp('!')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// parseNumber
// ---------------------------------------------------------------------------
describe('parseNumber', () => {
  test('parses valid integers', () => {
    expect(parseNumber('42', 'a')).toBe(42);
    expect(parseNumber('-7', 'a')).toBe(-7);
    expect(parseNumber('0', 'a')).toBe(0);
  });

  test('parses valid decimals', () => {
    expect(parseNumber('3.14', 'a')).toBeCloseTo(3.14);
  });

  test('throws on non-numeric input', () => {
    expect(() => parseNumber('abc', 'a')).toThrow(/Invalid number/);
    expect(() => parseNumber('', 'a')).toThrow(/Invalid number/);
  });

  test('throws on Infinity', () => {
    expect(() => parseNumber('Infinity', 'a')).toThrow(/Invalid number/);
  });
});

// ---------------------------------------------------------------------------
// calculate – basic arithmetic
// ---------------------------------------------------------------------------
describe('calculate – basic arithmetic', () => {
  test('addition', () => expect(calculate('add', 2, 3)).toBe(5));
  test('subtraction', () => expect(calculate('sub', 10, 4)).toBe(6));
  test('multiplication', () => expect(calculate('mul', 45, 2)).toBe(90));
  test('division', () => expect(calculate('div', 20, 5)).toBe(4));
  test('division by zero throws', () => {
    expect(() => calculate('div', 5, 0)).toThrow(/division by zero/i);
  });
});

// ---------------------------------------------------------------------------
// calculate – modulo
// ---------------------------------------------------------------------------
describe('calculate – modulo', () => {
  test('10 % 3 = 1', () => expect(calculate('mod', 10, 3)).toBe(1));
  test('15 % 4 = 3', () => expect(calculate('mod', 15, 4)).toBe(3));
  test('7 % 7 = 0', () => expect(calculate('mod', 7, 7)).toBe(0));
  test('modulo by zero throws', () => {
    expect(() => calculate('mod', 5, 0)).toThrow(/modulo by zero/i);
  });
});

// ---------------------------------------------------------------------------
// calculate – exponentiation
// ---------------------------------------------------------------------------
describe('calculate – exponentiation', () => {
  test('2 ^ 8 = 256', () => expect(calculate('pow', 2, 8)).toBe(256));
  test('3 ^ 3 = 27', () => expect(calculate('pow', 3, 3)).toBe(27));
  test('5 ^ 0 = 1', () => expect(calculate('pow', 5, 0)).toBe(1));
  test('2 ^ -1 = 0.5', () => expect(calculate('pow', 2, -1)).toBe(0.5));
});

// ---------------------------------------------------------------------------
// calculate – square root
// ---------------------------------------------------------------------------
describe('calculate – square root', () => {
  test('sqrt(16) = 4', () => expect(calculate('sqrt', 16)).toBe(4));
  test('sqrt(9) = 3', () => expect(calculate('sqrt', 9)).toBe(3));
  test('sqrt(2) ≈ 1.414', () => expect(calculate('sqrt', 2)).toBeCloseTo(1.414, 3));
  test('sqrt(0) = 0', () => expect(calculate('sqrt', 0)).toBe(0));
  test('sqrt of negative number throws', () => {
    expect(() => calculate('sqrt', -1)).toThrow(/negative/i);
  });
});

// ---------------------------------------------------------------------------
// calculate – unsupported op
// ---------------------------------------------------------------------------
describe('calculate – unsupported op', () => {
  test('throws for unknown canonical op', () => {
    expect(() => calculate('unknown', 1, 2)).toThrow(/unsupported operation/i);
  });
});

// ---------------------------------------------------------------------------
// parseExpression
// ---------------------------------------------------------------------------
describe('parseExpression', () => {
  test('infix: a + b', () => {
    expect(parseExpression(['7', '+', '3'])).toEqual({ op: 'add', a: 7, b: 3 });
  });
  test('prefix: add a b', () => {
    expect(parseExpression(['add', '7', '3'])).toEqual({ op: 'add', a: 7, b: 3 });
  });
  test('infix: modulo', () => {
    expect(parseExpression(['10', '%', '3'])).toEqual({ op: 'mod', a: 10, b: 3 });
  });
  test('infix: exponentiation', () => {
    expect(parseExpression(['2', '^', '8'])).toEqual({ op: 'pow', a: 2, b: 8 });
  });
  test('prefix: sqrt a b (unary; b ignored)', () => {
    const result = parseExpression(['sqrt', '16', 'extra']);
    expect(result.op).toBe('sqrt');
    expect(result.a).toBe(16);
  });
  test('two-token: sqrt 9', () => {
    expect(parseExpression(['sqrt', '9'])).toEqual({ op: 'sqrt', a: 9, b: undefined });
  });
  test('two-token: 9 sqrt', () => {
    expect(parseExpression(['9', 'sqrt'])).toEqual({ op: 'sqrt', a: 9, b: undefined });
  });
  test('throws with no arguments', () => {
    expect(() => parseExpression([])).toThrow(/no arguments/i);
  });
  test('throws with too many arguments', () => {
    expect(() => parseExpression(['1', '+', '2', '3', '4'])).toThrow();
  });
  test('throws for invalid two-token expression', () => {
    expect(() => parseExpression(['1', '2'])).toThrow();
  });
});

// ---------------------------------------------------------------------------
// CLI integration tests
// ---------------------------------------------------------------------------
describe('CLI – basic arithmetic', () => {
  test('2 + 3 = 5', () => {
    const r = run('2', '+', '3');
    expect(r.stdout.trim()).toBe('5');
    expect(r.status).toBe(0);
  });
  test('10 - 4 = 6', () => {
    expect(run('10', '-', '4').stdout.trim()).toBe('6');
  });
  test('45 * 2 = 90', () => {
    expect(run('45', '*', '2').stdout.trim()).toBe('90');
  });
  test('20 / 5 = 4', () => {
    expect(run('20', '/', '5').stdout.trim()).toBe('4');
  });
  test('division by zero exits non-zero', () => {
    const r = run('5', '/', '0');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/division by zero/i);
  });
});

describe('CLI – modulo', () => {
  test('10 % 3 = 1', () => {
    expect(run('10', '%', '3').stdout.trim()).toBe('1');
  });
  test('mod prefix: mod 15 4 = 3', () => {
    expect(run('mod', '15', '4').stdout.trim()).toBe('3');
  });
  test('modulo by zero exits non-zero', () => {
    const r = run('5', '%', '0');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/modulo by zero/i);
  });
});

describe('CLI – exponentiation', () => {
  test('2 ^ 8 = 256', () => {
    expect(run('2', '^', '8').stdout.trim()).toBe('256');
  });
  test('pow prefix: pow 3 3 = 27', () => {
    expect(run('pow', '3', '3').stdout.trim()).toBe('27');
  });
  test('** alias: 2 ** 10 = 1024', () => {
    expect(run('2', '**', '10').stdout.trim()).toBe('1024');
  });
});

describe('CLI – square root', () => {
  test('sqrt 16 = 4', () => {
    expect(run('sqrt', '16').stdout.trim()).toBe('4');
  });
  test('sqrt 9 = 3', () => {
    expect(run('sqrt', '9').stdout.trim()).toBe('3');
  });
  test('square root of negative exits non-zero', () => {
    const r = run('sqrt', '-1');
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/negative/i);
  });
});

describe('CLI – help', () => {
  test('--help exits 0', () => {
    const r = run('--help');
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/sqrt/i);
  });
  test('-h exits 0', () => {
    expect(run('-h').status).toBe(0);
  });
  test('no args shows help', () => {
    const r = run();
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/usage/i);
  });
});

describe('CLI – invalid input', () => {
  test('invalid operator exits non-zero', () => {
    const r = run('5', '!', '3');
    expect(r.status).not.toBe(0);
  });
  test('non-numeric operand exits non-zero', () => {
    const r = run('abc', '+', '3');
    expect(r.status).not.toBe(0);
  });
});

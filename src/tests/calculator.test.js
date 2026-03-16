'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  getHelpText,
  parseNumber,
  normalizeOp,
  parseExpression,
  modulo,
  power,
  squareRoot,
  calculate,
} = require('../calculator');

describe('calculator help text', () => {
  test('mentions the supported operations', () => {
    const help = getHelpText();
    expect(help).toContain('Operations:');
    expect(help).toContain('+');
    expect(help).toContain('addition');
    expect(help).toContain('-');
    expect(help).toContain('subtraction');
    expect(help).toContain('*');
    expect(help).toContain('multiplication');
    expect(help).toContain('/');
    expect(help).toContain('division');
    expect(help).toContain('%');
    expect(help).toContain('modulo');
    expect(help).toContain('**');
    expect(help).toContain('power');
    expect(help).toContain('sqrt');
    expect(help).toContain('square root');
  });
});

describe('normalizeOp', () => {
  test.each([
    ['+', 'add'],
    ['add', 'add'],
    ['plus', 'add'],

    ['-', 'sub'],
    ['sub', 'sub'],
    ['subtract', 'sub'],
    ['minus', 'sub'],

    ['*', 'mul'],
    ['x', 'mul'],
    ['×', 'mul'],
    ['mul', 'mul'],
    ['multiply', 'mul'],
    ['times', 'mul'],

    ['/', 'div'],
    ['÷', 'div'],
    ['div', 'div'],
    ['divide', 'div'],

    ['%', 'mod'],
    ['mod', 'mod'],
    ['modulo', 'mod'],

    ['**', 'pow'],
    ['^', 'pow'],
    ['pow', 'pow'],
    ['power', 'pow'],
    ['exp', 'pow'],

    ['sqrt', 'sqrt'],
    ['√', 'sqrt'],
  ])('maps %p -> %p', (raw, expected) => {
    expect(normalizeOp(raw)).toBe(expected);
  });

  test('returns null for unsupported operations', () => {
    expect(normalizeOp('***')).toBeNull();
    expect(normalizeOp('nope')).toBeNull();
    expect(normalizeOp('')).toBeNull();
  });
});

describe('parseNumber', () => {
  test('parses numeric inputs', () => {
    expect(parseNumber('3', 'n')).toBe(3);
    expect(parseNumber('3.5', 'n')).toBe(3.5);
    expect(parseNumber('-2', 'n')).toBe(-2);
  });

  test('rejects invalid numbers', () => {
    expect(() => parseNumber('abc', 'n')).toThrow(/Invalid n number/);
    expect(() => parseNumber('NaN', 'n')).toThrow(/Invalid n number/);
  });
});

describe('modulo', () => {
  test('returns the remainder', () => {
    expect(modulo(10, 3)).toBe(1);
  });

  test('modulo by zero throws', () => {
    expect(() => modulo(10, 0)).toThrow(/Modulo by zero/);
  });
});

describe('power', () => {
  test('raises base to exponent', () => {
    expect(power(2, 8)).toBe(256);
  });
});

describe('squareRoot', () => {
  test('computes square root', () => {
    expect(squareRoot(9)).toBe(3);
  });

  test('negative numbers throw', () => {
    expect(() => squareRoot(-1)).toThrow(/Square root of negative numbers/);
  });
});

describe('calculate', () => {
  test('addition', () => {
    expect(calculate('add', 2, 3)).toBe(5);
  });

  test('subtraction', () => {
    expect(calculate('sub', 10, 4)).toBe(6);
  });

  test('multiplication', () => {
    expect(calculate('mul', 45, 2)).toBe(90);
  });

  test('division', () => {
    expect(calculate('div', 20, 5)).toBe(4);
  });

  test('division by zero throws', () => {
    expect(() => calculate('div', 7, 0)).toThrow(/Division by zero/);
  });

  test('modulo', () => {
    expect(calculate('mod', 10, 3)).toBe(1);
  });

  test('power', () => {
    expect(calculate('pow', 2, 8)).toBe(256);
  });

  test('square root', () => {
    expect(calculate('sqrt', 9)).toBe(3);
  });

  test('unsupported operation throws', () => {
    expect(() => calculate('nope', 2, 3)).toThrow(/Unsupported operation/);
  });
});

describe('parseExpression', () => {
  test('supports infix format: a op b', () => {
    expect(parseExpression(['2', '+', '3'])).toEqual({ op: 'add', a: 2, b: 3 });
    expect(parseExpression(['10', '-', '4'])).toEqual({ op: 'sub', a: 10, b: 4 });
    expect(parseExpression(['45', '*', '2'])).toEqual({ op: 'mul', a: 45, b: 2 });
    expect(parseExpression(['20', '/', '5'])).toEqual({ op: 'div', a: 20, b: 5 });
    expect(parseExpression(['5', '%', '2'])).toEqual({ op: 'mod', a: 5, b: 2 });
    expect(parseExpression(['10', '%', '3'])).toEqual({ op: 'mod', a: 10, b: 3 });
    expect(parseExpression(['2', '**', '8'])).toEqual({ op: 'pow', a: 2, b: 8 });
    expect(parseExpression(['2', '^', '3'])).toEqual({ op: 'pow', a: 2, b: 3 });
  });

  test('supports prefix format: op a b', () => {
    expect(parseExpression(['add', '2', '3'])).toEqual({ op: 'add', a: 2, b: 3 });
    expect(parseExpression(['divide', '20', '5'])).toEqual({ op: 'div', a: 20, b: 5 });
    expect(parseExpression(['mod', '10', '3'])).toEqual({ op: 'mod', a: 10, b: 3 });
    expect(parseExpression(['pow', '2', '8'])).toEqual({ op: 'pow', a: 2, b: 8 });
  });

  test('supports unary format: sqrt n', () => {
    expect(parseExpression(['sqrt', '9'])).toEqual({ op: 'sqrt', a: 9 });
  });

  test('rejects unsupported operations', () => {
    expect(() => parseExpression(['nope', '2', '3'])).toThrow(/Unsupported operation/);
    expect(() => parseExpression(['sqrt', '2', '3'])).toThrow(/Unsupported operation/);
  });

  test('rejects incorrect argument counts', () => {
    expect(() => parseExpression(['pow', '2'])).toThrow(/Expected 3 arguments/);
  });

  test('rejects invalid numeric inputs', () => {
    expect(() => parseExpression(['2', '+', 'nope'])).toThrow(/Invalid second number/);
    expect(() => parseExpression(['sqrt', 'nope'])).toThrow(/Invalid argument number/);
  });
});

describe('CLI integration', () => {
  function runCli(args) {
    const script = path.join(__dirname, '..', 'calculator.js');
    return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  }

  test('computes basic operations', () => {
    expect(runCli(['2', '+', '3']).status).toBe(0);
    expect(runCli(['2', '+', '3']).stdout).toBe('5\n');

    expect(runCli(['10', '-', '4']).stdout).toBe('6\n');
    expect(runCli(['45', '*', '2']).stdout).toBe('90\n');
    expect(runCli(['20', '/', '5']).stdout).toBe('4\n');
  });

  test('computes extended operations from the example image', () => {
    // modulo with 5 % 2
    expect(runCli(['5', '%', '2']).status).toBe(0);
    expect(runCli(['5', '%', '2']).stdout).toBe('1\n');

    // power with 2 ^ 3
    expect(runCli(['2', '^', '3']).status).toBe(0);
    expect(runCli(['2', '^', '3']).stdout).toBe('8\n');

    // square root with √16 (as: √ 16)
    expect(runCli(['√', '16']).status).toBe(0);
    expect(runCli(['√', '16']).stdout).toBe('4\n');
  });

  test('computes modulo and power (additional)', () => {
    expect(runCli(['10', '%', '3']).status).toBe(0);
    expect(runCli(['10', '%', '3']).stdout).toBe('1\n');

    expect(runCli(['2', '**', '8']).status).toBe(0);
    expect(runCli(['2', '**', '8']).stdout).toBe('256\n');
  });

  test('computes square root (unary)', () => {
    expect(runCli(['sqrt', '9']).status).toBe(0);
    expect(runCli(['sqrt', '9']).stdout).toBe('3\n');
  });

  test('division by zero exits non-zero with a friendly error', () => {
    const res = runCli(['7', '/', '0']);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Division by zero is not allowed/);
  });

  test('modulo by zero exits non-zero with a friendly error', () => {
    const res = runCli(['10', '%', '0']);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Modulo by zero is not allowed/);
  });

  test('sqrt of a negative number exits non-zero with a friendly error', () => {
    const res = runCli(['sqrt', '-1']);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Square root of negative numbers is not allowed/);
  });
});

'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  getHelpText,
  parseNumber,
  normalizeOp,
  parseExpression,
  calculate,
} = require('../calculator');

describe('calculator help text', () => {
  test('mentions the four supported operations', () => {
    const help = getHelpText();
    expect(help).toContain('Operations:');
    expect(help).toContain('+   addition');
    expect(help).toContain('-   subtraction');
    expect(help).toContain('*   multiplication');
    expect(help).toContain('/   division');
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
  ])('maps %p -> %p', (raw, expected) => {
    expect(normalizeOp(raw)).toBe(expected);
  });

  test('returns null for unsupported operations', () => {
    expect(normalizeOp('**')).toBeNull();
    expect(normalizeOp('mod')).toBeNull();
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

  test('unsupported operation throws', () => {
    expect(() => calculate('pow', 2, 3)).toThrow(/Unsupported operation/);
  });
});

describe('parseExpression', () => {
  test('supports infix format: a op b', () => {
    expect(parseExpression(['2', '+', '3'])).toEqual({ op: 'add', a: 2, b: 3 });
    expect(parseExpression(['10', '-', '4'])).toEqual({ op: 'sub', a: 10, b: 4 });
    expect(parseExpression(['45', '*', '2'])).toEqual({ op: 'mul', a: 45, b: 2 });
    expect(parseExpression(['20', '/', '5'])).toEqual({ op: 'div', a: 20, b: 5 });
  });

  test('supports prefix format: op a b', () => {
    expect(parseExpression(['add', '2', '3'])).toEqual({ op: 'add', a: 2, b: 3 });
    expect(parseExpression(['divide', '20', '5'])).toEqual({ op: 'div', a: 20, b: 5 });
  });

  test('rejects unsupported operations', () => {
    expect(() => parseExpression(['**', '2', '3'])).toThrow(/Unsupported operation/);
  });

  test('rejects invalid numeric inputs', () => {
    expect(() => parseExpression(['2', '+', 'nope'])).toThrow(/Invalid second number/);
  });
});

describe('CLI integration', () => {
  function runCli(args) {
    const script = path.join(__dirname, '..', 'calculator.js');
    return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  }

  test('computes the example operations from the image', () => {
    expect(runCli(['2', '+', '3']).status).toBe(0);
    expect(runCli(['2', '+', '3']).stdout).toBe('5\n');

    expect(runCli(['10', '-', '4']).stdout).toBe('6\n');
    expect(runCli(['45', '*', '2']).stdout).toBe('90\n');
    expect(runCli(['20', '/', '5']).stdout).toBe('4\n');
  });

  test('division by zero exits non-zero with a friendly error', () => {
    const res = runCli(['7', '/', '0']);
    expect(res.status).toBe(1);
    expect(res.stderr).toMatch(/Division by zero is not allowed/);
  });
});

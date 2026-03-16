#!/usr/bin/env node
'use strict';

/*
 * CLI Calculator (basic arithmetic)
 *
 * Supported operations (and synonyms):
 * - Addition:       +, add, plus
 * - Subtraction:    -, sub, subtract, minus
 * - Multiplication: *, x, ×, mul, multiply, times
 * - Division:       /, ÷, div, divide
 *
 * Examples:
 *   node src/calculator.js 7 + 3
 *   node src/calculator.js add 7 3
 */

function getHelpText() {
  return [
    'Usage:',
    '  calculator <a> <op> <b>',
    '  calculator <op> <a> <b>',
    '  calculator sqrt <n>',
    '',
    'Operations:',
    '  +    addition',
    '  -    subtraction',
    '  *    multiplication',
    '  /    division',
    '  %    modulo (remainder)',
    '  **   exponentiation (power)',
    '  sqrt square root',
    '',
    'Examples:',
    '  node src/calculator.js 10 / 2',
    '  node src/calculator.js multiply 6 7',
    '  node src/calculator.js 10 % 3',
    '  node src/calculator.js 2 ** 8',
    '  node src/calculator.js 2 ^ 8',
    '  node src/calculator.js sqrt 9',
    '',
    'Notes:',
    '  Division by zero is not allowed.',
    '  Modulo by zero is not allowed.',
    '  Square root of negative numbers is not allowed.',
  ].join('\n');
}

function printHelp(exitCode = 0) {
  const out = exitCode === 0 ? process.stdout : process.stderr;
  out.write(getHelpText() + '\n');
  process.exit(exitCode);
}

function parseNumber(raw, label) {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${label} number: ${JSON.stringify(raw)}`);
  }
  return n;
}

function normalizeOp(raw) {
  const op = String(raw).trim().toLowerCase();

  // Map all allowed synonyms into one of:
  // add | sub | mul | div | mod | pow | sqrt
  const table = new Map([
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
  ]);

  return table.get(op) ?? null;
}

function modulo(a, b) {
  if (b === 0) {
    throw new Error('Modulo by zero is not allowed.');
  }
  return a % b;
}

function power(base, exponent) {
  return base ** exponent;
}

function squareRoot(n) {
  if (n < 0) {
    throw new Error('Square root of negative numbers is not allowed.');
  }
  return Math.sqrt(n);
}

function calculate(op, a, b) {
  switch (op) {
    case 'add':
      return a + b;
    case 'sub':
      return a - b;
    case 'mul':
      return a * b;
    case 'div':
      if (b === 0) {
        throw new Error('Division by zero is not allowed.');
      }
      return a / b;
    case 'mod':
      return modulo(a, b);
    case 'pow':
      return power(a, b);
    case 'sqrt':
      return squareRoot(a);
    default:
      throw new Error(`Unsupported operation: ${JSON.stringify(op)}`);
  }
}

function parseExpression(args) {
  if (!Array.isArray(args) || (args.length !== 3 && args.length !== 2)) {
    throw new Error('Expected 3 arguments for binary ops or 2 arguments for unary ops. Use --help for usage.');
  }

  // Unary: sqrt <n>
  if (args.length === 2) {
    const op = normalizeOp(args[0]);
    if (op !== 'sqrt') {
      throw new Error('Expected 3 arguments for binary ops or 2 arguments for unary ops. Use --help for usage.');
    }

    const a = parseNumber(args[1], 'argument');
    return { op, a };
  }

  // Binary: support both formats:
  //   1) a op b
  //   2) op a b
  let aRaw;
  let opRaw;
  let bRaw;

  const maybeOpMiddle = normalizeOp(args[1]);
  if (maybeOpMiddle) {
    aRaw = args[0];
    opRaw = args[1];
    bRaw = args[2];
  } else {
    opRaw = args[0];
    aRaw = args[1];
    bRaw = args[2];
  }

  const op = normalizeOp(opRaw);
  if (!op || op === 'sqrt') {
    throw new Error(`Unsupported operation: ${JSON.stringify(opRaw)}. Use --help for supported operations.`);
  }

  const a = parseNumber(aRaw, 'first');
  const b = parseNumber(bRaw, 'second');

  return { op, a, b };
}

function main(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp(0);
  }

  const { op, a, b } = parseExpression(args);
  const result = calculate(op, a, b);
  process.stdout.write(String(result) + '\n');
}

module.exports = {
  getHelpText,
  parseNumber,
  normalizeOp,
  parseExpression,
  modulo,
  power,
  squareRoot,
  calculate,
  main,
};

if (require.main === module) {
  try {
    main(process.argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
}

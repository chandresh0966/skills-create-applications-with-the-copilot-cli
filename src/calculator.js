#!/usr/bin/env node
/**
 * calculator.js - Node.js CLI Calculator
 *
 * Supported operations:
 *   addition       (+, add, plus)
 *   subtraction    (-, sub, minus)
 *   multiplication (*, x, ×, mul, times)
 *   division       (/, ÷, div, divide)
 *   modulo         (%, mod, modulo)
 *   exponentiation (^, **, pow, power)
 *   square root    (sqrt, squareroot) - single operand
 */

'use strict';

/**
 * Returns the help text string.
 * @returns {string}
 */
function getHelpText() {
  return `Usage:
  node calculator.js <a> <op> <b>     (infix)
  node calculator.js <op> <a> <b>     (prefix, two-operand ops)
  node calculator.js sqrt <a>          (square root)

Operations:
  addition:        +  add  plus
  subtraction:     -  sub  minus
  multiplication:  *  x  ×  mul  times
  division:        /  ÷  div  divide
  modulo:          %  mod  modulo
  exponentiation:  ^  **  pow  power
  square root:     sqrt  squareroot

Examples:
  node calculator.js 7 + 3
  node calculator.js add 7 3
  node calculator.js 10 % 3
  node calculator.js 2 ^ 8
  node calculator.js sqrt 16`;
}

/**
 * Prints help text and exits.
 * @param {number} [exitCode=0]
 */
function printHelp(exitCode = 0) {
  console.log(getHelpText());
  process.exit(exitCode);
}

/**
 * Parses and validates a numeric argument.
 * @param {string} raw
 * @param {string} label
 * @returns {number}
 */
function parseNumber(raw, label) {
  if (raw === '' || raw == null) {
    throw new Error(`Invalid number for ${label}: "${raw}"`);
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid number for ${label}: "${raw}"`);
  }
  return n;
}

/**
 * Normalises an operator string to a canonical key.
 * @param {string} raw
 * @returns {string} One of: add | sub | mul | div | mod | pow | sqrt
 */
function normalizeOp(raw) {
  switch (raw.toLowerCase()) {
    case '+':
    case 'add':
    case 'plus':
      return 'add';
    case '-':
    case 'sub':
    case 'minus':
      return 'sub';
    case '*':
    case 'x':
    case '×':
    case 'mul':
    case 'times':
      return 'mul';
    case '/':
    case '÷':
    case 'div':
    case 'divide':
      return 'div';
    case '%':
    case 'mod':
    case 'modulo':
      return 'mod';
    case '^':
    case '**':
    case 'pow':
    case 'power':
      return 'pow';
    case 'sqrt':
    case 'squareroot':
      return 'sqrt';
    default:
      throw new Error(`Unsupported operation: "${raw}"`);
  }
}

/**
 * Performs the arithmetic calculation.
 * @param {string} op  Canonical operator (add|sub|mul|div|mod|pow|sqrt)
 * @param {number} a
 * @param {number} [b]  Not required for sqrt
 * @returns {number}
 */
function calculate(op, a, b) {
  switch (op) {
    case 'add': return a + b;
    case 'sub': return a - b;
    case 'mul': return a * b;
    case 'div':
      if (b === 0) throw new Error('Division by zero is not allowed');
      return a / b;
    case 'mod':
      if (b === 0) throw new Error('Modulo by zero is not allowed');
      return a % b;
    case 'pow': return Math.pow(a, b);
    case 'sqrt':
      if (a < 0) throw new Error('Square root of a negative number is not allowed');
      return Math.sqrt(a);
    default:
      throw new Error(`Unsupported operation: "${op}"`);
  }
}

/**
 * Parses the CLI argument list into { op, a, b }.
 * Supports:
 *   infix  : a op b
 *   prefix : op a b
 *   unary  : sqrt a  (or  a sqrt)
 * @param {string[]} args
 * @returns {{ op: string, a: number, b: number|undefined }}
 */
function parseExpression(args) {
  if (args.length === 0) {
    throw new Error('No arguments provided');
  }

  // Unary sqrt shorthand: single token (not a number) with one number
  // Detect if first token is operator or second is operator
  const [first, second, third] = args;

  // Two-token: sqrt <a> or <a> sqrt
  if (args.length === 2) {
    // "sqrt 16" or "squareroot 16"
    try {
      const op = normalizeOp(first);
      if (op === 'sqrt') {
        const a = parseNumber(second, 'a');
        return { op, a, b: undefined };
      }
    } catch (_) { /* not an operator first */ }
    // "16 sqrt"
    try {
      const op = normalizeOp(second);
      if (op === 'sqrt') {
        const a = parseNumber(first, 'a');
        return { op, a, b: undefined };
      }
    } catch (_) { /* not an operator second */ }
    throw new Error('Invalid expression. Use: <a> <op> <b> or <op> <a> <b>');
  }

  if (args.length === 3) {
    // Try infix: a op b
    const maybeInfixOp = normalizeOpSafe(second);
    if (maybeInfixOp) {
      const a = parseNumber(first, 'a');
      const op = maybeInfixOp;
      if (op === 'sqrt') {
        // "a sqrt b" does not make sense; ignore b and warn? Treat as unary.
        return { op, a, b: undefined };
      }
      const b = parseNumber(third, 'b');
      return { op, a, b };
    }

    // Try prefix: op a b
    const maybePrefixOp = normalizeOpSafe(first);
    if (maybePrefixOp) {
      const op = maybePrefixOp;
      const a = parseNumber(second, 'a');
      if (op === 'sqrt') {
        // prefix unary: sqrt a  (ignore third argument)
        return { op, a, b: undefined };
      }
      const b = parseNumber(third, 'b');
      return { op, a, b };
    }

    throw new Error('Invalid expression. Use: <a> <op> <b> or <op> <a> <b>');
  }

  throw new Error('Too many arguments. Use: <a> <op> <b> or <op> <a> <b>');
}

/**
 * normalizeOp that returns null instead of throwing.
 * @param {string} raw
 * @returns {string|null}
 */
function normalizeOpSafe(raw) {
  try {
    return normalizeOp(raw);
  } catch (_) {
    return null;
  }
}

/**
 * CLI entry point.
 * @param {string[]} argv  process.argv
 */
function main(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp(0);
  }

  let op, a, b;
  try {
    ({ op, a, b } = parseExpression(args));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error('Run with --help for usage.');
    process.exit(1);
  }

  let result;
  try {
    result = calculate(op, a, b);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  console.log(result);
}

module.exports = {
  getHelpText,
  parseNumber,
  normalizeOp,
  normalizeOpSafe,
  parseExpression,
  calculate,
  main,
};

if (require.main === module) {
  try {
    main(process.argv);
  } catch (err) {
    console.error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

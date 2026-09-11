// Reads tokens/tokens.json directly for structure, order, and $description,
// and cross-checks every CSS variable name it derives against the real
// generated build/css/tokens.css so a naming mismatch fails loudly instead of
// silently rendering the wrong (or no) value.
import tokensJson from '../../tokens/tokens.json';
import generatedCss from '../../build/css/tokens.css?raw';

export const NO_DESCRIPTION = 'No description in tokens.json.';

type TokenNode = {
  $type?: string;
  $value?: unknown;
  $description?: string;
  [key: string]: unknown;
};

export interface FoundationToken {
  /** Dotted path, e.g. "color.interactive.primary". */
  name: string;
  /** CSS custom property name, e.g. "--color-interactive-primary". */
  cssVar: string;
  type?: string;
  /** Human-readable resolved value, following any {alias} references. */
  resolvedValue: string;
  description: string;
}

const knownCssVars = new Set(
  Array.from(generatedCss.matchAll(/--([a-z0-9-]+):/g)).map((m) => m[1])
);

function isTokenLeaf(node: unknown): node is TokenNode {
  return typeof node === 'object' && node !== null && '$value' in (node as object);
}

function toCssVarName(path: string[]): string {
  const words = path
    .flatMap((segment) =>
      segment
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/\s+/)
        .filter(Boolean)
    )
    .map((word) => word.toLowerCase());
  const name = words.join('-');
  if (!knownCssVars.has(name)) {
    throw new Error(
      `Foundations story: computed CSS var --${name} for token "${path.join('.')}" but ` +
        `build/css/tokens.css has no such variable. Run "npm run tokens" or check the naming logic.`
    );
  }
  return name;
}

function resolveValue(node: TokenNode, root: TokenNode): unknown {
  let value: unknown = node.$value;
  const seen = new Set<string>();
  while (typeof value === 'string' && /^\{.+\}$/.test(value)) {
    const refPath = value.slice(1, -1);
    if (seen.has(refPath)) {
      throw new Error(`Foundations story: circular token reference at {${refPath}}`);
    }
    seen.add(refPath);
    const target = refPath
      .split('.')
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], root);
    if (!target || typeof target !== 'object') {
      throw new Error(`Foundations story: broken token reference {${refPath}}`);
    }
    value = (target as TokenNode).$value;
  }
  return value;
}

function formatValue(type: string | undefined, value: unknown): string {
  if (type === 'color' && typeof value === 'object' && value !== null && 'hex' in value) {
    const v = value as { hex: string; alpha?: number };
    return v.alpha !== undefined && v.alpha < 1
      ? `${v.hex} @ ${Math.round(v.alpha * 100)}% alpha`
      : v.hex;
  }
  if (type === 'dimension' && typeof value === 'object' && value !== null && 'value' in value) {
    const v = value as { value: number; unit: string };
    return `${v.value}${v.unit}`;
  }
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  return JSON.stringify(value);
}

function collect(node: TokenNode, path: string[], root: TokenNode, out: FoundationToken[]) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const nextPath = [...path, key];
    if (isTokenLeaf(child)) {
      const cssVar = toCssVarName(nextPath);
      out.push({
        name: nextPath.join('.'),
        cssVar: `--${cssVar}`,
        type: child.$type,
        resolvedValue: formatValue(child.$type, resolveValue(child, root)),
        description: child.$description ?? NO_DESCRIPTION,
      });
    } else if (typeof child === 'object' && child !== null) {
      collect(child as TokenNode, nextPath, root, out);
    }
  }
}

const root = tokensJson as unknown as TokenNode;

// Every direct child of `color` that isn't one of the raw palette scales is a
// semantic group (background, interactive, text, border, ...). Reading it off
// the real structure, rather than a hardcoded list, means a new semantic
// group in tokens.json shows up here automatically.
const PRIMITIVE_PALETTES = new Set([
  'navy', 'neutral', 'violet', 'green', 'red', 'coral', 'blue', 'magenta', 'gold', 'alpha', 'black',
]);

export function getSemanticColorGroups(): { group: string; tokens: FoundationToken[] }[] {
  const colorNode = root.color as TokenNode;
  return Object.keys(colorNode)
    .filter((key) => !PRIMITIVE_PALETTES.has(key))
    .map((group) => {
      const out: FoundationToken[] = [];
      collect(colorNode[group] as TokenNode, ['color', group], root, out);
      return { group, tokens: out };
    });
}

/** font.Greed's named text styles, in the scale order already authored in tokens.json. */
export function getTextStyles(): FoundationToken[] {
  const out: FoundationToken[] = [];
  collect((root.font as TokenNode).Greed as TokenNode, ['font', 'Greed'], root, out);
  return out;
}

function parsePx(resolvedValue: string): number {
  return parseFloat(resolvedValue);
}

/** size.space, split into a positive scale and the negative-margin values, each in ascending magnitude. */
export function getSpacingScale(): { positive: FoundationToken[]; negative: FoundationToken[] } {
  const out: FoundationToken[] = [];
  collect((root.size as TokenNode).space as TokenNode, ['size', 'space'], root, out);
  const positive = out.filter((t) => parsePx(t.resolvedValue) >= 0).sort((a, b) => parsePx(a.resolvedValue) - parsePx(b.resolvedValue));
  const negative = out
    .filter((t) => parsePx(t.resolvedValue) < 0)
    .sort((a, b) => Math.abs(parsePx(a.resolvedValue)) - Math.abs(parsePx(b.resolvedValue)));
  return { positive, negative };
}

/** size.radius, ascending. */
export function getRadiusScale(): FoundationToken[] {
  const out: FoundationToken[] = [];
  collect((root.size as TokenNode).radius as TokenNode, ['size', 'radius'], root, out);
  return out.sort((a, b) => parsePx(a.resolvedValue) - parsePx(b.resolvedValue));
}

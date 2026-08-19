// The two rules that make a module jettisonable, as an oxlint plugin.
//
//   layer-dependencies — imports flow one way: app → modules → shared → core
//   module-privacy     — a module is reachable only through its index.ts
//
// No module resolution is involved, and none is needed: a layer is a path prefix
// and an alias is a path prefix, so classifying both sides is string work. That
// also means an alias this file does not know about is simply not classified —
// see ALIASES if you rename one.
import path from 'node:path';

import { definePlugin, defineRule, type ESTree } from '@oxlint/plugins';

type Layer = 'app' | 'core' | 'modules' | 'shared';

/** A file's place in the architecture. `null` for anything that has not adopted it. */
type Element = { layer: Layer; module?: string; internalPath?: string };

const ALIASES = new Map([
  ['@app', 'src/app'],
  ['@modules', 'src/modules'],
  ['@shared', 'src/shared'],
  ['@core', 'src/core'],
]);

/** Which layer may not reach which, and what to say when it does. */
const FORBIDDEN: { from: Layer; to: Layer[]; message: (to: Layer) => string }[] = [
  {
    from: 'core',
    to: ['app', 'modules', 'shared'],
    message: (to) => `core is the bottom layer — it may not import ${to}.`,
  },
  {
    from: 'shared',
    to: ['app', 'modules'],
    message: (to) => `shared may only import core — ${to} is above it.`,
  },
  {
    from: 'modules',
    to: ['app'],
    message: () => 'modules may not import app — only app composes.',
  },
];

function classify(relativePath: string): Element | null {
  const parts = relativePath.split('/');
  if (parts[0] !== 'src') return null;

  if (parts[1] === 'app') return { layer: 'app' };
  if (parts[1] === 'shared') return { layer: 'shared' };
  if (parts[1] === 'core') return { layer: 'core' };

  if (parts[1] === 'modules' && parts[2] !== undefined && parts[2] !== '') {
    return { layer: 'modules', module: parts[2], internalPath: parts.slice(3).join('/') };
  }

  return null;
}

/** The repo-relative path a specifier points at, or `null` for a package. */
function resolveSpecifier(specifier: string, fromDirectory: string): string | null {
  if (specifier.startsWith('.'))
    return path.posix.normalize(path.posix.join(fromDirectory, specifier));

  const [alias, ...rest] = specifier.split('/');
  const root = alias === undefined ? undefined : ALIASES.get(alias);

  return root === undefined ? null : path.posix.join(root, ...rest);
}

/** `index`, `index.ts` and the bare folder are the module's front door. */
function isModuleRoot(internalPath: string): boolean {
  return internalPath === '' || internalPath === 'index' || internalPath === 'index.ts';
}

type ImportingNode =
  ESTree.ExportAllDeclaration | ESTree.ExportNamedDeclaration | ESTree.ImportDeclaration;

/** Every syntax that names another file: static, dynamic, and re-exports. */
function eachImport(visit: (node: ESTree.Node, specifier: string) => void) {
  // `export { x }` with no `from` is the one case with nothing to classify.
  const fromSource = (node: ImportingNode) => {
    if (node.source !== null) visit(node, node.source.value);
  };

  return {
    ImportDeclaration: fromSource,
    ExportAllDeclaration: fromSource,
    ExportNamedDeclaration: fromSource,
    // `import()` matters: every screen in this app is lazy-loaded through one.
    ImportExpression(node: ESTree.ImportExpression) {
      const { source } = node;
      // A literal is the only source that names a file at lint time. Coerced
      // rather than type-tested: a number or regexp classifies as no layer, so
      // the worst case is a specifier no rule below recognises.
      if (source.type === 'Literal' && source.value !== null) visit(node, String(source.value));
    },
  };
}

const relativeToCwd = (context: { cwd: string; filename: string }) =>
  path.relative(context.cwd, context.filename).split(path.sep).join('/');

const layerDependenciesRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'Imports flow one way: app → modules → shared → core.' },
  },
  create(context) {
    const filePath = relativeToCwd(context);
    const from = classify(filePath);
    if (from === null) return {};

    const directory = path.posix.dirname(filePath);
    const policy = FORBIDDEN.find((entry) => entry.from === from.layer);

    return eachImport((node, specifier) => {
      const targetPath = resolveSpecifier(specifier, directory);
      const to = targetPath === null ? null : classify(targetPath);
      if (to === null) return;

      if (policy?.to.includes(to.layer) === true) {
        context.report({ node, message: policy.message(to.layer) });
        return;
      }

      // The jettison test, as a lint rule: no module may depend on another, or
      // deleting one would break the other.
      if (from.layer === 'modules' && to.layer === 'modules' && from.module !== to.module) {
        context.report({
          node,
          message:
            'modules may not import other modules — move it down to shared/core, or duplicate it.',
        });
      }
    });
  },
});

const modulePrivacyRule = defineRule({
  meta: {
    type: 'problem',
    docs: { description: 'A module is consumed only through its index.ts.' },
  },
  create(context) {
    const filePath = relativeToCwd(context);
    const from = classify(filePath);
    const directory = path.posix.dirname(filePath);

    return eachImport((node, specifier) => {
      const targetPath = resolveSpecifier(specifier, directory);
      const to = targetPath === null ? null : classify(targetPath);
      if (to?.layer !== 'modules' || to.internalPath === undefined) return;

      // Files inside the module import each other freely: the formality lives at
      // the boundary, not within it.
      if (from?.layer === 'modules' && from.module === to.module) return;

      if (!isModuleRoot(to.internalPath)) {
        context.report({
          node,
          message: `a module is consumed only through its index.ts — ${to.internalPath} is private.`,
        });
      }
    });
  },
});

export default definePlugin({
  meta: { name: 'jettison' },
  rules: {
    'layer-dependencies': layerDependenciesRule,
    'module-privacy': modulePrivacyRule,
  },
});

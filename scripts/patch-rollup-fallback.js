/**
 * This script patches Rollup to use a JavaScript-based fallback for its native bindings.
 * It is used for compatibility in environments where native binaries are unavailable (e.g., certain CI or limited systems).
 */
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const replacements = [
    {
        file: path.join(rootDir, '..', 'packages', 'web-jitter-rng', 'node_modules', 'rollup', 'dist', 'native.js'),
        pattern: /const \{ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 \} = requireWithFriendlyError\([\s\S]*?\);/,
        replace: `let parse;\nlet parseAsync;\nlet xxhashBase64Url;\nlet xxhashBase36;\nlet xxhashBase16;\n\ntry {\n        ({ parse, parseAsync, xxhashBase64Url, xxhashBase36, xxhashBase16 } = requireWithFriendlyError(\n                existsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`\n        ));\n} catch (nativeError) {\n        const acorn = require('acorn');\n        const { createHash } = require('node:crypto');\n\n        parse = (code, options = {}) =>\n                acorn.parse(code, {\n                        ecmaVersion: 'latest',\n                        sourceType: 'module',\n                        locations: true,\n                        ...options\n                });\n        parseAsync = async (code, options = {}) => parse(code, options);\n\n        const hash = input =>\n                createHash('sha256')\n                        .update(typeof input === 'string' ? input : Buffer.from(input))\n                        .digest();\n        xxhashBase64Url = input => hash(input).toString('base64url');\n        xxhashBase36 = input => BigInt('0x' + hash(input).toString('hex')).toString(36);\n        xxhashBase16 = input => hash(input).toString('hex');\n\n        process.emitWarning(\n                \`rollup native bindings unavailable (\${nativeError.message}); using JS fallbacks.\`,\n                'MissingOptionalDependency'\n        );\n}`
    },
    {
        file: path.join(rootDir, '..', 'packages', 'web-jitter-rng', 'node_modules', 'rollup', 'dist', 'shared', 'parseAst.js'),
        search: `const parseAst = (input, { allowReturnOutsideFunction = false, jsx = false } = {}) => convertProgram(getAstBuffer(native_js.parse(input, allowReturnOutsideFunction, jsx)));\nconst parseAstAsync = async (input, { allowReturnOutsideFunction = false, jsx = false, signal } = {}) => convertProgram(getAstBuffer(await native_js.parseAsync(input, allowReturnOutsideFunction, jsx, signal)));`,
        replace: `const parseAst = (input, { allowReturnOutsideFunction = false, jsx = false } = {}) => {\n    const parsed = native_js.parse(input, allowReturnOutsideFunction, jsx);\n    return parsed && typeof parsed.type === 'string' ? parsed : convertProgram(getAstBuffer(parsed));\n};\nconst parseAstAsync = async (input, { allowReturnOutsideFunction = false, jsx = false, signal } = {}) => {\n    const parsed = await native_js.parseAsync(input, allowReturnOutsideFunction, jsx, signal);\n    return parsed && typeof parsed.type === 'string' ? parsed : convertProgram(getAstBuffer(parsed));\n};`
    },
    {
        file: path.join(rootDir, '..', 'packages', 'web-jitter-rng', 'node_modules', 'rollup', 'dist', 'es', 'shared', 'parseAst.js'),
        search: `const parseAst = (input, { allowReturnOutsideFunction = false, jsx = false } = {}) => convertProgram(getAstBuffer(parse(input, allowReturnOutsideFunction, jsx)));\nconst parseAstAsync = async (input, { allowReturnOutsideFunction = false, jsx = false, signal } = {}) => convertProgram(getAstBuffer(await parseAsync(input, allowReturnOutsideFunction, jsx, signal)));`,
        replace: `const parseAst = (input, { allowReturnOutsideFunction = false, jsx = false } = {}) => {\n    const parsed = parse(input, allowReturnOutsideFunction, jsx);\n    return parsed && typeof parsed.type === 'string' ? parsed : convertProgram(getAstBuffer(parsed));\n};\nconst parseAstAsync = async (input, { allowReturnOutsideFunction = false, jsx = false, signal } = {}) => {\n    const parsed = await parseAsync(input, allowReturnOutsideFunction, jsx, signal);\n    return parsed && typeof parsed.type === 'string' ? parsed : convertProgram(getAstBuffer(parsed));\n};`
    }
];

function applyPatch({ file, search, replace, pattern }) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    if (
        content.includes(replace) ||
        content.includes('MissingOptionalDependency') ||
        content.includes('? parsed : convertProgram(getAstBuffer(parsed))')
    ) {
        return;
    }
    if (pattern) {
        if (!pattern.test(content)) {
            console.warn(`Patch markers not found in ${file}, skipping.`);
            return;
        }
        fs.writeFileSync(file, content.replace(pattern, replace), 'utf8');
    } else {
        if (!content.includes(search)) {
            console.warn(`Patch markers not found in ${file}, skipping.`);
            return;
        }
        fs.writeFileSync(file, content.replace(search, replace), 'utf8');
    }
    console.log(`Patched ${path.relative(path.join(rootDir, '..'), file)}`);
}

replacements.forEach(applyPatch);

import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['index.js'],
    bundle: true,
    outfile: 'dist/index.js',
    format: 'esm',
    platform: 'neutral',
    minify: true,
    charset: 'utf8',
    sourcemap: true,
    tsconfig: 'tsconfig.json',
});
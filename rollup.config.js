import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
  {
    input: 'src/index.js',
    external: id => /^(lib0|crdtmap|@react-native-async-storage)/.test(id),
    output: {
      name: 'CrdtMapAsyncStorage',
      file: 'dist/crdtmap-async-storage.cjs',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },

  // Add .js to work with react-native
  {
    input: 'src/index.js',
    external: id => /^(lib0|crdtmap|@react-native-async-storage)/.test(id),
    output: {
      name: 'CrdtMapAsyncStorage',
      file: 'dist/crdtmap-async-storage.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  }
]

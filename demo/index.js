const CrdtMap = require('crdtmap')
const { createAsyncStorageHandler } = require('../dist/crdtmap-async-storage.cjs')

const doc = CrdtMap()
const handler = createAsyncStorageHandler('@prefix:', doc)

doc.set('key1', 'before-sync')
console.log('before sync', doc.toJSON())

handler.whenSynced.then(() => {
  // doc.set('key2', 'after-sync')
  console.log('after sync', doc.toJSON())
})

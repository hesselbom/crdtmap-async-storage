import CrdtMap from 'crdtmap'
import b64 from 'base64-js'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import AsyncStorage from '@react-native-async-storage/async-storage'

export function createAsyncStorageHandler (prefix, doc) {
  let isSynced = false

  const fetchStored = async () => {
    const snapshot = {}

    return AsyncStorage.getAllKeys()
      .then(keys => keys.filter(key => key.startsWith(prefix)))
      .then(keys => AsyncStorage.multiGet(keys))
      .then(values => {
        for (const [key, data] of values) {
          const decoder = decoding.createDecoder(b64ToArray(data))
          const value = decoding.readAny(decoder)

          snapshot[key.substr(prefix.length)] = value
        }
      })
      .then(() => doc.applySnapshot(snapshot))
      .then(() => snapshot)
  }

  const whenSynced = Promise.resolve().then(() => {
    const currentSnapshot = doc.getSnapshotFromTimestamp(0)

    return fetchStored()
      .then(storedSnapshot => {
        // Wait until here to set synced to avoid onUpdate called when fetching stored snapshot
        isSynced = true

        // And now store snapshot from before indexeddb sync
        // To make sure we only store latest data, we filter snapshot first by getting appliedSnapshot from a dummy doc
        const dummyDoc = CrdtMap()
        dummyDoc.applySnapshot(storedSnapshot)
        dummyDoc.on('snapshot', (_, appliedSnapshot) => {
          // Store applied snapshot, which is the changes we had in the doc prior to loading indexeddb
          storeSnapshot(appliedSnapshot)
        })

        // When we apply this snapshot, "snapshot" will be emitted with applied part of snapshot, ensuring we're storing latest
        dummyDoc.applySnapshot(currentSnapshot)
      })
  })

  const storeSnapshot = (snapshot) => {
    if (isSynced) {
      for (const [key, value] of Object.entries(snapshot)) {
        const encoder = encoding.createEncoder()
        encoding.writeAny(encoder, value)
        const data = encoding.toUint8Array(encoder)

        AsyncStorage.setItem(prefix + key, arrayToB64(data))
      }
    }
  }

  // Updates are always latest data, so safe to store as snapshot
  const onUpdate = storeSnapshot

  // Snapshot should only stored applied snapshot, to not store accidental old data
  const onSnapshot = (_, appliedSnapshot) => storeSnapshot(appliedSnapshot)

  const handler = {
    whenSynced,
    destroy () {
      doc.off('update', onUpdate)
      doc.off('snapshot', onSnapshot)
      doc.off('destroy', this.destroy)
    }
  }

  doc.on('update', onUpdate)
  doc.on('snapshot', onSnapshot)
  doc.on('destroy', handler.destroy)

  return handler
}

// From https://stackoverflow.com/a/67861333
function arrayToB64 (array) {
  return b64.fromByteArray(array).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function b64ToArray (str) {
  return b64.toByteArray(str + '==='.slice((str.length + 3) % 4))
}

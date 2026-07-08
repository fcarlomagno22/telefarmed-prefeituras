import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getBluetoothDeviceIcon,
  rssiToSignalLevel,
} from '../adapters/appBluetooth.types.ts'

describe('appBluetooth helpers', () => {
  it('mapeia RSSI para barras de sinal', () => {
    assert.equal(rssiToSignalLevel(-48), 4)
    assert.equal(rssiToSignalLevel(-62), 3)
    assert.equal(rssiToSignalLevel(-72), 2)
    assert.equal(rssiToSignalLevel(-90), 1)
    assert.equal(rssiToSignalLevel(null), 2)
  })

  it('infere ícone por nome do dispositivo', () => {
    assert.equal(getBluetoothDeviceIcon('Galaxy Watch 6'), 'watch-variant')
    assert.equal(getBluetoothDeviceIcon('Balança Inteligente'), 'scale-bathroom')
    assert.equal(getBluetoothDeviceIcon('Sensor XYZ'), 'bluetooth')
  })
})

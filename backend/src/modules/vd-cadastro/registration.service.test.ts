import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { shouldUploadVdPacientePhoto } from './registration.service.js'

const samplePhotoDataUrl =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='

describe('shouldUploadVdPacientePhoto (credentials_only UBT)', () => {
  it('não sobrescreve foto existente do paciente UBT completo', () => {
    assert.equal(
      shouldUploadVdPacientePhoto({
        mode: 'credentials_only',
        existingAvatarUrl: 'https://storage.example/pacientes/avatar.jpg',
        photoDataUrl: samplePhotoDataUrl,
      }),
      false,
    )
  })

  it('permite enviar foto quando paciente não tem avatar', () => {
    assert.equal(
      shouldUploadVdPacientePhoto({
        mode: 'credentials_only',
        existingAvatarUrl: '',
        photoDataUrl: samplePhotoDataUrl,
      }),
      true,
    )
  })

  it('permite enviar foto em cadastro novo ou atualização', () => {
    assert.equal(
      shouldUploadVdPacientePhoto({
        mode: 'updated',
        existingAvatarUrl: 'https://storage.example/pacientes/avatar.jpg',
        photoDataUrl: samplePhotoDataUrl,
      }),
      true,
    )
  })

  it('ignora URL http vinda do lookup (não é data URL)', () => {
    assert.equal(
      shouldUploadVdPacientePhoto({
        mode: 'credentials_only',
        existingAvatarUrl: '',
        photoDataUrl: 'https://storage.example/pacientes/avatar.jpg',
      }),
      false,
    )
  })
})

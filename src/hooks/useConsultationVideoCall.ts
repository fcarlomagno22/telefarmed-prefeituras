import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Room,
  RoomEvent,
  Track,
  ParticipantEvent,
  type LocalVideoTrack,
  type RemoteAudioTrack,
  type RemoteTrack,
  type RemoteVideoTrack,
} from 'livekit-client'
import {
  fetchProfissionalConsultaVideoToken,
  ProfissionalAtendimentosApiError,
} from '../lib/services/profissional/atendimentos'
import {
  fetchPublicConsultaVideoToken,
  PublicAtendimentoApiError,
} from '../lib/services/public/atendimento'
import { getLiveKitServerUrl } from '../lib/livekit/config'

export type ConsultationVideoCallRole = 'medico' | 'paciente'

export type ConsultationVideoConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

type UseConsultationVideoCallOptions = {
  role: ConsultationVideoCallRole
  codigoOrToken: string | undefined
  getAccessToken?: () => string | null
  enabled?: boolean
}

function resolveVideoCallErrorMessage(error: unknown): string {
  if (error instanceof ProfissionalAtendimentosApiError || error instanceof PublicAtendimentoApiError) {
    if (error.status === 409) {
      return 'A teleconsulta ainda não está disponível. Aguarde o início do atendimento.'
    }
    if (error.status === 403) {
      return 'Você não tem permissão para entrar nesta sala de atendimento.'
    }
    if (error.status === 404) {
      return 'Sala de atendimento não encontrada.'
    }
    if (error.status === 410) {
      return 'Este atendimento não está mais disponível.'
    }
    if (error.message.trim()) {
      return error.message
    }
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase()
    if (normalized.includes('vite_livekit_url') || normalized.includes('não configurado')) {
      return 'Teleconsulta indisponível: URL do LiveKit não configurada no frontend.'
    }
    if (
      normalized.includes('permission') ||
      normalized.includes('notallowed') ||
      normalized.includes('denied')
    ) {
      return 'Não foi possível acessar câmera ou microfone. Verifique as permissões do navegador.'
    }
    if (normalized.includes('notfound') || normalized.includes('device')) {
      return 'Câmera ou microfone não encontrados neste dispositivo.'
    }
    if (normalized.includes('network') || normalized.includes('connect')) {
      return 'Falha de conexão com a teleconsulta. Verifique sua internet.'
    }
    if (error.message.trim()) {
      return error.message
    }
  }

  return 'Não foi possível conectar à teleconsulta. Tente recarregar a página.'
}

function pickRemoteParticipant(room: Room) {
  const participants = [...room.remoteParticipants.values()]
  return participants[0] ?? null
}

function readLocalVideoTrack(room: Room | null): LocalVideoTrack | null {
  if (!room) return null
  return room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack ?? null
}

function readRemoteVideoTrack(room: Room | null): RemoteVideoTrack | null {
  const participant = room ? pickRemoteParticipant(room) : null
  if (!participant) return null
  return participant.getTrackPublication(Track.Source.Camera)?.videoTrack ?? null
}

function readRemoteAudioTrack(room: Room | null): RemoteAudioTrack | null {
  const participant = room ? pickRemoteParticipant(room) : null
  if (!participant) return null
  return participant.getTrackPublication(Track.Source.Microphone)?.audioTrack ?? null
}

function attachRemoteAudioTrack(track: RemoteTrack | undefined) {
  if (!track || track.kind !== Track.Kind.Audio) return
  track.attach()
}

function syncTrackState(
  room: Room | null,
  setLocalVideoTrack: (track: LocalVideoTrack | null) => void,
  setRemoteVideoTrack: (track: RemoteVideoTrack | null) => void,
  setRemoteAudioTrack: (track: RemoteAudioTrack | null) => void,
) {
  setLocalVideoTrack(readLocalVideoTrack(room))
  setRemoteVideoTrack(readRemoteVideoTrack(room))
  setRemoteAudioTrack(readRemoteAudioTrack(room))
}

function teardownRoom(room: Room | null) {
  if (!room) return

  room.localParticipant.trackPublications.forEach((publication) => {
    publication.track?.detach()
    publication.track?.stop()
  })

  room.remoteParticipants.forEach((participant) => {
    participant.trackPublications.forEach((publication) => {
      publication.track?.detach()
    })
  })

  room.removeAllListeners()
  room.disconnect()
}

function syncMediaEnabledState(
  room: Room | null,
  setIsMicEnabled: (value: boolean) => void,
  setIsCameraEnabled: (value: boolean) => void,
) {
  if (!room) {
    setIsMicEnabled(false)
    setIsCameraEnabled(false)
    return
  }

  setIsMicEnabled(room.localParticipant.isMicrophoneEnabled)
  setIsCameraEnabled(room.localParticipant.isCameraEnabled)
}

export function useConsultationVideoCall(options: UseConsultationVideoCallOptions) {
  const { role, codigoOrToken, getAccessToken, enabled = false } = options

  const roomRef = useRef<Room | null>(null)
  const connectAttemptRef = useRef(0)
  const intentionalDisconnectRef = useRef(false)
  const getAccessTokenRef = useRef(getAccessToken)

  useEffect(() => {
    getAccessTokenRef.current = getAccessToken
  }, [getAccessToken])

  const [connectionState, setConnectionState] =
    useState<ConsultationVideoConnectionState>('idle')
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null)
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteVideoTrack | null>(null)
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<RemoteAudioTrack | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMicEnabled, setIsMicEnabled] = useState(false)
  const [isCameraEnabled, setIsCameraEnabled] = useState(false)

  const disconnect = useCallback(() => {
    intentionalDisconnectRef.current = true
    teardownRoom(roomRef.current)
    roomRef.current = null
    setLocalVideoTrack(null)
    setRemoteVideoTrack(null)
    setRemoteAudioTrack(null)
    setIsMicEnabled(false)
    setIsCameraEnabled(false)
    setConnectionState('idle')
    setErrorMessage(null)
  }, [])

  const toggleMic = useCallback(async () => {
    const room = roomRef.current
    if (!room || connectionState !== 'connected') return

    const enabledMic = room.localParticipant.isMicrophoneEnabled
    await room.localParticipant.setMicrophoneEnabled(!enabledMic)
    syncMediaEnabledState(room, setIsMicEnabled, setIsCameraEnabled)
  }, [connectionState])

  const toggleCamera = useCallback(async () => {
    const room = roomRef.current
    if (!room || connectionState !== 'connected') return

    const enabledCamera = room.localParticipant.isCameraEnabled
    await room.localParticipant.setCameraEnabled(!enabledCamera)
    syncTrackState(room, setLocalVideoTrack, setRemoteVideoTrack, setRemoteAudioTrack)
    syncMediaEnabledState(room, setIsMicEnabled, setIsCameraEnabled)
  }, [connectionState])

  useEffect(() => {
    if (!enabled || !codigoOrToken?.trim()) {
      disconnect()
      setErrorMessage(null)
      return
    }

    if (role === 'medico') {
      const accessToken = getAccessTokenRef.current?.() ?? null
      if (!accessToken) {
        disconnect()
        setConnectionState('error')
        setErrorMessage('Sessão do profissional expirada.')
        return
      }
    }

    const attemptId = connectAttemptRef.current + 1
    connectAttemptRef.current = attemptId
    intentionalDisconnectRef.current = false

    let cancelled = false

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    roomRef.current = room

    const refreshTracks = () => {
      syncTrackState(room, setLocalVideoTrack, setRemoteVideoTrack, setRemoteAudioTrack)
      syncMediaEnabledState(room, setIsMicEnabled, setIsCameraEnabled)
    }

    const onLocalTrackPublished = () => {
      refreshTracks()
    }

    const onTrackMuted = () => {
      refreshTracks()
    }

    const onTrackUnmuted = () => {
      refreshTracks()
    }

    const onTrackSubscribed = (track: RemoteTrack) => {
      attachRemoteAudioTrack(track)
      refreshTracks()
    }

    const onTrackUnsubscribed = () => {
      refreshTracks()
    }

    const onParticipantConnected = () => {
      refreshTracks()
    }

    const onParticipantDisconnected = () => {
      refreshTracks()
    }

    room.on(RoomEvent.TrackSubscribed, onTrackSubscribed)
    room.on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
    room.localParticipant.on(ParticipantEvent.LocalTrackPublished, onLocalTrackPublished)
    room.localParticipant.on(ParticipantEvent.TrackMuted, onTrackMuted)
    room.localParticipant.on(ParticipantEvent.TrackUnmuted, onTrackUnmuted)
    room.on(RoomEvent.Reconnecting, () => {
      if (connectAttemptRef.current === attemptId) {
        setConnectionState('connecting')
      }
    })
    room.on(RoomEvent.Reconnected, () => {
      if (connectAttemptRef.current === attemptId) {
        setConnectionState('connected')
        refreshTracks()
      }
    })
    room.on(RoomEvent.Disconnected, () => {
      if (connectAttemptRef.current !== attemptId) return
      refreshTracks()
      if (cancelled || intentionalDisconnectRef.current) return
      setConnectionState('error')
      setErrorMessage('A conexão com a teleconsulta foi interrompida.')
    })

    async function connect() {
      setConnectionState('connecting')
      setErrorMessage(null)

      try {
        const credentials =
          role === 'medico'
            ? await fetchProfissionalConsultaVideoToken(
                getAccessTokenRef.current!(),
                codigoOrToken.trim(),
              )
            : await fetchPublicConsultaVideoToken(codigoOrToken.trim())

        if (cancelled || connectAttemptRef.current !== attemptId) return

        const serverUrl = getLiveKitServerUrl()
        await room.connect(serverUrl, credentials.token)
        if (cancelled || connectAttemptRef.current !== attemptId) {
          teardownRoom(room)
          return
        }

        await room.localParticipant.setCameraEnabled(true)
        await room.localParticipant.setMicrophoneEnabled(true)

        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            attachRemoteAudioTrack(publication.track)
          })
        })

        refreshTracks()
        setConnectionState('connected')
      } catch (error) {
        if (cancelled || connectAttemptRef.current !== attemptId) return

        teardownRoom(room)
        roomRef.current = null
        setLocalVideoTrack(null)
        setRemoteVideoTrack(null)
        setRemoteAudioTrack(null)
        setIsMicEnabled(false)
        setIsCameraEnabled(false)
        setConnectionState('error')
        setErrorMessage(resolveVideoCallErrorMessage(error))
      }
    }

    void connect()

    return () => {
      cancelled = true
      if (roomRef.current === room) {
        room.localParticipant.removeAllListeners()
        teardownRoom(room)
        roomRef.current = null
      }
      setLocalVideoTrack(null)
      setRemoteVideoTrack(null)
      setRemoteAudioTrack(null)
      setIsMicEnabled(false)
      setIsCameraEnabled(false)
      if (connectAttemptRef.current === attemptId) {
        setConnectionState('idle')
      }
    }
  }, [codigoOrToken, disconnect, enabled, role])

  return {
    connectionState,
    localVideoTrack,
    remoteVideoTrack,
    remoteAudioTrack,
    isMicEnabled,
    isCameraEnabled,
    toggleMic,
    toggleCamera,
    disconnect,
    errorMessage,
  }
}

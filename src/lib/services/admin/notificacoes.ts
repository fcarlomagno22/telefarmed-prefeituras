import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/notificacoes'
import * as mock from '../../mockServices/admin/notificacoes'

const useApi = isBackendApiEnabled()

export type {
  AdminBroadcastListResponse,
  AdminNotificationKpisResponse,
  AdminRecipientPrefeitura,
  AdminRecipientPrefeituraUser,
  AdminRecipientProfissionaisStats,
  AdminRecipientProfissional,
  AdminRecipientUbt,
  AdminRecipientUbtUser,
  CreateAdminBroadcastPayload,
  AdminNotificationTargetSnapshot,
} from '../../mockServices/admin/notificacoes'

export const AdminNotificacoesApiError = useApi
  ? api.AdminNotificacoesApiError
  : mock.AdminNotificacoesApiError

export const isAdminNotificacoesApiError = useApi
  ? api.isAdminNotificacoesApiError
  : mock.isAdminNotificacoesApiError

export const fetchAdminNotificationKpis = useApi
  ? api.fetchAdminNotificationKpis
  : mock.fetchAdminNotificationKpis

export const fetchAdminBroadcasts = useApi ? api.fetchAdminBroadcasts : mock.fetchAdminBroadcasts

export const createAdminBroadcast = useApi ? api.createAdminBroadcast : mock.createAdminBroadcast

export const fetchAdminRecipientPrefeituras = useApi
  ? api.fetchAdminRecipientPrefeituras
  : mock.fetchAdminRecipientPrefeituras

export const fetchAdminRecipientUbts = useApi
  ? api.fetchAdminRecipientUbts
  : mock.fetchAdminRecipientUbts

export const fetchAdminRecipientProfissionaisStats = useApi
  ? api.fetchAdminRecipientProfissionaisStats
  : mock.fetchAdminRecipientProfissionaisStats

export const fetchAdminRecipientProfissionais = useApi
  ? api.fetchAdminRecipientProfissionais
  : mock.fetchAdminRecipientProfissionais

export const fetchAdminRecipientPrefeituraUsers = useApi
  ? api.fetchAdminRecipientPrefeituraUsers
  : mock.fetchAdminRecipientPrefeituraUsers

export const fetchAdminRecipientUbtUsers = useApi
  ? api.fetchAdminRecipientUbtUsers
  : mock.fetchAdminRecipientUbtUsers

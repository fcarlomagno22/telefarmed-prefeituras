import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/portal/suporte'
import * as mock from '../../mockServices/ubt/suporte'

const useApi = isBackendApiEnabled()

export type {
  CreatePortalSupportTicketInput,
  ListPortalSupportTicketsParams,
  PortalSupportTicketListResponse,
  SupportKpisResponse,
} from '../../mockServices/ubt/suporte'

export type { SupportMessage, SupportTicket } from '../../mockServices/ubt/suporte'

export type PortalSuporteVariant = api.PortalSuporteVariant

export const PortalSuporteApiError = useApi ? api.PortalSuporteApiError : mock.PortalSuporteApiError

export const UbtSuporteApiError = PortalSuporteApiError

export const isPortalSuporteApiError = useApi ? api.isPortalSuporteApiError : mock.isPortalSuporteApiError

export const isUbtSuporteApiError = useApi ? api.isUbtSuporteApiError : mock.isUbtSuporteApiError

export const fetchPortalSupportKpis = useApi ? api.fetchPortalSupportKpis : mock.fetchPortalSupportKpis

export const fetchPortalSupportTickets = useApi
  ? api.fetchPortalSupportTickets
  : mock.fetchPortalSupportTickets

export const fetchPortalSupportTicket = useApi
  ? api.fetchPortalSupportTicket
  : mock.fetchPortalSupportTicket

export const createPortalSupportTicket = useApi
  ? api.createPortalSupportTicket
  : mock.createPortalSupportTicket

export const sendPortalSupportReply = useApi ? api.sendPortalSupportReply : mock.sendPortalSupportReply

export const updatePortalSupportMessage = useApi
  ? api.updatePortalSupportMessage
  : mock.updatePortalSupportMessage

export const deletePortalSupportMessage = useApi
  ? api.deletePortalSupportMessage
  : mock.deletePortalSupportMessage

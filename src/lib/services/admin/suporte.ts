import { isBackendApiEnabled } from '../../api/config'
import * as api from '../../api/admin/suporte'
import * as mock from '../../mockServices/admin/suporte'

const useApi = isBackendApiEnabled()

export type {
  ListSupportTicketsParams,
  SupportKpisResponse,
  SupportTicketListResponse,
} from '../../mockServices/admin/suporte'

export type {
  SupportMessage,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from '../../mockServices/admin/suporte'

export const AdminSuporteApiError = useApi ? api.AdminSuporteApiError : mock.AdminSuporteApiError

export const isAdminSuporteApiError = useApi ? api.isAdminSuporteApiError : mock.isAdminSuporteApiError

export const fetchSupportKpis = useApi ? api.fetchSupportKpis : mock.fetchSupportKpis

export const fetchSupportTickets = useApi ? api.fetchSupportTickets : mock.fetchSupportTickets

export const fetchSupportTicket = useApi ? api.fetchSupportTicket : mock.fetchSupportTicket

export const sendSupportReply = useApi ? api.sendSupportReply : mock.sendSupportReply

export const updateSupportMessage = useApi ? api.updateSupportMessage : mock.updateSupportMessage

export const deleteSupportMessage = useApi ? api.deleteSupportMessage : mock.deleteSupportMessage

export const closeSupportTicket = useApi ? api.closeSupportTicket : mock.closeSupportTicket

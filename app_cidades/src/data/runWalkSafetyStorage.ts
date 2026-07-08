import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  activateRunWalkContatoConfiancaSos,
  createRunWalkContatoConfianca,
  deleteRunWalkContatoConfianca,
  getRunWalkContatosConfianca,
  updateRunWalkContatoConfianca,
  type TrustedContactDto,
  type TrustedContactsListDto,
} from '../lib/api/vd/runWalk'
import { maskPhone } from '../utils/phone'

const LEGACY_TRUSTED_CONTACT_KEY = '@telefarmed/run-walk/trusted-contact'
const LEGACY_TRUSTED_CONTACTS_KEY = '@telefarmed/run-walk/trusted-contacts'
const LEGACY_ACTIVE_TRUSTED_CONTACT_ID_KEY = '@telefarmed/run-walk/active-trusted-contact-id'
const LEGACY_SELECTED_TRUSTED_CONTACT_IDS_KEY =
  '@telefarmed/run-walk/selected-trusted-contact-ids'

const CACHE_KEY = '@telefarmed/run-walk/trusted-contacts-cache'
const SELECTED_IDS_KEY = '@telefarmed/run-walk/trusted-contacts-selected-ids'

export const MAX_TRUSTED_CONTACTS = 5

const SERVER_CONTACT_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type TrustedContact = {
  id: string
  clientContactId: string
  name: string
  phone: string
  liveShareEnabled: boolean
  isActiveSos?: boolean
}

type TrustedContactsCacheRecord = {
  contacts: TrustedContact[]
  activeSosContactId: string | null
  updatedAt: string
}

type TrustedContactsCacheStore = Record<string, TrustedContactsCacheRecord>
type SelectedContactIdsStore = Record<string, string[]>

type LegacyTrustedContact = {
  id: string
  name: string
  phone: string
  liveShareEnabled?: boolean
}

type LegacyTrustedContactsStore = {
  contacts: LegacyTrustedContact[]
}

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

export function isServerTrustedContactId(id: string) {
  return SERVER_CONTACT_ID_REGEX.test(id)
}

function mapDtoToContact(dto: TrustedContactDto): TrustedContact {
  return {
    id: dto.id,
    clientContactId: dto.clientContactId,
    name: dto.name,
    phone: maskPhone(dto.phone),
    liveShareEnabled: dto.liveShareEnabled,
    isActiveSos: dto.isActiveSos,
  }
}

function normalizeContact(contact: TrustedContact): TrustedContact {
  const clientContactId = contact.clientContactId || contact.id
  return {
    ...contact,
    id: contact.id || clientContactId,
    clientContactId,
    phone: maskPhone(contact.phone),
  }
}

function mapListDtoToContacts(dto: TrustedContactsListDto): TrustedContact[] {
  return dto.contacts.map(mapDtoToContact)
}

async function readCacheStore(): Promise<TrustedContactsCacheStore> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as TrustedContactsCacheStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeCacheStore(store: TrustedContactsCacheStore) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store))
}

async function readSelectedIdsStore(): Promise<SelectedContactIdsStore> {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_IDS_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as SelectedContactIdsStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeSelectedIdsStore(store: SelectedContactIdsStore) {
  await AsyncStorage.setItem(SELECTED_IDS_KEY, JSON.stringify(store))
}

async function cacheTrustedContactsList(
  patientCpf: string,
  dto: TrustedContactsListDto,
) {
  const store = await readCacheStore()
  store[patientCpf] = {
    contacts: mapListDtoToContacts(dto),
    activeSosContactId: dto.activeSosContactId,
    updatedAt: new Date().toISOString(),
  }
  await writeCacheStore(store)
}

async function cacheTrustedContacts(
  patientCpf: string,
  contacts: TrustedContact[],
  activeSosContactId: string | null,
) {
  const store = await readCacheStore()
  store[patientCpf] = {
    contacts: contacts.map(normalizeContact),
    activeSosContactId,
    updatedAt: new Date().toISOString(),
  }
  await writeCacheStore(store)
}

export async function loadCachedTrustedContacts(
  patientCpf: string,
): Promise<TrustedContactsCacheRecord | null> {
  const store = await readCacheStore()
  return store[patientCpf] ?? null
}

async function migrateLegacyContacts(patientCpf: string): Promise<TrustedContact[] | null> {
  const legacyContactsRaw = await AsyncStorage.getItem(LEGACY_TRUSTED_CONTACTS_KEY)
  const legacyActiveId = await AsyncStorage.getItem(LEGACY_ACTIVE_TRUSTED_CONTACT_ID_KEY)
  const legacySelectedRaw = await AsyncStorage.getItem(LEGACY_SELECTED_TRUSTED_CONTACT_IDS_KEY)

  let contacts: TrustedContact[] = []

  if (legacyContactsRaw) {
    try {
      const parsed = JSON.parse(legacyContactsRaw) as LegacyTrustedContactsStore
      if (Array.isArray(parsed.contacts)) {
        contacts = parsed.contacts.map((contact) =>
          normalizeContact({
            id: contact.id,
            clientContactId: contact.id,
            name: contact.name,
            phone: contact.phone,
            liveShareEnabled: contact.liveShareEnabled ?? true,
          }),
        )
      }
    } catch {
      contacts = []
    }
  }

  if (contacts.length === 0) {
    const legacySingleRaw = await AsyncStorage.getItem(LEGACY_TRUSTED_CONTACT_KEY)
    if (legacySingleRaw) {
      try {
        const legacy = JSON.parse(legacySingleRaw) as LegacyTrustedContact
        if (legacy?.id && legacy?.name) {
          contacts = [
            normalizeContact({
              id: legacy.id,
              clientContactId: legacy.id,
              name: legacy.name,
              phone: legacy.phone,
              liveShareEnabled: legacy.liveShareEnabled ?? true,
              isActiveSos: true,
            }),
          ]
        }
      } catch {
        contacts = []
      }
    }
  }

  if (contacts.length === 0) return null

  const activeSosContactId =
    legacyActiveId && contacts.some((contact) => contact.id === legacyActiveId)
      ? legacyActiveId
      : contacts[0]?.id ?? null

  await cacheTrustedContacts(patientCpf, contacts, activeSosContactId)

  if (legacySelectedRaw) {
    try {
      const parsed = JSON.parse(legacySelectedRaw) as string[]
      if (Array.isArray(parsed)) {
        const selectedStore = await readSelectedIdsStore()
        selectedStore[patientCpf] = parsed.filter((id) =>
          contacts.some((contact) => contact.id === id),
        )
        await writeSelectedIdsStore(selectedStore)
      }
    } catch {
      // ignore invalid legacy selected ids
    }
  }

  await AsyncStorage.multiRemove([
    LEGACY_TRUSTED_CONTACT_KEY,
    LEGACY_TRUSTED_CONTACTS_KEY,
    LEGACY_ACTIVE_TRUSTED_CONTACT_ID_KEY,
    LEGACY_SELECTED_TRUSTED_CONTACT_IDS_KEY,
  ])

  return contacts
}

async function loadGuestTrustedContacts(patientCpf: string): Promise<TrustedContact[]> {
  const migrated = await migrateLegacyContacts(patientCpf)
  if (migrated) return migrated

  const cached = await loadCachedTrustedContacts(patientCpf)
  return cached?.contacts ?? []
}

async function saveGuestTrustedContacts(
  patientCpf: string,
  contacts: TrustedContact[],
  activeSosContactId: string | null,
) {
  await cacheTrustedContacts(patientCpf, contacts, activeSosContactId)
}

async function syncTrustedContactsFromApi(
  patientCpf: string,
  options?: { forceRefresh?: boolean },
): Promise<TrustedContact[]> {
  if (!options?.forceRefresh) {
    const cached = await loadCachedTrustedContacts(patientCpf)
    if (cached?.contacts.length) {
      void getRunWalkContatosConfianca()
        .then((dto) => cacheTrustedContactsList(patientCpf, dto))
        .catch(() => undefined)
      return cached.contacts
    }
  }

  const dto = await getRunWalkContatosConfianca()
  await cacheTrustedContactsList(patientCpf, dto)
  return mapListDtoToContacts(dto)
}

/** Carrega contatos via API com cache local; guest e offline usam cache. */
export async function loadTrustedContacts(
  patientCpf: string,
  options?: { forceRefresh?: boolean },
): Promise<TrustedContact[]> {
  if (isGuestPatient(patientCpf)) {
    return loadGuestTrustedContacts(patientCpf)
  }

  const migrated = await migrateLegacyContacts(patientCpf)
  if (migrated?.length && !options?.forceRefresh) {
    void syncTrustedContactsFromApi(patientCpf, { forceRefresh: true }).catch(() => undefined)
    return migrated
  }

  try {
    return await syncTrustedContactsFromApi(patientCpf, options)
  } catch {
    const cached = await loadCachedTrustedContacts(patientCpf)
    return cached?.contacts ?? []
  }
}

export async function loadActiveTrustedContactId(patientCpf: string): Promise<string | null> {
  const cached = await loadCachedTrustedContacts(patientCpf)
  if (cached?.activeSosContactId) {
    return cached.activeSosContactId
  }

  const contacts = await loadTrustedContacts(patientCpf)
  const active = contacts.find((contact) => contact.isActiveSos)
  return active?.id ?? contacts[0]?.id ?? null
}

export async function loadActiveTrustedContact(
  patientCpf: string,
): Promise<TrustedContact | null> {
  const [contacts, activeId] = await Promise.all([
    loadTrustedContacts(patientCpf),
    loadActiveTrustedContactId(patientCpf),
  ])

  if (!activeId) return contacts[0] ?? null
  return contacts.find((contact) => contact.id === activeId) ?? contacts[0] ?? null
}

async function persistActiveTrustedContact(patientCpf: string, id: string) {
  const contacts = await loadTrustedContacts(patientCpf)
  const nextContacts = contacts.map((contact) => ({
    ...contact,
    isActiveSos: contact.id === id,
  }))
  const cached = await loadCachedTrustedContacts(patientCpf)
  await cacheTrustedContacts(patientCpf, nextContacts, id)

  if (isGuestPatient(patientCpf)) {
    await saveGuestTrustedContacts(patientCpf, nextContacts, id)
    return
  }

  if (isServerTrustedContactId(id)) {
    try {
      await activateRunWalkContatoConfiancaSos(id)
      const dto = await getRunWalkContatosConfianca()
      await cacheTrustedContactsList(patientCpf, dto)
    } catch {
      await cacheTrustedContacts(patientCpf, nextContacts, id)
    }
  }
}

export async function setActiveTrustedContact(patientCpf: string, id: string): Promise<void> {
  await persistActiveTrustedContact(patientCpf, id)
}

export async function loadSelectedTrustedContactIds(patientCpf: string): Promise<string[]> {
  const selectedStore = await readSelectedIdsStore()
  const stored = selectedStore[patientCpf]
  if (stored?.length) {
    const contacts = await loadTrustedContacts(patientCpf)
    const validIds = stored.filter((id) => contacts.some((contact) => contact.id === id))
    if (validIds.length > 0) return validIds
  }

  const activeId = await loadActiveTrustedContactId(patientCpf)
  const contacts = await loadTrustedContacts(patientCpf)

  if (activeId && contacts.some((contact) => contact.id === activeId)) {
    return [activeId]
  }

  if (contacts.length === 1) return [contacts[0].id]
  return []
}

export async function setSelectedTrustedContactIds(
  patientCpf: string,
  ids: string[],
): Promise<void> {
  const contacts = await loadTrustedContacts(patientCpf)
  const uniqueIds = [...new Set(ids.filter((id) => contacts.some((contact) => contact.id === id)))]

  const selectedStore = await readSelectedIdsStore()
  selectedStore[patientCpf] = uniqueIds
  await writeSelectedIdsStore(selectedStore)

  if (uniqueIds[0]) {
    await persistActiveTrustedContact(patientCpf, uniqueIds[0])
  } else {
    const cached = await loadCachedTrustedContacts(patientCpf)
    await cacheTrustedContacts(patientCpf, contacts, cached?.activeSosContactId ?? null)
  }
}

export async function loadSelectedTrustedContacts(
  patientCpf: string,
): Promise<TrustedContact[]> {
  const [contacts, selectedIds] = await Promise.all([
    loadTrustedContacts(patientCpf),
    loadSelectedTrustedContactIds(patientCpf),
  ])
  return contacts.filter((contact) => selectedIds.includes(contact.id))
}

export async function hasSelectedTrustedContactsForShare(
  patientCpf: string,
): Promise<boolean> {
  const selectedIds = await loadSelectedTrustedContactIds(patientCpf)
  return selectedIds.length > 0
}

export async function upsertTrustedContact(
  patientCpf: string,
  contact: TrustedContact,
): Promise<TrustedContact[]> {
  const normalized = normalizeContact(contact)

  if (isGuestPatient(patientCpf)) {
    const contacts = await loadGuestTrustedContacts(patientCpf)
    const index = contacts.findIndex(
      (item) => item.id === normalized.id || item.clientContactId === normalized.clientContactId,
    )

    let nextContacts: TrustedContact[]
    if (index >= 0) {
      nextContacts = [...contacts]
      nextContacts[index] = normalized
    } else if (contacts.length >= MAX_TRUSTED_CONTACTS) {
      throw new Error(`Você pode cadastrar no máximo ${MAX_TRUSTED_CONTACTS} contatos de confiança.`)
    } else {
      nextContacts = [normalized, ...contacts]
    }

    const activeId = (await loadActiveTrustedContactId(patientCpf)) ?? nextContacts[0]?.id ?? null
    await saveGuestTrustedContacts(patientCpf, nextContacts, activeId)
    return nextContacts
  }

  try {
    let dto: TrustedContactsListDto
    if (isServerTrustedContactId(normalized.id)) {
      dto = await updateRunWalkContatoConfianca(normalized.id, {
        name: normalized.name,
        phone: normalized.phone,
        liveShareEnabled: normalized.liveShareEnabled,
      })
    } else {
      dto = await createRunWalkContatoConfianca({
        clientContactId: normalized.clientContactId,
        name: normalized.name,
        phone: normalized.phone,
        liveShareEnabled: normalized.liveShareEnabled,
        isActiveSos: normalized.isActiveSos,
      })
    }

    await cacheTrustedContactsList(patientCpf, dto)
    return mapListDtoToContacts(dto)
  } catch {
    const contacts = await loadTrustedContacts(patientCpf)
    const index = contacts.findIndex(
      (item) => item.id === normalized.id || item.clientContactId === normalized.clientContactId,
    )

    let nextContacts: TrustedContact[]
    if (index >= 0) {
      nextContacts = [...contacts]
      nextContacts[index] = normalized
    } else if (contacts.length >= MAX_TRUSTED_CONTACTS) {
      throw new Error(`Você pode cadastrar no máximo ${MAX_TRUSTED_CONTACTS} contatos de confiança.`)
    } else {
      nextContacts = [normalized, ...contacts]
    }

    const activeId =
      normalized.isActiveSos || contacts.length === 0
        ? normalized.id
        : (await loadActiveTrustedContactId(patientCpf)) ?? nextContacts[0]?.id ?? null

    await cacheTrustedContacts(patientCpf, nextContacts, activeId)
    return nextContacts
  }
}

export async function deleteTrustedContact(
  patientCpf: string,
  id: string,
): Promise<TrustedContact[]> {
  if (isGuestPatient(patientCpf)) {
    const contacts = (await loadGuestTrustedContacts(patientCpf)).filter(
      (contact) => contact.id !== id,
    )
    const selectedIds = (await loadSelectedTrustedContactIds(patientCpf)).filter(
      (selectedId) => selectedId !== id,
    )
    const activeId = (await loadActiveTrustedContactId(patientCpf)) === id
      ? contacts[0]?.id ?? null
      : await loadActiveTrustedContactId(patientCpf)

    await saveGuestTrustedContacts(patientCpf, contacts, activeId)
    await setSelectedTrustedContactIds(patientCpf, selectedIds)
    return contacts
  }

  try {
    const dto = isServerTrustedContactId(id)
      ? await deleteRunWalkContatoConfianca(id)
      : await getRunWalkContatosConfianca()

    if (!isServerTrustedContactId(id)) {
      const contacts = (await loadTrustedContacts(patientCpf)).filter((contact) => contact.id !== id)
      const activeId =
        (await loadActiveTrustedContactId(patientCpf)) === id
          ? contacts[0]?.id ?? null
          : await loadActiveTrustedContactId(patientCpf)
      await cacheTrustedContacts(patientCpf, contacts, activeId)
      const selectedIds = (await loadSelectedTrustedContactIds(patientCpf)).filter(
        (selectedId) => selectedId !== id,
      )
      await setSelectedTrustedContactIds(patientCpf, selectedIds)
      return contacts
    }

    await cacheTrustedContactsList(patientCpf, dto)
    const selectedIds = (await loadSelectedTrustedContactIds(patientCpf)).filter(
      (selectedId) => dto.contacts.some((contact) => contact.id === selectedId),
    )
    const selectedStore = await readSelectedIdsStore()
    selectedStore[patientCpf] = selectedIds
    await writeSelectedIdsStore(selectedStore)
    return mapListDtoToContacts(dto)
  } catch {
    const contacts = (await loadTrustedContacts(patientCpf)).filter((contact) => contact.id !== id)
    const activeId =
      (await loadActiveTrustedContactId(patientCpf)) === id
        ? contacts[0]?.id ?? null
        : await loadActiveTrustedContactId(patientCpf)
    await cacheTrustedContacts(patientCpf, contacts, activeId)
    const selectedIds = (await loadSelectedTrustedContactIds(patientCpf)).filter(
      (selectedId) => selectedId !== id,
    )
    await setSelectedTrustedContactIds(patientCpf, selectedIds)
    return contacts
  }
}

export async function clearTrustedContacts(patientCpf: string): Promise<void> {
  const store = await readCacheStore()
  delete store[patientCpf]
  await writeCacheStore(store)

  const selectedStore = await readSelectedIdsStore()
  delete selectedStore[patientCpf]
  await writeSelectedIdsStore(selectedStore)
}

/** @deprecated Use loadActiveTrustedContact(patientCpf) */
export async function loadTrustedContact(patientCpf: string): Promise<TrustedContact | null> {
  return loadActiveTrustedContact(patientCpf)
}

/** @deprecated Use upsertTrustedContact + setActiveTrustedContact */
export async function saveTrustedContact(
  patientCpf: string,
  contact: TrustedContact,
): Promise<void> {
  await upsertTrustedContact(patientCpf, contact)
  await setActiveTrustedContact(patientCpf, contact.id)
}

/** @deprecated Use clearTrustedContacts(patientCpf) */
export async function clearTrustedContact(patientCpf: string): Promise<void> {
  await clearTrustedContacts(patientCpf)
}

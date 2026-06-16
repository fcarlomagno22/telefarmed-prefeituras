import AsyncStorage from '@react-native-async-storage/async-storage'

const LEGACY_TRUSTED_CONTACT_KEY = '@telefarmed/run-walk/trusted-contact'
const TRUSTED_CONTACTS_KEY = '@telefarmed/run-walk/trusted-contacts'
const ACTIVE_TRUSTED_CONTACT_ID_KEY = '@telefarmed/run-walk/active-trusted-contact-id'
const SELECTED_TRUSTED_CONTACT_IDS_KEY = '@telefarmed/run-walk/selected-trusted-contact-ids'

export type TrustedContact = {
  id: string
  name: string
  phone: string
  liveShareEnabled: boolean
}

type TrustedContactsStore = {
  contacts: TrustedContact[]
}

async function loadStore(): Promise<TrustedContactsStore> {
  await migrateLegacyContact()

  const raw = await AsyncStorage.getItem(TRUSTED_CONTACTS_KEY)
  if (!raw) return { contacts: [] }

  try {
    const parsed = JSON.parse(raw) as TrustedContactsStore
    if (!Array.isArray(parsed.contacts)) return { contacts: [] }
    return parsed
  } catch {
    return { contacts: [] }
  }
}

async function saveStore(store: TrustedContactsStore): Promise<void> {
  await AsyncStorage.setItem(TRUSTED_CONTACTS_KEY, JSON.stringify(store))
}

async function migrateLegacyContact(): Promise<void> {
  const legacyRaw = await AsyncStorage.getItem(LEGACY_TRUSTED_CONTACT_KEY)
  if (!legacyRaw) return

  const currentRaw = await AsyncStorage.getItem(TRUSTED_CONTACTS_KEY)
  if (currentRaw) {
    await AsyncStorage.removeItem(LEGACY_TRUSTED_CONTACT_KEY)
    return
  }

  try {
    const legacy = JSON.parse(legacyRaw) as TrustedContact
    if (!legacy?.id || !legacy?.name) {
      await AsyncStorage.removeItem(LEGACY_TRUSTED_CONTACT_KEY)
      return
    }

    await saveStore({ contacts: [legacy] })
    await AsyncStorage.setItem(ACTIVE_TRUSTED_CONTACT_ID_KEY, legacy.id)
    await AsyncStorage.removeItem(LEGACY_TRUSTED_CONTACT_KEY)
  } catch {
    await AsyncStorage.removeItem(LEGACY_TRUSTED_CONTACT_KEY)
  }
}

export async function loadTrustedContacts(): Promise<TrustedContact[]> {
  const store = await loadStore()
  return store.contacts
}

export async function loadActiveTrustedContactId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_TRUSTED_CONTACT_ID_KEY)
}

export async function loadActiveTrustedContact(): Promise<TrustedContact | null> {
  const [contacts, activeId] = await Promise.all([
    loadTrustedContacts(),
    loadActiveTrustedContactId(),
  ])

  if (!activeId) return contacts[0] ?? null
  return contacts.find((contact) => contact.id === activeId) ?? contacts[0] ?? null
}

export async function setActiveTrustedContact(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_TRUSTED_CONTACT_ID_KEY, id)
}

export async function loadSelectedTrustedContactIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(SELECTED_TRUSTED_CONTACT_IDS_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) {
        const contacts = await loadTrustedContacts()
        const validIds = parsed.filter((id) => contacts.some((contact) => contact.id === id))
        if (validIds.length > 0) return validIds
      }
    } catch {
      // fall through to defaults
    }
  }

  const [contacts, activeId] = await Promise.all([
    loadTrustedContacts(),
    loadActiveTrustedContactId(),
  ])

  if (activeId && contacts.some((contact) => contact.id === activeId)) {
    return [activeId]
  }

  if (contacts.length === 1) return [contacts[0].id]
  return []
}

export async function setSelectedTrustedContactIds(ids: string[]): Promise<void> {
  const contacts = await loadTrustedContacts()
  const uniqueIds = [...new Set(ids.filter((id) => contacts.some((contact) => contact.id === id)))]
  await AsyncStorage.setItem(SELECTED_TRUSTED_CONTACT_IDS_KEY, JSON.stringify(uniqueIds))

  if (uniqueIds[0]) {
    await setActiveTrustedContact(uniqueIds[0])
  } else {
    await AsyncStorage.removeItem(ACTIVE_TRUSTED_CONTACT_ID_KEY)
  }
}

export async function loadSelectedTrustedContacts(): Promise<TrustedContact[]> {
  const [contacts, selectedIds] = await Promise.all([
    loadTrustedContacts(),
    loadSelectedTrustedContactIds(),
  ])
  return contacts.filter((contact) => selectedIds.includes(contact.id))
}

export async function hasSelectedTrustedContactsForShare(): Promise<boolean> {
  const selectedIds = await loadSelectedTrustedContactIds()
  return selectedIds.length > 0
}

export async function upsertTrustedContact(contact: TrustedContact): Promise<TrustedContact[]> {
  const store = await loadStore()
  const index = store.contacts.findIndex((item) => item.id === contact.id)

  if (index >= 0) {
    store.contacts[index] = contact
  } else {
    store.contacts = [contact, ...store.contacts]
  }

  await saveStore(store)
  return store.contacts
}

export async function deleteTrustedContact(id: string): Promise<TrustedContact[]> {
  const store = await loadStore()
  store.contacts = store.contacts.filter((contact) => contact.id !== id)
  await saveStore(store)

  const activeId = await loadActiveTrustedContactId()
  if (activeId === id) {
    const selectedIds = (await loadSelectedTrustedContactIds()).filter((selectedId) => selectedId !== id)
    await setSelectedTrustedContactIds(selectedIds)

    if (store.contacts[0]) {
      await setActiveTrustedContact(store.contacts[0].id)
    } else {
      await AsyncStorage.removeItem(ACTIVE_TRUSTED_CONTACT_ID_KEY)
    }
  } else {
    const selectedIds = (await loadSelectedTrustedContactIds()).filter((selectedId) => selectedId !== id)
    await setSelectedTrustedContactIds(selectedIds)
  }

  return store.contacts
}

export async function clearTrustedContacts(): Promise<void> {
  await AsyncStorage.multiRemove([
    TRUSTED_CONTACTS_KEY,
    ACTIVE_TRUSTED_CONTACT_ID_KEY,
    SELECTED_TRUSTED_CONTACT_IDS_KEY,
  ])
}

/** @deprecated Use loadActiveTrustedContact */
export async function loadTrustedContact(): Promise<TrustedContact | null> {
  return loadActiveTrustedContact()
}

/** @deprecated Use upsertTrustedContact + setActiveTrustedContact */
export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  await upsertTrustedContact(contact)
  await setActiveTrustedContact(contact.id)
}

/** @deprecated Use clearTrustedContacts */
export async function clearTrustedContact(): Promise<void> {
  await clearTrustedContacts()
}

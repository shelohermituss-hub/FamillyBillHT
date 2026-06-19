export type FieldType = 'text' | 'number' | 'tel' | 'select'

export type BillField = {
  id: string
  label: string
  placeholder: string
  type: FieldType
  required: boolean
  hint?: string
  maxLength?: number
  pattern?: string
  options?: string[]
}

export type Provider = {
  id: string
  name: string
  shortName: string
  category: string
  emoji: string
  color: string
  bg: string
  description: string
  fields: BillField[]
  minAmount?: number
  maxAmount?: number
  fee: number
  instant: boolean
  priority: 1 | 2
}

export type BillCategory = {
  id: string
  label: string
  emoji: string
  color: string
  bg: string
  providerIds: string[]
}

export const BILL_CATEGORIES: BillCategory[] = [
  { id: 'electricity', label: 'Électricité', emoji: '⚡', color: '#f59e0b', bg: '#fef3c7', providerIds: ['edh'] },
  { id: 'tv',          label: 'TV / Câble',  emoji: '📺', color: '#8b5cf6', bg: '#ede9fe', providerIds: ['canal_plus', 'nutv'] },
  { id: 'phone',       label: 'Téléphone',   emoji: '📱', color: '#3b82f6', bg: '#dbeafe', providerIds: ['digicel', 'natcom'] },
  { id: 'internet',    label: 'Internet',    emoji: '🌐', color: '#06b6d4', bg: '#cffafe', providerIds: ['access_haiti', 'wimis'] },
  { id: 'water',       label: 'Eau',         emoji: '💧', color: '#0ea5e9', bg: '#e0f2fe', providerIds: ['camep', 'veolia'] },
  { id: 'moncash',     label: 'MonCash',     emoji: '💸', color: '#ef4444', bg: '#fee2e2', providerIds: ['moncash'] },
  { id: 'rent',        label: 'Loyer',       emoji: '🏠', color: '#10b981', bg: '#d1fae5', providerIds: ['rent'] },
  { id: 'gas',         label: 'Gaz',         emoji: '🔥', color: '#f97316', bg: '#ffedd5', providerIds: ['sodigaz'] },
  { id: 'insurance',   label: 'Assurance',   emoji: '🛡️', color: '#64748b', bg: '#f1f5f9', providerIds: ['aic'] },
]

export const PROVIDERS: Provider[] = [
  // ── PRIORITY 1 ──────────────────────────────────────────────────────────────
  {
    id: 'edh',
    name: 'Électricité d\'Haïti (EDH)',
    shortName: 'EDH',
    category: 'electricity',
    emoji: '⚡',
    color: '#f59e0b',
    bg: '#fef3c7',
    description: 'Paiement de facture d\'électricité EDH',
    fee: 0,
    instant: true,
    priority: 1,
    fields: [
      {
        id: 'meter_number',
        label: 'Numéro de compteur',
        placeholder: '12345678901234',
        type: 'text',
        required: true,
        hint: '14 chiffres imprimés sur votre facture',
        maxLength: 14,
        pattern: '^[0-9]{14}$',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: false,
        hint: 'Tel qu\'indiqué sur la facture',
      },
    ],
  },

  {
    id: 'digicel',
    name: 'Digicel Haïti',
    shortName: 'Digicel',
    category: 'phone',
    emoji: '📱',
    color: '#ef4444',
    bg: '#fee2e2',
    description: 'Recharge, forfait ou données Digicel',
    fee: 0,
    instant: true,
    priority: 1,
    fields: [
      {
        id: 'phone_number',
        label: 'Numéro Digicel',
        placeholder: '36000000',
        type: 'tel',
        required: true,
        hint: '8 chiffres (ex. 36xxxxxx / 37xxxxxx / 38xxxxxx)',
        maxLength: 8,
        pattern: '^(36|37|38|39)[0-9]{6}$',
      },
      {
        id: 'service_type',
        label: 'Type de service',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Recharge crédit', 'Forfait appels', 'Forfait données', 'Combo appels + données'],
      },
    ],
  },

  {
    id: 'natcom',
    name: 'Natcom',
    shortName: 'Natcom',
    category: 'phone',
    emoji: '📱',
    color: '#1d4ed8',
    bg: '#dbeafe',
    description: 'Recharge ou forfait Natcom',
    fee: 0,
    instant: true,
    priority: 1,
    fields: [
      {
        id: 'phone_number',
        label: 'Numéro Natcom',
        placeholder: '34000000',
        type: 'tel',
        required: true,
        hint: '8 chiffres (ex. 34xxxxxx / 35xxxxxx)',
        maxLength: 8,
        pattern: '^(34|35)[0-9]{6}$',
      },
      {
        id: 'service_type',
        label: 'Type de service',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Recharge crédit', 'Forfait appels', 'Forfait données'],
      },
    ],
  },

  {
    id: 'canal_plus',
    name: 'Canal+ Haïti',
    shortName: 'Canal+',
    category: 'tv',
    emoji: '📺',
    color: '#7c3aed',
    bg: '#ede9fe',
    description: 'Abonnement Canal+ / Canal+ Haïti',
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'subscriber_number',
        label: 'N° d\'abonné / Décodeur',
        placeholder: '1234567890',
        type: 'text',
        required: true,
        hint: '10 chiffres sur votre décodeur ou facture',
        maxLength: 10,
      },
      {
        id: 'duration',
        label: 'Durée d\'abonnement',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['1 mois', '3 mois', '6 mois', '12 mois'],
      },
    ],
  },

  {
    id: 'nutv',
    name: 'NuTV',
    shortName: 'NuTV',
    category: 'tv',
    emoji: '📺',
    color: '#0891b2',
    bg: '#cffafe',
    description: 'Abonnement NuTV (bouquet local)',
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'subscriber_number',
        label: 'N° d\'abonné NuTV',
        placeholder: '123456',
        type: 'text',
        required: true,
        hint: 'Numéro sur votre carte abonné',
      },
      {
        id: 'package',
        label: 'Formule',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Basic (30 chaînes)', 'Standard (60 chaînes)', 'Premium (90+ chaînes)'],
      },
    ],
  },

  {
    id: 'moncash',
    name: 'MonCash (Digicel)',
    shortName: 'MonCash',
    category: 'moncash',
    emoji: '💸',
    color: '#ef4444',
    bg: '#fee2e2',
    description: 'Envoi via portefeuille MonCash',
    fee: 0,
    instant: true,
    priority: 1,
    fields: [
      {
        id: 'moncash_number',
        label: 'Numéro MonCash (Digicel)',
        placeholder: '36000000',
        type: 'tel',
        required: true,
        hint: 'N° Digicel du destinataire',
        maxLength: 8,
        pattern: '^(36|37|38|39)[0-9]{6}$',
      },
      {
        id: 'reference',
        label: 'Référence / Motif',
        placeholder: 'Ex. loyer mai, facture, etc.',
        type: 'text',
        required: false,
        hint: 'Visible par le destinataire',
      },
    ],
  },

  // ── PRIORITY 2 ──────────────────────────────────────────────────────────────
  {
    id: 'camep',
    name: 'CAMEP',
    shortName: 'CAMEP',
    category: 'water',
    emoji: '💧',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    description: 'Paiement d\'eau CAMEP (Port-au-Prince)',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'contract_number',
        label: 'N° de contrat / Abonné',
        placeholder: 'CAMEP-123456',
        type: 'text',
        required: true,
        hint: 'Indiqué sur votre facture CAMEP',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: false,
      },
    ],
  },

  {
    id: 'veolia',
    name: 'Veolia Eau',
    shortName: 'Veolia',
    category: 'water',
    emoji: '💧',
    color: '#0284c7',
    bg: '#e0f2fe',
    description: 'Paiement d\'eau Veolia',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'contract_number',
        label: 'N° de contrat',
        placeholder: 'VEO-78901',
        type: 'text',
        required: true,
        hint: 'Numéro sur votre contrat Veolia',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: false,
      },
    ],
  },

  {
    id: 'access_haiti',
    name: 'Access Haiti',
    shortName: 'Access Haiti',
    category: 'internet',
    emoji: '🌐',
    color: '#06b6d4',
    bg: '#cffafe',
    description: 'Abonnement Internet Access Haiti',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'subscriber_id',
        label: 'N° d\'abonné',
        placeholder: 'AH-00123',
        type: 'text',
        required: true,
        hint: 'Sur votre contrat ou facture',
      },
      {
        id: 'plan',
        label: 'Forfait',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Mensuel', 'Trimestriel', 'Semi-annuel', 'Annuel'],
      },
    ],
  },

  {
    id: 'wimis',
    name: 'WiMiS',
    shortName: 'WiMiS',
    category: 'internet',
    emoji: '🌐',
    color: '#2563eb',
    bg: '#dbeafe',
    description: 'Abonnement Internet WiMiS',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'subscriber_id',
        label: 'N° de client WiMiS',
        placeholder: 'WMS-00456',
        type: 'text',
        required: true,
        hint: 'Sur votre contrat ou facture WiMiS',
      },
      {
        id: 'plan',
        label: 'Forfait',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Mensuel', 'Trimestriel', 'Annuel'],
      },
    ],
  },

  {
    id: 'sodigaz',
    name: 'SODIGAZ',
    shortName: 'SODIGAZ',
    category: 'gas',
    emoji: '🔥',
    color: '#f97316',
    bg: '#ffedd5',
    description: 'Commande de bonbonnes de propane',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'client_number',
        label: 'N° de client SODIGAZ',
        placeholder: 'SOD-00789',
        type: 'text',
        required: true,
        hint: 'Sur votre carte client ou facture',
      },
      {
        id: 'cylinder_size',
        label: 'Taille de bonbonne',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['10 kg', '20 kg', '45 kg', '100 kg'],
      },
      {
        id: 'quantity',
        label: 'Quantité',
        placeholder: '1',
        type: 'number',
        required: true,
        hint: 'Nombre de bonbonnes',
      },
    ],
  },

  {
    id: 'aic',
    name: 'AIC Assurance',
    shortName: 'AIC',
    category: 'insurance',
    emoji: '🛡️',
    color: '#64748b',
    bg: '#f1f5f9',
    description: 'Paiement de prime d\'assurance AIC',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'policy_number',
        label: 'N° de police',
        placeholder: 'AIC-2024-00001',
        type: 'text',
        required: true,
        hint: 'Sur votre contrat d\'assurance',
      },
      {
        id: 'insurance_type',
        label: 'Type d\'assurance',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Automobile', 'Habitation', 'Santé', 'Vie', 'Responsabilité civile'],
      },
    ],
  },

  {
    id: 'rent',
    name: 'Loyer / Propriétaire',
    shortName: 'Loyer',
    category: 'rent',
    emoji: '🏠',
    color: '#10b981',
    bg: '#d1fae5',
    description: 'Paiement de loyer à votre propriétaire',
    fee: 0,
    instant: true,
    priority: 2,
    fields: [
      {
        id: 'landlord_name',
        label: 'Nom du propriétaire',
        placeholder: 'Pierre Jacques',
        type: 'text',
        required: true,
      },
      {
        id: 'property_address',
        label: 'Adresse du bien',
        placeholder: '12 Rue Geffrard, Pétionville',
        type: 'text',
        required: true,
      },
      {
        id: 'period',
        label: 'Période',
        placeholder: '',
        type: 'select',
        required: true,
        options: [
          'Janvier 2025', 'Février 2025', 'Mars 2025', 'Avril 2025',
          'Mai 2025', 'Juin 2025', 'Juillet 2025', 'Août 2025',
          'Septembre 2025', 'Octobre 2025', 'Novembre 2025', 'Décembre 2025',
        ],
      },
    ],
  },
]

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find(p => p.id === id)
}

export function getCategory(id: string): BillCategory | undefined {
  return BILL_CATEGORIES.find(c => c.id === id)
}

export function getProvidersForCategory(categoryId: string): Provider[] {
  const cat = getCategory(categoryId)
  if (!cat) return []
  return cat.providerIds.map(id => PROVIDERS.find(p => p.id === id)).filter(Boolean) as Provider[]
}

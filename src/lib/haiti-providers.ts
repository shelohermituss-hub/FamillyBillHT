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
  logo?: string
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
  icon?: string
  color: string
  bg: string
  providerIds: string[]
}

// ── Shared period options ──────────────────────────────────────────────────────
const MONTHS_2025_2026 = [
  'Janvier 2025', 'Février 2025', 'Mars 2025', 'Avril 2025',
  'Mai 2025', 'Juin 2025', 'Juillet 2025', 'Août 2025',
  'Septembre 2025', 'Octobre 2025', 'Novembre 2025', 'Décembre 2025',
  'Janvier 2026', 'Février 2026', 'Mars 2026', 'Avril 2026',
  'Mai 2026', 'Juin 2026',
]

const SCHOOL_PERIODS = [
  '1er Trimestre 2024-2025', '2ème Trimestre 2024-2025', '3ème Trimestre 2024-2025',
  '1er Trimestre 2025-2026', '2ème Trimestre 2025-2026', '3ème Trimestre 2025-2026',
  'Inscription 2025-2026', 'Inscription 2026-2027',
]

// ── Categories ─────────────────────────────────────────────────────────────────
export const BILL_CATEGORIES: BillCategory[] = [
  { id: 'electricity', label: 'Électricité', emoji: '⚡', icon: '/icons/categories/electricity.jpg', color: '#f59e0b', bg: '#fef3c7', providerIds: ['edh'] },
  { id: 'water',       label: 'Eau',         emoji: '💧', icon: '/icons/categories/water.png',        color: '#0ea5e9', bg: '#e0f2fe', providerIds: ['camep', 'veolia'] },
  { id: 'phone',       label: 'Téléphone',   emoji: '📱', icon: '/icons/categories/phone.png',        color: '#3b82f6', bg: '#dbeafe', providerIds: ['digicel', 'natcom'] },
  { id: 'internet',    label: 'Internet',    emoji: '🌐', icon: '/icons/providers/access_haiti.png',  color: '#06b6d4', bg: '#cffafe', providerIds: ['access_haiti', 'wimis'] },
  { id: 'tv',          label: 'TV / Câble',  emoji: '📺', icon: '/icons/categories/tv.jpg',           color: '#8b5cf6', bg: '#ede9fe', providerIds: ['canal_plus', 'nutv'] },
  { id: 'school',      label: 'École',       emoji: '🎓', icon: '/icons/categories/school.png',       color: '#10b981', bg: '#d1fae5', providerIds: ['frais_scolaires'] },
  { id: 'health',      label: 'Santé',       emoji: '🏥', icon: '/icons/categories/health.png',       color: '#ec4899', bg: '#fce7f3', providerIds: ['clinique'] },
  { id: 'moncash',     label: 'MonCash',     emoji: '💸', icon: '/icons/providers/moncash.png',       color: '#ef4444', bg: '#fee2e2', providerIds: ['moncash'] },
  { id: 'rent',        label: 'Loyer',       emoji: '🏠', icon: '/icons/categories/loyer.png',        color: '#6366f1', bg: '#eef2ff', providerIds: ['rent'] },
  { id: 'gas',         label: 'Gaz',         emoji: '🔥', icon: '/icons/categories/gas.jpg',          color: '#f97316', bg: '#ffedd5', providerIds: ['sodigaz'] },
  { id: 'insurance',   label: 'Assurance',   emoji: '🛡️', icon: '/icons/providers/aic.jpg',           color: '#64748b', bg: '#f1f5f9', providerIds: ['aic'] },
]

// ── Providers ──────────────────────────────────────────────────────────────────
export const PROVIDERS: Provider[] = [

  // ════════════════════════════════════════════════════════════
  // PRIORITY 1
  // ════════════════════════════════════════════════════════════

  // ── Électricité d'Haïti (EDH) ─────────────────────────────
  {
    id: 'edh',
    name: "Électricité d'Haïti (EDH)",
    shortName: 'EDH',
    category: 'electricity',
    emoji: '⚡',
    logo: '/icons/providers/edh.jpg',
    color: '#f59e0b',
    bg: '#fef3c7',
    description: "Paiement de facture d'électricité EDH",
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
        hint: '14 chiffres imprimés sur votre facture ou compteur',
        maxLength: 14,
        pattern: '^[0-9]{10,14}$',
      },
      {
        id: 'customer_number',
        label: 'N° de client EDH',
        placeholder: 'EDH-123456',
        type: 'text',
        required: false,
        hint: 'Numéro de client sur votre contrat (optionnel)',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
        hint: "Tel qu'indiqué sur la facture",
      },
      {
        id: 'service_address',
        label: 'Adresse du service',
        placeholder: '12 Rue Geffrard, Pétionville',
        type: 'text',
        required: false,
        hint: 'Adresse du branchement électrique',
      },
      {
        id: 'billing_period',
        label: 'Période facturée',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Digicel Haïti ──────────────────────────────────────────
  {
    id: 'digicel',
    name: 'Digicel Haïti',
    shortName: 'Digicel',
    category: 'phone',
    emoji: '📱',
    logo: '/icons/providers/digicel.png',
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
        hint: '8 chiffres (ex. 36xxxxxx / 37xxxxxx / 38xxxxxx / 39xxxxxx)',
        maxLength: 8,
        pattern: '^(36|37|38|39)[0-9]{6}$',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: false,
        hint: 'Nom associé au compte (optionnel)',
      },
      {
        id: 'service_type',
        label: 'Type de service',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Recharge crédit', 'Forfait appels', 'Forfait données', 'Combo appels + données', 'Forfait international'],
      },
      {
        id: 'billing_period',
        label: 'Mois concerné',
        placeholder: '',
        type: 'select',
        required: false,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Natcom ─────────────────────────────────────────────────
  {
    id: 'natcom',
    name: 'Natcom',
    shortName: 'Natcom',
    category: 'phone',
    emoji: '📱',
    logo: '/icons/providers/natcom.webp',
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
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: false,
      },
      {
        id: 'service_type',
        label: 'Type de service',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Recharge crédit', 'Forfait appels', 'Forfait données', 'Forfait voix + données'],
      },
      {
        id: 'billing_period',
        label: 'Mois concerné',
        placeholder: '',
        type: 'select',
        required: false,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Canal+ Haïti ───────────────────────────────────────────
  {
    id: 'canal_plus',
    name: 'Canal+ Haïti',
    shortName: 'Canal+',
    category: 'tv',
    emoji: '📺',
    logo: '/icons/providers/canal_plus.jpg',
    color: '#7c3aed',
    bg: '#ede9fe',
    description: 'Abonnement Canal+ / Canal+ Haïti',
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'subscriber_number',
        label: "N° d'abonné / Décodeur",
        placeholder: '1234567890',
        type: 'text',
        required: true,
        hint: '10 chiffres sur votre décodeur ou facture',
        maxLength: 10,
      },
      {
        id: 'account_name',
        label: "Nom du titulaire du compte",
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
        hint: "Nom enregistré chez Canal+",
      },
      {
        id: 'duration',
        label: "Durée d'abonnement",
        placeholder: '',
        type: 'select',
        required: true,
        options: ['1 mois', '3 mois', '6 mois', '12 mois'],
      },
      {
        id: 'billing_period',
        label: 'Période de début',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── NuTV ───────────────────────────────────────────────────
  {
    id: 'nutv',
    name: 'NuTV',
    shortName: 'NuTV',
    category: 'tv',
    emoji: '📺',
    logo: '/icons/providers/nutv.png',
    color: '#f59e0b',
    bg: '#fef3c7',
    description: 'Abonnement NuTV (bouquet local)',
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'subscriber_number',
        label: "N° d'abonné NuTV",
        placeholder: '123456',
        type: 'text',
        required: true,
        hint: 'Numéro sur votre carte abonné',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'package',
        label: 'Formule',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Basic (30 chaînes)', 'Standard (60 chaînes)', 'Premium (90+ chaînes)'],
      },
      {
        id: 'billing_period',
        label: 'Mois concerné',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── MonCash ────────────────────────────────────────────────
  {
    id: 'moncash',
    name: 'MonCash (Digicel)',
    shortName: 'MonCash',
    category: 'moncash',
    emoji: '💸',
    logo: '/icons/providers/moncash.png',
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
        hint: 'N° Digicel du destinataire (36/37/38/39xxxxxx)',
        maxLength: 8,
        pattern: '^(36|37|38|39)[0-9]{6}$',
      },
      {
        id: 'account_name',
        label: 'Nom du bénéficiaire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: false,
        hint: 'Pour vérification (optionnel)',
      },
      {
        id: 'reference',
        label: 'Référence / Motif',
        placeholder: 'Ex. loyer mai, facture, aide famille…',
        type: 'text',
        required: false,
        hint: 'Visible par le destinataire',
      },
    ],
  },

  // ── Frais Scolaires ────────────────────────────────────────
  {
    id: 'frais_scolaires',
    name: 'Frais Scolaires',
    shortName: 'École',
    category: 'school',
    emoji: '🎓',
    logo: '/icons/categories/school.png',
    color: '#10b981',
    bg: '#d1fae5',
    description: "Paiement de frais scolaires, inscription ou cantine",
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'school_name',
        label: "Nom de l'école",
        placeholder: 'Collège Saint-Pierre, Pétionville',
        type: 'text',
        required: true,
        hint: 'Nom complet de l\'établissement',
      },
      {
        id: 'student_name',
        label: "Nom complet de l'élève",
        placeholder: 'Marie Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'student_id',
        label: "N° d'inscription / Matricule",
        placeholder: '2025-00123',
        type: 'text',
        required: true,
        hint: 'Numéro de dossier ou matricule de l\'élève',
      },
      {
        id: 'parent_name',
        label: 'Nom du parent / tuteur',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: false,
      },
      {
        id: 'class_level',
        label: 'Classe / Niveau',
        placeholder: 'Ex. 6ème, 3ème, Terminale',
        type: 'text',
        required: true,
      },
      {
        id: 'fee_type',
        label: 'Type de frais',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Scolarité', 'Inscription', 'Uniforme', 'Transport', 'Cantine', 'Examens', 'Activités parascolaires', 'Frais administratifs'],
      },
      {
        id: 'billing_period',
        label: 'Trimestre / Période',
        placeholder: '',
        type: 'select',
        required: true,
        options: SCHOOL_PERIODS,
      },
    ],
  },

  // ── Clinique / Hôpital ─────────────────────────────────────
  {
    id: 'clinique',
    name: 'Clinique / Hôpital',
    shortName: 'Santé',
    category: 'health',
    emoji: '🏥',
    logo: '/icons/categories/health.png',
    color: '#ec4899',
    bg: '#fce7f3',
    description: 'Paiement de facture médicale, consultation ou hospitalisation',
    fee: 0,
    instant: false,
    priority: 1,
    fields: [
      {
        id: 'clinic_name',
        label: 'Nom de la clinique / hôpital',
        placeholder: 'Clinique Canapé Vert, Port-au-Prince',
        type: 'text',
        required: true,
      },
      {
        id: 'patient_name',
        label: 'Nom complet du patient',
        placeholder: 'Marie Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'record_number',
        label: 'N° de dossier médical',
        placeholder: 'DOS-2025-00456',
        type: 'text',
        required: true,
        hint: 'Numéro de dossier fourni par la clinique',
      },
      {
        id: 'responsible_name',
        label: 'Nom du responsable de paiement',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: false,
        hint: 'Si différent du patient',
      },
      {
        id: 'service_type',
        label: 'Service / Type de soins',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Consultation', 'Hospitalisation', 'Urgences', 'Chirurgie', 'Maternité', 'Laboratoire', 'Radiologie / Imagerie', 'Pharmacie', 'Suivi post-opératoire'],
      },
      {
        id: 'bill_reference',
        label: 'N° de facture médicale',
        placeholder: 'FACT-2025-00789',
        type: 'text',
        required: false,
        hint: 'Référence sur votre facture (optionnel)',
      },
      {
        id: 'billing_period',
        label: 'Mois de la prestation',
        placeholder: '',
        type: 'select',
        required: false,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  // PRIORITY 2
  // ════════════════════════════════════════════════════════════

  // ── CAMEP ──────────────────────────────────────────────────
  {
    id: 'camep',
    name: 'CAMEP',
    shortName: 'CAMEP',
    category: 'water',
    emoji: '💧',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    description: "Paiement d'eau CAMEP (Port-au-Prince)",
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'contract_number',
        label: "N° de contrat / Abonné",
        placeholder: 'CAMEP-123456',
        type: 'text',
        required: true,
        hint: 'Numéro sur votre facture CAMEP',
      },
      {
        id: 'meter_number',
        label: 'N° de compteur (si disponible)',
        placeholder: '123456',
        type: 'text',
        required: false,
        hint: 'Référence du compteur d\'eau',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: true,
      },
      {
        id: 'service_address',
        label: 'Adresse du branchement',
        placeholder: '5 Rue du Peuple, Port-au-Prince',
        type: 'text',
        required: false,
      },
      {
        id: 'billing_period',
        label: 'Période facturée',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Veolia Eau ─────────────────────────────────────────────
  {
    id: 'veolia',
    name: 'Veolia Eau',
    shortName: 'Veolia',
    category: 'water',
    emoji: '💧',
    logo: '/icons/providers/veolia.jpg',
    color: '#e53e3e',
    bg: '#fee2e2',
    description: "Paiement d'eau Veolia",
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
        id: 'meter_number',
        label: 'N° de compteur',
        placeholder: '98765',
        type: 'text',
        required: false,
        hint: 'Référence du compteur (optionnel)',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: true,
      },
      {
        id: 'service_address',
        label: 'Adresse du branchement',
        placeholder: '8 Avenue Christophe, Port-au-Prince',
        type: 'text',
        required: false,
      },
      {
        id: 'billing_period',
        label: 'Période facturée',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Access Haiti ───────────────────────────────────────────
  {
    id: 'access_haiti',
    name: 'Access Haiti',
    shortName: 'Access Haiti',
    category: 'internet',
    emoji: '🌐',
    logo: '/icons/providers/access_haiti.png',
    color: '#e53e3e',
    bg: '#fee2e2',
    description: 'Abonnement Internet Access Haiti',
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'subscriber_id',
        label: "N° d'abonné / Contrat",
        placeholder: 'AH-00123',
        type: 'text',
        required: true,
        hint: 'Sur votre contrat ou facture Access Haiti',
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'service_address',
        label: 'Adresse du service',
        placeholder: '12 Rue Geffrard, Pétionville',
        type: 'text',
        required: false,
        hint: 'Lieu de fourniture du service internet',
      },
      {
        id: 'plan',
        label: 'Type de forfait',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Résidentiel Standard', 'Résidentiel Pro', 'Business Basic', 'Business Pro', 'Enterprise'],
      },
      {
        id: 'billing_period',
        label: 'Période facturée',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── WiMiS ──────────────────────────────────────────────────
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
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'service_address',
        label: 'Adresse du service',
        placeholder: '5 Rue du Panthéon, Port-au-Prince',
        type: 'text',
        required: false,
      },
      {
        id: 'plan',
        label: 'Forfait',
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Mensuel', 'Trimestriel', 'Semi-annuel', 'Annuel'],
      },
      {
        id: 'billing_period',
        label: 'Période facturée',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── SODIGAZ ────────────────────────────────────────────────
  {
    id: 'sodigaz',
    name: 'SODIGAZ',
    shortName: 'SODIGAZ',
    category: 'gas',
    emoji: '🔥',
    logo: '/icons/providers/sodigaz.png',
    color: '#1d6eb5',
    bg: '#dbeafe',
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
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'service_address',
        label: 'Adresse de livraison',
        placeholder: '7 Impasse Martin, Delmas',
        type: 'text',
        required: true,
        hint: 'Adresse pour la livraison des bonbonnes',
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

  // ── AIC Assurance ──────────────────────────────────────────
  {
    id: 'aic',
    name: 'AIC Assurance',
    shortName: 'AIC',
    category: 'insurance',
    emoji: '🛡️',
    logo: '/icons/providers/aic.jpg',
    color: '#1d4ed8',
    bg: '#dbeafe',
    description: "Paiement de prime d'assurance AIC",
    fee: 0,
    instant: false,
    priority: 2,
    fields: [
      {
        id: 'policy_number',
        label: 'N° de police / Contrat',
        placeholder: 'AIC-2024-00001',
        type: 'text',
        required: true,
        hint: "Sur votre contrat d'assurance",
      },
      {
        id: 'account_name',
        label: 'Nom du titulaire',
        placeholder: 'Jean Pierre',
        type: 'text',
        required: true,
      },
      {
        id: 'insurance_type',
        label: "Type d'assurance",
        placeholder: '',
        type: 'select',
        required: true,
        options: ['Automobile', 'Habitation', 'Santé', 'Vie', 'Responsabilité civile', 'Commerce / Entreprise'],
      },
      {
        id: 'billing_period',
        label: 'Période de prime',
        placeholder: '',
        type: 'select',
        required: false,
        options: MONTHS_2025_2026,
      },
    ],
  },

  // ── Loyer / Propriétaire ───────────────────────────────────
  {
    id: 'rent',
    name: 'Loyer / Propriétaire',
    shortName: 'Loyer',
    category: 'rent',
    emoji: '🏠',
    color: '#6366f1',
    bg: '#eef2ff',
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
        label: 'Adresse du bien loué',
        placeholder: '12 Rue Geffrard, Pétionville',
        type: 'text',
        required: true,
      },
      {
        id: 'account_name',
        label: 'Nom du locataire',
        placeholder: 'Marie Jean',
        type: 'text',
        required: false,
        hint: 'Votre nom en tant que locataire',
      },
      {
        id: 'billing_period',
        label: 'Mois de loyer',
        placeholder: '',
        type: 'select',
        required: true,
        options: MONTHS_2025_2026,
      },
      {
        id: 'late_payment_note',
        label: 'Note (retard / autre)',
        placeholder: 'Ex. paiement en retard pour novembre 2025',
        type: 'text',
        required: false,
        hint: 'Précisez si paiement partiel ou en retard',
      },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
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

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Au moins 6 caractères'),
  confirmPassword: z.string().min(6, 'Au moins 6 caractères'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export const transferSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  note: z.string().max(200, 'La note ne peut pas dépasser 200 caractères').optional().or(z.literal('')),
  recipientName: z.string().optional(),
})

export const bankTransferSchema = z.object({
  bankName: z.string().min(1, 'Nom de la banque requis'),
  recipientName: z.string().min(2, 'Nom du bénéficiaire requis'),
  recipientAccount: z.string().min(4, 'Numéro de compte invalide'),
  purpose: z.string().optional().or(z.literal('')),
  amount: z.number().positive('Le montant doit être positif'),
})

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
  phone: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
})

export const billPaymentSchema = z.object({
  providerId: z.string().min(1, 'Sélectionnez un fournisseur'),
  amount: z.number().positive('Le montant doit être positif'),
  fields: z.record(z.string(), z.string()),
})

export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type TransferInput = z.infer<typeof transferSchema>
export type BankTransferInput = z.infer<typeof bankTransferSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type BillPaymentInput = z.infer<typeof billPaymentSchema>

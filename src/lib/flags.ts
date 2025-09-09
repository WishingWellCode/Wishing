/**
 * Feature flags configuration
 */

export const FEATURE_PORTAL4 = process.env.NEXT_PUBLIC_FEATURE_PORTAL4 !== 'false'

export const FLAGS = {
  PORTAL4: FEATURE_PORTAL4,
} as const

export type FeatureFlag = keyof typeof FLAGS
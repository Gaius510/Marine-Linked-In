import type { Role } from '@/lib/types'

export const VIEW_QUERY_PARAM = 'view'

export type SeafarerView = 'overview' | 'cv' | 'jobs' | 'applications'
export type RecruiterView = 'overview' | 'browse' | 'postJob' | 'myJobs' | 'saved' | 'interviews' | 'messages'
export type AdminView = 'overview' | 'masterList'
export type AppView = SeafarerView | RecruiterView | AdminView
export type ViewSlug =
  | 'overview'
  | 'browse'
  | 'post-job'
  | 'my-jobs'
  | 'saved'
  | 'interviews'
  | 'messages'
  | 'cv'
  | 'jobs'
  | 'applications'
  | 'master-database'

const ROLE_VIEWS: Record<Role, readonly AppView[]> = {
  SEAFARER: ['overview', 'cv', 'jobs', 'applications'],
  RECRUITER: ['overview', 'browse', 'postJob', 'myJobs', 'saved', 'interviews', 'messages'],
  ADMIN: ['overview', 'masterList'],
}

const VIEW_TO_SLUG: Record<AppView, ViewSlug> = {
  overview: 'overview',
  browse: 'browse',
  postJob: 'post-job',
  myJobs: 'my-jobs',
  saved: 'saved',
  interviews: 'interviews',
  messages: 'messages',
  cv: 'cv',
  jobs: 'jobs',
  applications: 'applications',
  masterList: 'master-database',
}

const SLUG_TO_VIEW: Record<ViewSlug, AppView> = {
  overview: 'overview',
  browse: 'browse',
  'post-job': 'postJob',
  'my-jobs': 'myJobs',
  saved: 'saved',
  interviews: 'interviews',
  messages: 'messages',
  cv: 'cv',
  jobs: 'jobs',
  applications: 'applications',
  'master-database': 'masterList',
}

export function getDefaultViewForRole(_role: Role): AppView {
  return 'overview'
}

export function getViewSlug(view: string): ViewSlug | null {
  return VIEW_TO_SLUG[view as AppView] ?? null
}

export function isViewAllowedForRole(role: Role, view: string): view is AppView {
  return ROLE_VIEWS[role].includes(view as AppView)
}

export function coerceViewForRole(role: Role, view: string | null | undefined): AppView {
  if (view && isViewAllowedForRole(role, view)) return view
  return getDefaultViewForRole(role)
}

export function getViewFromSlug(slug: string | null | undefined): AppView | null {
  if (!slug) return null
  return SLUG_TO_VIEW[slug as ViewSlug] ?? null
}

export function getSafeViewFromSlug(role: Role, slug: string | null | undefined): AppView {
  return coerceViewForRole(role, getViewFromSlug(slug))
}

export function getSafeViewSlugForRole(role: Role, view: string | null | undefined): ViewSlug {
  return VIEW_TO_SLUG[coerceViewForRole(role, view)]
}

// Shared domain types used across client & server

export type Role = 'SEAFARER' | 'RECRUITER' | 'ADMIN'
export type Availability = 'AVAILABLE' | 'ON_BOARD' | 'UNAVAILABLE'
export type JobStatus = 'OPEN' | 'CLOSED'
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED'
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'

export interface SafeUser {
  id: string
  email: string
  name: string
  role: Role
  company: string | null
  phone: string | null
  city: string | null
  country: string | null
}

export interface Certificate {
  id: string
  seafarerId: string
  name: string
  number: string | null
  issuedDate: string | null
  expiryDate: string | null
  issuingAuthority: string | null
}

export interface VesselExperience {
  id: string
  seafarerId: string
  rank: string | null
  vesselType: string
  vesselName: string | null
  companyName: string | null
  imoNumber: string | null
  grossTonnage: string | null
  engineType: string | null
  tradeArea: string | null
  signOnDate: string | null
  signOffDate: string | null
  captainName: string | null
  captainContact: string | null
  chiefEngName: string | null
  chiefEngContact: string | null
}

export interface SeafarerProfile {
  id: string
  userId: string
  rank: string | null
  nationality: string | null
  dateOfBirth: string | null
  availability: Availability
  availableFrom: string | null
  yearsExperience: string | null
  bio: string | null
  avatarUrl: string | null
  cocGrade: string | null
  cocExpiry: string | null
  passportNo: string | null
  passportExpiry: string | null
  usVisa: string | null
  schengenVisa: string | null
}

export interface SeafarerWithRelations extends SeafarerProfile {
  user: SafeUser
  certificates: Certificate[]
  vesselExperiences: VesselExperience[]
  _count?: { savedBy: number; applications: number }
  savedByMe?: boolean
}

export interface Job {
  id: string
  recruiterId: string
  title: string
  rank: string | null
  vesselType: string | null
  companyName: string
  salaryMin: string | null
  salaryMax: string | null
  currency: string
  contractDuration: string | null
  joiningDate: string | null
  location: string | null
  description: string | null
  requirements: string | null
  status: JobStatus
  createdAt: string
  recruiter?: SafeUser
  _count?: { applications: number }
  myApplicationStatus?: ApplicationStatus | null
}

export interface Application {
  id: string
  jobId: string
  seafarerId: string
  status: ApplicationStatus
  message: string | null
  coverLetter: string | null
  createdAt: string
  job?: Job
  seafarer?: SeafarerWithRelations
}

export interface SavedProfile {
  id: string
  recruiterId: string
  seafarerId: string
  note: string | null
  createdAt: string
}

export interface Message {
  id: string
  recruiterId: string
  seafarerId: string
  subject: string
  body: string
  read: boolean
  createdAt: string
  recruiter?: SafeUser
  seafarer?: SeafarerWithRelations
}

export interface Interview {
  id: string
  recruiterId: string
  seafarerId: string
  jobId: string | null
  scheduledAt: string | null
  location: string | null
  notes: string | null
  status: InterviewStatus
  createdAt: string
  recruiter?: SafeUser
  seafarer?: SeafarerWithRelations
  job?: Job | null
}

export const VESSEL_TYPES = [
  'Container Ship', 'Oil Tanker', 'Chemical Tanker', 'Bulk Carrier', 'LNG Carrier', 'LPG Carrier',
  'General Cargo', 'Ro-Ro', 'Passenger', 'Offshore Supply', 'DP AHTS', 'Cruise Ship', 'Car Carrier', 'Reefer',
]

export const RANKS = [
  'Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Chief Engineer', '2nd Engineer', '3rd Engineer',
  '4th Engineer', 'ETO', 'Bosun', 'AB Seaman', 'Oiler', 'Cook', 'Deck Cadet', 'Engine Cadet',
]

export const NATIONALITIES = [
  'Filipino', 'Indian', 'Ukrainian', 'Russian', 'Indonesian', 'Chinese', 'Myanmar', 'Egyptian',
  'Turkish', 'Vietnamese', 'Sri Lankan', 'Bangladeshi',
]

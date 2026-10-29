import type { Prisma, Role } from '@prisma/client'

// OPEN is the only public-discovery status in the current schema. Keep this
// allowlist explicit so a future private/draft status is not exposed by default.
export function jobDetailVisibility(user: { id: string; role: Role } | null): Prisma.JobWhereInput {
  if (user?.role === 'ADMIN') return { status: { in: ['OPEN', 'CLOSED'] } }
  if (user?.role === 'RECRUITER') {
    return { OR: [{ status: 'OPEN' }, { status: 'CLOSED', recruiterId: user.id }] }
  }
  // An application is not proof of access to closed details: the application
  // creation endpoint currently allows CLOSED jobs. Historical information
  // stays in the existing owner-scoped application views instead.
  return { status: 'OPEN' }
}

// Discovery, owner and administrative reads need business identity, not the
// recruiter's personal email/phone. Explicit fields also prevent future private
// Job columns from automatically appearing in these read responses.
export const jobReadSelect = {
  id: true,
  recruiterId: true,
  title: true,
  rank: true,
  vesselType: true,
  companyName: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  contractDuration: true,
  joiningDate: true,
  location: true,
  description: true,
  requirements: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  recruiter: { select: { id: true, name: true, company: true } },
  _count: { select: { applications: true } },
} satisfies Prisma.JobSelect

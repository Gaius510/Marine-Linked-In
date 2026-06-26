import { db } from '../src/lib/db'

const ABSENT_VALUES = new Set(['', 'none', 'no', 'n/a', 'na', 'false'])

function hasLegacyTravelAuthorization(value: string | null): boolean {
  return !ABSENT_VALUES.has((value ?? '').trim().toLowerCase())
}

async function main() {
  const profiles = await db.seafarerProfile.findMany({
    select: {
      id: true,
      usVisa: true,
      schengenVisa: true,
      travelAuthorizations: {
        select: { type: true },
      },
    },
  })

  const counts = {
    profilesWithLegacyUsVisaData: 0,
    profilesWithLegacySchengenData: 0,
    backfilled: 0,
    skippedExisting: 0,
  }

  for (const profile of profiles) {
    const existingTypes = new Set(profile.travelAuthorizations.map((authorization) => authorization.type))
    const planned: Array<'US_C1_D' | 'SCHENGEN'> = []

    if (hasLegacyTravelAuthorization(profile.usVisa)) {
      counts.profilesWithLegacyUsVisaData += 1
      planned.push('US_C1_D')
    }

    if (hasLegacyTravelAuthorization(profile.schengenVisa)) {
      counts.profilesWithLegacySchengenData += 1
      planned.push('SCHENGEN')
    }

    for (const type of planned) {
      if (existingTypes.has(type)) {
        counts.skippedExisting += 1
        continue
      }

      await db.travelAuthorization.create({
        data: {
          seafarerId: profile.id,
          type,
        },
      })
      existingTypes.add(type)
      counts.backfilled += 1
    }
  }

  console.log(JSON.stringify(counts, null, 2))
}

main()
  .catch((error) => {
    console.error('Travel authorization backfill failed')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })

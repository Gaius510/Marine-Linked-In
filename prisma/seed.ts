import { PrismaClient, Role, Availability, JobStatus, User } from '@prisma/client'
import { scryptSync, randomBytes } from 'crypto'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const vesselTypes = ['Container Ship', 'Oil Tanker', 'Chemical Tanker', 'Bulk Carrier', 'LNG Carrier', 'LPG Carrier', 'General Cargo', 'Ro-Ro', 'Passenger', 'Offshore Supply', 'DP AHTS', 'Cruise Ship', 'Car Carrier', 'Reefer']
const ranks = ['Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Chief Engineer', '2nd Engineer', '3rd Engineer', '4th Engineer', 'ETO', 'Bosun', 'AB Seaman', 'Oiler', 'Cook', 'Deck Cadet', 'Engine Cadet']
const nationalities = ['Filipino', 'Indian', 'Ukrainian', 'Russian', 'Indonesian', 'Chinese', 'Myanmar', 'Egyptian', 'Turkish', 'Vietnamese', 'Sri Lankan', 'Bangladeshi']
const companies = ['Maersk Line', 'Mediterranean Shipping Company', 'COSCO Shipping', 'CMA CGM', 'Hapag-Lloyd', 'NYK Line', 'Mitsui O.S.K. Lines', 'Evergreen Marine', 'ONE', 'Zodiac Maritime', 'Anglo Eastern', 'V.Group', 'Bernhard Schulte', 'Synergy Marine']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function pickN<T>(arr: T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return out
}

async function main() {
  console.log('Seeding database...')

  // Admin
  const admin = await db.user.upsert({
    where: { email: 'admin@maritimenet.com' },
    update: {},
    create: {
      email: 'admin@maritimenet.com',
      passwordHash: hashPassword('admin123'),
      name: 'Platform Admin',
      role: Role.ADMIN,
      phone: '+971 50 000 0000',
      city: 'Dubai',
      country: 'UAE',
    },
  })

  // Recruiters
  const recruiterData = [
    { name: 'Sarah Mitchell', email: 'sarah@maersk-recruit.com', company: 'Maersk Crewing', country: 'Denmark', city: 'Copenhagen' },
    { name: 'Ahmed Al-Rashid', email: 'ahmed@gulf-maritime.ae', company: 'Gulf Maritime Services', country: 'UAE', city: 'Dubai' },
    { name: 'Liu Wei', email: 'liu.wei@cosco-crewing.cn', company: 'COSCO Crewing', country: 'China', city: 'Shanghai' },
  ]
  const recruiters: User[] = []
  for (const r of recruiterData) {
    const u = await db.user.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, passwordHash: hashPassword('recruiter123'), role: Role.RECRUITER, phone: '+971 50 100 2000' },
    })
    recruiters.push(u)
  }

  // Seafarers
  const seafarerNames = [
    'Juan Dela Cruz', 'Rajesh Kumar', 'Andriy Kovalenko', 'Dmitri Petrov', 'Budi Santoso',
    'Zhang Ming', 'Min Aung', 'Mohamed Hassan', 'Mehmet Yilmaz', 'Nguyen Van Linh',
    'Saman Perera', 'Karim Rahman', 'Alex Mensah', 'Pedro Santos', 'Vladimir Ivanov',
    'Suresh Patel', 'Yusuf Demir', 'Bambang Wijaya', 'Igor Sokolov', 'Rahul Sharma',
    'Anton Silva', 'Bayu Pratama', 'Hassan Ali', 'Sunil Fernando', 'Mikhail Orlov',
  ]

  let counter = 0
  for (const name of seafarerNames) {
    counter++
    const email = `seafarer${counter}@maritimenet.com`
    const rank = pick(ranks)
    const nationality = pick(nationalities)
    const availability = pick([Availability.AVAILABLE, Availability.AVAILABLE, Availability.AVAILABLE, Availability.ON_BOARD, Availability.UNAVAILABLE])
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hashPassword('seafarer123'),
        name,
        role: Role.SEAFARER,
        phone: `+63 9${Math.floor(100000000 + Math.random() * 899999999)}`,
        city: pick(['Manila', 'Mumbai', 'Odessa', 'Jakarta', 'Shanghai', 'Yangon', 'Cairo', 'Istanbul']),
        country: pick(['Philippines', 'India', 'Ukraine', 'Indonesia', 'China', 'Myanmar', 'Egypt', 'Turkey']),
      },
    })

    const profile = await db.seafarerProfile.create({
      data: {
        userId: user.id,
        rank,
        nationality,
        dateOfBirth: `19${80 + Math.floor(Math.random() * 20)}-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`,
        availability,
        availableFrom: availability === Availability.AVAILABLE ? `2025-0${1 + Math.floor(Math.random() * 9)}-15` : null,
        yearsExperience: String(2 + Math.floor(Math.random() * 20)),
        bio: `Experienced ${rank} with strong background in ${pickN(vesselTypes, 2).join(' and ')} vessels. STCW certified, reliable team player.`,
        cocGrade: pick(['Class I (Master)', 'Class II (Chief Mate)', 'Class III (Officer in charge)', 'Class IV (Engineer)', 'ETO Certificate']),
        cocExpiry: `202${6 + Math.floor(Math.random() * 4)}-06-30`,
        passportNo: `P${Math.floor(10000000 + Math.random() * 89999999)}`,
        passportExpiry: `202${6 + Math.floor(Math.random() * 6)}-12-31`,
        usVisa: pick(['Valid C1/D', 'Valid B1/B2', 'None', 'Expired']),
        schengenVisa: pick(['Valid', 'None', 'Expired']),
      },
    })

    // 1-3 vessel experiences
    const expCount = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < expCount; i++) {
      const signOnYear = 2020 + Math.floor(Math.random() * 5)
      const signOnMonth = 1 + Math.floor(Math.random() * 12)
      await db.vesselExperience.create({
        data: {
          seafarerId: profile.id,
          rank: pick(ranks),
          vesselType: pick(vesselTypes),
          vesselName: pick(['MV OCEAN STAR', 'MT NORTHERN LIGHT', 'MV PACIFIC DAWN', 'MT GOLDEN HORIZON', 'MV SEA BREEZE', 'MT IRON DUKE', 'MV BLUE OCEAN', 'MT ATLAS']),
          companyName: pick(companies),
          imoNumber: String(9000000 + Math.floor(Math.random() * 999999)),
          grossTonnage: String(10000 + Math.floor(Math.random() * 200000)),
          engineType: pick(['Slow Speed Diesel', 'Medium Speed Diesel', 'Dual Fuel', 'Steam Turbine']),
          tradeArea: pick(['Global', 'Asia-Pacific', 'Europe-Mediterranean', 'Trans-Atlantic', 'Middle East Gulf', 'Coastal']),
          signOnDate: `${signOnYear}-${String(signOnMonth).padStart(2, '0')}-01`,
          signOffDate: `${signOnYear + (Math.random() > 0.5 ? 1 : 0)}-${String(((signOnMonth + 5) % 12) + 1).padStart(2, '0')}-15`,
          captainName: `Capt. ${pick(['Smith', 'Johnson', 'Andersen', 'Müller', 'Tanaka', 'Olsen', 'Brown', 'Garcia'])}`,
          captainContact: `+63 917 ${Math.floor(1000000 + Math.random() * 8999999)}`,
          chiefEngName: `C/E ${pick(['Lee', 'Patel', 'Ivanov', 'Kumar', 'Schmidt', 'Wong', 'Garcia', 'Nakamura'])}`,
          chiefEngContact: `+63 918 ${Math.floor(1000000 + Math.random() * 8999999)}`,
        },
      })
    }

    // certificates
    const certs = pickN(['STCW Basic Training', 'GMDSS Operator', 'Advanced Fire Fighting', 'Medical First Aid', 'Survival Craft', 'Ship Security Officer', 'Dangerous Goods', 'Bridge Resource Management', 'Engine Room Resource Management', 'ECDIS'], 2 + Math.floor(Math.random() * 3))
    for (const cert of certs) {
      await db.certificate.create({
        data: {
          seafarerId: profile.id,
          name: cert,
          number: `CERT-${Math.floor(100000 + Math.random() * 899999)}`,
          issuedDate: `202${2 + Math.floor(Math.random() * 3)}-03-10`,
          expiryDate: `202${6 + Math.floor(Math.random() * 4)}-03-10`,
          issuingAuthority: pick(['Maritime Industry Authority', 'DG Shipping', 'MCA UK', 'USCG', 'AMSA']),
        },
      })
    }
  }

  // Jobs
  const jobTemplates = [
    { title: 'Chief Officer - Container Ship', rank: 'Chief Officer', vesselType: 'Container Ship', salary: '9000-11000' },
    { title: 'Chief Engineer - Oil Tanker', rank: 'Chief Engineer', vesselType: 'Oil Tanker', salary: '11000-13000' },
    { title: '2nd Officer - LNG Carrier', rank: '2nd Officer', vesselType: 'LNG Carrier', salary: '7000-8500' },
    { title: 'Master - Bulk Carrier', rank: 'Master', vesselType: 'Bulk Carrier', salary: '12000-14000' },
    { title: 'ETO - Offshore Supply', rank: 'ETO', vesselType: 'Offshore Supply', salary: '6500-8000' },
    { title: '3rd Engineer - Chemical Tanker', rank: '3rd Engineer', vesselType: 'Chemical Tanker', salary: '5500-7000' },
    { title: 'Bosun - Ro-Ro Vessel', rank: 'Bosun', vesselType: 'Ro-Ro', salary: '3500-4500' },
    { title: 'AB Seaman - General Cargo', rank: 'AB Seaman', vesselType: 'General Cargo', salary: '2500-3200' },
    { title: 'Chief Cook - Cruise Ship', rank: 'Cook', vesselType: 'Cruise Ship', salary: '4000-5500' },
    { title: 'Deck Cadet - Container Ship', rank: 'Deck Cadet', vesselType: 'Container Ship', salary: '1500-2000' },
    { title: '2nd Engineer - DP AHTS', rank: '2nd Engineer', vesselType: 'DP AHTS', salary: '8500-10000' },
    { title: '3rd Officer - Car Carrier', rank: '3rd Officer', vesselType: 'Car Carrier', salary: '5000-6500' },
  ]
  for (const jt of jobTemplates) {
    const recruiter = pick(recruiters)
    await db.job.create({
      data: {
        recruiterId: recruiter.id,
        title: jt.title,
        rank: jt.rank,
        vesselType: jt.vesselType,
        companyName: recruiter.company || 'Maritime Co',
        salaryMin: jt.salary.split('-')[0],
        salaryMax: jt.salary.split('-')[1],
        currency: 'USD',
        contractDuration: pick(['4 months', '6 months', '6+2 months', '9 months']),
        joiningDate: `2025-0${2 + Math.floor(Math.random() * 6)}-1${Math.floor(Math.random() * 9)}`,
        location: pick(['Rotterdam, Netherlands', 'Singapore', 'Fujairah, UAE', 'Houston, USA', 'Hong Kong', 'Dubai, UAE']),
        description: `We are seeking a qualified ${jt.rank} for a ${jt.vesselType} operating on global trade routes. Competitive salary and good working conditions.`,
        requirements: `Minimum 12 months in rank. Valid COC, STCW certificates, and US visa preferred. Good English communication skills.`,
        status: JobStatus.OPEN,
      },
    })
  }

  console.log(`Seeded: 1 admin, ${recruiters.length} recruiters, ${seafarerNames.length} seafarers, ${jobTemplates.length} jobs`)
  console.log('Demo accounts:')
  console.log('  Admin:     admin@maritimenet.com / admin123')
  console.log('  Recruiter: sarah@maersk-recruit.com / recruiter123')
  console.log('  Seafarer:  seafarer1@maritimenet.com / seafarer123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })

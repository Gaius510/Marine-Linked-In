'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n'
import { useSeafarerProfile } from '@/components/seafarer/use-seafarer-profile'
import { computeCompleteness, strengthKey } from '@/components/seafarer/profile-completeness'
import { CvCompletionPanel } from '@/components/seafarer/cv/cv-completion-panel'
import { CvProfileHeader } from '@/components/seafarer/cv/cv-profile-header'
import { PersonalInformationSection } from '@/components/seafarer/cv/personal-information-section'
import { MaritimeDetailsSection } from '@/components/seafarer/cv/maritime-details-section'
import { VesselExperienceSection } from '@/components/seafarer/cv/vessel-experience-section'
import { CertificatesSection } from '@/components/seafarer/cv/certificates-section'
import { DocumentsSection } from '@/components/seafarer/cv/documents-section'
import type { CompletionItem, SeafarerCvProfile } from '@/components/seafarer/cv/types'
import { FileText } from 'lucide-react'

type SectionKey = 'personal' | 'maritime' | 'experience' | 'certificates' | 'documents'

export function SeafarerCV() {
  const { t } = useI18n()
  const { data, isLoading, isError, refetch } = useSeafarerProfile()
  const profile = data?.profile

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return <CVBody profile={profile} />
}

function CVBody({ profile }: { profile: SeafarerCvProfile }) {
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState<SectionKey>('personal')
  const completeness = useMemo(() => computeCompleteness(profile), [profile])
  const completionItems = useMemo(() => getCompletionItems(profile, t), [profile, t])
  const completionByKey = Object.fromEntries(
    completionItems.map((item) => [item.key, item.complete])
  ) as Record<SectionKey, boolean>

  const selectSection = (section: string) => {
    const next = section as SectionKey
    setActiveSection(next)
    document.getElementById(`cv-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('cv.title')}
        subtitle={t('seafarer.completeCvDesc')}
        icon={<FileText className="size-5" />}
      />

      <CvProfileHeader
        profile={profile}
        completeness={completeness}
        strengthLabel={t(strengthKey(completeness))}
        isSaving={false}
      />

      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1">
          <CvCompletionPanel
            completeness={completeness}
            items={completionItems}
            activeSection={activeSection}
            onSelectSection={selectSection}
          />
        </aside>

        <div className="order-1 space-y-5 lg:order-2">
          <section id="cv-personal" className="scroll-mt-24" onFocusCapture={() => setActiveSection('personal')}>
            <PersonalInformationSection profile={profile} complete={completionByKey.personal} />
          </section>

          <section id="cv-maritime" className="scroll-mt-24" onFocusCapture={() => setActiveSection('maritime')}>
            <MaritimeDetailsSection profile={profile} complete={completionByKey.maritime} />
          </section>

          <section id="cv-experience" className="scroll-mt-24" onFocusCapture={() => setActiveSection('experience')}>
            <VesselExperienceSection profile={profile} complete={completionByKey.experience} />
          </section>

          <section id="cv-certificates" className="scroll-mt-24" onFocusCapture={() => setActiveSection('certificates')}>
            <CertificatesSection profile={profile} complete={completionByKey.certificates} />
          </section>

          <section id="cv-documents" className="scroll-mt-24" onFocusCapture={() => setActiveSection('documents')}>
            <DocumentsSection profile={profile} complete={completionByKey.documents} />
          </section>
        </div>
      </div>
    </div>
  )
}

function getCompletionItems(profile: SeafarerCvProfile, t: (key: string) => string): CompletionItem[] {
  return [
    {
      key: 'personal',
      label: t('cv.personalInfo'),
      complete: !!profile.user.phone && (!!profile.user.city || !!profile.user.country) && !!profile.nationality && !!profile.dateOfBirth && !!profile.bio?.trim(),
    },
    {
      key: 'maritime',
      label: t('cv.maritimeInfo'),
      complete: !!profile.rank && !!profile.yearsExperience && !!profile.cocGrade && !!profile.cocExpiry,
    },
    {
      key: 'experience',
      label: t('cv.vesselExperience'),
      complete: profile.vesselExperiences.length > 0,
    },
    {
      key: 'certificates',
      label: t('cv.certificates'),
      complete: profile.certificates.length > 0,
    },
    {
      key: 'documents',
      label: t('cv.documents'),
      complete: !!profile.passportNo && !!profile.passportExpiry,
    },
  ]
}

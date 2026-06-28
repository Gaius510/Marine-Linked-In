'use client'

import { useState } from 'react'
import { useNavStore } from '@/stores/nav-store'
import { SeafarerDetailDialog } from './seafarer-detail-dialog'
import { OverviewView } from './overview-view'
import { BrowseView } from './browse-view'
import { PostJobView } from './post-job-view'
import { MyJobsView } from './my-jobs-view'
import { SavedView } from './saved-view'
import { InterviewsView } from './interviews-view'
import { MessagesView } from './messages-view'

export function RecruiterPortal() {
  const view = useNavStore((s) => s.view)
  const setView = useNavStore((s) => s.setView)

  // Shared "view profile" dialog accessible across views
  const [detailId, setDetailId] = useState<string | null>(null)
  const openProfile = (id: string) => setDetailId(id)

  switch (view) {
    case 'browse':
      return <BrowseView onPostJob={() => setView('postJob')} />
    case 'postJob':
      return <PostJobView />
    case 'myJobs':
      return (
        <>
          <MyJobsView onViewProfile={openProfile} />
          <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
        </>
      )
    case 'saved':
      return <SavedView />
    case 'interviews':
      return (
        <>
          <InterviewsView onViewProfile={openProfile} />
          <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
        </>
      )
    case 'messages':
      return (
        <>
          <MessagesView onViewProfile={openProfile} />
          <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
        </>
      )
    case 'overview':
    default:
      return (
        <>
          <OverviewView
            onPostJob={() => setView('postJob')}
            onBrowseSeafarers={() => setView('browse')}
            onManageJobs={() => setView('myJobs')}
            onViewMessages={() => setView('messages')}
            onViewProfile={openProfile}
            onViewAllApplicants={() => setView('myJobs')}
            onViewAllInterviews={() => setView('interviews')}
          />
          <SeafarerDetailDialog seafarerId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
        </>
      )
  }
}

import { ConversationsSidebar } from '../ConversationsSidebar'
import { ConversationView } from './ConversationView'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ contactId: string }>
}) {
  const { contactId } = await params
  return (
    <>
      <ConversationsSidebar />
      <ConversationView contactId={contactId} />
    </>
  )
}

import { ConversationsSidebar } from './ConversationsSidebar'

export default function ConversationsPage() {
  return (
    <>
      <ConversationsSidebar />
      <div className="flex-1 flex items-center justify-center bg-[#efeae2]">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-lg font-medium">Selecione uma conversa</p>
          <p className="text-sm">para ver as mensagens</p>
        </div>
      </div>
    </>
  )
}

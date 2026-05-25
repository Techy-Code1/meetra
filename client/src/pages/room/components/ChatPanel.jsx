import { Send } from "lucide-react";

export default function ChatPanel({
  messages,
  draft,
  onDraftChange,
  onSendMessage,
  messagesEndRef,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSendMessage();
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-1 ${
              message.mine ? "items-end" : "items-start"
            }`}
          >
            <span className="px-1 text-[10px] text-slate-500">
              {message.author}
            </span>
            <div
              className={`max-w-200px break-word rounded-xl px-3 py-2 text-[13px] leading-snug ${
                message.mine
                  ? "bg-blue-700 text-blue-50"
                  : "bg-[#162d4b] text-slate-200"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 gap-2 border-t border-[#1e3250] p-3"
      >
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Message everyone..."
          className="min-w-0 flex-1 rounded-lg border border-[#1e3250] bg-[#081426] px-3 py-2 text-[13px] text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 bg-blue-600 text-white transition-colors hover:bg-blue-500"
        >
          <Send size={15} />
        </button>
      </form>
    </>
  );
}

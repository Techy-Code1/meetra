import { useNavigate } from "react-router-dom";

function UpcomingMeetings({ meetings = [] }) {
  const navigate = useNavigate();

  const formattedMeetings = meetings
    .map((m) => {
      const d = new Date(m.scheduled_at);
      const now = new Date();
      const endTime = new Date(d.getTime() + (m.duration_minutes || 60) * 60000);
      // Highlight if within 15 mins before start, or currently ongoing
      const isHighlighted = now >= new Date(d.getTime() - 15 * 60000) && now <= endTime;
      const isEnded = now > endTime;

      return {
        id: m.meeting_id,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: m.meeting_title,
        description: m.description || "No description provided",
        members: [
          m.host?.profile_picture_url || "https://www.figma.com/api/mcp/asset/67753a3d-3549-4da3-b837-ca8737b2faf5"
        ],
        isHighlighted,
        isEnded,
      };
    })
    .filter((m) => !m.isEnded);

  const runningMeetings = formattedMeetings.filter((m) => m.isHighlighted);
  const futureMeetings = formattedMeetings.filter((m) => !m.isHighlighted);

  const renderMeeting = (meeting) => (
    <div
      key={meeting.id}
      className={`group flex items-start gap-4 p-2 transition-all ${
        meeting.isHighlighted ? "border-l-2 border-border-focus bg-bg-subtle" : ""
      }`}
    >
      <div className="flex flex-col items-start gap-1 w-[83px] shrink-0">
        <span className="font-body text-base font-semibold text-text-brand leading-6">
          {meeting.time}
        </span>
        {meeting.isHighlighted && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-100 text-[10px] font-bold text-success-700 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-success-500 animate-pulse"></span>
            Live
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="font-body text-base font-semibold text-text-primary leading-6">
            {meeting.title}
          </h4>
          <p className="font-body text-sm text-text-subtle leading-5">
            {meeting.description}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {meeting.members.map((member, i) => (
              <div key={`${meeting.id}-${i}`} className="size-6 rounded-full border-2 border-bg-surface bg-bg-brand-subtle overflow-hidden shadow-sm">
                <img src={member} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <button 
            onClick={() => meeting.isHighlighted && navigate(`/lobby/${meeting.id}`)}
            disabled={!meeting.isHighlighted}
            className={`rounded-[12px] px-4 py-2 text-sm font-semibold transition-all font-body ${
              meeting.isHighlighted 
                ? "bg-bg-brand text-text-inverse shadow-sm hover:bg-bg-brand-hover active:scale-95"
                : "bg-bg-surface text-text-subtle cursor-not-allowed"
            }`}
          >
            {meeting.isHighlighted ? "Join now" : "Not started"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <aside className="flex flex-col gap-6 w-full lg:w-[381px] shrink-0 p-6 bg-bg-surface border border-border-subtle rounded-[12px] shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50">
        <h3 className="font-display text-base font-bold text-text-primary">Upcoming meetings</h3>
        <button className="text-sm font-medium text-text-brand hover:underline font-body transition-colors">
          View Calendar
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 text-[13px] font-medium text-text-secondary font-display">
          <span>Today</span>
          <span className="mx-1">.</span>
          <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        <div className="space-y-6">
          {runningMeetings.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-text-primary uppercase tracking-wider">Live Now</h4>
              {runningMeetings.map(renderMeeting)}
            </div>
          )}

          {futureMeetings.length > 0 && (
            <div className="space-y-4">
              {futureMeetings.map(renderMeeting)}
            </div>
          )}

          {formattedMeetings.length === 0 && (
            <p className="text-sm text-text-secondary font-body">No upcoming meetings.</p>
          )}
        </div>
      </div>
    </aside>
  );
}

export default UpcomingMeetings;

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ONBOARDING_OPTIONS = [
  {
    id: "personal",
    title: "Personal",
    description: "For personal projects, freelancing, and workflow organization.",
    icon: "https://www.figma.com/api/mcp/asset/b1d52221-b5be-4243-8c94-6eff58fbf7dc",
  },
  {
    id: "team",
    title: "Team",
    description: "For team collaboration, task management, and departmental alignment.",
    icon: "https://www.figma.com/api/mcp/asset/a1b6047a-85e0-439d-9ef8-21b4f7e5ffe7",
  },
  {
    id: "education",
    title: "Education",
    description: "For virtual classrooms, tutoring, and research coordination.",
    icon: "https://www.figma.com/api/mcp/asset/2a828139-7703-4b1e-ac83-cf017d4f34d6",
  },
  {
    id: "client-meetings",
    title: "Client Meetings",
    description: "For presentations, consultations, and service delivery.",
    icon: "https://www.figma.com/api/mcp/asset/16de2f02-5a62-4ab9-a24d-32f07c879061",
  },
];

const CHECKMARK_ICON = "https://www.figma.com/api/mcp/asset/a438571f-fe3d-4b0f-b609-4b7ccfb38867";
const ARROW_RIGHT_ICON = "https://www.figma.com/api/mcp/asset/f1d6f81f-3936-406c-bf5b-0a31c14b69af";
const EXTERNAL_LINK_ICON = "https://www.figma.com/api/mcp/asset/984c3f4a-a6f1-4d20-9177-7ba5e28fa321";

const TEAM_SIZES = ["1 - 10", "11 - 50", "51 - 200", "200+"];

const INITIAL_COLLABORATORS = [
  { name: "Raja", role: "Product Ops", avatarText: "RA", access: "Admin" },
  { name: "Gaurab", role: "Engineering Manager", avatarText: "GB", access: "Scheduler" },
  { name: "Gyanendra", role: "Design Lead", avatarText: "GA", access: "Viewer" },
];

function Step1({ selectedOption, setSelectedOption }) {
  return (
    <>
      <div className="mt-10 text-center">
        <h1 className="font-display text-[32px] font-semibold leading-tight text-text-primary">
          What will you use this for?
        </h1>
        <p className="mx-auto mt-3 max-w-[600px] font-body text-base text-text-secondary">
          Select the option that best describes your primary use case to help us tailor your workspace setup.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mx-auto lg:max-w-[800px]">
        {ONBOARDING_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            className={`relative flex flex-col items-start rounded-[12px] border p-8 text-left transition-all duration-interaction ${
              selectedOption === option.id
                ? "border-bg-brand bg-bg-brand shadow-md"
                : "border-border-subtle bg-bg-surface hover:border-border-focus"
            }`}
          >
            {selectedOption === option.id && (
              <div className="absolute top-5 right-5 flex size-6 items-center justify-center rounded-full bg-bg-brand">
                <img src={CHECKMARK_ICON} alt="Selected" className="size-4" />
              </div>
            )}
            <div className="mb-6 h-12">
              <img src={option.icon} alt={option.title} className="h-full object-contain" />
            </div>
            <h3 className={`font-display text-2xl font-semibold ${selectedOption === option.id ? "text-brand-100" : "text-text-primary"}`}>
              {option.title}
            </h3>
            <p className={`mt-2 font-body text-base leading-6 ${selectedOption === option.id ? "text-brand-100" : "text-text-secondary"}`}>
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}

function Step2({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[800px] rounded-[20px] border border-border-subtle bg-bg-canvas p-6 sm:p-10 shadow-sm">
      <header className="mb-10">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-brand font-body">
          Foundations
        </span>
        <h1 className="mt-2 font-display text-[36px] font-bold leading-tight text-text-primary">
          Set up Meetra for your team.
        </h1>
        <p className="mt-4 font-body text-base leading-6 text-text-secondary">
          Start with the account details that personalise the workspace, meeting defaults, and the first team recommendations.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Full name</label>
          <input
            type="text"
            name="workspaceName"
            value={formData.workspaceName}
            onChange={handleChange}
            placeholder="Ezekay’s Team"
            className="h-[52px] w-full rounded-[12px] border border-border-focus bg-bg-surface px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Role</label>
          <div className="relative">
            <input
              type="text"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder="Product designer"
              className="h-[52px] w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 pr-12 text-base text-text-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium text-text-brand hover:text-brand-700">
              Edit
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Work email</label>
          <input
            type="email"
            name="workEmail"
            value={formData.workEmail}
            onChange={handleChange}
            placeholder="eze@meetra.so"
            className="h-[52px] w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 text-base text-text-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Timezone</label>
          <input
            type="text"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            placeholder="GMT+05:45 Kathmandu"
            className="h-[52px] w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 text-base text-text-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
          />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <label className="text-sm font-medium text-text-secondary font-body">Team size</label>
        <div className="flex flex-wrap gap-3">
          {TEAM_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setFormData((prev) => ({ ...prev, teamSize: size }))}
              className={`h-11 min-w-[110px] rounded-[12px] border px-4 py-2 text-sm font-medium transition-all ${
                formData.teamSize === size
                  ? "border-brand-400 bg-bg-brand text-text-inverse"
                  : "border-border-subtle bg-bg-surface text-text-primary hover:border-border-focus"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-[16px] border border-border-subtle bg-bg-surface p-5">
        <h4 className="font-display text-lg font-bold text-text-primary">Setup note</h4>
        <p className="mt-2 font-body text-sm leading-5 text-text-secondary">
          This onboarding flow stays focused on operational setup. Marketing copy is intentionally muted so the primary task remains getting the workspace ready.
        </p>
      </div>
    </div>
  );
}

function Step3({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[800px] rounded-[20px] border border-border-subtle bg-bg-canvas p-6 sm:p-10 shadow-sm">
      <header className="mb-10">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-brand font-body">
          Workspace setup
        </span>
        <h1 className="mt-2 font-display text-[36px] font-bold leading-tight text-text-primary">
          Create the first workspace shell.
        </h1>
        <p className="mt-4 font-body text-base leading-6 text-text-secondary">
          Define the workspace identity, URL, and scheduling window that will be used across meetings, rooms, and notifications.
        </p>
      </header>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Workspace name</label>
          <input
            type="text"
            name="workspaceIdentity"
            value={formData.workspaceIdentity}
            onChange={handleChange}
            placeholder="Meetra Design Ops"
            className="h-[52px] w-full rounded-[12px] border border-border-focus bg-bg-surface px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
          />
          <p className="text-[13px] text-text-secondary font-body">
            Shown in the sidebar, room navigation, and calendar invitations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-body">Workspace URL</label>
            <div className="relative">
              <input
                type="text"
                name="workspaceUrl"
                value={formData.workspaceUrl}
                onChange={handleChange}
                placeholder="meetra-design-ops"
                className="h-[52px] w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 text-base text-text-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary font-body">Default host timezone</label>
            <input
              type="text"
              name="hostTimezone"
              value={formData.hostTimezone}
              onChange={handleChange}
              placeholder="Asia/Kathmandu"
              className="h-[52px] w-full rounded-[12px] border border-border-subtle bg-bg-surface px-4 text-base text-text-primary outline-none focus:border-border-focus focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
            />
          </div>
        </div>

        <div className="mt-10 rounded-[16px] border border-border-subtle bg-bg-surface p-5">
          <h4 className="font-display text-lg font-bold text-text-primary">Scheduling window</h4>
          <p className="mt-2 font-body text-sm leading-5 text-text-secondary">
            Choose a working window that becomes the baseline for suggestions, room availability, and meeting reminders.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="h-11 rounded-[12px] border border-brand-400 bg-bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-all">
              Mon - Fri
            </button>
            <button className="h-11 rounded-[12px] border border-border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:border-border-focus transition-all">
              09:00 - 18:00
            </button>
            <button className="h-11 rounded-[12px] border border-border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:border-border-focus transition-all">
              45 min default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-[800px] rounded-[20px] border border-border-subtle bg-bg-canvas p-6 sm:p-10 shadow-sm">
      <header className="mb-10">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-text-brand font-body">
          Core collaborators
        </span>
        <h1 className="mt-2 font-display text-[36px] font-bold leading-tight text-text-primary">
          Invite the people who need access first.
        </h1>
        <p className="mt-4 font-body text-base leading-6 text-text-secondary">
          Start with the operators who manage rooms, schedules, and reporting. This keeps permissions tight while the workspace is still fresh.
        </p>
      </header>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary font-body">Add emails</label>
          <input
            type="text"
            name="inviteEmails"
            value={formData.inviteEmails}
            onChange={handleChange}
            placeholder="raja@meetra.so, gaurab@meetra.so, gyaenendra@meetra.so"
            className="h-[52px] w-full rounded-[12px] border border-border-focus bg-bg-surface px-4 text-base text-text-primary outline-none focus:ring-2 focus:ring-brand-500/20 font-body transition-all"
          />
          <p className="text-[13px] text-text-secondary font-body">
            Comma-separated invites are enough for the first pass.
          </p>
        </div>

        <div className="rounded-[16px] border border-border-subtle p-5">
          <h4 className="font-display text-lg font-bold text-text-primary">Initial invite review</h4>
          <div className="mt-5 space-y-4">
            {INITIAL_COLLABORATORS.map((person, index) => (
              <div key={index} className="flex items-center justify-between rounded-[16px] bg-bg-surface p-4 border border-border-subtle/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex size-9 items-center justify-center rounded-[18px] bg-bg-brand border border-border-brand text-xs font-bold text-text-inverse">
                    {person.avatarText}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary font-body">{person.name}</span>
                    <span className="text-[13px] text-text-secondary font-body">{person.role}</span>
                  </div>
                </div>
                <div className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  person.access === 'Admin' 
                    ? 'bg-bg-brand text-text-inverse' 
                    : 'bg-bg-elevated text-text-brand border border-border-subtle'
                }`}>
                  {person.access}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step5() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermissionGranted(true);
    } catch (err) {
      console.error("Permission denied:", err);
    }
  };

  return (
    <div className="mx-auto mt-20 flex w-full max-w-[568px] flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-bg-brand shadow-sm">
            <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div className="flex size-12 items-center justify-center rounded-full bg-bg-brand shadow-sm">
            <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1v10M19 10v1a7 7 0 0 1-14 0v-1M12 18.5V23M8 23h8" /><rect x="9" y="1" width="6" height="11" rx="3" />
            </svg>
          </div>
        </div>
        <h1 className="mt-4 font-display text-[24px] font-semibold leading-tight text-text-primary">
          Enable camera &<br />microphone
        </h1>
        <p className="mt-3 font-body text-base leading-6 text-text-secondary">
          ConnectFlow requires access to your camera and microphone so colleagues can see and hear you during meetings. Your browser will prompt you to confirm.
        </p>
      </div>

      <div className="flex w-full max-w-[484px] flex-col gap-3">
        <button
          onClick={requestPermissions}
          className={`flex h-[44px] w-full items-center justify-center gap-2 rounded-full bg-bg-brand px-6 py-3 text-sm font-semibold tracking-wide text-text-inverse transition-all hover:bg-bg-brand-hover active:bg-bg-brand-pressed ${permissionGranted ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {permissionGranted ? 'Access Granted' : 'Allow Access'}
          <img src={ARROW_RIGHT_ICON} alt="" className="size-3" />
        </button>
        <button className="h-[44px] w-full rounded-full px-6 py-3 text-sm font-semibold tracking-wide text-text-brand hover:bg-bg-brand/5 transition-all">
          Skip for now
        </button>
      </div>

      <div className="w-full rounded-[8px] bg-[#f8f2fa] p-4 text-left">
        <div className="flex gap-3">
          <svg className="mt-0.5 size-4.5 text-text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-text-primary">Did you previously block access?</h4>
            <p className="text-sm text-text-secondary">
              Click the lock icon in your browser's address bar to reset your preferences.
            </p>
            <a href="#" className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-text-brand hover:underline">
              View troubleshooting guide
              <img src={EXTERNAL_LINK_ICON} alt="" className="size-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="text-[13px] text-text-secondary">
          Your privacy is respected. Settings can be changed anytime.
        </span>
      </div>
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState("team");
  const [formData, setFormData] = useState({
    workspaceName: "",
    role: "",
    workEmail: "",
    timezone: "GMT+05:45 Kathmandu",
    teamSize: "11 - 50",
    workspaceIdentity: "",
    workspaceUrl: "",
    hostTimezone: "Asia/Kathmandu",
    workingDays: "Mon - Fri",
    workingHours: "09:00 - 18:00",
    defaultDuration: "45 min",
    inviteEmails: "raja@meetra.so, gaurab@meetra.so, gyaenendra@meetra.so",
  });

  const handleContinue = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <main className="min-h-screen bg-bg-surface px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        {/* Progress Section */}
        <div className="mx-auto flex w-full max-w-[512px] flex-col items-center gap-3 pt-8">
          <div className="inline-flex items-center justify-center rounded-full bg-overlay-default px-4 py-1">
            <span className="text-sm font-semibold tracking-wide text-text-brand font-body">
              Step {currentStep} of 5
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-bg-disabled">
            <div
              className="h-full bg-bg-brand transition-all duration-slow"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {currentStep === 1 ? (
          <Step1 selectedOption={selectedOption} setSelectedOption={setSelectedOption} />
        ) : currentStep === 2 ? (
          <Step2 formData={formData} setFormData={setFormData} />
        ) : currentStep === 3 ? (
          <Step3 formData={formData} setFormData={setFormData} />
        ) : currentStep === 4 ? (
          <Step4 formData={formData} setFormData={setFormData} />
        ) : (
          <Step5 />
        )}

        {/* Footer Actions */}
        <div className="mx-auto mt-12 max-w-[800px] border-t border-border-subtle pt-8">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-3 text-sm font-semibold tracking-wide text-text-secondary transition-colors hover:text-text-primary font-body"
            >
              Back
            </button>
            <div className="flex gap-3">
              {(currentStep >= 2 && currentStep <= 4) && (
                <button
                  onClick={handleContinue}
                  className="rounded-[12px] bg-bg-elevated border border-border-subtle px-6 py-3 text-sm font-semibold tracking-wide text-text-primary hover:bg-neutral-200 font-body transition-all"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleContinue}
                className="rounded-[12px] bg-bg-brand px-12 py-3 text-sm font-semibold tracking-wide text-text-inverse shadow-sm transition-all hover:bg-bg-brand-hover active:bg-bg-brand-pressed font-body"
              >
                {currentStep === 5 ? 'Finish' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Onboarding;

export const ROOM_DETAILS = {
  title: "Team Standup",
  id: "Room 1",
  profileInitials: "YO",
};

export const AVATAR_GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-400 to-orange-500",
  "from-pink-500 to-rose-600",
  "from-orange-400 to-red-500",
];

export const PARTICIPANTS = [
  {
    id: "local",
    initials: "YO",
    name: "You",
    role: "Host",
    isLocal: true,
    mic: true,
    cam: true,
    talking: true,
  },
  {
    id: "p1",
    initials: "SR",
    name: "Sara R.",
    role: "Guest",
    isLocal: false,
    mic: true,
    cam: true,
    talking: false,
  },
  {
    id: "p2",
    initials: "MK",
    name: "Mike K.",
    role: "Guest",
    isLocal: false,
    mic: false,
    cam: true,
    talking: false,
  },
  {
    id: "p3",
    initials: "JL",
    name: "Jamie L.",
    role: "Guest",
    isLocal: false,
    mic: true,
    cam: false,
    talking: false,
  },
];

export const INITIAL_MESSAGES = [
  {
    id: 1,
    author: "Sara R.",
    text: "Hey everyone, can you all see my screen?",
    mine: false,
  },
  {
    id: 2,
    author: "You",
    text: "Yes, looks good to me.",
    mine: true,
  },
  {
    id: 3,
    author: "Mike K.",
    text: "Let me share the Q3 numbers now.",
    mine: false,
  },
  {
    id: 4,
    author: "Jamie L.",
    text: "Ready when you are.",
    mine: false,
  },
];

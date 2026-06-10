import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, getMeetings, createMeeting, getUpcomingMeetings, scheduleMeeting, updateMeeting, deleteMeeting } from "../lib/api";
import ScheduleMeetingDialog from "../components/dashboard/ScheduleMeetingDialog";
import InstantMeetingDialog from "../components/dashboard/InstantMeetingDialog";
import CreateRoomDialog from "../components/dashboard/CreateRoomDialog";
import EditRoomDialog from "../components/dashboard/EditRoomDialog";
import Sidebar from "../components/dashboard/Sidebar";
import TopBar from "../components/dashboard/TopBar";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import RoomCard from "../components/dashboard/RoomCard";
import UpcomingMeetings from "../components/dashboard/UpcomingMeetings";

const QUICK_ACTIONS = [
  { id: "instant", title: "Instant Meeting", icon: "video" },
  { id: "create-room", title: "Create Room", icon: "plus" },
  { id: "schedule", title: "Schedule", icon: "calendar" },
];

function Dashboard() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstantMeetingOpen, setIsInstantMeetingOpen] = useState(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isScheduleMeetingOpen, setIsScheduleMeetingOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, meetingsRes, upcomingRes] = await Promise.all([
          getProfile(),
          getMeetings(),
          getUpcomingMeetings(),
        ]);
        
        setUser(profileRes.data);
        
        // Filter upcoming meetings to only include scheduled ones
        const scheduledMeetings = (upcomingRes?.data?.meetings || []).filter(
          (m) => m.status === "scheduled"
        );
        setUpcomingMeetings(scheduledMeetings);
        
        // Map ongoing meetings/rooms to UI room format
        const ongoingMeetings = (meetingsRes?.data?.meetings || []).filter(
          (m) => m.status === "ongoing"
        );
        const mappedRooms = ongoingMeetings.map((m) => ({
          id: m.meeting_id,
          title: m.meeting_title,
          memberCount: m._count.participants,
          themeColor: "bg-[#5D59C7]/20 text-[#5D59C7]", // Default theme
          members: [m.host.profile_picture_url || "https://www.figma.com/api/mcp/asset/67753a3d-3549-4da3-b837-ca8737b2faf5"],
        }));
        
        setRooms(mappedRooms);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleActionClick = (id) => {
    if (id === "instant") {
      setIsInstantMeetingOpen(true);
    } else if (id === "create-room") {
      setIsCreateRoomOpen(true);
    } else if (id === "schedule") {
      setIsScheduleMeetingOpen(true);
    }
  };

  const handleScheduleMeeting = async (meetingData) => {
    try {
      const response = await scheduleMeeting(meetingData);
      setUpcomingMeetings((prev) => [...prev, response.data].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
      setIsScheduleMeetingOpen(false);
    } catch (error) {
      console.error("Failed to schedule meeting:", error);
      alert("Failed to schedule meeting. Please try again.");
    }
  };

  const handleStartMeeting = (meetingDetails) => {
    setIsInstantMeetingOpen(false);
    const instantRoomId = "instant-" + Math.floor(Math.random() * 1000000);
    navigate(`/room/${instantRoomId}`, { state: { meetingDetails } });
  };

  const handleCreateRoom = async (roomData) => {
    try {
      const response = await createMeeting({
        meeting_title: roomData.name,
      });

      const newMeeting = response.data;
      
      const newRoom = {
        id: newMeeting.meeting_id,
        title: newMeeting.meeting_title,
        memberCount: 1,
        themeColor: roomData.theme + "/20 text-" + roomData.theme.split("-")[1],
        members: [
          newMeeting.host.profile_picture_url || "https://www.figma.com/api/mcp/asset/67753a3d-3549-4da3-b837-ca8737b2faf5",
        ],
      };
      
      setRooms([newRoom, ...rooms]);
      setIsCreateRoomOpen(false);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleEditRoomSubmit = async (roomData) => {
    try {
      await updateMeeting(roomData.id, {
        meeting_title: roomData.name,
      });

      const updatedThemeColor = roomData.theme + "/20 text-" + roomData.theme.split("-")[1];

      setRooms(rooms.map(room => 
        room.id === roomData.id 
          ? { ...room, title: roomData.name, themeColor: updatedThemeColor }
          : room
      ));
      setIsEditRoomOpen(false);
      setRoomToEdit(null);
    } catch (error) {
      console.error("Failed to update room:", error);
      alert("Failed to update room. Please try again.");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await deleteMeeting(roomId);
      setRooms(rooms.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Failed to delete room. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-canvas">
      <Sidebar user={user} activeItem="dashboard" />
      <main className="flex flex-1 flex-col lg:pl-[300px]">
        <TopBar 
          userName={user ? user.first_name : "User"} 
          meetingCount={rooms.length} 
        />
        
        <div className="flex flex-1 flex-col gap-8 p-4 lg:flex-row lg:p-6">
          <div className="flex flex-1 flex-col gap-10">
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-base font-bold text-text-secondary uppercase tracking-wider">
                Quick actions
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionCard 
                    key={action.id} 
                    {...action} 
                    onClick={() => handleActionClick(action.id)}
                  />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-text-secondary uppercase tracking-wider">
                  Your rooms
                </h2>
                <button className="text-sm font-medium text-text-brand hover:underline font-body">
                  View all
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-text-brand"></div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => (
                    <RoomCard 
                      key={room.id} 
                      {...room} 
                      onEdit={() => {
                        setRoomToEdit(room);
                        setIsEditRoomOpen(true);
                      }}
                      onDelete={() => handleDeleteRoom(room.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <UpcomingMeetings meetings={upcomingMeetings} />
        </div>
      </main>

      <InstantMeetingDialog 
        isOpen={isInstantMeetingOpen} 
        onClose={() => setIsInstantMeetingOpen(false)} 
        onStartMeeting={handleStartMeeting}
      />

      <CreateRoomDialog
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <EditRoomDialog
        isOpen={isEditRoomOpen}
        onClose={() => {
          setIsEditRoomOpen(false);
          setRoomToEdit(null);
        }}
        onEditRoom={handleEditRoomSubmit}
        initialData={roomToEdit}
      />

      <ScheduleMeetingDialog
        isOpen={isScheduleMeetingOpen}
        onClose={() => setIsScheduleMeetingOpen(false)}
        onSchedule={handleScheduleMeeting}
      />
    </div>
  );
}

export default Dashboard;

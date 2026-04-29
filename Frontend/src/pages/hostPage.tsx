import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";


interface HostData {
    id: number;
    name: string;
    email: string;
}

interface HostOverviewEvent {
    id: number;
    title: string;
    startsAt: string;
    location: string;
    attendeeCount: number;
    capacity: number | null;
    imageUrl?: string | null;
}

interface CardItem {
    title: string;
    date: string;
    location?: string;
    filled?: number;
    total?: number;
    image?: string;
}

interface ReviewItem {
    id: number;
    userName: string;
    msg: string;
    rating?: number;
    avatar?: string;
}

interface HostStats {
    totalEvents: number;
    totalAttendees: number;
    avgRating: number;
    reviewCount: number;
    avgFillRate: number;
}

interface HostOverviewResponse {
    host: HostData;
    stats?: {
        totalEvents?: number;
        totalAttendees?: number;
        averageRating?: number;
        reviewCount?: number;
        averageFillRate?: number;
    };
    upcomingEvents?: HostOverviewEvent[];
    pastEvents?: HostOverviewEvent[];
    reviews?: ReviewItem[];
}

interface EventDetailsResponse {
    imageUrl?: string | null;
}

const EMPTY_STATS: HostStats = {
    totalEvents: 0,
    totalAttendees: 0,
    avgRating: 0,
    reviewCount: 0,
    avgFillRate: 0,
};

const API_BASE = import.meta.env.VITE_API_URL;

const mapEventToCard = (event: HostOverviewEvent): CardItem => ({
    title: event.title ?? "Title",
    date: event.startsAt ? new Date(event.startsAt).toLocaleString() : "Date",
    location: event.location ?? "location",
    filled: event.attendeeCount ?? 0,
    total: event.capacity ?? undefined,
    image: event.imageUrl ?? undefined,
});

const fetchEventImage = async (eventId: number): Promise<string | undefined> => {
    try {
        const response = await fetch(`${API_BASE}/events/${eventId}`);
        if (!response.ok) return undefined;
        const detail = (await response.json()) as EventDetailsResponse;
        return detail.imageUrl ?? undefined;
    } catch {
        return undefined;
    }
};

const attachImagesFromEventDetails = async (events: HostOverviewEvent[]): Promise<HostOverviewEvent[]> => {
    const withImages = await Promise.all(
        events.map(async (event) => {
            const imageUrl = await fetchEventImage(event.id);
            if (!imageUrl) return event;
            return { ...event, imageUrl };
        }),
    );
    return withImages;
};


const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div style={{
        flex: 1,
        padding: "1rem",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
    }}>
        <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "500" }}>{label}</div>
        <div style={{ fontSize: "2rem", fontWeight: "700", color: "#111827", lineHeight: 1.2, marginTop: "0.25rem" }}>{value}</div>
        {sub && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>{sub}</div>}
    </div>
);

const EventCard = ({ card }: { card: CardItem }) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem",
        backgroundColor: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
        marginBottom: "0.625rem",
    }}>
        <img
            src={card.image || "/image-placeholder.png"}
            alt={card.title}
            style={{ width: "72px", height: "72px", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontWeight: "700", fontSize: "1rem", color: "#111827" }}>{card.title}</div>
            <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#374151" }}>{card.date}</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{card.location || "location"}</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{card.filled ?? 25}/{card.total ?? 100}</div>
        </div>
    </div>
);

export default function Host() {
    const { hostId } = useParams<{ hostId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [host, setHost] = useState<HostData | null>(null);
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [upcomingEvents, setUpcomingEvents] = useState<CardItem[]>([]);
    const [pastEvents, setPastEvents] = useState<CardItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<HostStats>(EMPTY_STATS);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const tabs = [
        { label: "Upcoming events", count: upcomingEvents.length },
        { label: "Past events",     count: pastEvents.length },
     //   { label: "Review" },
     //No backend for reviews yet, can be implemented in future
    ];

    //Checking if mobile view
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchHostData = async () => {
            try {
                const response = await fetch(`${API_BASE}/hosts/${hostId}/overview`);
                const data = (await response.json()) as HostOverviewResponse;
                console.log("Debugging, host Overview Data:", data);
                setHost(data.host);
                setStats({
                    totalEvents: data.stats?.totalEvents ?? 0,
                    totalAttendees: data.stats?.totalAttendees ?? 0,
                    avgRating: data.stats?.averageRating ?? 0,
                    reviewCount: data.stats?.reviewCount ?? 0,
                    avgFillRate: data.stats?.averageFillRate ?? 0,
                });

                const rawUpcoming: HostOverviewEvent[] = Array.isArray(data.upcomingEvents) ? data.upcomingEvents : [];
                const rawPast: HostOverviewEvent[] = Array.isArray(data.pastEvents) ? data.pastEvents : [];

                const [upcomingWithDetails, pastWithDetails] = await Promise.all([
                    attachImagesFromEventDetails(rawUpcoming),
                    attachImagesFromEventDetails(rawPast),
                ]);

                setUpcomingEvents(upcomingWithDetails.map(mapEventToCard));
                setPastEvents(pastWithDetails.map(mapEventToCard));
            } catch (err) {
                console.error("Failed to fetch host:", err);
                setHost({ id: 0, name: "Name", email: "email@domain.com" });
                setStats(EMPTY_STATS);
                setUpcomingEvents([]);
                setPastEvents([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (hostId) fetchHostData();
        else {
            setHost({ id: 0, name: "Name", email: "email@domain.com" });
            setIsLoading(false);
        }
    }, [hostId]);

    if (isLoading) return <p style={{ padding: "2rem" }}>Loading Host Profile...</p>;
    if (!host) return <p style={{ padding: "2rem" }}>Host not found.</p>;

    // ← current event list driven by selected tab
    const currentEvents = selectedTab === 0 ? upcomingEvents : pastEvents;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

            {/* Header */}
            <div style={{
                backgroundColor: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1.25rem",
                borderBottom: "1px solid #f3f4f6",
            }}>
                <button
                    onClick={() => {
                        const eventId = searchParams.get("eventId");
                        if (eventId) {
                            navigate(`/eventDetails/${eventId}`);
                        } else {
                            navigate(-1);
                        }
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="#111827" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div style={{ fontWeight: "700", fontSize: "0.9375rem", letterSpacing: "0.08em" }}>HOST</div>
                <div style={{ width: "20px" }} /> {/* Spacer for 'Host', replaces circle icon */}
            </div>

            {/* Profile + Stats */}
            <div style={{ backgroundColor: "white", padding: "1.5rem 1.25rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: "700", color: "#111827" }}>
                            {host.name || "Anonymous Host"}
                        </h1>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af", marginTop: "2px" }}>{host.email}</p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "0.625rem" }}>
                    <StatCard label="Total" value={stats.totalEvents} sub="events" />
                    <StatCard label="Total" value={stats.totalAttendees} sub="attendees" />
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ backgroundColor: "white", padding: "0.875rem 1.25rem 0", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                    {tabs.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedTab(i)}
                            style={{
                                padding: "0.4rem 0.875rem",
                                borderRadius: "999px",
                                border: "1px solid #e5e7eb",
                                backgroundColor: selectedTab === i ? "#111827" : "white",
                                color: selectedTab === i ? "white" : "#374151",
                                fontWeight: "600",
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "all 0.15s",
                            }}
                        >
                            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Responsive Content Grid ── */}
            <div style={{ 
                padding: "1rem 1.25rem", 
                display: "grid", 
                //Dynamic columns based on screen size
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
                gap: "1rem" 
            }}>

            {isMobile ? (
                /* On Mobile have everything stacked on top of each other in one go */
                <div>
                    {currentEvents.map((c, i) => (
                        <EventCard key={i} card={c} />
                    ))}
                </div>
            ) : (
            /* On desktop keep 2-column split */
            <>
                <div>
                    {currentEvents
                        .slice(0, Math.ceil(currentEvents.length / 2))
                        .map((c, i) => <EventCard key={i} card={c} />)}
                </div>
                <div>
                    {currentEvents
                        .slice(Math.ceil(currentEvents.length / 2))
                        .map((c, i) => <EventCard key={i} card={c} />)}
                </div>
            </>
                )}
            </div>
                    </div>
                );
}

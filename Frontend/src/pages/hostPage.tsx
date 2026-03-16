import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";


interface HostData {
    id: number,
    name: string,
    email: string
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

const MOCK_STATS: HostStats = {
    totalEvents: 125,
    totalAttendees: 500,
    avgRating: 4.1,
    reviewCount: 140,
    avgFillRate: 85,
};

const MOCK_UPCOMING_EVENTS: CardItem[] = Array.from({ length: 3 }, () => ({
    title: "Title",
    date: "Date",
    location: "location",
    filled: 25,
    total: 100,
    image: "https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=120&q=80",
}));

const MOCK_PAST_EVENTS: CardItem[] = Array.from({ length: 8 }, () => ({
    title: "Title",
    date: "Date",
    location: "location",
    filled: 25,
    total: 100,
    image: "https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=120&q=80",
}));

const StarRating = ({ rating = 4 }: { rating?: number }) => (
    <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} width="14" height="14" viewBox="0 0 24 24"
                fill={s <= rating ? "#FBBF24" : "none"}
                stroke="#FBBF24" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
        ))}
    </div>
);

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
            src={card.image || "https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=120&q=80"}
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

const ReviewCard = ({ review }: { review: ReviewItem }) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.625rem 0",
        borderBottom: "1px solid #f3f4f6"
    }}>
        <div style={{
            width: "2.25rem", height: "2.25rem", borderRadius: "50%",
            backgroundColor: review.avatar ? "transparent" : "#d1d5db",
            overflow: "hidden", flexShrink: 0,
        }}>
            {review.avatar
                ? <img src={review.avatar} alt={review.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", backgroundColor: "#6b7280" }} />
            }
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: "600", fontSize: "0.875rem", color: "#111827" }}>{review.userName}</div>
                <StarRating rating={review.rating ?? 4} />
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>{review.msg}</div>
        </div>
    </div>
);

export default function Host() {
    const { hostId } = useParams<{ hostId: string }>();
    const [host, setHost] = useState<HostData | null>(null);
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [upcomingEvents, setUpcomingEvents] = useState<CardItem[]>(MOCK_UPCOMING_EVENTS);
    const [pastEvents] = useState<CardItem[]>(MOCK_PAST_EVENTS);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats] = useState<HostStats>(MOCK_STATS);

    const tabs = [
        { label: "Upcoming events", count: upcomingEvents.length },
        { label: "Past events",     count: pastEvents.length },
        { label: "Review" },
    ];

    useEffect(() => {
        const fetchHostData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/hosts/${hostId}/overview`);
                const data = await response.json();
                console.log("Debugging, host Overview Data:", data);
                setHost(data.host);
                if (data.upcomingEvents?.length) setUpcomingEvents(data.upcomingEvents);
                setReviews(data.reviews);
            } catch (err) {
                console.error("Failed to fetch host:", err);
                setHost({ id: 0, name: "Name", email: "email@domain.com" });
                setReviews([
                    { id: 1, userName: "Name", msg: "review", rating: 4 },
                    { id: 2, userName: "Name", msg: "review", rating: 4 },
                    { id: 3, userName: "Name", msg: "review", rating: 4 },
                    { id: 4, userName: "Name", msg: "review", rating: 4 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        if (hostId) fetchHostData();
        else {
            setHost({ id: 0, name: "Name", email: "email@domain.com" });
            setReviews([
                { id: 1, userName: "Name", msg: "review", rating: 4 },
                { id: 2, userName: "Name", msg: "review", rating: 4 },
                { id: 3, userName: "Name", msg: "review", rating: 4 },
                { id: 4, userName: "Name", msg: "review", rating: 4 },
            ]);
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
                <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="#111827" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <div style={{ fontWeight: "700", fontSize: "0.9375rem", letterSpacing: "0.08em" }}>HOST</div>
                <div style={{
                    width: "2rem", height: "2rem", borderRadius: "50%", backgroundColor: "#111827",
                    display: "flex", alignItems: "center", justifyContent: "center"
                }} />
            </div>

            {/* Profile + Stats */}
            <div style={{ backgroundColor: "white", padding: "1.5rem 1.25rem 1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <img
                        src="/src/assets/user-icon.png"
                        alt="Host"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"; }}
                        style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }}
                    />
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
                    <StatCard label="Avg.rating" value={stats.avgRating} sub={`(${stats.reviewCount} reviews)`} />
                    <StatCard label="Avg. fill rate" value={`${stats.avgFillRate}%`} />
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

            {/* ── Three-column content grid ── */}
            <div style={{ padding: "1rem 1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>

                {selectedTab < 2 ? (
                    <>
                        {/* Col 1: first half of event list */}
                        <div>
                            {currentEvents
                                .slice(0, Math.ceil(currentEvents.length / 2))
                                .map((c, i) => <EventCard key={i} card={c} />)}
                        </div>
                        {/* Col 2: second half of event list */}
                        <div>
                            {currentEvents
                                .slice(Math.ceil(currentEvents.length / 2))
                                .map((c, i) => <EventCard key={i} card={c} />)}
                        </div>
                    </>
                ) : (
                    /* Review tab: full-width review list */
                    <div style={{ gridColumn: "span 2" }}>
                        {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                    </div>
                )}

                {/* Col 3: reviews panel – always visible on events tabs */}
                {selectedTab < 2 && (
                    <div style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.75rem",
                        padding: "0.875rem 0.875rem 0.25rem",
                        alignSelf: "start",
                    }}>
                        {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
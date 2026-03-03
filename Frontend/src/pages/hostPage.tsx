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
    const [tagsArr] = useState<string[]>(['Upcoming', 'Past events', 'Overview']);
    const [selectedTag, setSelectedTag] = useState<number>(0);
    const [upcomingEvents, setUpcomingEvents] = useState<CardItem[]>(MOCK_UPCOMING_EVENTS);
    const [pastEvents] = useState<CardItem[]>(MOCK_PAST_EVENTS);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats] = useState<HostStats>(MOCK_STATS);

    useEffect(() => {
        const fetchHostData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/hosts/${hostId}/overview`);
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

    if (isLoading) return <p>Loading Host Profile...</p>;
    if (!host) return <p>Host not found.</p>;
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

            {/* ── Header (redesigned) ── */}
            <div style={{
                backgroundColor: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1.25rem",               // ← tighter padding
                borderBottom: "1px solid #f3f4f6",          // ← subtle separator
            }}>
                {/* ← back arrow replaces logo icon */}
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

            {/* Profile */}
            {host && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem 1.25rem', backgroundColor: 'white' }}>
                    <div style={{ marginRight: '1.5rem' }}>
                        <img
                            src="/src/assets/user-icon.png"
                            alt="Host Profile"
                            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '700', color: '#111827' }}>
                            {host.name || "Anonymous Host"}
                        </h1>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af', marginTop: '2px' }}>
                            {host.email}
                        </p>
                    </div>
                </div>
            )}

            {/* Tags (unchanged for now) */}
            <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                marginTop: '0.5rem',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem'
            }}>
                {tagsArr.map((tag, index) => (
                    <div
                        key={index}
                        style={{
                            width: '33%',
                            height: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '1.5rem',
                            marginRight: '0.75rem',
                            backgroundColor: selectedTag === index ? 'black' : '#e5e7eb',
                            color: selectedTag === index ? 'white' : 'black',
                            cursor: 'pointer',
                        }}
                        onClick={() => setSelectedTag(index)}
                    >
                        <div style={{ fontWeight: 'bold' }}>{tag}</div>
                    </div>
                ))}
            </div>

            {/* Cards (unchanged) */}
            <div style={{ width: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    paddingLeft: '0.75rem',
                    minWidth: 'max-content'
                }}>
                    {upcomingEvents.map((card, index) => (
                        <div key={index} style={{
                            width: '12.5rem',
                            height: '5rem',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            marginRight: '0.75rem'
                        }}>
                            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>Date</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>TiTle</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews (unchanged) */}
            <div style={{
                marginTop: '2.5rem',
                paddingBottom: '1.25rem',
                marginLeft: '0.75rem',
                marginRight: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem'
            }}>
                <div style={{ marginTop: '1.25rem', fontWeight: 'bold' }}>Reviews</div>
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    )
}
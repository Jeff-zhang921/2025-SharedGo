import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

interface HostData {
    id: number;
    name: string;
    email: string;
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

const EMPTY_STATS: HostStats = {
    totalEvents: 0,
    totalAttendees: 0,
    avgRating: 0,
    reviewCount: 0,
    avgFillRate: 0,
};

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

// Review card component for user reviews
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
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [host, setHost] = useState<HostData | null>(null);
    const [selectedTab, setSelectedTab] = useState<number>(0);
    const [upcomingEvents, setUpcomingEvents] = useState<CardItem[]>([]);
    const [pastEvents, setPastEvents] = useState<CardItem[]>([]);
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<HostStats>(EMPTY_STATS);

    const tabs = [
        { label: "Upcoming events", count: upcomingEvents.length },
        { label: "Past events", count: pastEvents.length },
        { label: "Review" },
    ];

    const mapEventToCard = (event: any): CardItem => ({
        title: event.title ?? "Title",
        date: event.startsAt ? new Date(event.startsAt).toLocaleString() : "Date",
        location: event.location ?? "location",
        filled: event.attendeeCount ?? 0,
        total: event.capacity ?? undefined,
        image: event.imageUrl ?? undefined,
    });

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}></div>
    );
}
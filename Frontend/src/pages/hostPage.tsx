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

// Star rating component for reviews
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
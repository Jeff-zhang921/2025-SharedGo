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

// ← NEW
const MOCK_STATS: HostStats = {
    totalEvents: 125,
    totalAttendees: 500,
    avgRating: 4.1,
    reviewCount: 140,
    avgFillRate: 85,
};

export default function host() {
    const { hostId } = useParams<{ hostId: string }>();
    const [host, setHost] = useState<HostData | null>(null);
    const [tagsArr, settagArr] = useState<string[]>(['Upcoming', 'Past events', 'Overview']);
    const [selectedTag, setSelectedTag] = useState<number>(0);
    const [card, setCard] = useState<CardItem[]>([])
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats] = useState<HostStats>(MOCK_STATS); // ← NEW: wired to mock until backend ready

    useEffect(() => {
        const fetchHostData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/hosts/${hostId}/overview`);
                const data = await response.json();
                console.log("Debugging, host Overview Data:", data);
                setHost(data.host);
                setCard(data.upcomingEvents);
                setReviews(data.reviews);
            } catch (err) {
                console.error("Failed to fetch host:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (hostId) fetchHostData();
    }, [hostId]);

    if (isLoading) return <p>Loading Host Profile...</p>;
    if (!host) return <p>Host not found.</p>;
    return (
        <>
            <div style={{ height: '100vh' }}>
                <div style={{
                    backgroundColor: 'white',
                    width: '100%',
                    paddingLeft: '1.25rem',
                    paddingRight: '1.25rem',
                    paddingTop: '1rem',
                    paddingBottom: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <img style={{ height: '1.25rem', width: '1.25rem' }} src="../../public/flodIcon.svg" />
                    </div>
                    <div style={{ fontWeight: 'bold' }}>HOST</div>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        backgroundColor: 'black',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}></div>
                </div>

                {host && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem 1.25rem', backgroundColor: 'white' }}>
                        <div style={{ marginRight: '1.5rem' }}>
                            <img
                                src="/src/assets/user-icon.png"
                                alt="Host Profile"
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '500', color: 'black' }}>
                                {host.name || "Anonymous Host"}
                            </h1>
                            <p style={{ margin: 0, fontSize: '1.25rem', color: '#6b7280' }}>
                                {host.email}
                            </p>
                        </div>
                    </div>
                )}

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
                                color: selectedTag === index ? 'white' : 'black'
                            }}
                            onClick={() => setSelectedTag(index)}
                        >
                            <div style={{ fontWeight: 'bold' }}>{tag}</div>
                        </div>
                    ))}
                </div>

                <div style={{ width: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '0.5rem',
                        paddingLeft: '0.75rem',
                        minWidth: 'max-content'
                    }}>
                        {card.map((card, index) => (
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
                        <div key={review.id} style={{
                            height: '2.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '1rem',
                            marginBottom: '1rem'
                        }}>
                            <div style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                backgroundColor: 'black',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}></div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                paddingLeft: '1rem'
                            }}>
                                <div style={{ fontWeight: 'bold' }}>{review.userName}</div>
                                <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{review.msg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    )
}
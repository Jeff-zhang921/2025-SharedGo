
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

//Interface to match backend
interface HostData {
    id: number,
    name: string,
    email: string
}

//Moved interfaces outside of the export
interface CardItem { //Cards = events
    title: string;
    date: string;
}

interface ReviewItem {
    id: number;
    userName: string;
    msg: string;
}
export default function host() {
    const { hostId } = useParams<{ hostId: string }>(); //Fetches id of host from browser e.g. url/host/4 hostId becomes 4
    const [host, setHost] = useState<HostData | null>(null);
    const [tagsArr, settagArr] = useState<string[]>(['Upcoming', 'Past events', 'Overview']);
    const [selectedTag, setSelectedTag] = useState<number>(0);  // select status of tags
    const [card, setCard] = useState<CardItem[]>([])
    // 在组件内部添加状态
    const [reviews, setReviews] = useState<ReviewItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    //const [selectedTab, setSelectedTab] = useState<number>(0);

    useEffect(() => { //Logic to actually fetch host data from backend
        const fetchHostData = async () => {
            try {
                const response = await fetch(`http://localhost:3000/hosts/${hostId}/overview`); //Backend route to get specific host
                const data = await response.json();
                console.log("Debugging, host Overview Data:", data); //checking connection is working
                setHost(data.host);
                setCard(data.upcomingEvents); //backend returns their hosted events
                setReviews(data.reviews); //backend returns their reviews
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
                {/* head UI */}
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

                {/* Profile Section (Connects to backend) */}
                {host && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem 1.25rem', backgroundColor: 'white' }}>
                        <div style={{ marginRight: '1.5rem' }}>
                            <img //Placeholder host icon image
                                src="/src/assets/user-icon.png" 
                                alt="Host Profile"
                                style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '500', color: 'black' }}> {/*Name of host*/}
                                {host.name || "Anonymous Host"} {/*Name of host from backend*/}
                            </h1>
                            <p style={{ margin: 0, fontSize: '1.25rem', color: '#6b7280' }}> {/*Email address*/}
                                {host.email} {/*Email from backend*/}
                            </p>
                        </div>
                    </div>
                )}

                {/* tags UI */}
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

                {/* card UI */}
                <div style={{
                    width: '100%',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                }}>
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

                {/* Reviews UI */}
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
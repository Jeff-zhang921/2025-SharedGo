
import { useState } from "react";

export default function host() {
    interface CardItem {
        title: string;
        date: string;
    }

    const [tagsArr, settagArr] = useState<string[]>(['Upcoming', 'Past events', 'Overview']);
    const [selectedTag, setSelectedTag] = useState<number>(0);  // select status of tags

    const [card, setCard] = useState<CardItem[]>([{ title: "Title", date: "Date" }, { title: "Title", date: "Date" }, { title: "Title", date: "Date" }])

    interface ReviewItem {
        id: number;
        userName: string;
        msg: string;
    }

    // 在组件内部添加状态
    const [reviews, setReviews] = useState<ReviewItem[]>([
        {
            id: 1,
            userName: "User1",
            msg: "reviews",
        },
        {
            id: 2,
            userName: "User2",
            msg: "reviews",
        },
        {
            id: 3,
            userName: "User3",
            msg: "reviews",
        },
        {
            id: 4,
            userName: "User4",
            msg: "reviews",
        },
        {
            id: 5,
            userName: "User5",
            msg: "reviews",
        }
    ]);

    const [selectedTab, setSelectedTab] = useState<number>(0);
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

                {/* Description UI */}
                <div style={{
                    height: '20rem',
                    marginTop: '2.5rem',
                    marginLeft: '0.75rem',
                    marginRight: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    paddingLeft: '0.75rem',
                    paddingRight: '0.75rem'
                }}>
                    <div style={{ marginTop: '1.25rem', fontWeight: 'bold' }}>Description</div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                            borderBottom: '1px solid #e5e7eb',
                            height: '2.5rem'
                        }}></div>
                    ))}
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

                <div style={{ height: '5rem' }}></div>
                {/* 底部icon */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-around',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                }}>
                    {/* 底部按钮保持不变，只是转换为行内样式 */}
                    {[0, 1, 2, 3, 4].map((tabIndex) => (
                        <button
                            key={tabIndex}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '0.5rem'
                            }}
                            onClick={() => setSelectedTab(tabIndex)}
                        >
                            <div style={{ padding: '0.25rem', borderRadius: '50%' }}>
                                {/* SVG图标保持不变 */}
                                {selectedTab === tabIndex ? (
                                    <svg style={{ height: '1.5rem', width: '1.5rem' }} viewBox="0 0 24 24" fill="black">
                                        {/* 路径保持不变 */}
                                    </svg>
                                ) : (
                                    <svg style={{ height: '1.5rem', width: '1.5rem' }} viewBox="0 0 24 24">
                                        {/* 路径保持不变 */}
                                    </svg>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </>
    )
}
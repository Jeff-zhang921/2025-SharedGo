import Button from "./Button";
import React, { useState } from "react";
import { useLocation } from "react-router-dom"; //to check current page
import { useSearch } from "./../searchFile"; //Import the hook

type Props = {
    userId?: string | number;
};

export default function Navigation() {
    const location = useLocation();
    const isMapPage = location.pathname === "/map"; //Check if user is on the map (only show search bar if yes)
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { search, setSearch, category, setCategory } = useSearch();

    return (
        <aside className="navbar">            
            {/* Only show Search button if on the map page */}
            {isMapPage && (
                <div className="search-nav-item">
                    <button 
                        className="nav-action-btn" 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <img src="/src/assets/search.svg" alt="search" style={{ width: '30px', height: '30px' }} />
                    </button>

                    {/* Search Bar */}
                    {isSearchOpen && (
                        <div className="nav-search-container">
                            <input 
                                type="text" 
                                placeholder="Search events..." 
                                className="nav-search-input"
                                value={search} //Tells the input what to show
                                onChange={(e) => setSearch(e.target.value)} //Updates state as you type
                            />
                            <select 
                                className="nav-filter-select"
                                value={category} //Tells the dropdown which one is selected
                                onChange={(e) => setCategory(e.target.value)} //Updates category state
                            >
                                <option value="">All Categories</option>
                                <option value="Physical_Activities">Physical Activities</option>
                                <option value="Festivals">Festivals</option>
                                <option value="Educational">Educational</option>
                                <option value="Networking">Networking</option>
                                <option value="Arts & Culture">Arts & Culture</option>
                                <option value="Food & Drink">Food & Drink</option>
                                <option value="Music & Concerts">Music & Concerts</option>
                                <option value="Tech & Gaming">Tech & Gaming</option>
                                <option value="Wellness & Meditation">Wellness & Meditation</option>
                                <option value="Volunteer & Charity">Volunteer & Charity</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
            
            <Button link="/map" imgSrc="/src/assets/home.svg" text="home" size={30}/>
            <Button link="/conversations" imgSrc="/src/assets/chat.svg" text="chat" size={30}/>
            <Button link="/profile" imgSrc="/src/assets/user.svg" text="profile" size={30}/>
        </aside>
    );
}
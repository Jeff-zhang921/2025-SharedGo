import Button from "./Button";
import React, { useState } from "react";
import { useLocation } from "react-router-dom"; //to check current page
import { useSearch } from "./../searchFile"; //Import the hook
import { SearchIcon, HomeIcon, ChatIcon, ProfileIcon } from "./navbarIcons"

type Props = {
    userId?: string | number;
};

export default function Navigation() {
    const location = useLocation();
    const isMapPage = location.pathname === "/map"; //Check if user is on the map (only show search bar if yes)
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { search, setSearch, category, setCategory } = useSearch();
    const { startDate, setStartDate, endDate, setEndDate } = useSearch();

    return (
        <aside className="navbar">            
            {/* Only show Search button if on the map page */}
            {isMapPage && (
                <div className="search-nav-item">
                    <button 
                        className="nav-action-btn" 
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                        <SearchIcon size={30}/>
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
                                <option value="Arts_Culture">Arts & Culture</option>
                                <option value="Food_Drink">Food & Drink</option>
                                <option value="Music_Concerts">Music & Concerts</option>
                                <option value="Tech_Gaming">Tech & Gaming</option>
                                <option value="Wellness_Meditation">Wellness & Meditation</option>
                                <option value="Volunteer_Charity">Volunteer & Charity</option>
                            </select>

                            <div className="date-range-group">
                                <div className="date-input-wrapper">
                                    <label>From:</label>
                                    <input 
                                        type="date"  //Show browser calendar to pick from
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)} //When date picked, send that value to setStartDate
                                        className="nav-search-input date-input"
                                    />
                                </div>
                                <div className="date-input-wrapper">
                                    <label>To:</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        min={startDate} //Prevents picking a 'to' date before 'from'
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="nav-search-input date-input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/*No home button when on map page*/}
            {!isMapPage && (
                <Button link="/map" text="home" icon={<HomeIcon/>} size={30}/>
            )}

            <Button link="/conversations" text="chat" icon={<ChatIcon/>} size={30}/>

            <Button link="/profile" text="profile" icon={<ProfileIcon/>} size={30}/>
        </aside>
    );
}

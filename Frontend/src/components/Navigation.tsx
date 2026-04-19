import Button from "./Button";
import { HomeIcon, ChatIcon, ProfileIcon } from "./navbarIcons";

export default function Navigation() {
    return (
        <aside className="navbar">
            <Button link="/map" text="home" icon={<HomeIcon />} size={30} />
            <Button link="/conversations" text="chat" icon={<ChatIcon />} size={30} />
            <Button link="/profile" text="profile" icon={<ProfileIcon />} size={30} />
        </aside>
    );
}

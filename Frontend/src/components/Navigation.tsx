import Button from "./Button";

type Props = {
    userId?: string | number;
};

export default function Navigation({ userId }: Props) {
    return (
    <aside className="navbar">
        <Button link="/home" imgSrc="/src/assets/home.svg" text="home" size={30}/>
        <Button link="/map" imgSrc="/src/assets/map.svg" text="map" size={30}/>
        <Button link="/chat" imgSrc="/src/assets/chat.svg" text="chat" size={30}/>
        <Button link="/profile" imgSrc="/src/assets/user.svg" text="profile" size={30}/>
    </aside>
    );
}

import React from 'react';
import "./mapPage.css"

const MapPage = () => {
  const icons = [ //Clickable icons representing events in the area
    { top: "40%", left: "60%", label: "📍" }, //Icon 0
    { top: "20%", left: "10%", label: "📍" }, //Icon 1
    { top: "80%", left: "30%", label: "📍" }, //Icon 2
    { top: "50%", left: "80%", label: "📍" }  //Icon 3
  ];

  return (
    <div className="map-container">
      {icons.map((icon, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            top: icon.top,
            left: icon.left,
            cursor: "pointer",
            fontSize: "60px"
          }}
          onClick={() => alert(`Clicked icon ${idx}`)}
        >
          {icon.label}
        </div>
      ))}
    </div>
  );
};

export default MapPage;

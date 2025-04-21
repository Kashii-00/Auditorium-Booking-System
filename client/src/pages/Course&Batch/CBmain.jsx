import React from "react";
import courseIcon from "./kanban.png";
import batchIcon from "./list.png";
import costIcon from "./form.png";
import addIcon from "./plus.png";


import { useNavigate } from "react-router-dom";

const CBmain = () => {

    const navigate = useNavigate();

    const buttons = [
        { text: "Course Registration", image: courseIcon,path:"/courseregistration"},
        { text: "Batch Registration", image: batchIcon,path:"/BatchRegistration"},
        { text: "Cost - In", image: costIcon,path:"/CourseIN"},
        { text: "Add More", image: addIcon,path:"/AddMore"},
    ];

    return (
        <div>
            <h2 style={{fontWeight:'20px',marginLeft:'80px'}}>Course & Batch Management</h2>

            <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", paddingTop:'200px' }}>
                {buttons.map((item, index) => (
                    <div
                        key={index}
                        onClick={()=>navigate(item.path)}
                        style={{
                            width: "200px",
                            height: "120px",
                            border: "2px solid #6495ED",
                            borderRadius: "10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px",
                            backgroundColor: index !== 3 ? "#f8f9fd" : "transparent",
                            cursor: "pointer",
                        }}
                    >
                        <img src={item.image} alt={item.text} style={{ width: "40px", height: "40px", marginBottom: "10px" }} />
                        <span style={{ fontWeight: "bold", textAlign: "center" }}>{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CBmain;

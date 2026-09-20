import React from "react";
import {
  MdOutlineDesignServices,
  MdOutlineWebhook,
  MdAccountBalance,
  MdOutlineAnimation,
} from "react-icons/md";
import { TbAppsFilled } from "react-icons/tb";
import { FaReact } from "react-icons/fa";
import { GiArtificialIntelligence } from "react-icons/gi";
import { IoGameController } from "react-icons/io5";
import { FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const PopularCategories = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      title: "Graphics & Design",
      subTitle: "305 Open Positions",
      icon: <MdOutlineDesignServices />,
      colorClass: "cat-pink",
      query: "design",
    },
    {
      id: 2,
      title: "Mobile App Dev",
      subTitle: "500 Open Positions",
      icon: <TbAppsFilled />,
      colorClass: "cat-indigo",
      query: "mobile app",
    },
    {
      id: 3,
      title: "Frontend Web Dev",
      subTitle: "200 Open Positions",
      icon: <MdOutlineWebhook />,
      colorClass: "cat-sky",
      query: "frontend",
    },
    {
      id: 4,
      title: "MERN Stack Dev",
      subTitle: "1000+ Open Positions",
      icon: <FaReact />,
      colorClass: "cat-cyan",
      query: "MERN",
    },
    {
      id: 5,
      title: "Account & Finance",
      subTitle: "150 Open Positions",
      icon: <MdAccountBalance />,
      colorClass: "cat-emerald",
      query: "finance",
    },
    {
      id: 6,
      title: "Artificial Intelligence",
      subTitle: "867 Open Positions",
      icon: <GiArtificialIntelligence />,
      colorClass: "cat-violet",
      query: "AI",
    },
    {
      id: 7,
      title: "Video Animation",
      subTitle: "50 Open Positions",
      icon: <MdOutlineAnimation />,
      colorClass: "cat-orange",
      query: "animation",
    },
    {
      id: 8,
      title: "Game Development",
      subTitle: "80 Open Positions",
      icon: <IoGameController />,
      colorClass: "cat-rose",
      query: "game development",
    },
  ];

  return (
    <div className="categories">
      <div className="section-header">
        <span className="section-eyebrow">Explore Roles</span>
        <h3>Popular Categories</h3>
        <p className="section-sub">
          Browse curated job categories and find the perfect career path that aligns with your expertise.
        </p>
      </div>

      <div className="banner">
        {categories.map((element) => (
          <div
            className={`card cat-card ${element.colorClass}`}
            key={element.id}
            onClick={() => navigate(`/job/getall?category=${encodeURIComponent(element.title)}`)}
            role="button"
            tabIndex={0}
          >
            <div className="icon">{element.icon}</div>
            <div className="text">
              <p>{element.title}</p>
              <p>{element.subTitle}</p>
            </div>
            <span className="cat-explore">
              Explore <FiArrowRight />
            </span>
          </div>
        ))}
      </div>

      <div className="categories-cta">
        <button
          className="cat-cta-btn"
          onClick={() => navigate("/job/getall")}
          id="categories-view-all-btn"
        >
          View All Categories
          <FiArrowRight />
        </button>
      </div>
    </div>
  );
};

export default PopularCategories;

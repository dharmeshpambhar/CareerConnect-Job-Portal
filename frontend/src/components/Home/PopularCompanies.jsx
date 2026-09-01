import React from "react";
import { FaMicrosoft, FaApple, FaGoogle, FaAmazon } from "react-icons/fa";
import { SiTesla, SiMeta } from "react-icons/si";
import { FiArrowRight, FiMapPin } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const PopularCompanies = () => {
  const navigate = useNavigate();

  const companies = [
    {
      id: 1,
      title: "Microsoft",
      location: "Gurugram, Haryana",
      openPositions: 10,
      icon: <FaMicrosoft />,
      rating: 4.7,
      reviews: 1420,
      colorClass: "comp-blue",
      hiring: true,
    },
    {
      id: 2,
      title: "Tesla",
      location: "Bengaluru, Karnataka",
      openPositions: 5,
      icon: <SiTesla />,
      rating: 4.5,
      reviews: 830,
      colorClass: "comp-red",
      hiring: true,
    },
    {
      id: 3,
      title: "Apple",
      location: "Hyderabad, Telangana",
      openPositions: 20,
      icon: <FaApple />,
      rating: 4.8,
      reviews: 2100,
      colorClass: "comp-gray",
      hiring: true,
    },
    {
      id: 4,
      title: "Google",
      location: "Gurugram, Haryana",
      openPositions: 35,
      icon: <FaGoogle />,
      rating: 4.9,
      reviews: 3400,
      colorClass: "comp-green",
      hiring: true,
    },
    {
      id: 5,
      title: "Amazon",
      location: "Bengaluru, Karnataka",
      openPositions: 48,
      icon: <FaAmazon />,
      rating: 4.4,
      reviews: 2750,
      colorClass: "comp-orange",
      hiring: true,
    },
    {
      id: 6,
      title: "Meta",
      location: "Mumbai, Maharashtra",
      openPositions: 18,
      icon: <SiMeta />,
      rating: 4.6,
      reviews: 1180,
      colorClass: "comp-indigo",
      hiring: false,
    },
  ];

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    return (
      <div className="comp-stars">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < full ? "star-filled" : "star-empty"} />
        ))}
        <span>{rating}</span>
      </div>
    );
  };

  return (
    <div className="companies">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Top Employers</span>
          <h3>Top Companies Hiring</h3>
          <p className="section-sub">
            Join world-class organizations actively looking for talented professionals like you.
          </p>
        </div>

        <div className="banner">
          {companies.map((element) => (
            <div className={`card comp-card ${element.colorClass}`} key={element.id}>
              {element.hiring && <span className="comp-hiring-badge">Actively Hiring</span>}
              <div className="content">
                <div className={`icon comp-icon ${element.colorClass}`}>{element.icon}</div>
                <div className="text">
                  <p>{element.title}</p>
                  <p className="comp-location">
                    <FiMapPin /> {element.location}
                  </p>
                </div>
              </div>
              <div className="comp-meta">
                {renderStars(element.rating)}
                <span className="comp-reviews">({element.reviews.toLocaleString()} reviews)</span>
              </div>
              <button
                onClick={() => navigate(`/job/getall?q=${encodeURIComponent(element.title)}`)}
              >
                {element.openPositions} Open Positions <FiArrowRight />
              </button>
            </div>
          ))}
        </div>

        <div className="companies-cta">
          <button
            className="comp-cta-btn"
            onClick={() => navigate("/job/getall")}
            id="companies-explore-btn"
          >
            Explore All Companies
            <FiArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopularCompanies;

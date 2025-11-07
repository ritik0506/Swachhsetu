import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullScreen = false }) => {
  const spinnerClass = `spinner spinner-${size}`;
  
  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        <div className={spinnerClass}></div>
      </div>
    );
  }
  
  return <div className={spinnerClass}></div>;
};

export default LoadingSpinner;

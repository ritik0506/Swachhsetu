import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Star } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = ({ leaders, type = 'points' }) => {
  const getIcon = () => {
    switch (type) {
      case 'points':
        return <Star size={20} />;
      case 'reports':
        return <TrendingUp size={20} />;
      default:
        return <Award size={20} />;
    }
  };

  const getValue = (leader) => {
    switch (type) {
      case 'points':
        return leader.totalPoints;
      case 'reports':
        return leader.stats.reportsSubmitted;
      case 'level':
        return `Level ${leader.level.current}`;
      default:
        return leader.totalPoints;
    }
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        {getIcon()}
        <h3>Top Contributors</h3>
      </div>
      <div className="leaderboard-list">
        {leaders.map((leader, index) => (
          <motion.div
            key={leader._id}
            className={`leaderboard-item ${index < 3 ? `rank-${index + 1}` : ''}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="leader-rank">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${index + 1}`}
            </div>
            <img 
              src={leader.userId?.avatar || `https://ui-avatars.com/api/?name=${leader.userId?.name}&background=10b981&color=fff`} 
              alt={leader.userId?.name}
              className="leader-avatar"
            />
            <div className="leader-info">
              <div className="leader-name">{leader.userId?.name}</div>
              <div className="leader-value">{getValue(leader)}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;

import React from 'react';

export default function RecentActivity({ activities = [] }) {
  return (
    <div className="recent-activity-card">
      <h2 className="recent-activity-title">Recent activity</h2>
      <div className="activity-list">
        {activities.length === 0 ? (
          <p className="activity-empty">No recent activity recorded.</p>
        ) : (
          activities.map((item, idx) => (
            <div key={item.id || idx} className="activity-item">
              <span className="activity-text">{item.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { formatTime, formatDate } from '../../stringFormatters';

const LiveDateTime: React.FC = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-end text-sm">
      <div className="font-mono font-bold text-lg tracking-wider">
        {formatTime(dateTime)}
      </div>
      <div className="text-xs opacity-75 capitalize">
        {formatDate(dateTime)}
      </div>
    </div>
  );
};

export default LiveDateTime;
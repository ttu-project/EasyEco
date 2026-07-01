import React, { createContext, useContext, useState } from 'react';

const UsageContext = createContext();

export function UsageProvider({ children }) {
   console.log("UsageProvider အလုပ်လုပ်နေပါပြီ!"); // ဒီ log ကို Terminal မှာ မြင်ရရမယ်
  const [usageData, setUsageData] = useState({});

  // Add usage for a category
   const addUsage = (category, item) => {
    setUsageData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), item]
    }));
  };

  // Remove usage from a category
   const removeUsage = (category, itemId) => {
    setUsageData(prev => ({
      ...prev,
      [category]: prev[category]?.filter(i => i.id !== itemId) || []
    }));
  };

  // Get usage for a category
   const getUsage = (category) => {
    return usageData[category] || [];
  };

  return (
    <UsageContext.Provider value={{ usageData, addUsage, removeUsage, getUsage }}>
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);

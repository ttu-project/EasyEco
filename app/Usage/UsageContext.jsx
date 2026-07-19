import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { getToken, getUser } from '../utils/authStorage';

const UsageContext = createContext();

export function UsageProvider({ children }) {
  const [usageData, setUsageData] = useState({});

  const groupUsageByCategory = (items) => {
    return items.reduce((grouped, item) => {
      const category = item.category;
      const usageItem = {
        id: item._id || item.id,
        name: item.name,
        watt: item.watt,
        time: item.time,
      };

      return {
        ...grouped,
        [category]: [...(grouped[category] || []), usageItem],
      };
    }, {});
  };

  const getAuthConfig = async () => {
    const [token, user] = await Promise.all([getToken(), getUser()]);

    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?._id ? { 'X-User-Id': String(user._id) } : {}),
      },
    };
  };

  const fetchUsage = async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(`${API_BASE_URL}/usage`, config);
      setUsageData(groupUsageByCategory(response.data));
    } catch (error) {
      if (error.response?.status === 401) {
        setUsageData({});
      }
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const addUsage = async (category, item) => {
    setUsageData((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), item],
    }));

    try {
      const config = await getAuthConfig();
      const response = await axios.post(`${API_BASE_URL}/usage`, {
        category,
        name: item.name,
        watt: item.watt,
        time: item.time,
      }, config);

      const savedItem = {
        id: response.data._id,
        name: response.data.name,
        watt: response.data.watt,
        time: response.data.time,
      };

      setUsageData((prev) => ({
        ...prev,
        [category]: (prev[category] || []).map((usageItem) =>
          usageItem.id === item.id ? savedItem : usageItem
        ),
      }));
    } catch (error) {
    }
  };

  const removeUsage = async (category, itemId) => {
  const previousUsageData = usageData;

  setUsageData((prev) => ({
    ...prev,
    [category]: prev[category]?.filter((item) => item.id !== itemId) || [],
  }));

  try {
    const config = await getAuthConfig();
    await axios.delete(`${API_BASE_URL}/usage/${itemId}`, config);
  } catch (error) {
    setUsageData(previousUsageData);
  }
};

  const getUsage = (category) => {
    return usageData[category] || [];
  };

  // Clear only the in-memory data when a user logs out. Their saved usage
  // remains associated with their account and is fetched again after login.
  const clearAllUsage = () => {
    setUsageData({});
  };

  return (
    <UsageContext.Provider
      value={{ usageData, addUsage, removeUsage, getUsage, fetchUsage, clearAllUsage }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);

export default function UsageContextRoute() {
  return null;
}

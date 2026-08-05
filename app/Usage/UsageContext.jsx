import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { getToken, getUser } from '../utils/authStorage';

const UsageContext = createContext();

export function UsageProvider({ children }) {
  // ===== ORIGINAL API STATE =====
  const [usageData, setUsageData] = useState({});

  // ===== NEW LOCAL STATE =====
  const [monthlyBudget, setMonthlyBudget] = useState(100);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // ===== LOAD LOCAL DATA ON MOUNT =====
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const [b, f, r] = await Promise.all([
          AsyncStorage.getItem('monthlyBudget'),
          AsyncStorage.getItem('firstEntryDate'),
          AsyncStorage.getItem('dailyRecords'),
        ]);
        if (b) setMonthlyBudget(JSON.parse(b));
        if (f) setFirstEntryDate(f);
        if (r) setDailyRecords(JSON.parse(r));
      } catch (e) {
        console.error('Local load error', e);
      } finally {
        setIsReady(true);
      }
    };
    loadLocal();
  }, []);

  // ===== PERSIST LOCAL DATA =====
  useEffect(() => { AsyncStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  useEffect(() => { if (firstEntryDate) AsyncStorage.setItem('firstEntryDate', firstEntryDate); }, [firstEntryDate]);
  useEffect(() => { AsyncStorage.setItem('dailyRecords', JSON.stringify(dailyRecords)); }, [dailyRecords]);

  // ===== ORIGINAL FUNCTIONS (PRESERVED) =====
  const groupUsageByCategory = (items) => {
    return items.reduce((grouped, item) => {
      const category = item.category;
      const usageItem = {
        id: item._id || item.id,
        name: item.name,
        watt: item.watt,
        time: item.time,
      };
      return { ...grouped, [category]: [...(grouped[category] || []), usageItem] };
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

  const fetchUsage = useCallback(async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(`${API_BASE_URL}/usage`, config);
      setUsageData(groupUsageByCategory(response.data));
    } catch (error) {
      if (error.response?.status === 401) setUsageData({});
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const addUsage = useCallback(async (category, item) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId };

    setUsageData((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), optimisticItem],
    }));

    try {
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/usage`,
        { category, name: item.name, watt: item.watt, time: item.time },
        config
      );

      const savedItem = {
        id: response.data._id,
        name: response.data.name,
        watt: response.data.watt,
        time: response.data.time,
      };

      setUsageData((prev) => ({
        ...prev,
        [category]: (prev[category] || []).map((u) => (u.id === tempId ? savedItem : u)),
      }));
    } catch (error) {
      setUsageData((prev) => ({
        ...prev,
        [category]: (prev[category] || []).filter((u) => u.id !== tempId),
      }));
    }
  }, []);

  const removeUsage = useCallback(async (category, itemId) => {
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
  }, [usageData]);

  const getUsage = useCallback((category) => usageData[category] || [], [usageData]);

  const clearAllUsage = useCallback(() => setUsageData({}), []);

  // ===== DERIVED: Flat devices array for My Devices =====
  const devices = useMemo(() => {
    const all = [];
    Object.entries(usageData).forEach(([category, items]) => {
      if (items?.length > 0) {
        items.forEach((item) => all.push({ ...item, categoryId: category }));
      }
    });
    return all;
  }, [usageData]);

  // ===== NEW HELPERS =====
  const getAllDevices = useCallback(() => devices, [devices]);
  const getDeviceById = useCallback((id) => devices.find((d) => d.id === id), [devices]);

  const addDevice = useCallback(async (device) => {
    const { categoryId, name, watt, time } = device;
    await addUsage(categoryId, { name, watt, time });
    setFirstEntryDate((prev) => prev || new Date().toISOString().split('T')[0]);
  }, [addUsage]);

  const updateDevice = useCallback(async (id, updates) => {
    let category = null;
    Object.entries(usageData).forEach(([cat, items]) => {
      if (items.some((i) => i.id === id)) category = cat;
    });
    if (!category) return;

    setUsageData((prev) => ({
      ...prev,
      [category]: prev[category].map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));

    try {
      const config = await getAuthConfig();
      const current = usageData[category].find((i) => i.id === id);
      await axios.put(
        `${API_BASE_URL}/usage/${id}`,
        {
          category,
          name: updates.name || current?.name,
          watt: updates.watt || current?.watt,
          time: updates.time || current?.time,
        },
        config
      );
    } catch (err) {
      console.log('Update failed', err);
    }
  }, [usageData]);

  const deleteDevice = useCallback(async (id) => {
    for (const [category, items] of Object.entries(usageData)) {
      if (items.find((i) => i.id === id)) {
        await removeUsage(category, id);
        return;
      }
    }
  }, [usageData, removeUsage]);

  const saveDailyRecord = useCallback((units, cost) => {
    const today = new Date().toISOString().split('T')[0];
    setDailyRecords((prev) => {
      const filtered = prev.filter((r) => r.date !== today);
      return [...filtered, { date: today, units, cost, timestamp: Date.now() }]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  /* ───────────────────────────────
     FORECAST & DAILY USAGE HELPERS
     ─────────────────────────────── */

  const getDailyUsage = useCallback((dateString) => {
    const exact = dailyRecords.find((r) => r.date === dateString);
    if (exact) return exact.units;

    const target = new Date(dateString + 'T00:00:00');
    const previous = dailyRecords
      .filter((r) => new Date(r.date + 'T00:00:00') < target)
      .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'));

    if (previous.length > 0) return previous[0].units;
    return 0;
  }, [dailyRecords]);

  const getForecast = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentDay = today.getDate();

    // Sum recorded (or fallback) units from day 1 up to today
    let currentMonthUnits = 0;
    for (let d = 1; d <= currentDay; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentMonthUnits += getDailyUsage(ds);
    }

    const avgDaily = currentDay > 0 ? currentMonthUnits / currentDay : 0;
    const remainingDays = daysInMonth - currentDay;
    const estimatedRemaining = avgDaily * remainingDays;
    const estimatedUnits = Math.round(currentMonthUnits + estimatedRemaining);

    // Myanmar-style tiered rates — adjust to match your real tariff
    const calculateCost = (units) => {
      let cost = 0;
      let remaining = units;
      const tiers = [
        { limit: 30, rate: 35 },
        { limit: 50, rate: 50 },
        { limit: 75, rate: 70 },
        { limit: 100, rate: 90 },
        { limit: 150, rate: 110 },
        { limit: 200, rate: 120 },
        { limit: Infinity, rate: 125 },
      ];
      for (const t of tiers) {
        if (remaining <= 0) break;
        const u = Math.min(remaining, t.limit);
        cost += u * t.rate;
        remaining -= u;
      }
      return Math.round(cost);
    };

    const currentDailyCost = calculateCost(Math.round(currentMonthUnits));
    const estimatedCost = calculateCost(estimatedUnits);

    const isOverBudget = estimatedCost > monthlyBudget;
    const overBudgetAmount = isOverBudget ? estimatedCost - monthlyBudget : 0;
    const avgRate = estimatedUnits > 0 ? estimatedCost / estimatedUnits : 0;

    return {
      currentDailyUnits: Math.round(currentMonthUnits),
      currentDailyCost,
      estimatedUnits,
      estimatedCost,
      isOverBudget,
      overBudgetAmount,
      avgRate,
      daysInMonth,
      currentDay,
    };
  }, [dailyRecords, monthlyBudget, getDailyUsage]);

  return (
    <UsageContext.Provider
      value={{
        // Original
        usageData, addUsage, removeUsage, getUsage, fetchUsage, clearAllUsage,
        // New
        devices, monthlyBudget, dailyRecords, firstEntryDate, isReady,
        getAllDevices, getDeviceById, addDevice, updateDevice, deleteDevice,
        setMonthlyBudget, saveDailyRecord,
        // Forecast
        getForecast, getDailyUsage,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);
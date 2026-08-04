import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UsageContext = createContext({});

export const UsageProvider = ({ children }) => {
  const [devices, setDevices] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(100);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [d, b, f, r] = await Promise.all([
          AsyncStorage.getItem('myDevices'),
          AsyncStorage.getItem('monthlyBudget'),
          AsyncStorage.getItem('firstEntryDate'),
          AsyncStorage.getItem('dailyRecords'),
        ]);
        if (d) setDevices(JSON.parse(d));
        if (b) setMonthlyBudget(JSON.parse(b));
        if (f) setFirstEntryDate(f);
        if (r) setDailyRecords(JSON.parse(r));
      } catch (e) {
        console.error('Load error', e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // Persist whenever state changes
  useEffect(() => { AsyncStorage.setItem('myDevices', JSON.stringify(devices)); }, [devices]);
  useEffect(() => { AsyncStorage.setItem('monthlyBudget', JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  useEffect(() => { if (firstEntryDate) AsyncStorage.setItem('firstEntryDate', firstEntryDate); }, [firstEntryDate]);
  useEffect(() => { AsyncStorage.setItem('dailyRecords', JSON.stringify(dailyRecords)); }, [dailyRecords]);

  /**
   * BACKWARD COMPATIBLE: Returns array of specs for a category.
   * Used by old billing logic and Calculate.js cards.
   */
  const getUsage = useCallback((categoryId) => {
    return devices
      .filter((d) => d.categoryId === categoryId)
      .map((d) => ({ id: d.id, name: d.name, watt: d.watt, time: d.time }));
  }, [devices]);

  const getAllDevices = useCallback(() => devices, [devices]);
  const getDeviceById = useCallback((id) => devices.find((d) => d.id === id), [devices]);

  const addDevice = useCallback((device) => {
    const newDevice = {
      ...device,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setDevices((prev) => [...prev, newDevice]);
    setFirstEntryDate((prev) => prev || new Date().toISOString().split('T')[0]);
    return newDevice;
  }, []);

  const updateDevice = useCallback((id, updates) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const deleteDevice = useCallback((id) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const saveDailyRecord = useCallback((units, cost) => {
    const today = new Date().toISOString().split('T')[0];
    setDailyRecords((prev) => {
      const filtered = prev.filter((r) => r.date !== today);
      return [...filtered, { date: today, units, cost, timestamp: Date.now() }]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  }, []);

  // Legacy alias so old code using `usageData` still works
  const usageData = devices;

  return (
    <UsageContext.Provider
      value={{
        devices,
        monthlyBudget,
        firstEntryDate,
        dailyRecords,
        isLoaded,
        getUsage,        // <-- THIS IS THE FUNCTION
        getAllDevices,
        getDeviceById,
        addDevice,
        updateDevice,
        deleteDevice,
        setMonthlyBudget,
        saveDailyRecord,
        usageData,       // backward compatible alias
      }}
    >
      {children}
    </UsageContext.Provider>
  );
};

export const useUsage = () => {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error('useUsage must be inside UsageProvider');
  return ctx;
};
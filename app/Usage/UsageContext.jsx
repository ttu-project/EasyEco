import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { getToken, getUser } from '../utils/authStorage';
import {
  generateFrontendTimeline,
  calculateFrontendEstimate,
  buildAppliancesSnapshot,
  todayLocalString,
} from '../utils/timelineUtils';
import { calculateMeterBill, BILLING_CATEGORIES, parseWatt, parseTimeToHours, formatCost, generateRecommendation } from '../utils/billing';

const UsageContext = createContext();

export function UsageProvider({ children }) {
  // ===== ORIGINAL API STATE =====
  const [usageData, setUsageData] = useState({});

  // ===== LOCAL PERSISTED STATE =====
  const [monthlyBudget, setMonthlyBudget] = useState(100);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [firstEntryDate, setFirstEntryDate] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // ===== USAGE RECORD & BILL CALCULATION STATE =====
  const [usageRecords, setUsageRecords] = useState([]);
  const [monthlyEstimate, setMonthlyEstimate] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);

  // Calculated Dashboard metrics
  const [currentUnits, setCurrentUnits] = useState(0);
  const [currentCost, setCurrentCost] = useState(0);
  const [estimatedUnits, setEstimatedUnits] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [recommendationText, setRecommendationText] = useState('');
  const [budgetStatus, setBudgetStatus] = useState({
    isOverBudget: false,
    overBudgetAmount: 0,
    alertMessage: '',
    alertType: 'success',
  });

  // Loading / error state
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [recordSaveError, setRecordSaveError] = useState(null);

  // ===== LOAD LOCAL DATA ON MOUNT =====
  useEffect(() => {
    const loadLocal = async () => {
      try {
        const [b, f] = await Promise.all([
          AsyncStorage.getItem('monthlyBudget'),
          AsyncStorage.getItem('firstEntryDate'),
        ]);
        if (b) setMonthlyBudget(JSON.parse(b));
        if (f) setFirstEntryDate(f);
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

  // ===== AUTH HEADER HELPER =====
  const getAuthConfig = useCallback(async () => {
    const [token, user] = await Promise.all([getToken(), getUser()]);
    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(user?._id ? { 'X-User-Id': String(user._id) } : {}),
      },
    };
  }, []);

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

  // ===== FETCH ACTIVE USAGE =====
  const fetchUsage = useCallback(async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(`${API_BASE_URL}/usage`, config);
      setUsageData(groupUsageByCategory(response.data));
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) setUsageData({});
      return [];
    }
  }, [getAuthConfig]);

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
  }, [getAuthConfig]);

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
  }, [usageData, getAuthConfig]);

  const getUsage = useCallback((category) => usageData[category] || [], [usageData]);
  const clearAllUsage = useCallback(() => {
    setUsageData({});
    setCurrentUnits(0);
    setCurrentCost(0);
    setEstimatedUnits(0);
    setEstimatedCost(0);
    setMonthlyEstimate(null);
  }, []);

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
      const current = usageData[category]?.find((i) => i.id === id);
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
  }, [usageData, getAuthConfig]);

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
     LOCAL FORECAST HELPER (FALLBACK)
     ─────────────────────────────── */
  const getForecast = useCallback(() => {
    let applianceDailyUnits = 0;
    BILLING_CATEGORIES.forEach((cat) => {
      const specs = getUsage(cat) || [];
      specs.forEach((spec) => {
        applianceDailyUnits += (parseWatt(spec.watt) * parseTimeToHours(spec.time)) / 1000;
      });
    });

    if (!applianceDailyUnits || applianceDailyUnits <= 0) {
      return {
        currentDailyUnits: 0,
        currentDailyCost: 0,
        currentUnits: 0,
        currentCost: 0,
        estimatedUnits: 0,
        estimatedCost: 0,
        isOverBudget: false,
        overBudgetAmount: 0,
        daysInMonth: 0,
        currentDay: 0,
      };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const currentDay = now.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const remainingDays = daysInMonth - currentDay;
    const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthRecords = (dailyRecords || [])
      .filter((r) => r.date && r.date.startsWith(currentMonthStr))
      .sort((a, b) => a.date.localeCompare(b.date));

    let baselineDailyUnits = applianceDailyUnits;
    if (monthRecords.length > 0) {
      baselineDailyUnits = monthRecords[0].units;
    }

    let carryingUnits = baselineDailyUnits;
    let recordIdx = 0;
    let totalMonthUnits = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;

      while (
        recordIdx < monthRecords.length &&
        monthRecords[recordIdx].date <= dateStr
      ) {
        carryingUnits = monthRecords[recordIdx].units;
        recordIdx++;
      }

      let dayUnits = carryingUnits;
      if (d === currentDay && applianceDailyUnits > 0) {
        carryingUnits = applianceDailyUnits;
        dayUnits = applianceDailyUnits;
      }

      totalMonthUnits += dayUnits;
    }

    totalMonthUnits = Math.round(totalMonthUnits * 10) / 10;
    const estimatedCost = calculateMeterBill(totalMonthUnits);

    const todayUnits = parseFloat(applianceDailyUnits.toFixed(1));
    const todayCost = calculateMeterBill(todayUnits);

    const isOverBudget = estimatedCost > monthlyBudget;
    const overBudgetAmount = isOverBudget ? estimatedCost - monthlyBudget : 0;

    return {
      currentDailyUnits: todayUnits,
      currentDailyCost: todayCost,
      currentUnits: todayUnits,
      currentCost: todayCost,
      estimatedUnits: totalMonthUnits,
      estimatedCost,
      isOverBudget,
      overBudgetAmount,
      daysInMonth,
      currentDay,
    };
  }, [dailyRecords, monthlyBudget, getUsage]);

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

  // ── Current month helper ──────────────────────────────────────────────────
  const getCurrentMonthStr = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // ── Fetch the latest saved record from server ─────────────────────────────
  const fetchLatestRecord = useCallback(async () => {
    try {
      const config = await getAuthConfig();
      const res = await axios.get(`${API_BASE_URL}/records/latest`, config);
      if (res.data.hasData) {
        setLatestRecord(res.data.record);
      } else {
        setLatestRecord(null);
      }
    } catch (err) {
      console.warn('[UsageContext] fetchLatestRecord failed', err?.message);
    }
  }, [getAuthConfig]);

  // ── Fetch monthly estimate from server ────────────────────────────────────
  const fetchMonthlyEstimate = useCallback(async (monthStr) => {
    const month = monthStr || getCurrentMonthStr();
    setEstimateLoading(true);
    try {
      const config = await getAuthConfig();
      const res = await axios.get(
        `${API_BASE_URL}/records/estimate?month=${month}`,
        config
      );
      setMonthlyEstimate(res.data);
      return res.data;
    } catch (err) {
      console.warn('[UsageContext] fetchMonthlyEstimate failed', err?.message);
      return null;
    } finally {
      setEstimateLoading(false);
    }
  }, [getCurrentMonthStr, getAuthConfig]);

  // ── Fetch daily timeline from server ──────────────────────────────────────
  const fetchTimeline = useCallback(async (monthStr) => {
    const month = monthStr || getCurrentMonthStr();
    try {
      const config = await getAuthConfig();
      const res = await axios.get(
        `${API_BASE_URL}/records/timeline?month=${month}`,
        config
      );
      const rawTimeline = res.data.timeline || [];
      setTimeline(rawTimeline);
      const submitted = rawTimeline
        .filter((entry) => entry.source === 'submitted')
        .map((entry) => ({
          date: entry.date,
          units: entry.dailyKwh,
        }));
      setDailyRecords(submitted);
      return res.data;
    } catch (err) {
      console.warn('[UsageContext] fetchTimeline failed', err?.message);
      return null;
    }
  }, [getCurrentMonthStr, getAuthConfig]);

  // ── CALCULATE BILL (BACKEND INTEGRATION) ──────────────────────────────────
  /**
   * Calls POST /api/bill/calculate on Node.js + MongoDB backend.
   * Immediately updates Dashboard state with real calculated numbers.
   */
  const calculateBill = useCallback(async () => {
    setIsCalculating(true);
    try {
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/bill/calculate`,
        {},
        config
      );

      const data = response.data;
      setCurrentUnits(data.currentUnits || 0);
      setCurrentCost(data.currentCost || 0);
      setEstimatedUnits(data.estimatedUnits || 0);
      setEstimatedCost(data.estimatedCost || 0);
      setMonthlyEstimate(data);

      if (data.recommendation) {
        setRecommendationText(data.recommendation);
      } else {
        setRecommendationText(generateRecommendation(devices));
      }

      const isOver = (data.estimatedCost || 0) > monthlyBudget;
      const overAmount = isOver ? data.estimatedCost - monthlyBudget : 0;
      setBudgetStatus({
        isOverBudget: isOver,
        overBudgetAmount: overAmount,
        alertMessage: isOver
          ? `You are ${formatCost(overAmount)} MMK over your budget.`
          : 'You are within the budget.',
        alertType: isOver ? 'warning' : 'success',
      });

      return data;
    } catch (error) {
      console.warn('[UsageContext] Backend calculateBill fallback to local calculation:', error.message);
      const forecast = getForecast();
      setCurrentUnits(forecast.currentUnits);
      setCurrentCost(forecast.currentCost);
      setEstimatedUnits(forecast.estimatedUnits);
      setEstimatedCost(forecast.estimatedCost);
      setRecommendationText(generateRecommendation(devices));
      setBudgetStatus({
        isOverBudget: forecast.isOverBudget,
        overBudgetAmount: forecast.overBudgetAmount,
        alertMessage: forecast.isOverBudget
          ? `You are ${formatCost(forecast.overBudgetAmount)} MMK over your budget.`
          : 'You are within the budget.',
        alertType: forecast.isOverBudget ? 'warning' : 'success',
      });
      return forecast;
    } finally {
      setIsCalculating(false);
    }
  }, [getAuthConfig, monthlyBudget, devices, getForecast]);

  // ── SAVE USAGE RECORD (IMMUTABLE SNAPSHOT TO MONGODB) ─────────────────────
  const saveUsageRecord = useCallback(async (effectiveDate, notes = '') => {
    setRecordSaveError(null);
    setRecordsLoading(true);

    const dateToUse = effectiveDate || todayLocalString();

    const forecast = getForecast();
    saveDailyRecord(forecast.currentDailyUnits, forecast.currentDailyCost);

    const appliances = buildAppliancesSnapshot(usageData);

    try {
      const config = await getAuthConfig();
      const res = await axios.post(
        `${API_BASE_URL}/records`,
        { effectiveDate: dateToUse, appliances, notes },
        config
      );

      const savedRecord = res.data.record;

      setUsageRecords((prev) => [...prev, savedRecord]);
      setLatestRecord(savedRecord);
      setFirstEntryDate((prev) => prev || dateToUse);

      // Immediately trigger calculation to refresh Dashboard
      await calculateBill();
      await Promise.all([fetchMonthlyEstimate(), fetchTimeline(), fetchLatestRecord()]).catch(() => {});

      return savedRecord;
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn('[UsageContext] Server returned 404 for /api/records. Saved locally.');
        setRecordSaveError(null);
        await calculateBill();
        return { effectiveDate: dateToUse, isLocal: true };
      }

      const message = err.response?.data?.message || err.message || 'Failed to save record';
      setRecordSaveError(message);
      throw new Error(message);
    } finally {
      setRecordsLoading(false);
    }
  }, [usageData, getForecast, saveDailyRecord, getAuthConfig, calculateBill, fetchMonthlyEstimate, fetchTimeline, fetchLatestRecord]);

  // ── Refresh all data on startup / resume ──────────────────────────────────
  const refreshRecordData = useCallback(async () => {
    await fetchUsage();
    await calculateBill();
    await Promise.all([
      fetchMonthlyEstimate(),
      fetchTimeline(),
      fetchLatestRecord(),
    ]).catch(() => {});
  }, [fetchUsage, calculateBill, fetchMonthlyEstimate, fetchTimeline, fetchLatestRecord]);

  useEffect(() => {
    if (isReady) {
      refreshRecordData().catch(() => {});
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UsageContext.Provider
      value={{
        // Active appliances data
        usageData, addUsage, removeUsage, getUsage, fetchUsage, clearAllUsage,
        devices, monthlyBudget, dailyRecords, firstEntryDate, isReady,
        getAllDevices, getDeviceById, addDevice, updateDevice, deleteDevice,
        setMonthlyBudget, saveDailyRecord,
        // Calculation & Dashboard metrics
        currentUnits,
        currentCost,
        estimatedUnits,
        estimatedCost,
        recommendationText,
        budgetStatus,
        isCalculating,
        calculateBill,
        getForecast,
        getDailyUsage,
        // Usage Record System
        usageRecords,
        monthlyEstimate,
        timeline,
        latestRecord,
        recordsLoading,
        estimateLoading,
        recordSaveError,
        saveUsageRecord,
        fetchMonthlyEstimate,
        fetchTimeline,
        fetchLatestRecord,
        refreshRecordData,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export const useUsage = () => useContext(UsageContext);
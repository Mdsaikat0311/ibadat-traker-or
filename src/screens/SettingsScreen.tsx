import React, { useState } from 'react';
import {
  BookHeart,
  BellRing,
  Clock3,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { getRandomQuote } from '../data/hadithBank';
import { AppStats, GeneralReminderSetting } from '../types/ibadat';
import { StatsGrid } from '../components/StatsGrid';

interface SettingsScreenProps {
  userName: string;
  appStats: AppStats;
  autoHadithEnabled: boolean;
  generalReminder: GeneralReminderSetting;
  lifetimeStartDate: string;
  isViewingToday: boolean;
  onSetUserName: (name: string) => void;
  onToggleAutoHadith: () => void;
  onToggleGeneralReminder: () => void;
  onSetGeneralInterval: (interval: number) => void;
  onSetLifetimeStartDate: (date: string) => void;
  onRequestReset: () => void;
  onOpenLeaderboard: (metricType: string, title: string) => void;
  getMyRank: (metricType: string) => number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userName,
  appStats,
  autoHadithEnabled,
  generalReminder,
  lifetimeStartDate,
  isViewingToday,
  onSetUserName,
  onToggleAutoHadith,
  onToggleGeneralReminder,
  onSetGeneralInterval,
  onSetLifetimeStartDate,
  onRequestReset,
  onOpenLeaderboard,
  getMyRank
}) => {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [dateInput, setDateInput] = useState(lifetimeStartDate);
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote());

  const intervals = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-xl font-bold text-gray-800 mb-4">আমার প্রোফাইল</h2>

      {/* Profile Card */}
      <div className="bg-gray-100 p-6 rounded-xl shadow-xs border border-gray-300 text-center mb-5">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-teal-700">
            {userName ? userName[0] : 'U'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h3 className="text-lg font-bold text-gray-800">{userName || 'ব্যবহারকারী'}</h3>
          <button
            type="button"
            onClick={() => {
              setNameInput(userName);
              setShowNameDialog(true);
            }}
            className="p-1 text-teal-600 hover:text-teal-800 cursor-pointer"
            title="নাম পরিবর্তন করুন"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">ব্যবহারকারী অ্যাকাউন্ট</p>

        {/* 7 Stats Grid */}
        <StatsGrid
          stats={appStats}
          isToday={isViewingToday}
          onOpenLeaderboard={onOpenLeaderboard}
          getRank={getMyRank}
        />

        <button
          type="button"
          onClick={onRequestReset}
          className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium cursor-pointer"
        >
          লগ আউট / ডেটা রিসেট
        </button>
      </div>

      {/* Automatic Hadith */}
      <div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100 flex justify-between items-center mt-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <BookHeart className="w-5 h-5 mr-2 text-indigo-600" />
            <span>অটোমেটিক হাদিস</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            প্রতি ৩০ মিনিট পর পর (অনলাইন/অফলাইন)
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={autoHadithEnabled}
            onChange={onToggleAutoHadith}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
        </label>
      </div>

      {/* Tauba & Zikir Reminder */}
      <div className="p-4 bg-white rounded-xl shadow-xs border border-gray-100 mt-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <BellRing className="w-5 h-5 mr-2 text-orange-600" />
              <span>তাওবা ও জিকির রিমাইন্ডার</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              নির্দিষ্ট সময় পর পর এলার্ম বাজবে
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={generalReminder && generalReminder.enabled}
              onChange={onToggleGeneralReminder}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600" />
          </label>
        </div>

        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">সময় ব্যবধান:</span>
          <select
            id="general-interval-select"
            value={generalReminder.interval}
            onChange={(e) => onSetGeneralInterval(Number(e.target.value))}
            className="flex-grow p-2 border border-gray-300 rounded-md text-sm focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            {intervals.map((m) => (
              <option key={m} value={m}>
                {m} মিনিট
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Point count start date */}
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 mb-5 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
          <Clock3 className="w-5 h-5 inline mr-2 text-teal-600" />
          <span>পয়েন্ট কাউন্ট শুরু</span>
        </h2>
        <div className="flex space-x-2">
          <input
            type="date"
            id="lifetime-start-date-input"
            value={dateInput}
            max={maxDate}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <button
            type="button"
            onClick={() => onSetLifetimeStartDate(dateInput)}
            className="bg-teal-600 text-white px-4 rounded-lg cursor-pointer hover:bg-teal-700 transition"
          >
            সেট
          </button>
        </div>
      </div>

      {/* Daily Quran & Hadith Quote card */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-teal-900">
              কুরআনের বাণী ও হাদিস
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setCurrentQuote(getRandomQuote())}
            className="p-1 text-teal-600 hover:text-teal-800 transition cursor-pointer"
            title="নতুন বাণী দেখুন"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-teal-900 leading-relaxed font-medium">
          {currentQuote}
        </p>
      </div>

      {/* Reset all data button */}
      <button
        type="button"
        onClick={onRequestReset}
        className="w-full py-2.5 px-4 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
      >
        <Trash2 className="w-4 h-4" />
        <span>সমস্ত ডেটা রিসেট করুন</span>
      </button>

      {/* Name Edit Modal */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-3">
              নাম পরিবর্তন করুন
            </h3>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="আপনার নাম"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50/50"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowNameDialog(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetUserName(nameInput);
                  setShowNameDialog(false);
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 cursor-pointer"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

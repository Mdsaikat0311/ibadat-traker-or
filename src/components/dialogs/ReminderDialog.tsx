import React, { useState } from 'react';
import { Clock, BellRing, Volume2, ShieldCheck, Info } from 'lucide-react';
import { ReminderSetting } from '../../types/ibadat';
import { NotificationService } from '../../services/notificationService';

interface ReminderDialogProps {
  activityKey: string;
  activityName: string;
  initialSetting?: ReminderSetting;
  onSave: (key: string, name: string, start: string, count: number, interval: number) => void;
  onDelete: (key: string, name: string) => void;
  onDismiss: () => void;
}

export const ReminderDialog: React.FC<ReminderDialogProps> = ({
  activityKey,
  activityName,
  initialSetting,
  onSave,
  onDelete,
  onDismiss
}) => {
  const [startTime, setStartTime] = useState(initialSetting?.start || '06:00');
  const [count, setCount] = useState(initialSetting?.count?.toString() || '3');
  const [interval, setInterval] = useState(initialSetting?.interval?.toString() || '10');
  const [testSent, setTestSent] = useState(false);
  const [permGranted, setPermGranted] = useState(NotificationService.getPermissionState() === 'granted');
  const [showCordovaHelp, setShowCordovaHelp] = useState(false);

  const handleRequestPerm = async () => {
    const granted = await NotificationService.requestPermission();
    setPermGranted(granted);
    if (granted) {
      NotificationService.sendNotification(
        "নোটিফিকেশন চালু হয়েছে",
        "আলহামদুলিল্লাহ! আপনার ডিভাইসে নোটিফিকেশন সফলভাবে সক্রিয় হয়েছে।"
      );
    }
  };

  const handleTestNotification = async () => {
    await NotificationService.requestPermission();
    NotificationService.sendNotification(
      `টেস্ট রিমাইন্ডার: ${activityName}`,
      `এটি একটি পরীক্ষা বার্তা। ${activityName}-এর সময় হলে এভাবে এলার্ম ও নোটিফিকেশন আসবে।`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await NotificationService.requestPermission();
    const cnt = parseInt(count, 10) || 3;
    const itv = parseInt(interval, 10) || 10;
    onSave(
      activityKey,
      activityName,
      startTime || '06:00',
      Math.min(10, Math.max(1, cnt)),
      Math.max(1, itv)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 id="reminder-title" className="text-xl font-bold text-gray-800 flex items-center">
            <BellRing className="w-5 h-5 text-teal-600 mr-2" />
            রিমাইন্ডার সেট করুন
          </h3>
          <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-200">
            {activityName}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-4 flex items-center">
          <Clock className="w-3.5 h-3.5 inline mr-1 text-teal-600" />
          <span>নির্ধারিত সময়ে শব্দ ও নোটিফিকেশনের মাধ্যমে সতর্ক করা হবে</span>
        </p>

        {/* Permission status & Quick Test */}
        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700 flex items-center">
              <ShieldCheck className={`w-3.5 h-3.5 mr-1 ${permGranted ? 'text-emerald-600' : 'text-amber-500'}`} />
              অনুমতি: {permGranted ? 'সক্রিয় (Allowed)' : 'প্রয়োজন (Needed)'}
            </span>
            {!permGranted && (
              <button
                type="button"
                onClick={handleRequestPerm}
                className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium px-2 py-1 rounded cursor-pointer"
              >
                অনুমতি দিন
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
            <span className="text-xs text-gray-600">শব্দ ও বার্তা পরীক্ষা করুন:</span>
            <button
              type="button"
              onClick={handleTestNotification}
              className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded font-medium flex items-center transition cursor-pointer"
            >
              <Volume2 className="w-3 h-3 mr-1" />
              {testSent ? 'বাজছে...' : 'টেস্ট নোটিফিকেশন'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5">
            <label htmlFor="reminder-start-time" className="block text-xs font-bold text-gray-700 mb-1">
              ১. শুরু করার সময় (Time)
            </label>
            <input
              type="time"
              id="reminder-start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full p-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
          </div>

          <div className="mb-3.5">
            <label htmlFor="reminder-count" className="block text-xs font-bold text-gray-700 mb-1">
              ২. মোট কতবার রিমাইন্ডার দেবে
            </label>
            <input
              type="number"
              id="reminder-count"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              required
              className="w-full p-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">সর্বোচ্চ ১০ বার (পুনরাবৃত্তি)</p>
          </div>

          <div className="mb-4">
            <label htmlFor="reminder-interval" className="block text-xs font-bold text-gray-700 mb-1">
              ৩. কত মিনিট পর পর দেবে (Interval)
            </label>
            <input
              type="number"
              id="reminder-interval"
              min={1}
              max={120}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              required
              className="w-full p-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">মিনিট ব্যবধান (যেমন: ৫, ১০, ১৫ মিনিট)</p>
          </div>

          {/* Cordova Note Toggle */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowCordovaHelp(!showCordovaHelp)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center font-medium cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 mr-1" />
              Cordova-তে নোটিফিকেশন কাজ না করলে এখানে দেখুন
            </button>
            {showCordovaHelp && (
              <div className="mt-2 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-lg text-[11px] text-indigo-950 leading-relaxed">
                <p className="font-bold mb-1">💡 Cordova অ্যাপের জন্য প্রয়োজনীয় তথ্য:</p>
                <p>Android-এ ব্যাকগ্রাউন্ড বা ডিসপ্লে অফ অবস্থায় নোটিফিকেশন পেতে Cordova প্রোজেক্টে লোকাল নোটিফিকেশন প্লাগইন ইনস্টল করা থাকতে হবে:</p>
                <code className="block my-1.5 p-1 bg-white rounded border border-indigo-200 font-mono text-[10px] select-all">
                  cordova plugin add cordova-plugin-local-notification
                </code>
                <p>এই অ্যাপের কোডে <span className="font-semibold">cordova.plugins.notification.local</span> যুক্ত রয়েছে, প্লাগইন থাকলে স্বয়ংক্রিয়ভাবে নোটিফিকেশন শিডিউল হবে।</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-100">
            {initialSetting ? (
              <button
                type="button"
                onClick={() => onDelete(activityKey, activityName)}
                className="py-2 px-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition font-bold text-xs cursor-pointer"
              >
                বাতিল করুন
              </button>
            ) : (
              <div />
            )}

            <div className="flex space-x-2 ml-auto">
              <button
                type="button"
                onClick={onDismiss}
                className="py-2 px-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition text-xs font-medium cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition font-semibold text-xs shadow-sm cursor-pointer"
              >
                রিমাইন্ডার সেট করুন
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

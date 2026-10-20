import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { repository } from './data/repository';
import { DuaNote, TaskStats } from './types/ibadat';
import { TabId, BottomNav } from './components/BottomNav';
import { AppHeader } from './components/AppHeader';
import { DetailsDialog } from './components/dialogs/DetailsDialog';
import { ReminderDialog } from './components/dialogs/ReminderDialog';
import { NoteDetailDialog } from './components/dialogs/NoteDetailDialog';
import { LeaderboardDialog } from './components/dialogs/LeaderboardDialog';
import { CustomAlertDialog } from './components/dialogs/CustomAlertDialog';

import { SalahScreen } from './screens/SalahScreen';
import { AmalScreen } from './screens/AmalScreen';
import { DhikrScreen } from './screens/DhikrScreen';
import { NotesScreen } from './screens/NotesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { NotificationService } from './services/notificationService';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('salah');
  const [currentViewingDate, setCurrentViewingDate] = useState<string>(repository.getTodayKey());

  // State slices
  const [salahLog, setSalahLog] = useState<Record<string, boolean>>({});
  const [nawafilLog, setNawafilLog] = useState<Record<string, boolean>>({});
  const [dhikrLog, setDhikrLog] = useState<Record<string, boolean>>({});
  const [morningLog, setMorningLog] = useState<Record<string, boolean>>({});
  const [nightlyLog, setNightlyLog] = useState<Record<string, boolean>>({});
  const [quranLog, setQuranLog] = useState<Record<string, boolean>>({});
  const [specialAmalLog, setSpecialAmalLog] = useState<Record<string, boolean>>({});

  const [appStats, setAppStats] = useState(repository.getAppStats(currentViewingDate));
  const [yesterdayChampion, setYesterdayChampion] = useState(repository.getYesterdayChampion());
  const [duaNotes, setDuaNotes] = useState<DuaNote[]>(repository.getDuaNotes());
  const [reminders, setReminders] = useState(repository.getReminders());
  const [userName, setUserName] = useState<string>(repository.getUserName());
  const [autoHadithEnabled, setAutoHadithEnabled] = useState<boolean>(repository.isAutoHadithEnabled());
  const [generalReminder, setGeneralReminder] = useState(repository.getGeneralReminder());
  const [lifetimeStartDate, setLifetimeStartDate] = useState<string>(repository.getLifetimeStartDate());

  // Modals
  const [detailsModal, setDetailsModal] = useState<{ title: string; content: string } | null>(null);
  const [reminderModal, setReminderModal] = useState<{ key: string; name: string } | null>(null);
  const [noteModal, setNoteModal] = useState<DuaNote | null>(null);
  const [leaderboardModal, setLeaderboardModal] = useState<{ metric: string; title: string } | null>(null);
  const [alertState, setAlertState] = useState<{ msg: string; isSuccess: boolean } | null>(null);
  const [showResetDialog, setShowResetDialog] = useState<boolean>(false);

  const showAlert = useCallback((message: string, isSuccess: boolean) => {
    setAlertState({ msg: message, isSuccess });
  }, []);

  const refreshAll = useCallback(() => {
    setSalahLog(repository.getLog("salah", currentViewingDate));
    setNawafilLog(repository.getLog("nawafil", currentViewingDate));
    setDhikrLog(repository.getLog("dhikr", currentViewingDate));
    setMorningLog(repository.getLog("morning", currentViewingDate));
    setNightlyLog(repository.getLog("nightly", currentViewingDate));
    setQuranLog(repository.getLog("quran", currentViewingDate));
    setSpecialAmalLog(repository.getLog("specialAmal", currentViewingDate));

    setAppStats(repository.getAppStats(currentViewingDate));
    setYesterdayChampion(repository.getYesterdayChampion());
    setDuaNotes(repository.getDuaNotes());
    setReminders(repository.getReminders());
    setUserName(repository.getUserName());
    setAutoHadithEnabled(repository.isAutoHadithEnabled());
    setGeneralReminder(repository.getGeneralReminder());
    setLifetimeStartDate(repository.getLifetimeStartDate());
  }, [currentViewingDate]);

  useEffect(() => {
    refreshAll();
    NotificationService.syncAllCordovaReminders(repository.getReminders());
  }, [refreshAll]);

  // Periodic reminder checking interval (every 15s) for in-app and browser notifications
  useEffect(() => {
    const timer = setInterval(() => {
      NotificationService.checkTick(
        reminders,
        autoHadithEnabled,
        generalReminder,
        (title, message) => {
          showAlert(`${title}\n${message}`, true);
        }
      );
    }, 15000);

    return () => clearInterval(timer);
  }, [reminders, autoHadithEnabled, generalReminder, showAlert]);

  const isViewingToday = currentViewingDate === repository.getTodayKey();

  const handleSelectDate = (dateKey: string) => {
    const today = repository.getTodayKey();
    if (dateKey > today) {
      showAlert("আগামীকাল বা ভবিষ্যতের ডেটা আপডেট করা সম্ভব নয়।", false);
      return;
    }
    setCurrentViewingDate(dateKey);
  };

  const handleMoveDate = (offset: number) => {
    const d = new Date(currentViewingDate);
    d.setDate(d.getDate() + offset);
    const target = repository.formatIsoDate(d);
    const today = repository.getTodayKey();
    if (target > today) {
      showAlert("আগামীকালের ডেটা দেখা বা আপডেট করা সম্ভব নয়।", false);
      return;
    }
    setCurrentViewingDate(target);
  };

  const handleGoToToday = () => {
    setCurrentViewingDate(repository.getTodayKey());
  };

  const handleToggleSalah = (key: string) => {
    if (currentViewingDate > repository.getTodayKey()) return;
    repository.toggleTask("salah", currentViewingDate, key);
    refreshAll();
  };

  const handleToggleNawafil = (key: string) => {
    if (currentViewingDate > repository.getTodayKey()) return;
    repository.toggleTask("nawafil", currentViewingDate, key);
    refreshAll();
  };

  const handleToggleDhikr = (key: string) => {
    if (currentViewingDate > repository.getTodayKey()) return;
    repository.toggleTask("dhikr", currentViewingDate, key);
    refreshAll();
  };

  const handleToggleRoutineTask = (category: string, taskKey: string) => {
    if (currentViewingDate > repository.getTodayKey()) return;
    repository.toggleTask(category, currentViewingDate, taskKey);
    refreshAll();
  };

  const handleGetTaskStats = (category: string, taskKey: string): TaskStats => {
    return repository.getTaskCompletionStats(category, taskKey);
  };

  const handleSaveReminder = (key: string, name: string, start: string, count: number, interval: number) => {
    const setting = { key, name, start, count, interval };
    repository.saveReminder(setting);
    NotificationService.scheduleCordovaReminders(setting);
    setReminderModal(null);
    refreshAll();
    showAlert(`${name}-এর রিমাইন্ডার সেট হয়েছে (${start} থেকে শুরু)!`, true);
  };

  const handleDeleteReminder = (key: string, name: string) => {
    repository.deleteReminder(key);
    NotificationService.cancelCordovaReminders(key);
    setReminderModal(null);
    refreshAll();
    showAlert(`${name}-এর রিমাইন্ডার বন্ধ করা হয়েছে।`, true);
  };

  const handleAddNote = (title: string, text: string) => {
    if (!text.trim()) return;
    repository.addDuaNote(title, text);
    refreshAll();
  };

  const handleDeleteNote = (id: string) => {
    repository.deleteDuaNote(id);
    setNoteModal(null);
    refreshAll();
  };

  const handleSetUserName = (name: string) => {
    if (name.trim()) {
      repository.setUserName(name.trim());
      refreshAll();
      showAlert("নাম পরিবর্তন করা হয়েছে!", true);
    }
  };

  const handleToggleAutoHadith = async () => {
    const next = !autoHadithEnabled;
    if (next) {
      await NotificationService.requestPermission();
      NotificationService.sendNotification("হাদিস রিমাইন্ডার চালু", "প্রতি ৩০ মিনিট পর পর হাদিস নোটিফিকেশন আসবে।");
    }
    repository.setAutoHadithEnabled(next);
    setAutoHadithEnabled(next);
    if (next) {
      showAlert("চালু হয়েছে! প্রতি ৩০ মিনিট পর পর হাদিস আসবে।", true);
    } else {
      showAlert("অটোমেটিক হাদিস রিমাইন্ডার বন্ধ করা হয়েছে।", false);
    }
  };

  const handleToggleGeneralReminder = async () => {
    const next = { ...generalReminder, enabled: !generalReminder.enabled };
    if (next.enabled) {
      await NotificationService.requestPermission();
      NotificationService.sendNotification("তাওবাহ ও যিকির রিমাইন্ডার চালু", `প্রতি ${next.interval} মিনিট পর পর যিকিরের স্মরণ করিয়ে দেওয়া হবে।`);
    }
    repository.setGeneralReminder(next);
    setGeneralReminder(next);
    if (next.enabled) {
      showAlert(`চালু হয়েছে! প্রতি ${next.interval} মিনিট পর পর রিমাইন্ডার আসবে।`, true);
    } else {
      showAlert("সাধারণ রিমাইন্ডার বন্ধ করা হয়েছে।", false);
    }
  };

  const handleSetGeneralInterval = (interval: number) => {
    const next = { ...generalReminder, interval };
    repository.setGeneralReminder(next);
    setGeneralReminder(next);
    showAlert(`সময় পরিবর্তন হয়েছে: ${interval} মিনিট পর পর।`, true);
  };

  const handleSetLifetimeStartDate = (dateStr: string) => {
    const today = repository.getTodayKey();
    if (dateStr > today) {
      showAlert("ভবিষ্যতের কোনো তারিখ নির্বাচন করা যাবে না।", false);
      return;
    }
    repository.setLifetimeStartDate(dateStr);
    refreshAll();
    showAlert(`লাইফটাইম পয়েন্ট কাউন্ট শুরু ${dateStr} তারিখ থেকে সেট করা হয়েছে।`, true);
  };

  const handleConfirmReset = () => {
    setShowResetDialog(false);
    repository.resetAllData();
    setCurrentViewingDate(repository.getTodayKey());
    refreshAll();
  };

  // Header display calculations matching user switch case
  const headerInfo = useMemo(() => {
    switch (activeTab) {
      case 'salah': {
        const fardKeys = ["fajr", "zuhr", "asr", "maghrib", "isha"];
        const todaySalah = repository.getLog("salah", repository.getTodayKey());
        const fardCompleted = fardKeys.filter((k) => todaySalah[k]).length;
        return {
          title: "সালাত ও তাহাজ্জুদ",
          subtitle: `${fardCompleted}/৫ ফরয সম্পন্ন`
        };
      }
      case 'quran':
        return {
          title: "দৈনিক আমল ও কুরআন",
          subtitle: `আজকের পয়েন্ট: ${appStats.todayPoints}`
        };
      case 'dhikr': {
        const todayDhikr = repository.getLog("dhikr", repository.getTodayKey());
        const dhikrCompleted = Object.values(todayDhikr).filter(Boolean).length;
        return {
          title: "যিকির চেকলিস্ট",
          subtitle: `${dhikrCompleted}/৮ সম্পন্ন`
        };
      }
      case 'duaNotes':
        return {
          title: "গুরুত্বপূর্ণ দু’আ/নোট",
          subtitle: `${duaNotes.length} টি নোট`
        };
      case 'reports':
        return {
          title: "সারাংশ ও ইতিহাস",
          subtitle: `মোট লাইফটাইম পয়েন্ট: ${appStats.totalLifetimePoints}`
        };
      case 'settings':
        return {
          title: "সেটিংস ও তথ্য",
          subtitle: "অ্যাপ্লিকেশন নিয়ন্ত্রণ"
        };
      default:
        return {
          title: "ইবাদত ট্র্যাকার",
          subtitle: `আজকের পয়েন্ট: ${appStats.todayPoints}`
        };
    }
  }, [activeTab, duaNotes.length, appStats.todayPoints, appStats.totalLifetimePoints]);

  const dateDisplayStr = useMemo(() => {
    if (isViewingToday) return "আজকের দিন";
    try {
      return new Intl.DateTimeFormat('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(currentViewingDate));
    } catch {
      return currentViewingDate;
    }
  }, [isViewingToday, currentViewingDate]);

  return (
    <div className="main-container">
      {/* Header */}
      <AppHeader
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        dateDisplay={dateDisplayStr}
        isViewingToday={isViewingToday}
        onGoToToday={handleGoToToday}
      />

      {/* Main Content */}
      <main id="app-main-content" className="flex-grow p-4 space-y-6 overflow-y-auto pb-24">
        {activeTab === 'salah' && (
          <SalahScreen
            appStats={appStats}
            yesterdayChampion={yesterdayChampion}
            salahLog={salahLog}
            nawafilLog={nawafilLog}
            reminders={reminders}
            isViewingToday={isViewingToday}
            onToggleSalah={handleToggleSalah}
            onToggleNawafil={handleToggleNawafil}
            onOpenDetails={(title, content) => setDetailsModal({ title, content })}
            onOpenReminder={(key, name) => setReminderModal({ key, name })}
            onOpenLeaderboard={(metric, title) => setLeaderboardModal({ metric, title })}
            getMyRank={(metric) => {
              const list = repository.getLeaderboard(metric);
              return list.find((u) => u.isCurrentUser)?.rank || 1;
            }}
            getTaskStats={handleGetTaskStats}
          />
        )}

        {activeTab === 'quran' && (
          <AmalScreen
            appStats={appStats}
            specialAmalLog={specialAmalLog}
            morningLog={morningLog}
            nightlyLog={nightlyLog}
            quranLog={quranLog}
            reminders={reminders}
            onToggleRoutineTask={handleToggleRoutineTask}
            onOpenDetails={(title, content) => setDetailsModal({ title, content })}
            onOpenReminder={(key, name) => setReminderModal({ key, name })}
            getTaskStats={handleGetTaskStats}
          />
        )}

        {activeTab === 'dhikr' && (
          <DhikrScreen
            dhikrLog={dhikrLog}
            reminders={reminders}
            onToggleDhikr={handleToggleDhikr}
            onOpenDetails={(title, content) => setDetailsModal({ title, content })}
            onOpenReminder={(key, name) => setReminderModal({ key, name })}
            getTaskStats={handleGetTaskStats}
          />
        )}

        {activeTab === 'duaNotes' && (
          <NotesScreen
            duaNotes={duaNotes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onOpenNoteDetail={(note) => setNoteModal(note)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            currentViewingDate={currentViewingDate}
            onSelectDate={handleSelectDate}
            onMoveDate={handleMoveDate}
            onOpenLeaderboard={(metric, title) => setLeaderboardModal({ metric, title })}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            userName={userName}
            appStats={appStats}
            autoHadithEnabled={autoHadithEnabled}
            generalReminder={generalReminder}
            lifetimeStartDate={lifetimeStartDate}
            isViewingToday={isViewingToday}
            onSetUserName={handleSetUserName}
            onToggleAutoHadith={handleToggleAutoHadith}
            onToggleGeneralReminder={handleToggleGeneralReminder}
            onSetGeneralInterval={handleSetGeneralInterval}
            onSetLifetimeStartDate={handleSetLifetimeStartDate}
            onRequestReset={() => setShowResetDialog(true)}
            onOpenLeaderboard={(metric, title) => setLeaderboardModal({ metric, title })}
            getMyRank={(metric) => {
              const list = repository.getLeaderboard(metric);
              return list.find((u) => u.isCurrentUser)?.rank || 1;
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals & Dialogs */}
      {detailsModal && (
        <DetailsDialog
          title={detailsModal.title}
          content={detailsModal.content}
          onDismiss={() => setDetailsModal(null)}
        />
      )}

      {reminderModal && (
        <ReminderDialog
          activityKey={reminderModal.key}
          activityName={reminderModal.name}
          initialSetting={reminders[reminderModal.key]}
          onSave={handleSaveReminder}
          onDelete={handleDeleteReminder}
          onDismiss={() => setReminderModal(null)}
        />
      )}

      {noteModal && (
        <NoteDetailDialog
          note={noteModal}
          onDelete={handleDeleteNote}
          onDismiss={() => setNoteModal(null)}
        />
      )}

      {leaderboardModal && (
        <LeaderboardDialog
          initialTitle={leaderboardModal.title}
          initialMetric={leaderboardModal.metric}
          onDismiss={() => setLeaderboardModal(null)}
        />
      )}

      {alertState && (
        <CustomAlertDialog
          title={alertState.isSuccess ? "সফল!" : "সতর্কতা!"}
          message={alertState.msg}
          isSuccess={alertState.isSuccess}
          onDismiss={() => setAlertState(null)}
        />
      )}

      {showResetDialog && (
        <CustomAlertDialog
          title="ডেটা মুছে ফেলা হবে!"
          message="আপনি কি নিশ্চিত যে আপনি সমস্ত অ্যাপ্লিকেশন ডেটা মুছে ফেলতে চান? এই কাজটি ফিরিয়ে আনা যাবে না।"
          isSuccess={false}
          isConfirm={true}
          onConfirm={handleConfirmReset}
          onDismiss={() => setShowResetDialog(false)}
        />
      )}
    </div>
  );
};

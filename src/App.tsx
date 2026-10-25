/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { Header } from './components/Header';
import { BottomTabBar, TabKey } from './components/BottomTabBar';
import { DeviceFrame } from './components/DeviceFrame';
import { HomeScreen } from './screens/HomeScreen';
import { UdhaarScreen } from './screens/UdhaarScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { BalancesScreen } from './screens/BalancesScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TestRunnerScreen } from './screens/TestRunnerScreen';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { SettleUpModal } from './components/modals/SettleUpModal';
import { InviteModal } from './components/modals/InviteModal';
import { BudgetModal } from './components/modals/BudgetModal';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { AddUdhaarAccountModal } from './components/modals/AddUdhaarAccountModal';
import { AddUdhaarTransactionModal } from './components/modals/AddUdhaarTransactionModal';
import { UdhaarStatementModal } from './components/modals/UdhaarStatementModal';
import { DownloadAppModal } from './components/modals/DownloadAppModal';
import { FirebasePhoneOtpModal } from './components/modals/FirebasePhoneOtpModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ToastContainer } from './components/Toast';
import { getCurrentMonthIST } from './utils/date';
import { Expense, ExpenseType, UdhaarAccount, UdhaarTransaction, UdhaarTransactionType } from './types';

const MainApp: React.FC = () => {
  const {
    settlements,
    members,
    udhaarSummaries,
    group,
    toasts,
    dismissToast,
    signInWithGoogle,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthIST());
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // Welcome modal
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Expense Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [addExpenseType, setAddExpenseType] = useState<ExpenseType>('shared');

  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settleRecipientId, setSettleRecipientId] = useState<string | undefined>();
  const [settleAmountPaise, setSettleAmountPaise] = useState<number | undefined>();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);
  const [isPhoneOtpOpen, setIsPhoneOtpOpen] = useState(false);
  const [receiptExpense, setReceiptExpense] = useState<Expense | null>(null);

  // Udhaar Modals
  const [isAddUdhaarAccountOpen, setIsAddUdhaarAccountOpen] = useState(false);
  const [isAddUdhaarTransactionOpen, setIsAddUdhaarTransactionOpen] = useState(false);
  const [selectedUdhaarAccountId, setSelectedUdhaarAccountId] = useState<string | undefined>();
  const [defaultUdhaarType, setDefaultUdhaarType] = useState<UdhaarTransactionType>('gave');

  const [statementAccount, setStatementAccount] = useState<UdhaarAccount | null>(null);
  const [statementTransactions, setStatementTransactions] = useState<UdhaarTransaction[]>([]);

  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const overdueUdhaarCount = udhaarSummaries.filter((s) => s.is_overdue).length;

  const handleOpenAddExpense = (type: ExpenseType = 'shared') => {
    setAddExpenseType(type);
    setIsAddExpenseOpen(true);
  };

  const handleOpenSettleUp = (recipientId?: string, amountPaise?: number) => {
    setSettleRecipientId(recipientId);
    setSettleAmountPaise(amountPaise);
    setIsSettleUpOpen(true);
  };

  const handleOpenAddUdhaarTransaction = (accountId?: string, defaultType: UdhaarTransactionType = 'gave') => {
    setSelectedUdhaarAccountId(accountId);
    setDefaultUdhaarType(defaultType);
    setIsAddUdhaarTransactionOpen(true);
  };

  const handleOpenStatement = (account: UdhaarAccount, txs: UdhaarTransaction[]) => {
    setStatementAccount(account);
    setStatementTransactions(txs);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900/40 transition-colors">
      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top App Header */}
      <Header
        isMobileFrame={isMobileFrame}
        setIsMobileFrame={setIsMobileFrame}
        onOpenAddExpense={() => handleOpenAddExpense('shared')}
        onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
        onOpenPhoneOtp={() => setIsPhoneOtpOpen(true)}
      />

      {/* Main Viewport Container (Phone Bezel vs Desktop Shell) */}
      <DeviceFrame
        isMobileFrame={isMobileFrame}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddExpense={() => handleOpenAddExpense('shared')}
        bottomBar={
          isMobileFrame ? (
            <BottomTabBar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenAddExpense={() => handleOpenAddExpense('shared')}
              pendingSettlementsCount={pendingCount}
              overdueUdhaarCount={overdueUdhaarCount}
              isEmbedded={true}
            />
          ) : undefined
        }
      >
        {activeTab === 'home' && (
          <HomeScreen
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            onOpenAddExpense={handleOpenAddExpense}
            onOpenAddUdhaarTransaction={handleOpenAddUdhaarTransaction}
            onOpenSettleUp={() => handleOpenSettleUp()}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenBudget={() => setIsBudgetOpen(true)}
            onViewReceipt={(expense) => setReceiptExpense(expense)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onOpenWelcome={() => setIsWelcomeOpen(true)}
            onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
            onOpenPhoneOtp={() => setIsPhoneOtpOpen(true)}
          />
        )}

        {activeTab === 'udhaar' && (
          <UdhaarScreen
            onOpenAddAccount={() => setIsAddUdhaarAccountOpen(true)}
            onOpenAddTransaction={handleOpenAddUdhaarTransaction}
            onOpenStatement={handleOpenStatement}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesScreen
            onOpenAddExpense={() => handleOpenAddExpense('shared')}
            onViewReceipt={(expense) => setReceiptExpense(expense)}
          />
        )}

        {activeTab === 'balances' && (
          <BalancesScreen onOpenSettleUp={handleOpenSettleUp} />
        )}

        {activeTab === 'reports' && <ReportsScreen />}

        {activeTab === 'settings' && (
          <SettingsScreen
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenBudget={() => setIsBudgetOpen(true)}
            onOpenPhoneOtp={() => setIsPhoneOtpOpen(true)}
            onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
          />
        )}

        {activeTab === 'tests' && <TestRunnerScreen />}
      </DeviceFrame>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        defaultType={addExpenseType}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        prefillRecipientId={settleRecipientId}
        prefillAmountPaise={settleAmountPaise}
      />

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

      <BudgetModal isOpen={isBudgetOpen} onClose={() => setIsBudgetOpen(false)} />

      <ReceiptModal
        expense={receiptExpense}
        members={members}
        onClose={() => setReceiptExpense(null)}
      />

      {/* Khatabook Udhaar Modals */}
      <AddUdhaarAccountModal
        isOpen={isAddUdhaarAccountOpen}
        onClose={() => setIsAddUdhaarAccountOpen(false)}
      />

      <AddUdhaarTransactionModal
        isOpen={isAddUdhaarTransactionOpen}
        onClose={() => setIsAddUdhaarTransactionOpen(false)}
        preselectedAccountId={selectedUdhaarAccountId}
        defaultType={defaultUdhaarType}
      />

      <UdhaarStatementModal
        account={statementAccount}
        transactions={statementTransactions}
        groupName={group.name}
        onClose={() => setStatementAccount(null)}
      />

      {/* Download / Install App Modal for Android APK and iOS */}
      <DownloadAppModal
        isOpen={isDownloadAppOpen}
        onClose={() => setIsDownloadAppOpen(false)}
      />

      {/* Welcome / Onboarding Modal matching mockup #1 */}
      <WelcomeScreen
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onGetStarted={() => handleOpenAddExpense('shared')}
        onSignIn={signInWithGoogle}
        onOpenPhoneOtp={() => setIsPhoneOtpOpen(true)}
      />

      {/* Firebase Phone OTP Authentication Modal */}
      <FirebasePhoneOtpModal
        isOpen={isPhoneOtpOpen}
        onClose={() => setIsPhoneOtpOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}

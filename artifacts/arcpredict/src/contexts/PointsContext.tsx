import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  UserPoints,
  loadPoints,
  awardPoints,
  doCheckIn,
  markOnboarding,
  isOnboardingComplete,
} from "@/lib/points";
import { useWallet } from "@/lib/wallet";

interface PointsCtx {
  points: number;
  streak: number;
  xHandle: string | null;
  lastCheckIn: string | null;
  onboarding: UserPoints["onboarding"];
  onboardingComplete: boolean;
  award: (action: string, amount: number) => void;
  checkIn: () => { bonus: number; already: boolean };
  markStep: (step: keyof UserPoints["onboarding"], xHandle?: string) => void;
  refresh: () => void;
}

const defaultOnboarding: UserPoints["onboarding"] = {
  walletConnected: false,
  followed: false,
  verified: false,
};

const PointsContext = createContext<PointsCtx>({
  points: 0,
  streak: 0,
  xHandle: null,
  lastCheckIn: null,
  onboarding: defaultOnboarding,
  onboardingComplete: false,
  award: () => {},
  checkIn: () => ({ bonus: 0, already: false }),
  markStep: () => {},
  refresh: () => {},
});

export function PointsProvider({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const [data, setData] = useState<UserPoints | null>(null);

  const refresh = useCallback(() => {
    if (!address) {
      setData(null);
      return;
    }
    setData(loadPoints(address));
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const award = useCallback(
    (action: string, amount: number) => {
      if (!address) return;
      const updated = awardPoints(address, action, amount);
      setData(updated);
    },
    [address]
  );

  const checkIn = useCallback(() => {
    if (!address) return { bonus: 0, already: true };
    const result = doCheckIn(address);
    setData(result.data);
    return { bonus: result.bonus, already: result.already };
  }, [address]);

  const markStep = useCallback(
    (step: keyof UserPoints["onboarding"], xHandle?: string) => {
      if (!address) return;
      const updated = markOnboarding(address, step, xHandle);
      setData(updated);
    },
    [address]
  );

  const onboarding = data?.onboarding ?? defaultOnboarding;
  const onboardingComplete = address ? isOnboardingComplete(address) : false;

  return (
    <PointsContext.Provider
      value={{
        points: data?.total ?? 0,
        streak: data?.streak ?? 0,
        xHandle: data?.xHandle ?? null,
        lastCheckIn: data?.lastCheckIn ?? null,
        onboarding,
        onboardingComplete,
        award,
        checkIn,
        markStep,
        refresh,
      }}
    >
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  return useContext(PointsContext);
}

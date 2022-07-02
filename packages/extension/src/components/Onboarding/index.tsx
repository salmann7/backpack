import { useState } from "react";
import { useCustomTheme } from "@coral-xyz/themes";
import { CreatePassword } from "../Account/CreatePassword";
import { MnemonicInput } from "../Account/MnemonicInput";
import { SetupComplete } from "../Account/SetupComplete";
import { ImportAccounts } from "../Account/ImportAccounts";
import { OnboardingWelcome } from "./OnboardingWelcome";
import { WithNav, NavBackButton } from "../Layout/Nav";
import {
  getBackgroundClient,
  BrowserRuntimeExtension,
  DerivationPath,
  EXTENSION_WIDTH,
  EXTENSION_HEIGHT,
  UI_RPC_METHOD_KEYRING_STORE_CREATE,
} from "@coral-xyz/common";

export type OnboardingFlows =
  | "create-wallet"
  | "import-wallet"
  | "connect-hardware"
  | null;

export function Onboarding() {
  const [mnemonic, setMnemonic] = useState("");
  const [derivationPath, setDerivationPath] = useState<DerivationPath>();
  const [password, setPassword] = useState<string>("");
  const [accountIndices, setAccountIndices] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [onboardingFlow, setOnboardingFlow] = useState<OnboardingFlows>(null);
  const theme = useCustomTheme();

  const createStore = async (
    mnemonic: string,
    // TODO
    derivationPath: DerivationPath | undefined,
    password: string,
    accountIndices: number[]
  ) => {
    const background = getBackgroundClient();
    await background.request({
      method: UI_RPC_METHOD_KEYRING_STORE_CREATE,
      params: [mnemonic, derivationPath, password, accountIndices],
    });
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => {
    if (step === 0) {
      // If we are at the first step, back should revert to welcome screen
      setOnboardingFlow(null);
    } else {
      setStep(step - 1);
    }
  };

  //
  // Flow for creating a new wallet. This generates a random 12 word mnemonic
  // and sets a password.
  //
  const createWalletFlow = [
    <CreatePassword
      onNext={(password: string) => {
        setPassword(password);
        nextStep();
      }}
    />,
    <MnemonicInput
      onNext={(mnemonic: string) => {
        createStore(mnemonic, DerivationPath.Bip44Change, password, [0]);
        nextStep();
      }}
      readOnly={true}
    />,
    <SetupComplete onClose={() => BrowserRuntimeExtension.closeActiveTab()} />,
  ];

  //
  // Flow for importing an existing mnemonic. The user can input a 12 or
  // 24 word mnemonic and select the accounts they want to import, as well
  // as set a password.
  //
  const importWalletFlow = [
    <MnemonicInput
      onNext={(mnemonic: string) => {
        setMnemonic(mnemonic);
        nextStep();
      }}
    />,
    <ImportAccounts
      mnemonic={mnemonic}
      onNext={(accountIndices: number[], derivationPath: DerivationPath) => {
        setAccountIndices(accountIndices);
        setDerivationPath(derivationPath);
        nextStep();
      }}
    />,
    <CreatePassword
      onNext={(password: string) => {
        createStore(mnemonic, derivationPath, password, accountIndices);
        nextStep();
      }}
    />,
    <SetupComplete onClose={() => BrowserRuntimeExtension.closeActiveTab()} />,
  ];

  // TODO
  const connectHardwareFlow = [
    <SetupComplete onClose={() => BrowserRuntimeExtension.closeActiveTab()} />,
  ];

  let renderComponent;
  if (onboardingFlow === null) {
    renderComponent = <OnboardingWelcome onSelect={setOnboardingFlow} />;
  } else {
    const flow = {
      "create-wallet": createWalletFlow,
      "import-wallet": importWalletFlow,
      "connect-hardware": connectHardwareFlow,
    }[onboardingFlow];
    renderComponent = (
      <WithNav
        navButtonLeft={<NavBackButton onClick={prevStep} />}
        navbarStyle={{
          backgroundColor: theme.custom.colors.nav,
        }}
        navContentStyle={{
          backgroundColor: theme.custom.colors.nav,
        }}
      >
        {flow[step] || null}
      </WithNav>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        backgroundImage: `url('coral-bg.png')`,
      }}
    >
      <div
        style={{
          width: `${EXTENSION_WIDTH}px`,
          height: `${EXTENSION_HEIGHT}px`,
          background: theme.custom.colors.nav,
          display: "flex",
          flexDirection: "column",
          margin: "0 auto",
          padding: onboardingFlow === null ? "20px" : 0,
          borderRadius: "12px",
          boxShadow:
            "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
        }}
      >
        {renderComponent}
      </div>
    </div>
  );
}

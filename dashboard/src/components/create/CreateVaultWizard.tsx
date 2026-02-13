"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { useAgentShieldClient } from "@/hooks/useAgentShieldClient";
import { StepBasicInfo, type BasicInfoData } from "./StepBasicInfo";
import { StepPolicy, type PolicyData } from "./StepPolicy";
import { StepReview } from "./StepReview";
import { getVaultPDA } from "@agent-shield/sdk";

type Step = "basic" | "policy" | "review";
const steps: Step[] = ["basic", "policy", "review"];
const stepLabels = ["Info", "Policy", "Review"];

export function CreateVaultWizard() {
  const router = useRouter();
  const { client } = useAgentShieldClient();
  const [step, setStep] = useState<Step>("basic");
  const [submitting, setSubmitting] = useState(false);

  const [basicInfo, setBasicInfo] = useState<BasicInfoData>({
    vaultId: "1",
    feeDestination: "",
  });

  const [policyData, setPolicyData] = useState<PolicyData>({
    dailySpendingCap: "10",
    maxTransactionSize: "1",
    maxLeverageBps: "5",
    maxConcurrentPositions: "3",
    allowedTokens: "",
    allowedProtocols: "",
    developerFeeRate: "0",
  });

  const handleSubmit = async () => {
    if (!client) return;
    setSubmitting(true);
    try {
      const vaultId = new BN(basicInfo.vaultId);
      const feeDestination = new PublicKey(basicInfo.feeDestination);

      const tokens = policyData.allowedTokens
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => new PublicKey(s));

      const protocols = policyData.allowedProtocols
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => new PublicKey(s));

      await client.createVault({
        vaultId,
        dailySpendingCap: new BN(
          Math.floor(parseFloat(policyData.dailySpendingCap) * 1e9)
        ),
        maxTransactionSize: new BN(
          Math.floor(
            parseFloat(policyData.maxTransactionSize) * 1e9
          )
        ),
        allowedTokens: tokens,
        allowedProtocols: protocols,
        maxLeverageBps: Math.floor(
          parseFloat(policyData.maxLeverageBps) * 100
        ),
        maxConcurrentPositions: parseInt(
          policyData.maxConcurrentPositions
        ),
        feeDestination,
        developerFeeRate: Math.floor(
          parseFloat(policyData.developerFeeRate || "0") * 100
        ),
      });

      const ownerPk = client.provider.wallet.publicKey;
      const [vaultPda] = getVaultPDA(ownerPk, vaultId);
      router.push(`/vault/${vaultPda.toBase58()}`);
    } catch (e: any) {
      console.error("Create vault failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const currentIdx = steps.indexOf(step);

  return (
    <div className="max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  i < currentIdx
                    ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,102,255,0.2)]"
                    : step === s
                    ? "border-2 border-primary text-foreground"
                    : "bg-white/[0.06] text-muted-foreground"
                }`}
              >
                {i < currentIdx ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs hidden sm:inline ${
                step === s ? "text-foreground" : "text-muted-foreground"
              }`}>
                {stepLabels[i]}
              </span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-px transition-colors duration-300 ${
                i < currentIdx ? "bg-primary/40" : "bg-white/[0.06]"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {step === "basic" && (
        <StepBasicInfo
          data={basicInfo}
          onChange={setBasicInfo}
          onNext={() => setStep("policy")}
        />
      )}
      {step === "policy" && (
        <StepPolicy
          data={policyData}
          onChange={setPolicyData}
          onNext={() => setStep("review")}
          onBack={() => setStep("basic")}
        />
      )}
      {step === "review" && (
        <StepReview
          basicInfo={basicInfo}
          policyData={policyData}
          onBack={() => setStep("policy")}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "lucide-react";

export function CodeSnippetsPanel({
  vaultAddress,
}: {
  vaultAddress: string;
}) {
  const initSnippet = `import { AgentShieldClient } from "@agent-shield/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const client = new AgentShieldClient(connection, wallet);

// Fetch vault data
const vault = await client.fetchVaultByAddress(
  new PublicKey("${vaultAddress}")
);
console.log("Vault status:", vault.status);`;

  const swapSnippet = `import { composeJupiterSwapTransaction } from "@agent-shield/sdk";

const tx = await composeJupiterSwapTransaction({
  client,
  vault: new PublicKey("${vaultAddress}"),
  owner: vault.owner,
  vaultId: vault.vaultId,
  agent: agentKeypair.publicKey,
  inputMint: USDC_MINT,
  outputMint: SOL_MINT,
  amount: new BN(1_000_000), // 1 USDC
  slippageBps: 50,
});

const sig = await connection.sendTransaction(tx, [agentKeypair]);`;

  const killSnippet = `// Emergency freeze — revoke agent access
await client.revokeAgent(
  new PublicKey("${vaultAddress}")
);

// Later, reactivate with a new agent
await client.reactivateVault(
  new PublicKey("${vaultAddress}"),
  newAgentPublicKey // optional
);`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-4 w-4" />
          SDK Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fetch">
          <TabsList className="w-full">
            <TabsTrigger value="fetch" className="flex-1">
              Fetch
            </TabsTrigger>
            <TabsTrigger value="swap" className="flex-1">
              Swap
            </TabsTrigger>
            <TabsTrigger value="kill" className="flex-1">
              Kill Switch
            </TabsTrigger>
          </TabsList>
          <TabsContent value="fetch">
            <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto">
              <code>{initSnippet}</code>
            </pre>
          </TabsContent>
          <TabsContent value="swap">
            <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto">
              <code>{swapSnippet}</code>
            </pre>
          </TabsContent>
          <TabsContent value="kill">
            <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto">
              <code>{killSnippet}</code>
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

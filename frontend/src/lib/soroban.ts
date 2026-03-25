/**
 * Soroban contract interaction helpers.
 */

import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Transaction,
  Networks,
  nativeToScVal,
  Address,
  xdr,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from "./network";

// ============================================================================
// Contract IDs
// ============================================================================

export const CONTRACT_IDS = {
  treasury: "PLACEHOLDER_TREASURY_CONTRACT_ID",
  governance: "PLACEHOLDER_GOVERNANCE_CONTRACT_ID",
  tokenVault: "PLACEHOLDER_TOKEN_VAULT_CONTRACT_ID",
  accessControl: "PLACEHOLDER_ACCESS_CONTROL_CONTRACT_ID",
} as const;

// ============================================================================
// Server Instance
// ============================================================================

const server = new SorobanRpc.Server(SOROBAN_RPC_URL);

// ============================================================================
// Soroban RPC Helpers
// ============================================================================

export async function buildContractCall(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAddress: string
): Promise<TransactionBuilder> {
  const account = await server.getAccount(sourceAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30);

  return tx;
}

export async function signAndSubmit(
  transaction: Transaction
): Promise<SorobanRpc.Api.GetTransactionResponse> {
  const signedXdr = await signTransaction(transaction.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedTx = TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  ) as Transaction;

  const sendResponse = await server.sendTransaction(signedTx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResponse.status}`);
  }

  // Poll for transaction result
  const hash = sendResponse.hash;
  let getResponse: SorobanRpc.Api.GetTransactionResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    getResponse = await server.getTransaction(hash);

    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      continue;
    }

    if (getResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return getResponse;
    }

    throw new Error(
      `Transaction failed with status: ${getResponse.status}`
    );
  }
}

export async function readContractValue(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<any> {
  const contract = new Contract(contractId);

  const account = await server.getAccount(contractId);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationSuccess(simulated)) {
    return simulated.result?.retval;
  }

  throw new Error("Contract read failed");
}

// ============================================================================
// Treasury Transaction Builders
// ============================================================================

export async function buildDepositTx(
  contractId: string,
  from: string,
  amount: number
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(from), { type: "address" }),
    nativeToScVal(amount, { type: "i128" }),
  ];

  return buildContractCall(contractId, "deposit", args, from);
}

export async function buildProposeWithdrawalTx(
  contractId: string,
  proposer: string,
  to: string,
  amount: number,
  memo: string
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(proposer), { type: "address" }),
    nativeToScVal(Address.fromString(to), { type: "address" }),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(memo, { type: "string" }),
  ];

  return buildContractCall(contractId, "propose_withdrawal", args, proposer);
}

export async function buildApproveTx(
  contractId: string,
  signer: string,
  txId: number
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(signer), { type: "address" }),
    nativeToScVal(txId, { type: "u64" }),
  ];

  return buildContractCall(contractId, "approve", args, signer);
}

export async function buildExecuteTx(
  contractId: string,
  executor: string,
  txId: number
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(executor), { type: "address" }),
    nativeToScVal(txId, { type: "u64" }),
  ];

  return buildContractCall(contractId, "execute", args, executor);
}

// ============================================================================
// Governance Transaction Builders
// ============================================================================

export async function buildCreateProposalTx(
  contractId: string,
  proposer: string,
  title: string,
  description: string,
  action: string,
  amount: number,
  target: string
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(proposer), { type: "address" }),
    nativeToScVal(title, { type: "symbol" }),
    nativeToScVal(description, { type: "symbol" }),
    nativeToScVal(action, { type: "symbol" }),
    nativeToScVal(amount, { type: "i128" }),
    nativeToScVal(Address.fromString(target), { type: "address" }),
  ];

  return buildContractCall(contractId, "create_proposal", args, proposer);
}

export async function buildVoteTx(
  contractId: string,
  voter: string,
  proposalId: number,
  voteFor: boolean
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(voter), { type: "address" }),
    nativeToScVal(proposalId, { type: "u64" }),
    nativeToScVal(voteFor, { type: "bool" }),
  ];

  return buildContractCall(contractId, "vote", args, voter);
}

export async function buildFinalizeTx(
  contractId: string,
  caller: string,
  proposalId: number
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(caller), { type: "address" }),
    nativeToScVal(proposalId, { type: "u64" }),
  ];

  return buildContractCall(contractId, "finalize", args, caller);
}

export async function buildExecuteProposalTx(
  contractId: string,
  executor: string,
  proposalId: number
): Promise<TransactionBuilder> {
  const args = [
    nativeToScVal(Address.fromString(executor), { type: "address" }),
    nativeToScVal(proposalId, { type: "u64" }),
  ];

  return buildContractCall(contractId, "execute_proposal", args, executor);
}

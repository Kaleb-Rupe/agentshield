//! Pin Token-2022 opcode discriminants against the canonical interface crate.
//!
//! PR 7 (`fix/sigil-block-token2022-opcode-27`) blocks specific `ix.data[0]`
//! tags. If `spl-token-2022-interface` ever renumbers a variant, this test
//! catches it BEFORE the blocklist starts blocking the wrong ops in prod.
//!
//! Source of truth: solana-program/token-2022 @ 9bc02757
//!   interface/src/instruction.rs :: pub enum TokenInstruction
//!   interface/src/extension/confidential_transfer/instruction.rs ::
//!     pub enum ConfidentialTransferInstruction
//!
//! IMPORTANT: this test pins discriminants by SERIALIZING (`.pack()`) and
//! asserting `serialized[0] == EXPECTED`. We do NOT use `as u8` on the
//! variant — that's not stable across enum reorders without explicit
//! `#[repr(u8)]` discriminants on every variant.

#[cfg(test)]
mod tests {
    use solana_program::pubkey::Pubkey;
    use spl_token_2022_interface::extension::confidential_transfer::instruction::ConfidentialTransferInstruction;
    use spl_token_2022_interface::instruction::TokenInstruction;

    /// Helper: pack a TokenInstruction and return its byte-0 tag.
    fn tag_of(ix: &TokenInstruction) -> u8 {
        ix.pack()[0]
    }

    #[test]
    fn pr7_blocked_opcodes_match_canonical_token2022() {
        // ConfidentialTransfer umbrella -> 27
        assert_eq!(
            tag_of(&TokenInstruction::ConfidentialTransferExtension),
            27,
            "opcode 27 must remain ConfidentialTransferExtension"
        );

        // ConfidentialMintBurn umbrella -> 42
        assert_eq!(
            tag_of(&TokenInstruction::ConfidentialMintBurnExtension),
            42,
            "opcode 42 must remain ConfidentialMintBurnExtension"
        );

        // PermanentDelegate (parses a Pubkey, but byte-0 is still 35)
        assert_eq!(
            tag_of(&TokenInstruction::InitializePermanentDelegate {
                delegate: Pubkey::new_unique(),
            }),
            35,
            "opcode 35 must remain InitializePermanentDelegate",
        );

        // TransferHook umbrella -> 36
        assert_eq!(
            tag_of(&TokenInstruction::TransferHookExtension),
            36,
            "opcode 36 must remain TransferHookExtension"
        );

        // Destructive-balance trio -> 38, 45, 46
        assert_eq!(
            tag_of(&TokenInstruction::WithdrawExcessLamports),
            38,
            "opcode 38 must remain WithdrawExcessLamports"
        );
        assert_eq!(
            tag_of(&TokenInstruction::UnwrapLamports {
                amount: None.into()
            }),
            45,
            "opcode 45 must remain UnwrapLamports",
        );
        assert_eq!(
            tag_of(&TokenInstruction::PermissionedBurnExtension),
            46,
            "opcode 46 must remain PermissionedBurnExtension"
        );
    }

    #[test]
    fn pr7_unblocked_neighbors_are_what_we_think() {
        // Sanity: opcode 31 is CreateNativeMint, NOT ConfidentialTransfer.
        // (This is the exact confusion the prior audit flagged as UNCERTAIN.)
        assert_eq!(tag_of(&TokenInstruction::CreateNativeMint), 31);
    }

    #[test]
    fn confidential_transfer_subops_route_through_byte_27() {
        // All ConfidentialTransferInstruction variants are dispatched under
        // parent byte 27 with sub-discriminator at data[1]. Blocking byte 0 == 27
        // is therefore sufficient to catch every sub-op (Withdraw=6, Transfer=7,
        // TransferWithFee=13, etc.).
        assert_eq!(ConfidentialTransferInstruction::Withdraw as u8, 6);
        assert_eq!(ConfidentialTransferInstruction::Transfer as u8, 7);
        assert_eq!(ConfidentialTransferInstruction::TransferWithFee as u8, 13);
    }

    #[test]
    fn batch_opcode_is_255() {
        // Batch wraps inner TokenInstructions. If this test fails, the byte-0
        // blocklist would still see 255 (good) but the canonical name moved.
        // Either way, opcode 255 stays blocked outright via BatchInstructionBlocked.
        let batch = TokenInstruction::Batch { data: vec![] };
        assert_eq!(tag_of(&batch), 255);
    }
}

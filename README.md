# Tokenized Equipment Leasing for Healthcare

A blockchain-based system for managing medical equipment leasing, tracking, and maintenance using Clarity smart contracts on the Stacks blockchain.

## Overview

This project implements a set of smart contracts that enable:

1. Registration and tracking of medical equipment assets
2. Verification of healthcare facilities
3. Monitoring equipment usage and condition
4. Scheduling maintenance based on actual usage

The system provides transparency, efficiency, and trust in the medical equipment leasing process, ensuring that equipment is properly maintained and utilized.

## Smart Contracts

### Asset Registration Contract

The Asset Registration contract manages the lifecycle of medical equipment:

- Register new medical equipment with detailed information
- Track equipment status (available, leased, in maintenance)
- Transfer ownership between entities
- Query equipment details

```clarity
;; Example: Register a new MRI scanner
(contract-call? .asset-registration register-asset "MRI Scanner" "GE Healthcare MR750" "MRI12345" u1620000000 u500000)

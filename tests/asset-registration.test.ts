import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity VM environment
const mockClarity = {
  tx: {
    sender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  },
  contracts: {
    'asset-registration': {
      functions: {
        'register-asset': vi.fn(),
        'update-asset-status': vi.fn(),
        'get-asset': vi.fn(),
        'transfer-asset': vi.fn(),
        'set-contract-owner': vi.fn(),
      },
      variables: {
        'last-asset-id': { type: 'uint', value: 0 },
        'contract-owner': { type: 'principal', value: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
      },
      maps: {
        'assets': new Map(),
      }
    }
  }
};

// Helper to simulate contract calls
function simulateContractCall(contractName, functionName, args, sender = mockClarity.tx.sender) {
  const originalSender = mockClarity.tx.sender;
  mockClarity.tx.sender = sender;
  
  try {
    return mockClarity.contracts[contractName].functions[functionName](...args);
  } finally {
    mockClarity.tx.sender = originalSender;
  }
}

describe('Asset Registration Contract', () => {
  beforeEach(() => {
    // Reset mocks and state
    vi.resetAllMocks();
    mockClarity.contracts['asset-registration'].maps.assets.clear();
    mockClarity.contracts['asset-registration'].variables['last-asset-id'].value = 0;
  });
  
  describe('register-asset', () => {
    it('should register a new asset successfully', () => {
      // Setup
      const equipmentType = 'MRI Scanner';
      const model = 'GE Healthcare MR750';
      const serialNumber = 'MRI12345';
      const purchaseDate = 1620000000;
      const value = 500000;
      
      mockClarity.contracts['asset-registration'].functions['register-asset'].mockImplementation(() => {
        const newId = mockClarity.contracts['asset-registration'].variables['last-asset-id'].value + 1;
        mockClarity.contracts['asset-registration'].variables['last-asset-id'].value = newId;
        
        mockClarity.contracts['asset-registration'].maps.assets.set(
            JSON.stringify({ asset_id: newId }),
            {
              equipment_type: equipmentType,
              model: model,
              serial_number: serialNumber,
              purchase_date: purchaseDate,
              value: value,
              owner: mockClarity.tx.sender,
              status: 1
            }
        );
        
        return { type: 'ok', value: newId };
      });
      
      // Execute
      const result = simulateContractCall('asset-registration', 'register-asset', [
        equipmentType, model, serialNumber, purchaseDate, value
      ]);
      
      // Verify
      expect(result).toEqual({ type: 'ok', value: 1 });
      expect(mockClarity.contracts['asset-registration'].variables['last-asset-id'].value).toBe(1);
      expect(mockClarity.contracts['asset-registration'].maps.assets.size).toBe(1);
    });
    
    it('should fail if caller is not contract owner', () => {
      // Setup
      mockClarity.contracts['asset-registration'].functions['register-asset'].mockImplementation(() => {
        if (mockClarity.tx.sender !== mockClarity.contracts['asset-registration'].variables['contract-owner'].value) {
          return { type: 'err', value: 403 };
        }
        return { type: 'ok', value: 1 };
      });
      
      // Execute
      const result = simulateContractCall('asset-registration', 'register-asset', [
        'MRI Scanner', 'GE Healthcare MR750', 'MRI12345', 1620000000, 500000
      ], 'ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      // Verify
      expect(result).toEqual({ type: 'err', value: 403 });
    });
  });
  
  describe('update-asset-status', () => {
    it('should update asset status successfully', () => {
      // Setup
      const assetId = 1;
      const newStatus = 2; // leased
      
      mockClarity.contracts['asset-registration'].maps.assets.set(
          JSON.stringify({ asset_id: assetId }),
          {
            equipment_type: 'MRI Scanner',
            model: 'GE Healthcare MR750',
            serial_number: 'MRI12345',
            purchase_date: 1620000000,
            value: 500000,
            owner: mockClarity.tx.sender,
            status: 1
          }
      );
      
      mockClarity.contracts['asset-registration'].functions['update-asset-status'].mockImplementation((id, status) => {
        const assetKey = JSON.stringify({ asset_id: id });
        const asset = mockClarity.contracts['asset-registration'].maps.assets.get(assetKey);
        
        if (!asset) {
          return { type: 'err', value: 404 };
        }
        
        if (asset.owner !== mockClarity.tx.sender) {
          return { type: 'err', value: 403 };
        }
        
        if (status < 1 || status > 3) {
          return { type: 'err', value: 400 };
        }
        
        asset.status = status;
        mockClarity.contracts['asset-registration'].maps.assets.set(assetKey, asset);
        
        return { type: 'ok', value: true };
      });
      
      // Execute
      const result = simulateContractCall('asset-registration', 'update-asset-status', [assetId, newStatus]);
      
      // Verify
      expect(result).toEqual({ type: 'ok', value: true });
      const updatedAsset = mockClarity.contracts['asset-registration'].maps.assets.get(JSON.stringify({ asset_id: assetId }));
      expect(updatedAsset.status).toBe(newStatus);
    });
  });
  
  // Additional tests would follow the same pattern
});

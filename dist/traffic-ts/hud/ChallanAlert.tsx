import React from 'react';
import { ChallanViolation } from '../types';

interface ChallanAlertProps {
  violation?: ChallanViolation;
}

export const ChallanAlert: React.FC<ChallanAlertProps> = ({ violation }) => {
  if (!violation) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 24,
      right: 24,
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(239, 68, 68, 0.45)',
      borderRadius: 14,
      padding: '14px 20px',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 12px 32px rgba(239, 68, 68, 0.25), 0 4px 16px rgba(0,0,0,0.5)',
      zIndex: 100,
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid #ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18
      }}>
        {violation.icon || '🚨'}
      </div>

      <div>
        <div style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#ef4444',
          letterSpacing: 1,
          textTransform: 'uppercase'
        }}>
          E-Challan Issued
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
          {violation.title}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#f2b84b', marginTop: 2 }}>
          Fine: ₹{violation.fine.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

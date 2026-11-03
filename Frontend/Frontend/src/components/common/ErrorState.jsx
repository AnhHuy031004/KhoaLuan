import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';
export default function ErrorState({ error, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>
          {error?.status === 403
            ? 'Không có quyền truy cập'
            : 'Chưa thể hoàn tất thao tác'}
        </strong>
        <p>{error?.message || 'Vui lòng thử lại.'}</p>
      </div>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

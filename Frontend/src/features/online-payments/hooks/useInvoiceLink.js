import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import { api } from '../../../services/api.js';
export default function useInvoiceLink(onOpen, onError) {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const invoiceId = params.get('invoice'),
    recordId = params.get('record');
  const scope = [params.get('wardId'), params.get('clubId')].join(':');
  const callbacks = useRef({ onOpen, onError });
  callbacks.current = { onOpen, onError };
  useEffect(() => {
    if (!invoiceId && !recordId) return;
    const controller = new AbortController();
    let active = true;
    const get = (path) => api.request(path, { signal: controller.signal });
    (async () => {
      let invoice;
      if (invoiceId)
        invoice = await get('/invoices/' + encodeURIComponent(invoiceId));
      else {
        try {
          invoice = await get('/invoices/' + encodeURIComponent(recordId));
        } catch (error) {
          if (error.status !== 404) throw error;
          const payment = await get(
            '/online-payments/' + encodeURIComponent(recordId),
          );
          if (!payment.invoiceId)
            throw Error('Thông báo thiếu mã hóa đơn liên quan.');
          invoice = await get(
            '/invoices/' + encodeURIComponent(payment.invoiceId),
          );
        }
      }
      if (active) callbacks.current.onOpen(invoice);
    })().catch((error) => {
      if (active) callbacks.current.onError(error);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [invoiceId, recordId, scope, user?.id]);
  return () => {
    if (!invoiceId && !recordId) return;
    const next = new URLSearchParams(params);
    next.delete('invoice');
    next.delete('record');
    setParams(next, { replace: true });
  };
}

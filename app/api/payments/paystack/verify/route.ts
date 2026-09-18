import { markOrderPaid, parseOrderIdFromReference, resolveOrderId } from '@/lib/paystackPayments';

function redirectTo(request: Request, pathname: string, params: Record<string, string>) {
  const url = new URL(pathname, request.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return Response.redirect(url, 302);
}

function popupResult(request: Request, payload: { status: 'success' | 'failed'; orderNumber?: string; reason?: string; mode?: string }) {
  const origin = new URL(request.url).origin;
  const body = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Payment Status</title></head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify({ type: 'wf-paystack-result', ...payload })};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, ${JSON.stringify(origin)});
          }
        } catch (_) {}

        try { window.close(); } catch (_) {}

        setTimeout(function () {
          window.location.replace('/checkout?payment=' + encodeURIComponent(message.status));
        }, 400);
      })();
    </script>
  </body>
</html>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference') || '';
  const orderIdValue = Number(url.searchParams.get('orderId') || '0');
  const mock = url.searchParams.get('mock') === '1';
  const popup = url.searchParams.get('popup') === '1';
  const apiMode = url.searchParams.get('api') === '1';
  const mockOrderNumber = url.searchParams.get('orderNumber') || '';

  const jsonResult = (statusCode: number, body: Record<string, unknown>) =>
    Response.json(body, {
      status: statusCode,
      headers: { 'Cache-Control': 'no-store' },
    });

  if (!reference) {
    if (apiMode) {
      return jsonResult(400, { status: 'failed', reason: 'invalid_callback' });
    }
    if (popup) {
      return popupResult(request, { status: 'failed', reason: 'invalid_callback' });
    }
    return redirectTo(request, '/checkout', {
      payment: 'failed',
      reason: 'invalid_callback',
    });
  }

  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    if (apiMode) {
      return jsonResult(500, { status: 'failed', reason: 'paystack_not_configured' });
    }
    if (popup) {
      return popupResult(request, { status: 'failed', reason: 'paystack_not_configured' });
    }
    return redirectTo(request, '/checkout', {
      payment: 'failed',
      reason: 'paystack_not_configured',
    });
  }

  if (mock && key.startsWith('sk_test_')) {
    const mockOrderId = resolveOrderId(orderIdValue, reference);
    if (!mockOrderId) {
      if (apiMode) {
        return jsonResult(400, { status: 'failed', reason: 'missing_order_id' });
      }
      if (popup) {
        return popupResult(request, { status: 'failed', reason: 'missing_order_id' });
      }
      return redirectTo(request, '/checkout', {
        payment: 'failed',
        reason: 'missing_order_id',
      });
    }

    await markOrderPaid(mockOrderId);
    if (apiMode) {
      return jsonResult(200, {
        status: 'success',
        orderNumber: mockOrderNumber,
        mode: 'mock',
      });
    }
    if (popup) {
      return popupResult(request, {
        status: 'success',
        orderNumber: mockOrderNumber,
        mode: 'mock',
      });
    }
    return redirectTo(request, '/checkout', {
      payment: 'success',
      orderNumber: mockOrderNumber,
      mode: 'mock',
    });
  }

  try {
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });

    const payload = (await verifyResponse.json().catch(() => ({}))) as {
      status?: boolean;
      data?: { status?: string; metadata?: { orderNumber?: string; orderId?: number } };
    };

    const paid = Boolean(verifyResponse.ok && payload.status && payload.data?.status === 'success');

    if (!paid) {
      if (apiMode) {
        return jsonResult(402, { status: 'failed', reason: 'verification_failed' });
      }
      if (popup) {
        return popupResult(request, { status: 'failed', reason: 'verification_failed' });
      }
      return redirectTo(request, '/checkout', {
        payment: 'failed',
        reason: 'verification_failed',
      });
    }

    const resolvedOrderId =
      resolveOrderId(orderIdValue, reference) ??
      resolveOrderId(payload.data?.metadata?.orderId, reference) ??
      parseOrderIdFromReference(reference);

    if (!resolvedOrderId) {
      if (apiMode) {
        return jsonResult(200, { status: 'success', mode: 'verified_only' });
      }
      if (popup) {
        return popupResult(request, { status: 'success', mode: 'verified_only' });
      }
      return redirectTo(request, '/checkout', {
        payment: 'success',
        mode: 'verified_only',
      });
    }

    await markOrderPaid(resolvedOrderId);

    const resolvedOrderNumber = payload.data?.metadata?.orderNumber || '';

    if (apiMode) {
      return jsonResult(200, {
        status: 'success',
        orderNumber: resolvedOrderNumber,
      });
    }

    if (popup) {
      return popupResult(request, {
        status: 'success',
        orderNumber: resolvedOrderNumber,
      });
    }

    return redirectTo(request, '/checkout', {
      payment: 'success',
      orderNumber: payload.data?.metadata?.orderNumber || '',
    });
  } catch {
    if (apiMode) {
      return jsonResult(500, { status: 'failed', reason: 'verification_error' });
    }
    if (popup) {
      return popupResult(request, { status: 'failed', reason: 'verification_error' });
    }
    return redirectTo(request, '/checkout', {
      payment: 'failed',
      reason: 'verification_error',
    });
  }
}

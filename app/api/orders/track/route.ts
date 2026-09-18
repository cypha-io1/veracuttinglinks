import { pool } from '@/lib/db';
import { ensureDbInitialized } from '@/lib/dbInit';

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function GET(request: Request) {
  let client;

  try {
    await ensureDbInitialized();

    const url = new URL(request.url);
    const orderNumber = String(url.searchParams.get('orderNumber') || '').trim().toUpperCase();
    const phone = String(url.searchParams.get('phone') || '').trim();

    if (!orderNumber) {
      return Response.json({ error: 'Order number is required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    client = await pool.connect();

    const result = await client.query(
      `
      SELECT
        o.id,
        o."orderNumber",
        o."customerName",
        o.phone,
        o.status,
        o.total,
        o."createdAt",
        o."paymentMethod",
        (
          COALESCE(o."paymentCompleted", FALSE)
          OR o.status IN ('Paid', 'Delivered', 'Cancelled')
        ) AS "paymentCompleted",
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'productName', oi."productName",
              'quantity', oi.quantity,
              'lineTotal', oi."lineTotal"
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM "Order" o
      LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."orderNumber" = $1
        AND o.phone = $2
        AND (
          COALESCE(o."paymentCompleted", FALSE)
          OR o.status IN ('Paid', 'Delivered', 'Cancelled')
        )
      GROUP BY o.id
      LIMIT 1
      `,
      [orderNumber, phone],
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    return Response.json(result.rows[0], {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to track order',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    if (client) client.release();
  }
}

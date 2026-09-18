import { getUserByPhone } from '@/lib/serverAuth';

type PhoneLookupPayload = {
  phone: string;
};

const isValidPhone = (value: string) => /^0\d{9}$/.test(value);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PhoneLookupPayload;
    const phone = body.phone?.trim();

    if (!phone) {
      return Response.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return Response.json({ error: 'Phone must be 10 digits and start with 0' }, { status: 400 });
    }

    const user = await getUserByPhone(phone);

    if (!user) {
      return Response.json({ exists: false, hasPassword: false });
    }

    return Response.json({
      exists: true,
      hasPassword: Boolean(user.passwordHash),
      profile: {
        fullName: user.fullName,
        phone: user.phone,
        email: user.email || '',
        address: user.address || '',
        city: user.city || '',
        role: user.role,
      },
    });
  } catch (error) {
    return Response.json(
      { error: 'Failed to look up phone', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

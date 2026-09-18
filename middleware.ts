import { NextRequest, NextResponse } from 'next/server';

type SiteStatus = {
  liveMode: boolean;
  maintenanceReason: string;
};

const DEFAULT_STATUS: SiteStatus = {
  liveMode: true,
  maintenanceReason: 'We are performing scheduled maintenance. Please check back shortly.',
};

function isAssetPath(pathname: string): boolean {
  return /\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml)$/i.test(pathname);
}

function isAlwaysAllowed(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/system/status') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/logo.png' ||
    isAssetPath(pathname)
  );
}

async function hasAdminSession(request: NextRequest): Promise<boolean> {
  try {
    const url = new URL('/api/auth/me', request.url);
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as {
      authenticated?: boolean;
      profile?: { role?: string };
    };

    return Boolean(payload.authenticated && payload.profile?.role === 'admin');
  } catch {
    return false;
  }
}

async function getSiteStatus(request: NextRequest): Promise<SiteStatus> {
  try {
    const url = new URL('/api/system/status', request.url);
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'x-maintenance-check': '1',
      },
    });

    if (!response.ok) {
      return DEFAULT_STATUS;
    }

    const payload = (await response.json()) as Partial<SiteStatus>;
    return {
      liveMode: payload.liveMode !== false,
      maintenanceReason:
        typeof payload.maintenanceReason === 'string' && payload.maintenanceReason.trim()
          ? payload.maintenanceReason.trim()
          : DEFAULT_STATUS.maintenanceReason,
    };
  } catch {
    return DEFAULT_STATUS;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/maintenance')) {
    const status = await getSiteStatus(request);
    if (status.liveMode) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (isAlwaysAllowed(pathname)) {
    return NextResponse.next();
  }

  const status = await getSiteStatus(request);

  if (status.liveMode) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const isAdmin = await hasAdminSession(request);
    if (!isAdmin) {
      const maintenanceUrl = new URL('/maintenance', request.url);
      maintenanceUrl.searchParams.set('reason', status.maintenanceReason);
      return NextResponse.redirect(maintenanceUrl);
    }

    if (pathname !== '/admin/dashboard') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.next();
    }

    if (pathname === '/api/orders' || pathname === '/api/products') {
      const isAdmin = await hasAdminSession(request);
      if (isAdmin) {
        return NextResponse.next();
      }
    }

    return NextResponse.json(
      {
        error: 'Site is currently closed for maintenance.',
        reason: status.maintenanceReason,
      },
      { status: 503 }
    );
  }

  const maintenanceUrl = new URL('/maintenance', request.url);
  maintenanceUrl.searchParams.set('reason', status.maintenanceReason);
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

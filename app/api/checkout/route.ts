import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pack } = await req.json();
    
    // Authorization header from client should be passed through if needed
    // or use admin SDK to verify user from cookie
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real app, add user's Firebase token
      },
      body: JSON.stringify({ pack })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Checkout failed' }, { status: response.status });
    }

    return NextResponse.json({ url: data.url });
  } catch (err: unknown) {
    console.error('Checkout API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

export const stripeLib = {
    createCheckoutSession: async (userId, priceId) => {
        if (!stripe) throw new Error('Stripe is not configured');
        return stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'payment',
            success_url: 'https://platform.pathgen.dev/dashboard?success=true',
            cancel_url: 'https://platform.pathgen.dev/billing?canceled=true',
            client_reference_id: userId,
        });
    },
    verifyWebhook: (payload, sig) => {
        if (!stripe) throw new Error('Stripe is not configured');
        return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
};

export const PACKS = {
  starter: 'price_starter_499',
  pro: 'price_pro_1999',
  studio: 'price_studio_4999'
};

# When to Mock

Mock at system boundaries only:

- External APIs such as payment, email, search, or analytics providers
- Databases when a test database is impractical
- Time and randomness
- File system when real filesystem tests are too slow or brittle

Do not mock:

- Your own classes/modules
- Internal collaborators
- Anything you control and can execute cheaply

Before heavy mock use, also read `testing-anti-patterns.md`.

## Designing for Mockability

At system boundaries, design interfaces that are easy to mock.

### 1. Use Dependency Injection

Pass external dependencies in rather than creating them internally.

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

### 2. Prefer SDK-Style Interfaces Over Generic Fetchers

Create specific functions for each external operation instead of one generic function with conditional logic.

```typescript
// GOOD: Each function is independently mockable
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// BAD: Mocking requires conditional logic inside the mock
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK-style interfaces mean:

- Each mock returns one specific shape
- No conditional logic in test setup
- Easier visibility into which endpoints a test exercises
- Type safety per endpoint

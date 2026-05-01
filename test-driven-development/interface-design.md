# Interface Design for Testability

Good interfaces make testing natural.

## Accept Dependencies, Don't Create Them

```typescript
// Testable
function processOrder(order, paymentGateway) {}

// Hard to test
function processOrder(order) {
  const gateway = new StripeGateway();
}
```

## Return Results, Don't Hide Everything in Side Effects

```typescript
// Testable
function calculateDiscount(cart): Discount {}

// Hard to test
function applyDiscount(cart): void {
  cart.total -= discount;
}
```

## Keep Surface Area Small

- Fewer methods mean fewer tests needed
- Fewer params mean simpler setup
- Smaller public interfaces make behavior easier to specify

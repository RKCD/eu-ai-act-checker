import type { ShoppingLine } from "@/domain/inventory";
import { log } from "@/lib/log";
import type { AidChannel, ContractorChannel, FoodProvider, PaymentProvider, ShelterProvider } from "./types";
import { seedShelters } from "@/data/seed";

/** Mock-hinnad (sentides) e-Selveri päringu järgi. */
const MOCK_PRICES: Record<string, number> = {
  joogivesi: 69, konserv: 189, tangud: 149, "näkileib": 159, "patareid aa": 99, esmaabi: 1499, taskulamp: 999,
};

export class MockSelverProvider implements FoodProvider {
  readonly name = "e-Selver (mock)";
  estimate(lines: ShoppingLine[]) {
    return lines.reduce((s, l) => s + (MOCK_PRICES[l.query] ?? 299) * Math.ceil(l.quantity), 0);
  }
  async placeOrder(lines: ShoppingLine[], ctx: { regionId: string }) {
    const externalRef = `SELVER-MOCK-${Date.now().toString(36).toUpperCase()}`;
    log("food.order.mock", { regionId: ctx.regionId, count: lines.length });
    return { externalRef, totalCents: this.estimate(lines) };
  }
  shoppingLinks(lines: ShoppingLine[]) {
    return lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      unit: l.unit,
      url: `https://www.selver.ee/search?q=${encodeURIComponent(l.query)}`,
    }));
  }
}

export class SeedShelterProvider implements ShelterProvider {
  readonly name = "Seemneandmed";
  async listShelters() {
    return seedShelters();
  }
  async notifyBooking(b: { shelterId: string }) {
    log("shelter.notify.mock", { shelterId: b.shelterId });
  }
}

export class MockAidChannel implements AidChannel {
  readonly name = "E-kiri / vorm (mock)";
  async forward(target: { kind: "partner" | "redcross"; id: string }, need: { id: string }) {
    log("aid.forward.mock", { needId: need.id, partnerId: target.id });
    return { delivered: true, via: target.kind === "redcross" ? "operaatori vaade + e-kiri" : "partneri vaade + e-kiri" };
  }
}

export class MockContractorChannel implements ContractorChannel {
  readonly name = "Tehnopartner (mock)";
  async sendRequest(req: { id: string; partnerId: string }) {
    log("contractor.request.mock", { partnerId: req.partnerId });
    return { delivered: true, via: "e-kiri partnerile" };
  }
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "Stripe test mode (mock)";
  async charge(p: { amountCents: number }) {
    return { ok: p.amountCents >= 0, ref: `pi_test_${Date.now().toString(36)}` };
  }
}

export const adapters = {
  food: new MockSelverProvider() as FoodProvider,
  shelters: new SeedShelterProvider() as ShelterProvider,
  aid: new MockAidChannel() as AidChannel,
  contractor: new MockContractorChannel() as ContractorChannel,
  payments: new MockPaymentProvider() as PaymentProvider,
};

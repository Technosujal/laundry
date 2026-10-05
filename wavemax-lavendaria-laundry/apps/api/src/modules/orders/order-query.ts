import { z } from "zod";

import type { OrderListQuery } from "./order-types.js";

const optionalText = (maximum: number) => z.string().trim().min(1).max(maximum).optional();

const querySchema = z
  .object({
    search: optionalText(100),
    sourceStatus: optionalText(80),
    paymentStatus: optionalText(80),
    createdFrom: z.string().datetime({ offset: true }).optional(),
    createdTo: z.string().datetime({ offset: true }).optional(),
    cursor: optionalText(512),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.createdFrom && query.createdTo && query.createdFrom > query.createdTo) {
      context.addIssue({
        code: "custom",
        message: "createdFrom must not be after createdTo",
        path: ["createdFrom"],
      });
    }
  });

export function parseOrderListQuery(value: unknown): OrderListQuery | null {
  const result = querySchema.safeParse(value);
  if (!result.success) return null;

  const query = result.data;
  return {
    limit: query.limit,
    ...(query.search === undefined ? {} : { search: query.search }),
    ...(query.sourceStatus === undefined ? {} : { sourceStatus: query.sourceStatus }),
    ...(query.paymentStatus === undefined ? {} : { paymentStatus: query.paymentStatus }),
    ...(query.createdFrom === undefined ? {} : { createdFrom: query.createdFrom }),
    ...(query.createdTo === undefined ? {} : { createdTo: query.createdTo }),
    ...(query.cursor === undefined ? {} : { cursor: query.cursor }),
  };
}

const orderIdSchema = z.string().trim().min(1).max(128);

export function parseOrderId(value: unknown): string | null {
  const result = orderIdSchema.safeParse(value);
  return result.success ? result.data : null;
}

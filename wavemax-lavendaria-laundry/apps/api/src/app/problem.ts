import type { Response } from "express";

export function sendProblem(
  response: Response,
  status: number,
  title: string,
  correlationId: string,
) {
  return response.status(status).json({
    type: `https://wavemax.local/problems/${status}`,
    title,
    status,
    correlationId,
  });
}

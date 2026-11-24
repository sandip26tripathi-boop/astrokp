import { NextRequest } from 'next/server';
import { POST as mainPredictHandler } from '@/app/api/predict/route';

export async function POST(req: NextRequest) {
  return mainPredictHandler(req);
}

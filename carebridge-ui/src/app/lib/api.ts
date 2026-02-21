import axios from "axios";
import { PrePurchaseReport } from "../types/prepurchase";
import { AuditReport } from "../types/audit";

// ✅ env-driven — set NEXT_PUBLIC_API_URL in .env.local for dev,
//    and in Vercel/deployment env vars for production/Kaggle ngrok URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 360_000,   // 6 min — covers MedGemma generation time on T4
});

// --------------------------------------------------
// Post-Rejection Audit
// --------------------------------------------------
export const analyzeRejection = async (payload: {
  policy_text:             string;
  rejection_text:          string;
  medical_documents_text?: string;
  user_explanation?:       string;
}): Promise<AuditReport> => {
  const response = await API.post("/audit", payload);
  return response.data;
};

// --------------------------------------------------
// Pre-Purchase Analysis — text input
// --------------------------------------------------
export const analyzePolicy = async (
  policyText: string
): Promise<PrePurchaseReport> => {
  const response = await API.post("/prepurchase", { policy_text: policyText });
  return response.data;
};

// --------------------------------------------------
// Pre-Purchase Analysis — file upload
// ✅ Reads file as text client-side then sends as text payload
// Backend only has /prepurchase (text), not /prepurchase/upload
// For PDFs, text extraction is best handled server-side — add that
// route to FastAPI with pdfplumber if needed later
// --------------------------------------------------
export const analyzePolicyFromFile = async (
  file: File
): Promise<PrePurchaseReport> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;

      if (!text || text.trim().length < 50) {
        reject(new Error(
          "Could not extract text from file. For PDFs, paste the text directly."
        ));
        return;
      }

      try {
        const response = await API.post("/prepurchase", { policy_text: text });
        resolve(response.data);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("File could not be read."));

    // Read as text — works for .txt files
    // For PDFs this will return raw bytes as string — not ideal
    // but avoids a broken endpoint call
    reader.readAsText(file);
  });
};

// --------------------------------------------------
// Policy Comparison
// --------------------------------------------------
export const comparePolicies = async (
  policyA: string,
  policyB: string
) => {
  const response = await API.post("/compare", {
    policy_a_text: policyA,
    policy_b_text: policyB,
  });
  return response.data;
};

export default API;
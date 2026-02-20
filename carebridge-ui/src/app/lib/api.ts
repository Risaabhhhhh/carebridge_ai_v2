import axios from "axios";
import { PrePurchaseReport } from "../types/prepurchase";
import { AuditReport } from "../types/audit";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

export const analyzeRejection = async (payload: {
  policy_text: string;
  rejection_text: string;
  medical_documents_text?: string;
  user_explanation?: string;
}): Promise<AuditReport> => {
  const response = await API.post("/audit", payload);
  return response.data;
};


/**
 * Analyze a single policy using text input
 */
export const analyzePolicy = async (
  policyText: string
): Promise<PrePurchaseReport> => {
  const response = await API.post("/prepurchase", {
    policy_text: policyText,
  });

  return response.data;
};

/**
 * Analyze a policy using file upload (PDF / Image)
 * Backend handles OCR and converts to text.
 */
export const analyzePolicyFromFile = async (
  file: File
): Promise<PrePurchaseReport> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post(
    "/prepurchase/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Compare two policies
 */
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

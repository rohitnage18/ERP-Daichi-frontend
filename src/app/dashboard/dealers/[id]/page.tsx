"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { GradeBadge } from "@/components/shared/GradeBadge";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { gradeFromCreditLimit } from "@/lib/dealer-grade";

interface DaichiDealerDetail {
  id: string;
  externalId: string;
  syncStatus: string;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
  lastSyncedAt: string;
  creditLimit?: number | null;
  dealerGrade?: string | null;
  firmName: string | null;
  firmAddress: string | null;
  mobileNumber: string | null;
  telephoneNumber: string | null;
  email: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  aadharNumber: string | null;
  experienceInBusiness: string | null;
  establishmentDate: string | null;
  managerRemark: string | null;
  staffName: string | null;
  partners: Array<{ id: string; name: string | null; age: number | null; education: string | null; experienceYears: number | null }>;
  bankAccounts: Array<{ id: string; bankName: string | null; branch: string | null; accountType: string | null; accountNumber: string | null; overdraftLimit: number | null }>;
  infrastructures: Array<{ id: string; type: string | null; ownership: string | null; details: string | null; area: number | null; address: string | null }>;
  otherCompanies: Array<{ id: string; companyName: string | null; productDetails: string | null; annualBusiness: string | null }>;
  securityCheques: Array<{ id: string; bankName: string | null; chequeNumber: string | null; chequeDate: string | null; amount: number | null }>;
  documents: Array<{
    id: string;
    docType: string;
    fileName: string | null;
    mimeType: string | null;
    size: number | null;
    storageKey: string | null;
    s3Key: string | null;
    uploadedLocally?: boolean;
  }>;
  syncLogs: Array<{ id: string; runAt: string; result: string; message: string | null }>;
}

export default function DealerDetailPage() {
  const params = useParams();
  const [dealer, setDealer] = useState<DaichiDealerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState<
    Record<string, { url: string; mimeType: string; fileName: string }>
  >({});
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    fetchDealer();
  }, [params.id]);

  const fetchDealer = async () => {
    try {
      const res = await apiFetch(`/api/daichi-dealers/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setDealer(data);
        loadPreviewUrls(String(params.id));
      }
    } catch (error) {
      console.error("Failed to fetch dealer:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreviewUrls = async (externalId: string) => {
    setLoadingPreviews(true);
    try {
      const res = await apiFetch(`/api/daichi-dealers/${externalId}/documents/preview-urls`);
      if (res.ok) {
        setPreviewUrls(await res.json());
      }
    } catch (error) {
      console.error("Failed to prefetch document URLs:", error);
    } finally {
      setLoadingPreviews(false);
    }
  };

  const isImageMime = (mime?: string | null) =>
    Boolean(mime && (mime.startsWith("image/") || mime === "image/jpeg" || mime === "image/png"));

  const isPdfMime = (mime?: string | null) => Boolean(mime?.includes("pdf"));

  const showToast = (type: "error" | "success", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const docTypeLabels: Record<string, string> = {
    "0": "PAN Card",
    "1": "Aadhar Card",
    "2": "GST Certificate",
    "3": "Blank Cheque",
    "4": "Fertilizer License",
    panCard: "PAN Card",
    aadharCard: "Aadhar Card",
    gstCertificate: "GST Certificate",
    blankCheque: "Blank Cheque",
    fertilizerLicense: "Fertilizer License",
  };

  const getDocLabel = (docType: string) => docTypeLabels[docType] || docType;

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocument = async (docType: string, fallbackName: string) => {
    try {
      setDownloadingDoc(docType);
      const res = await apiFetch(`/api/daichi-dealers/${params.id}/documents/${docType}/download`);
      if (!res.ok) {
        if (res.status === 404) {
          showToast("error", `${getDocLabel(docType)} is not available for this dealer.`);
          return;
        }
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      downloadBlob(blob, fallbackName || `${docType}.bin`);
      showToast("success", `${getDocLabel(docType)} downloaded.`);
    } catch (error) {
      console.error("Document download failed:", error);
      showToast("error", "Unable to download document right now. Please try again.");
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handlePreviewDocument = async (docType: string, mimeType?: string | null) => {
    const cached = previewUrls[docType];
    if (cached?.url) {
      if (isImageMime(cached.mimeType || mimeType)) {
        setPreviewImage(cached.url);
        return;
      }
      if (isPdfMime(cached.mimeType || mimeType)) {
        window.open(cached.url, "_blank", "noopener,noreferrer");
        return;
      }
      window.open(cached.url, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      setDownloadingDoc(`preview-${docType}`);
      const res = await apiFetch(`/api/daichi-dealers/${params.id}/documents/${docType}/preview-url`);
      if (!res.ok) {
        if (res.status === 404 || res.status === 400) {
          showToast("error", `${getDocLabel(docType)} is not available for this dealer.`);
          return;
        }
        throw new Error(`Preview failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.url) {
        showToast("error", `${getDocLabel(docType)} is not available for this dealer.`);
        return;
      }

      setPreviewUrls((prev) => ({ ...prev, [docType]: data }));

      if (isImageMime(data.mimeType || mimeType)) {
        setPreviewImage(data.url);
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Document preview failed:", error);
      showToast("error", "Unable to preview this document right now. Please try again.");
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setDownloadingAll(true);
      const res = await apiFetch(`/api/daichi-dealers/${params.id}/documents/download-all`);
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      downloadBlob(blob, `dealer-${params.id}-documents.zip`);
    } catch (error) {
      console.error("Download all failed:", error);
      alert("Unable to download all documents right now. Please try again.");
    } finally {
      setDownloadingAll(false);
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleUploadMissingDoc = async (docType: string, file: File | null) => {
    if (!file) return;
    try {
      setUploadingDoc(docType);
      if (file.size > 8 * 1024 * 1024) {
        showToast("error", "File too large (max 8 MB).");
        return;
      }
      const dataBase64 = await fileToBase64(file);
      const res = await apiFetch(`/api/daichi-dealers/${params.id}/documents/${docType}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          dataBase64,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed (${res.status})`);
      }
      showToast("success", `${getDocLabel(docType)} uploaded.`);
      await fetchDealer();
    } catch (error) {
      console.error("Document upload failed:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Unable to upload document right now."
      );
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Dealer not found</p>
        <Link href="/dashboard/dealers">
          <Button className="mt-4">Back to Dealers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dealers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{dealer.firmName || "Unnamed Dealer"}</h1>
              <StatusBadge status={dealer.syncStatus} />
              <GradeBadge
                grade={dealer.dealerGrade || gradeFromCreditLimit(dealer.creditLimit)}
              />
            </div>
            <p className="text-muted-foreground">
              Live synced dealer data for ERP
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Firm Name</p>
                  <p className="font-medium">{dealer.firmName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{dealer.mobileNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{dealer.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telephone</p>
                  <p className="font-medium">{dealer.telephoneNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GST</p>
                  <p className="font-medium">{dealer.gstNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PAN / Aadhar</p>
                  <p className="font-medium">{dealer.panNumber || "-"} / {dealer.aadharNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-medium">
                    {dealer.creditLimit != null ? formatCurrency(dealer.creditLimit) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <GradeBadge
                    grade={dealer.dealerGrade || gradeFromCreditLimit(dealer.creditLimit)}
                  />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Firm Address</p>
                <p className="font-medium mt-1">{dealer.firmAddress || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              {dealer.bankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bank accounts</p>
              ) : (
                <div className="space-y-3">
                  {dealer.bankAccounts.map((row) => (
                    <div key={row.id} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{row.bankName || "-"}</p>
                      <p>{row.branch || "-"} • {row.accountType || "-"}</p>
                      <p>Account: {row.accountNumber || "-"} • OD: {row.overdraftLimit ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partners</CardTitle>
            </CardHeader>
            <CardContent>
              {dealer.partners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No partner records</p>
              ) : (
                <div className="space-y-3">
                  {dealer.partners.map((row) => (
                    <div key={row.id} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{row.name || "-"}</p>
                      <p>Age: {row.age ?? "-"} • Education: {row.education || "-"}</p>
                      <p>Experience: {row.experienceYears ?? "-"} years</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Source Created At</p>
                <p className="text-sm font-medium">{dealer.sourceCreatedAt ? formatDate(dealer.sourceCreatedAt) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Source Updated At</p>
                <p className="text-sm font-medium">{dealer.sourceUpdatedAt ? formatDate(dealer.sourceUpdatedAt) : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Synced At</p>
                <p className="text-sm font-medium">{formatDate(dealer.lastSyncedAt)}</p>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Experience: {dealer.experienceInBusiness || "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                Establishment: {dealer.establishmentDate ? formatDate(dealer.establishmentDate) : "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                {loadingPreviews && (
                  <p className="text-xs text-muted-foreground">Loading previews…</p>
                )}
                <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAll}
                  disabled={downloadingAll || dealer.documents.every((d) => !d.fileName)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingAll ? "Preparing..." : "Download All"}
                </Button>
                </div>
              </div>

              {dealer.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents on dealer form</p>
              ) : (
                dealer.documents.map((doc) => {
                  const hasFile = Boolean(doc.fileName);
                  const preview = previewUrls[doc.docType];
                  const isImage = isImageMime(preview?.mimeType || doc.mimeType);
                  const isPdf = isPdfMime(preview?.mimeType || doc.mimeType);

                  return (
                    <div key={doc.id || doc.docType} className="rounded-md border p-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{getDocLabel(doc.docType)}</p>
                        {doc.uploadedLocally && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            Uploaded in ERP
                          </span>
                        )}
                      </div>
                      <p>{doc.fileName || "-"}</p>
                      <p>
                        {doc.mimeType || "-"} • {doc.size != null ? `${doc.size} bytes` : "-"}
                      </p>

                      {hasFile && isImage && preview?.url && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(preview.url)}
                          className="mt-2 block overflow-hidden rounded border bg-muted/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={preview.url}
                            alt={getDocLabel(doc.docType)}
                            className="max-h-40 w-full object-contain"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {hasFile ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadDocument(
                                  doc.docType,
                                  doc.fileName || `${doc.docType}.bin`
                                )
                              }
                              disabled={
                                downloadingDoc === doc.docType ||
                                downloadingDoc === `preview-${doc.docType}`
                              }
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingDoc === doc.docType ? "Preparing..." : "Download"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc.docType, doc.mimeType)}
                              disabled={
                                downloadingDoc === doc.docType ||
                                downloadingDoc === `preview-${doc.docType}`
                              }
                            >
                              {downloadingDoc === `preview-${doc.docType}`
                                ? "Opening..."
                                : isImage
                                  ? "View Image"
                                  : isPdf
                                    ? "Preview PDF"
                                    : "Open"}
                            </Button>
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-muted">
                              <input
                                type="file"
                                accept="image/*,.pdf,application/pdf"
                                className="hidden"
                                disabled={uploadingDoc === doc.docType}
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  e.target.value = "";
                                  void handleUploadMissingDoc(doc.docType, file);
                                }}
                              />
                              <Upload className="h-3.5 w-3.5" />
                              {uploadingDoc === doc.docType ? "Uploading..." : "Replace"}
                            </label>
                          </>
                        ) : (
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                            <input
                              type="file"
                              accept="image/*,.pdf,application/pdf"
                              className="hidden"
                              disabled={uploadingDoc === doc.docType}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                e.target.value = "";
                                void handleUploadMissingDoc(doc.docType, file);
                              }}
                            />
                            <Upload className="h-4 w-4" />
                            {uploadingDoc === doc.docType ? "Uploading..." : "Upload"}
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {previewImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
              onClick={() => setPreviewImage(null)}
              onKeyDown={(e) => e.key === "Escape" && setPreviewImage(null)}
              role="button"
              tabIndex={0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage}
                alt="Document preview"
                className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

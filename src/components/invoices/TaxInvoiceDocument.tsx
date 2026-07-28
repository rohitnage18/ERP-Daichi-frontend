"use client";

import React from "react";
import { DaichiLogo } from "@/components/branding/DaichiLogo";
import { formatInvoiceAmount, formatInvoiceDate } from "@/lib/utils";
import {
  DAICHI_SUPPLIER,
  ITEMS_PER_INVOICE_PAGE,
  resolveUnitsPerCase,
  numberToWords,
} from "@/lib/invoice-utils";

interface TaxInvoiceDocumentProps {
  invoice: Record<string, any>;
}

type NormalizedItem = {
  key: string;
  index: number;
  productName: string;
  packingSize: string;
  lotSize: string;
  unitsPerAlternate?: number;
  alternateUnit?: string;
  taxableValue: number;
  /** Rate unit shown in "per" — Tally uses Nos for product invoices */
  perUnit: string;
  unitPrice: number;
  quantity: number;
  hsnCode: string;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
};

type HsnTaxRow = {
  hsnCode: string;
  taxable: number;
  cgstRate: number;
  sgstRate: number;
  cgst: number;
  sgst: number;
};

type PageSlice = {
  pageNum: number;
  items: NormalizedItem[];
  showContinued: boolean;
  showTotals: boolean;
};

const cellClass = "border border-black p-[3px_4px] align-top";
const thClass = "border border-black bg-[#f0f0f0] p-[3px_4px] font-bold text-center";
const metaLabel = "text-[9px] leading-tight";
const metaValue = "text-[10px] font-semibold leading-tight";

/** Tally-style Alt. Quantity e.g. "2 Case" */
function formatAltQuantity(
  quantity: number,
  lotSize?: string,
  unitsPerAlternate?: number | null
): string {
  const upc = resolveUnitsPerCase(unitsPerAlternate, lotSize);
  if (!upc || upc <= 0) return "";
  const cases = quantity / upc;
  if (!Number.isFinite(cases) || cases <= 0) return "";
  // Show integer cases when exact; otherwise 1 decimal
  const label = Number.isInteger(cases) ? String(cases) : cases.toFixed(1);
  return `${label} Case`;
}

function normalizeItems(invoice: Record<string, any>): NormalizedItem[] {
  const rawItems = invoice.items?.length > 0 ? invoice.items : (invoice.order?.items ?? []);
  const hasInvoiceItems = invoice.items?.length > 0;

  return rawItems.map((row: any, index: number) => {
    const product = row.product;
    const productName = hasInvoiceItems ? row.productName : product?.name;
    const packingSize = hasInvoiceItems ? row.packingSize : product?.packingSize || "";
    const lotSize = row.lotSize || product?.lotSize || "";
    const unitsPerAlternate =
      row.unitsPerAlternate ?? product?.unitsPerAlternate ?? undefined;
    const alternateUnit = row.alternateUnit || product?.alternateUnit || undefined;
    const taxableValue = hasInvoiceItems
      ? Number(row.taxableValue ?? 0)
      : row.quantity * row.unitPrice - (row.discount || 0);
    const cgstRate = row.cgstRate ?? (row.gstRate ? row.gstRate / 2 : 2.5);
    const sgstRate = row.sgstRate ?? cgstRate;
    const cgstAmount = row.cgstAmount ?? (taxableValue * cgstRate) / 100;
    const sgstAmount = row.sgstAmount ?? (taxableValue * sgstRate) / 100;

    return {
      key: row.id || row.productId || String(index),
      index,
      productName: productName || "",
      packingSize,
      lotSize,
      unitsPerAlternate,
      alternateUnit,
      taxableValue,
      // Match Tally product invoices: rate is always per Nos
      perUnit: "Nos",
      unitPrice: Number(row.unitPrice || 0),
      quantity: Number(row.quantity || 0),
      hsnCode: (hasInvoiceItems ? row.hsnCode : product?.hsnCode) || "-",
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
    };
  });
}

/** HSN-wise tax summary — matches Tally footer table */
function buildHsnTaxRows(items: NormalizedItem[]): HsnTaxRow[] {
  const map = new Map<string, HsnTaxRow>();
  for (const item of items) {
    const key = `${item.hsnCode}|${item.cgstRate}|${item.sgstRate}`;
    const existing = map.get(key) || {
      hsnCode: item.hsnCode,
      taxable: 0,
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      cgst: 0,
      sgst: 0,
    };
    existing.taxable += item.taxableValue;
    existing.cgst += item.cgstAmount;
    existing.sgst += item.sgstAmount;
    map.set(key, existing);
  }
  return Array.from(map.values());
}

/** Tax rate groups for the Output CGST/SGST lines under the items table */
function buildTaxRateGroups(items: NormalizedItem[]) {
  const map = new Map<number, { cgstRate: number; sgstRate: number; cgst: number; sgst: number }>();
  for (const item of items) {
    const existing = map.get(item.cgstRate) || {
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      cgst: 0,
      sgst: 0,
    };
    existing.cgst += item.cgstAmount;
    existing.sgst += item.sgstAmount;
    map.set(item.cgstRate, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.cgstRate - b.cgstRate);
}

function paginateItems(items: NormalizedItem[]): PageSlice[] {
  if (items.length === 0) {
    return [{ pageNum: 1, items: [], showContinued: false, showTotals: true }];
  }

  const pages: PageSlice[] = [];
  for (let i = 0; i < items.length; i += ITEMS_PER_INVOICE_PAGE) {
    const chunk = items.slice(i, i + ITEMS_PER_INVOICE_PAGE);
    const isLast = i + ITEMS_PER_INVOICE_PAGE >= items.length;
    pages.push({
      pageNum: pages.length + 1,
      items: chunk,
      showContinued: !isLast,
      showTotals: isLast,
    });
  }
  return pages;
}

function InvoiceHeaderBlock({
  invoice,
  pageNum,
}: {
  invoice: Record<string, any>;
  pageNum: number;
}) {
  const supplierName = invoice.supplierName || DAICHI_SUPPLIER.name;
  const contactPerson =
    invoice.contactPersonName ||
    invoice.dealer?.contactPersonName ||
    invoice.dealer?.proprietorName ||
    "";
  const contactNumber =
    invoice.contactNumber ||
    invoice.dealer?.mobileNumber ||
    invoice.dealer?.contactNumber ||
    invoice.dealer?.telephoneNumber ||
    "";

  const consigneeName = invoice.shippingName || invoice.dealerName || invoice.dealer?.firmName || "";
  const consigneeAddress =
    invoice.shippingAddress ||
    invoice.dealerAddress ||
    invoice.dealer?.businessAddress ||
    invoice.dealer?.firmAddress ||
    "";
  const consigneeCity = invoice.shippingCity || invoice.dealerCity || invoice.dealer?.city || "";
  const consigneeState =
    invoice.shippingState || invoice.dealerState || invoice.dealer?.state || "Maharashtra";
  const consigneePincode =
    invoice.shippingPincode || invoice.dealerPincode || invoice.dealer?.pincode || "";
  const consigneeGst = invoice.shippingGstn || invoice.dealerGst || invoice.dealer?.gstNumber || "-";
  const consigneeStateCode = invoice.shippingStateCode || invoice.dealerStateCode || "27";

  const buyerName = invoice.dealerName || invoice.dealer?.firmName || "";
  const buyerAddress =
    invoice.dealerAddress || invoice.dealer?.businessAddress || invoice.dealer?.firmAddress || "";
  const buyerCity = invoice.dealerCity || invoice.dealer?.city || "";
  const buyerState = invoice.dealerState || invoice.dealer?.state || "Maharashtra";
  const buyerPincode = invoice.dealerPincode || invoice.dealer?.pincode || "";
  const buyerGst = invoice.dealerGst || invoice.dealer?.gstNumber || "-";
  const buyerStateCode = invoice.dealerStateCode || "27";
  const placeOfSupply = invoice.placeOfSupply || buyerState || consigneeState;

  const metaCell = (label: string, value?: string | null) => (
    <td className={`${cellClass} w-1/2`}>
      <p className={metaLabel}>{label}</p>
      <p className={metaValue}>{value || "\u00a0"}</p>
    </td>
  );

  return (
    <>
      <div className="border-b border-black py-1.5 text-center">
        <h1 className="text-[13px] font-bold tracking-wide">
          Tax Invoice{pageNum > 1 ? ` (Page ${pageNum})` : ""}
        </h1>
      </div>

      {/* Top: company (left) + invoice particulars (right) — Tally layout */}
      <div className="grid grid-cols-2 border-b border-black">
        <div className="flex border-r border-black">
          <div className="flex w-[72px] shrink-0 items-start justify-center border-r border-black p-1.5">
            <DaichiLogo size="invoice" />
          </div>
          <div className="flex-1 p-2 text-[10px] leading-snug">
            <p className="text-[11px] font-bold">{supplierName}</p>
            <p>{invoice.supplierAddress || DAICHI_SUPPLIER.address}</p>
            <p>{invoice.supplierCity || DAICHI_SUPPLIER.addressLine2}</p>
            <p>
              Dis-{DAICHI_SUPPLIER.district} {DAICHI_SUPPLIER.state} -{" "}
              {invoice.supplierPincode || "412308"}
            </p>
            <p>GSTIN/UIN: {invoice.supplierGstin || DAICHI_SUPPLIER.gstin}</p>
            <p>
              State Name : {DAICHI_SUPPLIER.state}, Code :{" "}
              {invoice.supplierStateCode || DAICHI_SUPPLIER.stateCode}
            </p>
            <p>Contact : {invoice.supplierContact || DAICHI_SUPPLIER.contact}</p>
            <p>E-Mail : {invoice.supplierEmail || DAICHI_SUPPLIER.email}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-[10px]">
          <tbody>
            <tr>
              {metaCell("Invoice No.", invoice.invoiceNumber)}
              {metaCell("Dated", formatInvoiceDate(invoice.invoiceDate))}
            </tr>
            <tr>
              {metaCell("Delivery Note", invoice.deliveryNote)}
              {metaCell("Mode/Terms of Payment", invoice.paymentTerms)}
            </tr>
            <tr>
              {metaCell("Reference No. & Date.", invoice.referenceNo)}
              {metaCell("Other References", invoice.otherReferences)}
            </tr>
            <tr>
              {metaCell(
                "Buyer's Order No.",
                invoice.order?.orderNumber || invoice.orderNumber
              )}
              {metaCell(
                "Dated",
                invoice.order?.createdAt ? formatInvoiceDate(invoice.order.createdAt) : ""
              )}
            </tr>
            <tr>
              {metaCell("Dispatch Doc No.", invoice.dispatchDocNo)}
              {metaCell(
                "Delivery Note Date",
                invoice.deliveryNoteDate ? formatInvoiceDate(invoice.deliveryNoteDate) : ""
              )}
            </tr>
            <tr>
              {metaCell("Dispatched through", invoice.transportMode)}
              {metaCell(
                "Destination",
                invoice.destination || invoice.shippingCity || invoice.dealerCity || ""
              )}
            </tr>
            <tr>
              <td className={cellClass} colSpan={2}>
                <p className={metaLabel}>Terms of Delivery</p>
                <p className={metaValue}>{invoice.termsOfDelivery || "\u00a0"}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Consignee | Buyer — side by side like classic Tally party block */}
      <table className="w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className={`${cellClass} w-1/2`}>
              <p className="font-semibold underline">Consignee (Ship to)</p>
              <p className="font-medium">{consigneeName}</p>
              <p>{consigneeAddress}</p>
              <p>
                {consigneeState}
                {consigneePincode ? ` - ${consigneePincode}` : ""}
                {consigneeCity && !consigneeAddress?.includes(consigneeCity)
                  ? `, ${consigneeCity}`
                  : ""}
              </p>
              <p>GSTIN/UIN : {consigneeGst}</p>
              <p>
                State Name : {consigneeState}, Code : {consigneeStateCode}
              </p>
            </td>
            <td className={`${cellClass} w-1/2`}>
              <p className="font-semibold underline">Buyer (Bill to)</p>
              <p className="font-medium">{buyerName}</p>
              <p>{buyerAddress}</p>
              <p>
                {buyerState}
                {buyerPincode ? ` - ${buyerPincode}` : ""}
                {buyerCity && !buyerAddress?.includes(buyerCity) ? `, ${buyerCity}` : ""}
              </p>
              <p>GSTIN/UIN : {buyerGst}</p>
              <p>
                State Name : {buyerState}, Code : {buyerStateCode}
              </p>
              <p>Place of Supply : {placeOfSupply}</p>
              {contactPerson && <p>Contact person : {contactPerson}</p>}
              {contactNumber && <p>Contact : {contactNumber}</p>}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function ItemsTable({
  pageItems,
  showTotals,
  invoice,
  taxRateGroups,
  allItems,
}: {
  pageItems: NormalizedItem[];
  showTotals: boolean;
  invoice: Record<string, any>;
  taxRateGroups: ReturnType<typeof buildTaxRateGroups>;
  allItems: NormalizedItem[];
}) {
  const totalQty = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCases = allItems.reduce((sum, item) => {
    const upc = resolveUnitsPerCase(item.unitsPerAlternate, item.lotSize);
    if (!upc || upc <= 0) return sum;
    const cases = item.quantity / upc;
    return Number.isInteger(cases) ? sum + cases : sum;
  }, 0);

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr>
          <th className={`${thClass} w-[28px]`}>
            Sl
            <br />
            No.
          </th>
          <th className={`${thClass} min-w-[140px] text-left`}>Description of Goods</th>
          <th className={`${thClass} w-[64px]`}>HSN/SAC</th>
          <th className={`${thClass} w-[64px]`}>Alt. Quantity</th>
          <th className={`${thClass} w-[64px]`}>Quantity</th>
          <th className={`${thClass} w-[56px]`}>Rate</th>
          <th className={`${thClass} w-[36px]`}>per</th>
          <th className={`${thClass} w-[72px]`}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {pageItems.map((row) => {
          const description = `${row.productName}${
            row.packingSize ? ` - ${row.packingSize}` : ""
          }`;
          const altQty = formatAltQuantity(row.quantity, row.lotSize, row.unitsPerAlternate);

          return (
            <tr key={row.key}>
              <td className={`${cellClass} text-center`}>{row.index + 1}</td>
              <td className={cellClass}>{description}</td>
              <td className={`${cellClass} text-center font-mono`}>{row.hsnCode}</td>
              <td className={`${cellClass} text-center`}>{altQty}</td>
              <td className={`${cellClass} text-center`}>
                {row.quantity} {row.perUnit}
              </td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.unitPrice)}
              </td>
              <td className={`${cellClass} text-center`}>{row.perUnit}</td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.taxableValue)}
              </td>
            </tr>
          );
        })}

        {showTotals && (
          <>
            <tr>
              <td className={cellClass} colSpan={7} />
              <td className={`${cellClass} text-right font-medium tabular-nums`}>
                {formatInvoiceAmount(invoice.subtotal)}
              </td>
            </tr>

            {taxRateGroups.map((group) => (
              <React.Fragment key={group.cgstRate}>
                <tr>
                  <td className={cellClass} colSpan={5}>
                    Output CGST @ {group.cgstRate}%
                  </td>
                  <td className={`${cellClass} text-right tabular-nums`}>
                    {group.cgstRate.toFixed(2)}
                  </td>
                  <td className={`${cellClass} text-center`}>%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>
                    {formatInvoiceAmount(group.cgst)}
                  </td>
                </tr>
                <tr>
                  <td className={cellClass} colSpan={5}>
                    Output SGST @ {group.sgstRate}%
                  </td>
                  <td className={`${cellClass} text-right tabular-nums`}>
                    {group.sgstRate.toFixed(2)}
                  </td>
                  <td className={`${cellClass} text-center`}>%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>
                    {formatInvoiceAmount(group.sgst)}
                  </td>
                </tr>
              </React.Fragment>
            ))}

            {invoice.roundOff != null && Number(invoice.roundOff) !== 0 ? (
              <tr>
                <td className={cellClass} colSpan={7}>
                  Round Off
                </td>
                <td className={`${cellClass} text-right tabular-nums`}>
                  {Number(invoice.roundOff).toFixed(2)}
                </td>
              </tr>
            ) : null}

            <tr className="font-bold">
              <td className={cellClass} colSpan={3}>
                Total
              </td>
              <td className={`${cellClass} text-center`}>
                {totalCases > 0 ? `${totalCases} Case` : ""}
              </td>
              <td className={`${cellClass} text-center`}>
                {totalQty} Nos
              </td>
              <td className={cellClass} colSpan={2} />
              <td className={`${cellClass} text-right tabular-nums`}>
                ₹ {formatInvoiceAmount(invoice.totalAmount)}
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}

function InvoiceFooterSection({
  invoice,
  hsnRows,
}: {
  invoice: Record<string, any>;
  hsnRows: HsnTaxRow[];
}) {
  const supplierName = invoice.supplierName || DAICHI_SUPPLIER.name;
  const totalTax =
    (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);
  const totalTaxable = hsnRows.reduce((s, r) => s + r.taxable, 0);
  const totalCgst = hsnRows.reduce((s, r) => s + r.cgst, 0);
  const totalSgst = hsnRows.reduce((s, r) => s + r.sgst, 0);

  return (
    <>
      <div className="flex border-t border-black p-2 text-[10px]">
        <div className="flex-1">
          <span>Amount Chargeable (in words)</span>
        </div>
        <div className="shrink-0 font-medium">E. &amp; O.E</div>
      </div>
      <div className="border-b border-black px-2 pb-2 text-[10px] font-medium">
        INR {invoice.totalAmountInWords || numberToWords(invoice.totalAmount)}
      </div>

      {/* HSN/SAC summary — Tally footer */}
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr>
            <th className={thClass} rowSpan={2}>
              HSN/SAC
            </th>
            <th className={thClass} rowSpan={2}>
              Taxable
              <br />
              Value
            </th>
            <th className={thClass} colSpan={2}>
              CGST
            </th>
            <th className={thClass} colSpan={2}>
              SGST/UTGST
            </th>
            <th className={thClass} rowSpan={2}>
              Total
              <br />
              Tax Amount
            </th>
          </tr>
          <tr>
            <th className={thClass}>Rate</th>
            <th className={thClass}>Amount</th>
            <th className={thClass}>Rate</th>
            <th className={thClass}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {hsnRows.map((row) => (
            <tr key={`${row.hsnCode}-${row.cgstRate}`}>
              <td className={`${cellClass} text-center font-mono`}>{row.hsnCode}</td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.taxable)}
              </td>
              <td className={`${cellClass} text-center`}>{row.cgstRate.toFixed(2)}%</td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.cgst)}
              </td>
              <td className={`${cellClass} text-center`}>{row.sgstRate.toFixed(2)}%</td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.sgst)}
              </td>
              <td className={`${cellClass} text-right tabular-nums`}>
                {formatInvoiceAmount(row.cgst + row.sgst)}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className={`${cellClass} text-right`}>Total</td>
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatInvoiceAmount(totalTaxable || invoice.subtotal)}
            </td>
            <td className={cellClass} />
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatInvoiceAmount(totalCgst || invoice.cgstAmount)}
            </td>
            <td className={cellClass} />
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatInvoiceAmount(totalSgst || invoice.sgstAmount)}
            </td>
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatInvoiceAmount(totalTax)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="border-b border-black p-2 text-[10px]">
        Tax Amount (in words) : INR {numberToWords(totalTax)}
      </div>

      <table className="w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className={`${cellClass} w-1/2 align-top`}>
              <p className="mb-1 font-semibold">Declaration</p>
              <p>
                We declare that this invoice shows the actual price of the goods described and
                that all particulars are true and correct.
              </p>
            </td>
            <td className={`${cellClass} w-1/2 align-top`}>
              <p className="mb-1 font-semibold">Company&apos;s Bank Details</p>
              <p>A/c Holder&apos;s Name : {supplierName}</p>
              <p>Bank Name : {invoice.bankName || DAICHI_SUPPLIER.bankName}</p>
              <p>A/c No. : {invoice.bankAccountNo || DAICHI_SUPPLIER.bankAccountNo}</p>
              <p>
                Branch &amp; IFS Code : {invoice.bankBranch || DAICHI_SUPPLIER.bankBranch} &amp;{" "}
                {invoice.bankIfsc || DAICHI_SUPPLIER.bankIfsc}
              </p>
              <p>SWIFT Code :</p>
            </td>
          </tr>
          <tr>
            <td className={cellClass} />
            <td className={`${cellClass} text-right align-bottom`}>
              <p className="mb-12 font-semibold">for {supplierName}</p>
              <p>Authorised Signatory</p>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export function TaxInvoiceDocument({ invoice }: TaxInvoiceDocumentProps) {
  const allItems = normalizeItems(invoice);
  const taxRateGroups = buildTaxRateGroups(allItems);
  const hsnRows = buildHsnTaxRows(allItems);
  const pages = paginateItems(allItems);

  return (
    <div className="tax-invoice-document mx-auto max-w-[210mm] bg-white font-serif text-black leading-snug">
      {pages.map((page) => (
        <div
          key={page.pageNum}
          className="invoice-page mb-4 border border-black bg-white last:mb-0 print:mb-0 print:break-after-page print:last:break-after-auto"
        >
          <InvoiceHeaderBlock invoice={invoice} pageNum={page.pageNum} />

          <ItemsTable
            pageItems={page.items}
            showTotals={page.showTotals}
            invoice={invoice}
            taxRateGroups={taxRateGroups}
            allItems={allItems}
          />

          {page.showTotals && <InvoiceFooterSection invoice={invoice} hsnRows={hsnRows} />}

          <div className="border-t border-black p-1.5 text-center text-[9px]">
            {page.showContinued && <p className="mb-1">continued...</p>}
            <p>This is a Computer Generated Invoice</p>
          </div>
        </div>
      ))}
    </div>
  );
}

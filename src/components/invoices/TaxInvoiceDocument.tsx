"use client";

import React from "react";
import { DaichiLogo } from "@/components/branding/DaichiLogo";
import { formatInvoiceAmount, formatInvoiceDate } from "@/lib/utils";
import {
  DAICHI_SUPPLIER,
  ITEMS_PER_INVOICE_PAGE,
  formatCaseLabel,
  invoiceUnitOfMeasure,
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
  unitOfMeasure: string;
  unitPrice: number;
  quantity: number;
  hsnCode: string;
};

type TaxGroup = {
  cgstRate: number;
  sgstRate: number;
  taxable: number;
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
      ? row.taxableValue
      : row.quantity * row.unitPrice - (row.discount || 0);
    const rawUom = hasInvoiceItems ? row.unitOfMeasure : product?.unitOfMeasure;
    const unitOfMeasure = invoiceUnitOfMeasure(rawUom, alternateUnit, lotSize);

    return {
      key: row.id || row.productId || String(index),
      index,
      productName: productName || "",
      packingSize,
      lotSize,
      unitsPerAlternate,
      alternateUnit,
      taxableValue,
      unitOfMeasure,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      hsnCode: (hasInvoiceItems ? row.hsnCode : product?.hsnCode) || "-",
    };
  });
}

function buildTaxGroups(items: NormalizedItem[], invoice: Record<string, any>): TaxGroup[] {
  const rawItems = invoice.items?.length > 0 ? invoice.items : (invoice.order?.items ?? []);
  const hasInvoiceItems = invoice.items?.length > 0;
  const groups = new Map<number, TaxGroup>();

  rawItems.forEach((row: any) => {
    const cgstRate = row.cgstRate ?? (row.gstRate ? row.gstRate / 2 : 2.5);
    const sgstRate = row.sgstRate ?? cgstRate;
    const taxable = row.taxableValue ?? row.quantity * row.unitPrice - (row.discount || 0);
    const existing = groups.get(cgstRate) || { cgstRate, sgstRate, taxable: 0, cgst: 0, sgst: 0 };
    existing.taxable += taxable;
    existing.cgst += row.cgstAmount ?? (taxable * cgstRate) / 100;
    existing.sgst += row.sgstAmount ?? (taxable * sgstRate) / 100;
    groups.set(cgstRate, existing);
  });

  return Array.from(groups.values()).sort((a, b) => a.cgstRate - b.cgstRate);
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
  const consigneeAddress = invoice.shippingAddress || invoice.dealerAddress || invoice.dealer?.businessAddress || invoice.dealer?.firmAddress || "";
  const consigneeCity = invoice.shippingCity || invoice.dealerCity || invoice.dealer?.city || "";
  const consigneeState = invoice.shippingState || invoice.dealerState || invoice.dealer?.state || "Maharashtra";
  const consigneeGst = invoice.shippingGstn || invoice.dealerGst || invoice.dealer?.gstNumber || "-";
  const consigneeStateCode = invoice.shippingStateCode || invoice.dealerStateCode || "27";

  const buyerName = invoice.dealerName || invoice.dealer?.firmName || "";
  const buyerAddress = invoice.dealerAddress || invoice.dealer?.businessAddress || invoice.dealer?.firmAddress || "";
  const buyerCity = invoice.dealerCity || invoice.dealer?.city || "";
  const buyerState = invoice.dealerState || invoice.dealer?.state || "Maharashtra";
  const buyerGst = invoice.dealerGst || invoice.dealer?.gstNumber || "-";
  const buyerStateCode = invoice.dealerStateCode || "27";

  const invoiceNoLabel = "Invoice No.";

  return (
    <>
      <div className="border-b border-black py-1.5 text-center">
        <h1 className="text-[13px] font-bold tracking-wide">
          Tax Invoice{pageNum > 1 ? `(Page ${pageNum})` : ""}
        </h1>
      </div>

      <div className="flex border-b border-black">
        <div className="flex w-[88px] shrink-0 items-start justify-center border-r border-black p-2">
          <DaichiLogo size="invoice" />
        </div>
        <div className="flex-1 p-2 text-[10px] leading-snug">
          <p className="text-[11px] font-bold">{supplierName}</p>
          <p>{invoice.supplierAddress || DAICHI_SUPPLIER.address}</p>
          <p>{invoice.supplierCity || DAICHI_SUPPLIER.addressLine2}</p>
          <p>Dis-{DAICHI_SUPPLIER.district}</p>
          <p>GSTIN/UIN: {invoice.supplierGstin || DAICHI_SUPPLIER.gstin}</p>
          <p>State Name : {DAICHI_SUPPLIER.state}, Code : {invoice.supplierStateCode || DAICHI_SUPPLIER.stateCode}</p>
          <p>Contact : {invoice.supplierContact || DAICHI_SUPPLIER.contact}</p>
          <p>E-Mail : {invoice.supplierEmail || DAICHI_SUPPLIER.email}</p>
        </div>
      </div>

      <table className="w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className={`${cellClass} w-1/2`}>
              <p className="font-semibold underline">Consignee (Ship to)</p>
              <p className="font-medium">{consigneeName}</p>
              <p>{consigneeAddress}</p>
              <p>{consigneeCity}{consigneeState ? `, ${consigneeState}` : ""}</p>
              <p>GSTIN/UIN : {consigneeGst}</p>
              <p>State Name : {consigneeState}, Code : {consigneeStateCode}</p>
              {contactPerson && <p>Contact person : {contactPerson}</p>}
              {contactNumber && <p>Contact : {contactNumber}</p>}
            </td>
            <td className={`${cellClass} w-1/2`}>
              <p className="font-semibold underline">Buyer (Bill to)</p>
              <p className="font-medium">{buyerName}</p>
              <p>{buyerAddress}</p>
              <p>{buyerCity}{buyerState ? `, ${buyerState}` : ""}</p>
              <p>GSTIN/UIN : {buyerGst}</p>
              <p>State Name : {buyerState}, Code : {buyerStateCode}</p>
              {contactPerson && <p>Contact person : {contactPerson}</p>}
              {contactNumber && <p>Contact : {contactNumber}</p>}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-[10px]">
        <tbody>
          <tr>
            <td className={cellClass}>
              <p>{invoiceNoLabel}</p>
              <p className="font-semibold">{invoice.invoiceNumber}</p>
            </td>
            <td className={cellClass}>
              <p>Delivery Note</p>
              <p>{invoice.deliveryNote || ""}</p>
            </td>
            <td className={cellClass}>
              <p>Reference No. &amp; Date.</p>
              <p>{invoice.referenceNo || ""}</p>
            </td>
            <td className={cellClass}>
              <p>Buyer&apos;s Order No.</p>
              <p>{invoice.order?.orderNumber || invoice.orderNumber || ""}</p>
            </td>
          </tr>
          <tr>
            <td className={cellClass}>
              <p>Dated</p>
              <p className="font-medium">{formatInvoiceDate(invoice.invoiceDate)}</p>
            </td>
            <td className={cellClass}>
              <p>Mode/Terms of Payment</p>
              <p>{invoice.paymentTerms || ""}</p>
            </td>
            <td className={cellClass}>
              <p>Other References</p>
              <p>{invoice.otherReferences || ""}</p>
            </td>
            <td className={cellClass}>
              <p>Destination</p>
              <p>{invoice.destination || invoice.shippingCity || invoice.dealerCity || ""}</p>
            </td>
          </tr>
          <tr>
            <td className={cellClass} colSpan={4}>
              <p>Terms of Delivery</p>
              <p>{invoice.termsOfDelivery || invoice.termsAndConditions || ""}</p>
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
  taxGroups,
  allItems,
}: {
  pageItems: NormalizedItem[];
  showTotals: boolean;
  invoice: Record<string, any>;
  taxGroups: TaxGroup[];
  allItems: NormalizedItem[];
}) {
  const totalQty = allItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr>
          <th className={`${thClass} w-[28px]`}>Sl<br />No.</th>
          <th className={`${thClass} min-w-[160px] text-left`}>Description of Goods</th>
          <th className={`${thClass} w-[72px]`}>Amount</th>
          <th className={`${thClass} w-[36px]`}>per</th>
          <th className={`${thClass} w-[56px]`}>Rate</th>
          <th className={`${thClass} w-[64px]`}>Quantity</th>
          <th className={`${thClass} w-[64px]`}>HSN/SAC</th>
        </tr>
      </thead>
      <tbody>
        {pageItems.map((row) => {
          const caseLabel = formatCaseLabel(row.quantity, row.lotSize, row.unitsPerAlternate);
          const description = `${row.productName}${row.packingSize ? ` - ${row.packingSize}` : ""}`;
          const perUnit = row.unitOfMeasure;
          const unitsLabel =
            row.unitsPerAlternate && row.unitsPerAlternate > 0
              ? `1 ${row.alternateUnit || "Case"} = ${row.unitsPerAlternate} ${perUnit}`
              : null;

          return (
            <tr key={row.key}>
              <td className={`${cellClass} text-center`}>{row.index + 1}</td>
              <td className={cellClass}>
                {description}
                {unitsLabel && <span className="block text-[9px]">{unitsLabel}</span>}
                {caseLabel && <span className="block">{caseLabel}</span>}
              </td>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(row.taxableValue)}</td>
              <td className={`${cellClass} text-center`}>{perUnit}</td>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(row.unitPrice)}</td>
              <td className={`${cellClass} text-center`}>
                {row.quantity} {perUnit}
              </td>
              <td className={`${cellClass} text-center font-mono`}>{row.hsnCode}</td>
            </tr>
          );
        })}

        {showTotals && (
          <>
            <tr>
              <td className={cellClass} colSpan={2} />
              <td className={`${cellClass} text-right font-medium tabular-nums`}>
                {formatInvoiceAmount(invoice.subtotal)}
              </td>
              <td className={cellClass} colSpan={4} />
            </tr>

            {taxGroups.map((group) => (
              <React.Fragment key={group.cgstRate}>
                <tr>
                  <td className={cellClass} colSpan={2}>Output CGST @ {group.cgstRate}%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.cgst)}</td>
                  <td className={`${cellClass} text-center`} colSpan={3}>%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>{group.cgstRate.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className={cellClass} colSpan={2}>Output SGST @ {group.sgstRate}%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.sgst)}</td>
                  <td className={`${cellClass} text-center`} colSpan={3}>%</td>
                  <td className={`${cellClass} text-right tabular-nums`}>{group.sgstRate.toFixed(2)}</td>
                </tr>
              </React.Fragment>
            ))}

            {invoice.roundOff != null && invoice.roundOff !== 0 ? (
              <tr>
                <td className={cellClass} colSpan={2}>Round Off</td>
                <td className={`${cellClass} text-right tabular-nums`}>
                  {Number(invoice.roundOff).toFixed(2)}
                </td>
                <td className={cellClass} colSpan={4} />
              </tr>
            ) : null}

            <tr className="font-bold">
              <td className={cellClass} colSpan={2} />
              <td className={`${cellClass} text-right tabular-nums`}>
                ₹{formatInvoiceAmount(invoice.totalAmount)}
              </td>
              <td className={`${cellClass} text-center`} colSpan={3}>{totalQty}</td>
              <td className={cellClass} />
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}

function InvoiceFooterSection({
  invoice,
  taxGroups,
}: {
  invoice: Record<string, any>;
  taxGroups: TaxGroup[];
}) {
  const supplierName = invoice.supplierName || DAICHI_SUPPLIER.name;
  const totalTax = (invoice.cgstAmount || 0) + (invoice.sgstAmount || 0) + (invoice.igstAmount || 0);

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

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr>
            <th className={thClass} rowSpan={2}>Taxable<br />Value</th>
            <th className={thClass} colSpan={2}>CGST</th>
            <th className={thClass} colSpan={2}>SGST/UTGST</th>
            <th className={thClass} rowSpan={2}>Total<br />Tax Amount</th>
          </tr>
          <tr>
            <th className={thClass}>Rate</th>
            <th className={thClass}>Amount</th>
            <th className={thClass}>Rate</th>
            <th className={thClass}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {taxGroups.map((group) => (
            <tr key={group.cgstRate}>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.taxable)}</td>
              <td className={`${cellClass} text-center`}>{group.cgstRate.toFixed(2)}%</td>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.cgst)}</td>
              <td className={`${cellClass} text-center`}>{group.sgstRate.toFixed(2)}%</td>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.sgst)}</td>
              <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(group.cgst + group.sgst)}</td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className={`${cellClass} text-right`}>Total:</td>
            <td className={cellClass} />
            <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(invoice.cgstAmount)}</td>
            <td className={cellClass} />
            <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(invoice.sgstAmount)}</td>
            <td className={`${cellClass} text-right tabular-nums`}>{formatInvoiceAmount(totalTax)}</td>
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
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
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
  const taxGroups = buildTaxGroups(allItems, invoice);
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
            taxGroups={taxGroups}
            allItems={allItems}
          />

          {page.showTotals && <InvoiceFooterSection invoice={invoice} taxGroups={taxGroups} />}

          <div className="border-t border-black p-1.5 text-center text-[9px]">
            {page.showContinued && <p className="mb-1">continued ...</p>}
            <p>This is a Computer Generated Invoice</p>
          </div>
        </div>
      ))}
    </div>
  );
}

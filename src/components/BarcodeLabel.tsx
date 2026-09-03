import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  barcode: string;
  name: string;
  price?: number;
  compact?: boolean;
};

export default function BarcodeLabel({ barcode, name, price, compact = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !barcode) return;
    JsBarcode(svgRef.current, barcode, {
      format: "CODE128",
      displayValue: true,
      fontSize: compact ? 10 : 12,
      height: compact ? 38 : 52,
      margin: 4,
      width: compact ? 1 : 1.4,
    });
  }, [barcode, compact]);

  return (
    <div className="bg-white text-center" data-testid="barcode-preview">
      <p className={`font-semibold truncate ${compact ? "text-[10px]" : "text-sm"}`}>{name}</p>
      <svg ref={svgRef} className="max-w-full h-auto" aria-label={`Barcode ${barcode}`} />
      {price !== undefined && <p className={compact ? "text-[10px] font-bold" : "text-xs font-bold"}>Rp {Number(price).toLocaleString("id-ID")}</p>}
    </div>
  );
}

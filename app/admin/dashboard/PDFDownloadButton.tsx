"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface PDFDownloadButtonProps {
    reportMetadata?: any;
    totalResponses: number;
    reportPeriodLabel: string;
    adminAnalysis: string;
    officeResponseData: any[];
    genderData: any[];
    ageData: any[];
    customerTypeData: any[];
    transactionData: any[];
    natureData: any[];
    serviceData: any[];
    ccData: any;
    ccOfficeData: any;
    actionData: any[];
    sqdResults: any;
    sqdOfficeData: any;
}

export default function PDFDownloadButton(props: PDFDownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const fileName = `CSM_Report_${props.reportPeriodLabel.replace(/\s+/g, "_")}.pdf`;

    const handleDownload = async () => {
        setLoading(true);
        try {
            // Dynamically import @react-pdf/renderer and PDFReport only when the button is clicked
            // This avoids reconciler conflicts during normal page rendering
            const [{ pdf }, { default: PDFReport }] = await Promise.all([
                import("@react-pdf/renderer"),
                import("./PDFReport"),
            ]);

            const doc = <PDFReport {...props} reportMetadata={props.reportMetadata} />;
            const blob = await pdf(doc).toBlob();

            // Trigger browser download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("PDF generation failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            variant="default"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            disabled={loading}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF…
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    Download PDF
                </>
            )}
        </Button>
    );
}

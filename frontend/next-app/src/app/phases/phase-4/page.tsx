"use client";

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Download, CheckCircle2, FileText, LayoutDashboard, ShieldAlert, Clock, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getPhase } from '@/lib/api';

export default function Phase4() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId');
    const reportRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [p1Data, setP1Data] = useState<any>(null);
    const [p2Data, setP2Data] = useState<any>(null);
    const [p3Data, setP3Data] = useState<any>(null);

    useEffect(() => {
        async function fetchAll() {
            if (!projectId) return;
            try {
                const [r1, r2, r3] = await Promise.all([
                    getPhase(projectId, 'functional_decomposition').catch(() => null),
                    getPhase(projectId, 'morphological_chart').catch(() => null),
                    getPhase(projectId, 'risk_analysis').catch(() => null)
                ]);

                // Parse AI data prioritizing human_approved
                const parseData = (res: any) => {
                    if (res?.human_approved_data && Object.keys(res.human_approved_data).length > 0) {
                        return res.human_approved_data;
                    }
                    return res?.ai_generated_data || null;
                };

                const getP1Array = (data: any) => {
                    if (!data) return null;
                    if (data.root_function?.children) return data.root_function.children;
                    if (Array.isArray(data)) return data;
                    if (data.root_function) return [data.root_function];
                    return [data];
                };

                const getP2Array = (data: any) => {
                    if (!data) return null;
                    if (data.mappings && Array.isArray(data.mappings)) return data.mappings;
                    if (Array.isArray(data)) return data;
                    return [data];
                };

                const getP3Array = (data: any) => {
                    if (!data) return null;
                    if (data.risks && Array.isArray(data.risks)) return data.risks;
                    if (Array.isArray(data)) return data;
                    return [data];
                };

                setP1Data(getP1Array(parseData(r1)));
                setP2Data(getP2Array(parseData(r2)));
                setP3Data(getP3Array(parseData(r3)));
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [projectId]);

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setDownloading(true);

        try {
            // Give React a moment to ensure no layout shifts
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Generate image using native SVG foreignObject method
            const imgData = await toPng(reportRef.current, {
                quality: 1,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                filter: (node) => {
                    // Filter out elements marked 'no-print'
                    if (node.classList && node.classList.contains('no-print')) {
                        return false;
                    }
                    return true;
                }
            });

            // Calculate PDF dimensions (A4 size: 210 x 297 mm)
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Handle multi-page PDFs if report is long
            let position = 0;
            let heightLeft = pdfHeight;
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            // Add subsequent pages if needed
            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Engineering_Report_${projectId?.substring(0, 8)}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('An error occurred while generating the PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    if (!projectId) {
        return <div className="p-8">No Project ID provided. Please start from the Home page.</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto" ref={reportRef}>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between no-print">
                <div>
                    <h1 className="text-4xl font-semibold mb-3">Project Report</h1>
                    <p className="text-lg text-muted-foreground">
                        Below is a comprehensive summary of all generated engineering phases.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-24 text-muted-foreground">
                    <Clock className="w-8 h-8 animate-spin mr-3" />
                    <span className="text-lg">Compiling report data...</span>
                </div>
            ) : (
                <div className="space-y-8 mb-12">
                    {/* Phase 1 Summary */}
                    <Card className="bg-card shadow-sm border-border overflow-hidden">
                        <CardHeader className="bg-black/5 pb-4 border-b border-border flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <LayoutDashboard className="h-6 w-6 text-black" />
                                <CardTitle className="text-xl">1. Functional Decomposition</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/phases/phase-1?projectId=${projectId}`)}>
                                Edit Phase 1
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!p1Data || p1Data.length === 0 ? (
                                <p className="text-muted-foreground">No data yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {p1Data.filter(Boolean).map((func: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                                            <span className="font-semibold text-sm">F{i + 1}:</span>
                                            <span className="text-foreground">{func.function || func.title || JSON.stringify(func)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Phase 2 Summary */}
                    <Card className="bg-card shadow-sm border-border overflow-hidden">
                        <CardHeader className="bg-black/5 pb-4 border-b border-border flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-6 w-6 text-black" />
                                <CardTitle className="text-xl">2. Morphological Analysis</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/phases/phase-2?projectId=${projectId}`)}>
                                Edit Phase 2
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!p2Data || p2Data.length === 0 ? (
                                <p className="text-muted-foreground">No data yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {p2Data.filter(Boolean).slice(0, 6).map((item: any, i: number) => (
                                        <div key={i} className="p-4 border border-border rounded-lg bg-card">
                                            <h4 className="font-semibold mb-2 text-sm">{item.function || `Function ${i + 1}`}</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(item.solutions || item.options || []).slice(0, 3).map((sol: any, j: number) => (
                                                    <span key={j} className="text-xs bg-muted text-foreground px-2 py-1 rounded-md">
                                                        {typeof sol === 'string' ? sol : sol.principle || 'Solution'}
                                                    </span>
                                                ))}
                                                {(item.solutions || item.options || []).length > 3 && (
                                                    <span className="text-xs text-muted-foreground px-1 py-1">+{(item.solutions || item.options).length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Phase 3 Summary */}
                    <Card className="bg-card shadow-sm border-border overflow-hidden">
                        <CardHeader className="bg-black/5 pb-4 border-b border-border flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="h-6 w-6 text-black" />
                                <CardTitle className="text-xl">3. Risk Analysis</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/phases/phase-3?projectId=${projectId}`)}>
                                Edit Phase 3
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            {!p3Data || p3Data.length === 0 ? (
                                <p className="text-muted-foreground">No data yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {p3Data.filter(Boolean).map((risk: any, i: number) => (
                                        <div key={i} className="flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-lg border border-border bg-card">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-lg text-destructive mb-1">{risk.risk_category || `Risk ${i + 1}`}</h4>
                                                <div className="text-sm space-y-1">
                                                    <p><span className="font-medium">Cause:</span> {risk.cause || 'N/A'}</p>
                                                    <p className="text-primary"><span className="font-medium">Trade-off:</span> {risk.trade_off || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Download Section */}
            <Card className="bg-black/5 border-black/10 no-print">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-6 inline-flex">
                        <FileText className="h-10 w-10 text-black" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Ready for Download</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        Get your complete engineering portfolio including the functional tree, morphological chart, and risk analysis in a single PDF document.
                    </p>
                    <Button
                        size="lg"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="bg-black hover:bg-black/80 text-white px-8 h-12 rounded-lg gap-2 text-base font-medium shadow-md transition-all sm:w-auto w-full"
                    >
                        {downloading ? <Clock className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        {downloading ? 'Generating Document...' : 'Download Full Report (PDF)'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

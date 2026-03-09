"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Play, Clock, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { updatePhase, getPhase, runPhase } from '@/lib/api';

export default function Phase3() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId');

    const [phaseData, setPhaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!projectId) return;
            try {
                const data = await getPhase(projectId, 'risk_analysis');
                setPhaseData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [projectId]);

    const handleRunPhase = async () => {
        if (!projectId) return;
        setRunning(true);
        try {
            await runPhase(projectId, 'risk_analysis');
            const data = await getPhase(projectId, 'risk_analysis');
            setPhaseData(data);
        } catch (err: any) {
            alert(err.message || 'Failed to run phase. Make sure Phase 2 is human-approved.');
        } finally {
            setRunning(false);
        }
    };

    const handleNextPhase = async () => {
        if (!projectId || !phaseData?.ai_generated_data) return;
        setSaving(true);
        try {
            await updatePhase(projectId, 'risk_analysis', phaseData.ai_generated_data);
            router.push(`/phases/phase-4?projectId=${projectId}`);
        } catch (err: any) {
            alert(err.message || 'Failed to save phase data');
            setSaving(false);
        }
    };

    if (!projectId) {
        return <div className="p-8">No Project ID provided. Please start from the Home page.</div>;
    }

    const hasHumanData = phaseData?.human_approved_data && Object.keys(phaseData.human_approved_data).length > 0;
    const dataSrc = hasHumanData ? phaseData.human_approved_data : phaseData?.ai_generated_data;

    // Ensure we extract the array properly whether it's wrapped in 'risks' or root
    let aiData = [];
    if (dataSrc?.risks && Array.isArray(dataSrc.risks)) {
        aiData = dataSrc.risks;
    } else if (Array.isArray(dataSrc)) {
        aiData = dataSrc;
    } else if (dataSrc && typeof dataSrc === 'object') {
        aiData = [dataSrc];
    }

    const hasData = aiData.length > 0;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 p-6 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold mb-2">Phase 3: Risk Analysis</h1>
                        <p className="text-muted-foreground">
                            Identify potential risks and mitigation strategies for the selected design.
                        </p>
                    </div>
                    {hasData ? (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-border hover:bg-black/5 text-foreground gap-2 rounded-lg px-6 h-10 shadow-sm"
                                onClick={handleRunPhase}
                                disabled={running || saving}
                            >
                                {running ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                {running ? 'Running AI...' : 'Re-run Phase'}
                            </Button>
                            <Button
                                className="bg-black hover:bg-black/80 text-white gap-2 rounded-lg px-6 h-10 shadow-sm border-0"
                                onClick={handleNextPhase}
                                disabled={saving || running}
                            >
                                {saving ? <Clock className="h-4 w-4 animate-spin" /> : 'View Report'}
                            </Button>
                        </div>
                    ) : (
                        <Button
                            className="bg-black hover:bg-black/80 text-white gap-2 rounded-lg px-6 h-10 shadow-sm border-0"
                            onClick={handleRunPhase}
                            disabled={running}
                        >
                            {running ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                            {running ? 'Running AI...' : 'Run Phase'}
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center p-12 text-muted-foreground">Loading phase data...</div>
            ) : hasData ? (
                <div className="space-y-4">
                    {Array.isArray(aiData) ? aiData.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors bg-card shadow-sm"
                        >
                            <div className="mt-1 p-3 rounded-lg bg-destructive/10 text-destructive">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-medium text-lg">{item.risk_category || `Risk ${index + 1}`}</h3>
                                            <Badge variant="outline" className="text-xs">
                                                Risk Factor
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-foreground my-2">
                                            <span className="font-semibold text-muted-foreground">Cause:</span> {item.cause || 'N/A'}
                                        </p>
                                        <p className="text-sm text-primary">
                                            <span className="font-semibold text-muted-foreground">Trade-off:</span> {item.trade_off || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <pre className="p-4 bg-muted rounded-md overflow-auto text-sm">
                            {JSON.stringify(aiData, null, 2)}
                        </pre>
                    )}
                </div>
            ) : (
                <div className="text-center p-16 border-2 border-dashed border-border rounded-xl bg-card">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">No data yet</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Click the "Run Phase" button above to generate the risk analysis checklist. Note: Phase 2 must be approved first.
                    </p>
                </div>
            )}
        </div>
    );
}

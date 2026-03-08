"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Play, Clock, AlertCircle, Palette, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getPhase, runPhase, updatePhase } from '@/lib/api';

export default function Phase2() {
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
                const data = await getPhase(projectId, 'morphological_chart');
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
            await runPhase(projectId, 'morphological_chart');
            const data = await getPhase(projectId, 'morphological_chart');
            setPhaseData(data);
        } catch (err: any) {
            alert(err.message || 'Failed to run phase. Make sure Phase 1 is human-approved.');
        } finally {
            setRunning(false);
        }
    };

    const handleNextPhase = async () => {
        if (!projectId || !phaseData?.ai_generated_data) return;
        setSaving(true);
        try {
            await updatePhase(projectId, 'morphological_chart', phaseData.ai_generated_data);
            router.push(`/phases/phase-3?projectId=${projectId}`);
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

    // Ensure we extract the array properly whether it's wrapped in 'mappings' or 'options'
    let aiData = [];
    if (dataSrc?.mappings && Array.isArray(dataSrc.mappings)) {
        aiData = dataSrc.mappings;
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
                        <h1 className="text-3xl font-semibold mb-2">Phase 2: Morphological Chart</h1>
                        <p className="text-muted-foreground">
                            Generate alternatives and morphological structures based on functions.
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
                                {saving ? <Clock className="h-4 w-4 animate-spin" /> : 'Next Phase'}
                                {!saving && <ArrowRight className="h-4 w-4" />}
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
                <div className="space-y-8 mt-6">
                    {Array.isArray(aiData) ? aiData.map((item: any, index: number) => (
                        <div key={index} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                            {/* Header Strip */}
                            <div className="bg-black/5 px-6 py-3 border-b border-border">
                                <h3 className="text-sm font-bold tracking-widest uppercase text-foreground">
                                    {item.function || `Function ${index + 1}`}
                                </h3>
                            </div>

                            {/* Options Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(item.solutions || item.options || []).map((sol: any, sIdx: number) => {
                                        const title = typeof sol === 'string' ? sol : sol.principle;
                                        const desc = typeof sol === 'string' ? '' : sol.description;
                                        return (
                                            <div key={sIdx} className="border border-border rounded-lg p-5 bg-card hover:border-black/20 hover:shadow-md transition-all">
                                                <h4 className="font-semibold text-foreground mb-2 text-base">{title}</h4>
                                                {desc && <p className="text-sm text-foreground/70 leading-relaxed">{desc}</p>}
                                            </div>
                                        );
                                    })}
                                    {!(item.solutions || item.options) && (
                                        <div className="text-sm text-muted-foreground col-span-3">
                                            {item.description || JSON.stringify(item)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <pre className="p-4 bg-muted rounded-md overflow-auto text-sm border border-border">
                            {JSON.stringify(aiData, null, 2)}
                        </pre>
                    )}
                </div>
            ) : (
                <div className="text-center p-16 border-2 border-dashed border-border rounded-xl bg-card">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-medium mb-2">No data yet</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Click the "Run Phase" button above to generate morphological chart options. Note: Phase 1 must be approved first.
                    </p>
                </div>
            )}
        </div>
    );
}

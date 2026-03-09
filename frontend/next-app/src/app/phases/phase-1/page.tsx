"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPhase, runPhase, getProject, updatePhase } from '@/lib/api';

const FunctionNodeCard = ({ node, index }: { node: any; index: string }) => {
    if (!node) return null;

    const funcText = node.function || node.title || 'Unnamed Function';
    const words = funcText.split(' ');
    const verb = words[0];
    const noun = words.slice(1).join(' ');

    return (
        <div className="flex flex-col mt-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-black/20 hover:shadow-md transition-all shadow-sm">
                <div className="flex items-center justify-center px-3 py-1.5 rounded-md bg-black/5 text-black text-xs font-bold tracking-widest uppercase">
                    Function {index}
                </div>
                <div className="text-lg">
                    <span className="text-black font-semibold">{verb}</span>{' '}
                    <span className="text-foreground/80">{noun}</span>
                </div>
            </div>
            {/* Render children if any exist seamlessly below */}
            {node.children && node.children.length > 0 && (
                <div className="ml-8 mt-2 space-y-2 border-l-2 border-border/50 pl-6">
                    {node.children.map((child: any, idx: number) => (
                        <FunctionNodeCard key={idx} node={child} index={`${index}.${idx + 1}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Phase1() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId');

    const [projectData, setProjectData] = useState<any>(null);
    const [phaseData, setPhaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!projectId) return;
            try {
                const [projectRes, phaseRes] = await Promise.all([
                    getProject(projectId).catch(() => null),
                    getPhase(projectId, 'functional_decomposition').catch(() => null)
                ]);
                setProjectData(projectRes);
                setPhaseData(phaseRes);
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
            await runPhase(projectId, 'functional_decomposition');
            const data = await getPhase(projectId, 'functional_decomposition');
            setPhaseData(data);
        } catch (err: any) {
            alert(err.message || 'Failed to run phase');
        } finally {
            setRunning(false);
        }
    };

    const handleNextPhase = async () => {
        if (!projectId || !phaseData?.ai_generated_data) return;
        setSaving(true);
        try {
            // For Phase 1, the human approved data is just the AI generated data directly
            // In a more complex app, the user might edit this before clicking next.
            await updatePhase(projectId, 'functional_decomposition', phaseData.ai_generated_data);
            router.push(`/phases/phase-2?projectId=${projectId}`);
        } catch (err: any) {
            alert(err.message || 'Failed to save phase data');
            setSaving(false);
        }
    };

    if (!projectId) {
        return <div className="p-8 text-white">No Project ID provided. Please start from the Home page.</div>;
    }

    const hasHumanData = phaseData?.human_approved_data && Object.keys(phaseData.human_approved_data).length > 0;
    const aiData = hasHumanData ? phaseData.human_approved_data : (phaseData?.ai_generated_data || []);
    const hasData = Array.isArray(aiData) ? aiData.length > 0 : !!(aiData && Object.keys(aiData).length > 0);

    let functionList: any[] = [];
    if (aiData?.root_function?.children) {
        functionList = aiData.root_function.children;
    } else if (Array.isArray(aiData)) {
        functionList = aiData;
    } else if (aiData?.root_function) {
        functionList = [aiData.root_function];
    } else if (aiData && typeof aiData === 'object' && !Array.isArray(aiData)) {
        functionList = [aiData];
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Decomposition</h1>
                        <p className="text-muted-foreground">
                            Break down the product into abstract functional components.
                        </p>
                    </div>
                    {hasData ? (
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-border hover:bg-black/5 text-foreground gap-2 rounded-lg px-6 h-10 shadow-sm"
                                onClick={handleRunPhase}
                                disabled={running}
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

                <div className="space-y-4">
                    {/* Intro Card */}
                    <div className="p-5 rounded-xl border border-border bg-card flex items-start gap-4 shadow-sm">
                        <CheckCircle2 className="h-6 w-6 text-black shrink-0 mt-0.5" />
                        <div>
                            <h2 className="text-foreground font-semibold mb-1">Functional Decomposition</h2>
                            <p className="text-muted-foreground text-sm">
                                The AI will break down your product into abstract verb-noun functions to isolate engineering challenges.
                            </p>
                        </div>
                    </div>

                    {/* AI Generated Content */}
                    {loading ? (
                        <div className="text-center p-12 text-muted-foreground">Loading phase data...</div>
                    ) : hasData ? (
                        <div className="space-y-3 mt-6">
                            {functionList.length > 0 ? (
                                functionList.map((item: any, index: number) => (
                                    <FunctionNodeCard key={index} node={item} index={String(index + 1)} />
                                ))
                            ) : (
                                <pre className="p-4 bg-muted rounded-md overflow-auto text-sm text-muted-foreground border border-border">
                                    {JSON.stringify(aiData, null, 2)}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-16 border-2 border-dashed border-border rounded-xl bg-card mt-6">
                            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-medium text-foreground mb-2">No data yet</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                Click the "Run Phase" button to generate the functional decomposition using the AI agent.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

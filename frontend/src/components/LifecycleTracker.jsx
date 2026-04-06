import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';

const WORKFLOW_SECTIONS = [
  { title: 'Pre-Onboarding', steps: ['Onboard Mail Sent', 'Document Submission', 'Background Verification'] },
  { title: 'Day 1 & 2', steps: ['Orientation Completed', 'WhatsApp Group Added', 'Biometric', 'ID Card Photo Taken', 'Official SIM Card Given'] },
  { title: 'System Setup (Day 1-10)', steps: ['Email ID Created', 'Signature Created', 'CRM Access Given', 'PeopleDesk Access Given', 'Zoho Projects Access Given'] },
  { title: 'Training (Day 2-10)', steps: ['Training Started', 'Daily Tracking', 'Training Completed', 'Final Evaluation'] },
  { title: 'Probation (Day 30-90)', steps: ['30 Day Review', '60 Day Review', '90 Day Confirmation'] }
];

const DEADLINES = {
  'Onboard Mail Sent': 1, 'Document Submission': 1, 'Background Verification': 1,
  'Orientation Completed': 3, 'WhatsApp Group Added': 3, 'Biometric': 2, 'ID Card Photo Taken': 3,
  'Official SIM Card Given': 10, 'Email ID Created': 10, 'Signature Created': 10, 'CRM Access Given': 10,
  'PeopleDesk Access Given': 1, 'Zoho Projects Access Given': 10,
  'Training Started': 10, 'Daily Tracking': 10, 'Training Completed': 10, 'Final Evaluation': 10,
  '30 Day Review': 30, '60 Day Review': 60, '90 Day Confirmation': 90
};

const allStepsFlat = [];
WORKFLOW_SECTIONS.forEach(section => {
  section.steps.forEach(stepName => {
    allStepsFlat.push({ sectionTitle: section.title, stepName });
  });
});
const TOTAL_STEPS = allStepsFlat.length;

const LifecycleTracker = ({ employeeId, initialSteps, doj, onUpdate }) => {
  const [steps, setSteps] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (initialSteps) {
      try {
        const parsed = typeof initialSteps === 'string' ? JSON.parse(initialSteps) : initialSteps;
        if (Array.isArray(parsed)) {
          // Robust merging: handle 19 steps -> 20 steps or other changes
          const merged = allStepsFlat.map(flat => {
            const existing = parsed.find(p => p.stepName === flat.stepName);
            return existing ? existing : {
              stepName: flat.stepName,
              section: flat.sectionTitle,
              done: false, date: '', remarks: ''
            };
          });
          setSteps(merged);
        } else {
          initializeSteps();
        }
      } catch (e) {
        initializeSteps();
      }
    } else {
      initializeSteps();
    }
  }, [initialSteps]);

  const initializeSteps = () => {
    const newSteps = allStepsFlat.map(s => ({
      stepName: s.stepName,
      section: s.sectionTitle,
      done: false, date: '', remarks: ''
    }));
    setSteps(newSteps);
  };

  const getProgress = () => {
    if (steps.length === 0) return 0;
    const doneCount = steps.filter(s => s.done).length;
    return Math.round((doneCount / TOTAL_STEPS) * 100);
  };

  const isRisk = () => getProgress() < 40;

  const getTargetDateStr = (doj, stepName) => {
    if (!doj) return null;
    const deadlineDays = DEADLINES[stepName] || 1;
    const date = new Date(doj);
    date.setDate(date.getDate() + deadlineDays);
    return date.toISOString().slice(0, 10);
  };

  const isOverdueStep = (stepIdx) => {
    if (!doj) return false;
    const step = steps[stepIdx];
    if (!step || step.done) return false;

    const targetDateStr = getTargetDateStr(doj, step.stepName);
    if (!targetDateStr) return false;

    const targetDate = new Date(targetDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    return today > targetDate;
  };

  const handleStepChange = (idx, checked) => {
    const newSteps = [...steps];
    newSteps[idx].done = checked;
    if (checked && !newSteps[idx].date) {
      newSteps[idx].date = new Date().toISOString().slice(0, 10);
    } else if (!checked) {
      newSteps[idx].date = '';
    }
    setSteps(newSteps);
    onUpdate(newSteps);
  };

  const handleRemarksChange = (idx, value) => {
    const newSteps = [...steps];
    newSteps[idx].remarks = value;
    setSteps(newSteps);
    onUpdate(newSteps);
  };

  const progress = getProgress();
  const risk = isRisk();

  return (
    <div className={`card slide-in ${risk ? 'risk-shake' : ''}`} style={{ 
      marginTop: '3rem', 
      padding: 0,
      border: risk ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--glass-border)',
      background: 'rgba(15, 23, 42, 0.4)',
      boxShadow: risk ? '0 0 40px rgba(239, 68, 68, 0.1)' : 'var(--shadow)',
      position: 'relative'
    }}>
      {/* Header Section */}
      <div 
        style={{ 
          padding: '2rem',
          cursor: 'pointer',
          background: 'linear-gradient(to right, rgba(255,255,255,0.03), transparent)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          borderBottom: expanded ? '1px solid var(--glass-border)' : 'none'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              padding: '0.75rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Clock size={24} color="white" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Onboarding Lifecycle
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                Tracking {TOTAL_STEPS} essential steps since {doj || 'TBD'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {risk && (
              <span style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444', 
                padding: '0.5rem 1rem', 
                borderRadius: '12px', 
                fontSize: '0.75rem', 
                fontWeight: 800,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertCircle size={14} /> ONBOARDING RISK
              </span>
            )}
            <div style={{ color: 'var(--text-dim)', transition: 'transform 0.3s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown size={24} />
            </div>
          </div>
        </div>

        {/* Improved Progress Bar Container */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Overall Completion
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: progress === 100 ? '#4ade80' : 'white', letterSpacing: '-0.05em' }}>
              {progress}<span style={{ fontSize: '1rem', opacity: 0.5, marginLeft: '2px' }}>%</span>
            </span>
          </div>
          <div style={{ 
            height: '12px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            borderRadius: '6px',
            padding: '3px',
            border: '1px solid rgba(255,255,255,0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${progress}%`, 
              height: '100%', 
              background: progress === 100 
                ? 'linear-gradient(90deg, #22c55e, #4ade80)' 
                : risk ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              borderRadius: '3px',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: progress > 0 ? `0 0 20px ${risk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` : 'none'
            }}>
              <div style={{ 
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                animation: 'shimmer 2s infinite linear'
              }} />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ 
          padding: '1.5rem 2rem 2.5rem', 
          maxHeight: '700px', 
          overflowY: 'auto',
          background: 'rgba(15, 23, 42, 0.2)'
        }}>
          {WORKFLOW_SECTIONS.map((section, sIdx) => {
            let globalIdxOffset = 0;
            for (let i = 0; i < sIdx; i++) globalIdxOffset += WORKFLOW_SECTIONS[i].steps.length;

            return (
              <div key={section.title} style={{ marginBottom: '2.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  marginBottom: '1.25rem',
                  position: 'sticky',
                  top: 0,
                  background: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(8px)',
                  padding: '8px 0',
                  zIndex: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#60a5fa' }}>
                    {section.title}
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.steps.map((stepName, stepIdx) => {
                    const globalIdx = globalIdxOffset + stepIdx;
                    const stepData = steps[globalIdx] || { done: false, date: '', remarks: '' };
                    const overdue = isOverdueStep(globalIdx);
                    const targetDate = getTargetDateStr(doj, stepName);

                    return (
                      <div 
                        key={stepName} 
                        className="lifecycle-row"
                        style={{ 
                          display: 'grid',
                          gridTemplateColumns: 'minmax(250px, 2fr) 80px 140px 140px 3fr',
                          alignItems: 'center',
                          padding: '0.875rem 1.25rem',
                          background: stepData.done ? 'rgba(34, 197, 94, 0.03)' : 'rgba(255,255,255,0.02)',
                          borderRadius: '12px',
                          border: '1px solid transparent',
                          borderColor: overdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.9375rem', 
                            fontWeight: stepData.done ? 700 : 500,
                            color: stepData.done ? 'white' : 'var(--text-dim)',
                            transition: 'color 0.3s ease'
                          }}>
                            {stepName}
                          </span>
                          {overdue && (
                            <div style={{ 
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#f87171',
                              fontSize: '0.625rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              whiteSpace: 'nowrap'
                            }}>
                              Overdue
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div 
                            onClick={() => handleStepChange(globalIdx, !stepData.done)}
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '6px',
                              border: `2px solid ${stepData.done ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                              background: stepData.done ? '#22c55e' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              margin: '0 auto',
                              transform: stepData.done ? 'scale(1.1)' : 'scale(1)'
                            }}
                          >
                            {stepData.done && <CheckCircle size={14} color="white" />}
                          </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Target</p>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: overdue ? '#f87171' : 'var(--text-dim)', fontWeight: 600 }}>{targetDate || '—'}</p>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Completed</p>
                          <p style={{ margin: 0, fontSize: '0.8125rem', color: stepData.done ? '#4ade80' : 'rgba(255,255,255,0.1)', fontWeight: 700 }}>
                            {stepData.date || '—'}
                          </p>
                        </div>

                        <div style={{ paddingLeft: '1.5rem' }}>
                          <input 
                            type="text" 
                            className="form-group-input"
                            value={stepData.remarks} 
                            onChange={(e) => handleRemarksChange(globalIdx, e.target.value)}
                            placeholder="Add detailed remarks..."
                            style={{ 
                              width: '100%', 
                              background: 'rgba(15, 23, 42, 0.3)', 
                              border: '1px solid rgba(255,255,255,0.05)', 
                              borderRadius: '8px', 
                              padding: '0.5rem 0.875rem',
                              color: 'white',
                              fontSize: '0.8125rem',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '1.25rem', 
            background: 'rgba(59, 130, 246, 0.05)', 
            borderRadius: '12px', 
            fontSize: '0.8125rem', 
            color: '#60a5fa', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <Info size={18} />
            <span>Progress and remarks are automatically encrypted and synchronized to the HR Master Database.</span>
          </div>
        </div>
      )}

      {/* Embedded Animations and Custom Scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
        .lifecycle-row:hover {
          background: rgba(255,255,255,0.05) !important;
          transform: translateX(4px);
        }
        .risk-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        div::-webkit-scrollbar { width: 6px; }
        div::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        div::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); borderRadius: 3px; }
      `}} />
    </div>
  );
};

export default LifecycleTracker;

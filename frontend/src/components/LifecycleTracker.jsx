import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Info } from 'lucide-react';

const WORKFLOW_SECTIONS = [
  { title: 'Pre-Onboarding', steps: ['Onboard Mail Sent', 'Document Submission', 'Background Verification'] },
  { title: 'Day 1', steps: ['Orientation Completed', 'WhatsApp Group Added', 'ID Card Photo Taken', 'Official SIM Card Given'] },
  { title: 'System Setup', steps: ['Email ID Created', 'Signature Created', 'CRM Access Given', 'PeopleDesk Access Given', 'Zoho Projects Access Given'] },
  { title: 'Training (Day 2–10 mandatory)', steps: ['Training Started', 'Daily Tracking', 'Training Completed', 'Final Evaluation'] },
  { title: 'Probation (3 months)', steps: ['30 Day Review', '60 Day Review', '90 Day Confirmation'] }
];

const allStepsFlat = [];
WORKFLOW_SECTIONS.forEach(section => {
  section.steps.forEach(stepName => {
    allStepsFlat.push({ sectionTitle: section.title, stepName });
  });
});
const TOTAL_STEPS = allStepsFlat.length;

const LifecycleTracker = ({ employeeId, initialSteps, doj, onUpdate }) => {
  const [steps, setSteps] = useState([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (initialSteps) {
      try {
        const parsed = typeof initialSteps === 'string' ? JSON.parse(initialSteps) : initialSteps;
        if (Array.isArray(parsed) && parsed.length === TOTAL_STEPS) {
          setSteps(parsed);
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
      done: false,
      date: '',
      remarks: ''
    }));
    setSteps(newSteps);
  };

  const getProgress = () => {
    if (steps.length === 0) return 0;
    const doneCount = steps.filter(s => s.done).length;
    return Math.round((doneCount / TOTAL_STEPS) * 100);
  };

  const isRisk = () => getProgress() < 40;

  const isOverdueStep = (stepIdx) => {
    if (!doj) return false;
    const dojDate = new Date(doj);
    const today = new Date();
    const step = steps[stepIdx];
    if (!step || step.done) return false;
    
    // logic from original:
    // probation steps (index >= 15 approx) and doj older than 75 days
    if (stepIdx >= 15 && (today - dojDate) > (75 * 86400000)) return true;
    // training steps older than 20 days
    if (stepIdx >= 8 && stepIdx <= 13 && (today - dojDate) > (20 * 86400000)) return true;
    return false;
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
    <div className="card" style={{ marginTop: '2rem', border: risk ? '2px solid #ef4444' : '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem', 
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={24} color="#60a5fa" /> Onboarding Lifecycle Tracker
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '100px', 
              height: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: risk ? '#ef4444' : '#22c55e',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{progress}%</span>
          </div>
          {risk && (
            <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.75rem', 
              fontWeight: 700 
            }}>
              ⚠️ RISK
            </span>
          )}
        </div>
        {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </div>

      {expanded && (
        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem 0.5rem' }}>Step</th>
                <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                <th style={{ padding: '1rem 0.5rem' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {WORKFLOW_SECTIONS.map((section, sIdx) => {
                let globalIdxOffset = 0;
                for (let i = 0; i < sIdx; i++) globalIdxOffset += WORKFLOW_SECTIONS[i].steps.length;

                return (
                  <React.Fragment key={section.title}>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td colSpan="4" style={{ padding: '0.75rem', fontWeight: 800, fontSize: '0.875rem', color: '#60a5fa' }}>
                        📌 {section.title}
                      </td>
                    </tr>
                    {section.steps.map((stepName, stepIdx) => {
                      const globalIdx = globalIdxOffset + stepIdx;
                      const stepData = steps[globalIdx] || { done: false, date: '', remarks: '' };
                      const overdue = isOverdueStep(globalIdx);

                      return (
                        <tr key={stepName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{stepName}</span>
                              {overdue && (
                                <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <AlertCircle size={12} /> OVERDUE
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input 
                              type="checkbox" 
                              checked={stepData.done} 
                              onChange={(e) => handleStepChange(globalIdx, e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                            {stepData.date || '—'}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <input 
                              type="text" 
                              value={stepData.remarks} 
                              onChange={(e) => handleRemarksChange(globalIdx, e.target.value)}
                              placeholder="Add remark..."
                              style={{ 
                                width: '100%', 
                                background: 'rgba(255,255,255,0.02)', 
                                border: '1px solid var(--glass-border)', 
                                borderRadius: '4px', 
                                padding: '4px 8px',
                                color: 'white',
                                fontSize: '0.8125rem'
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={14} /> Changes are automatically synced to the database.
          </div>
        </div>
      )}
    </div>
  );
};

export default LifecycleTracker;

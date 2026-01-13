/**
 * Timeline Step component.
 */

export interface TimelineStepData {
  timestamp: string;
  agent: string;
  action: string;
}

interface TimelineStepProps {
  step: TimelineStepData;
  index: number;
  isComplete?: boolean;
  isError?: boolean;
}

export function TimelineStep({ step, index, isComplete, isError }: TimelineStepProps) {
  const className = `timelineStep ${isComplete ? 'complete' : ''} ${isError ? 'error' : ''}`;
  const time = new Date(step.timestamp).toLocaleTimeString();
  
  return (
    <div className={`${className} slideIn`} style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex justifyBetween itemsCenter">
        <span className="textSecondary" style={{ fontSize: '0.75rem' }}>
          {step.agent}
        </span>
        <span className="textMuted" style={{ fontSize: '0.625rem' }}>
          {time}
        </span>
      </div>
      <p style={{ marginTop: '0.25rem' }}>{step.action}</p>
    </div>
  );
}

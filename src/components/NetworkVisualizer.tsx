import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface NetworkVisualizerProps {
  sourceIp?: string;
  destIp?: string;
  isAttacking?: boolean;
}

export default function NetworkVisualizer({ sourceIp, destIp, isAttacking }: NetworkVisualizerProps) {
  const fgRef = useRef<any>();
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      });
    }
  }, []);

  const graphData = useMemo(() => {
    const nodes = [
      { id: '10.0.0.1', label: 'Gateway Router', group: 1, color: '#00f2fe' },
      { id: '10.0.0.5', label: 'Admin SSH Box', group: 2, color: '#4facfe' },
      { id: '10.0.0.12', label: 'Web App Server', group: 2, color: '#4facfe' },
      { id: '10.0.0.18', label: 'Tomcat Internal', group: 2, color: '#4facfe' },
      { id: '10.0.0.40', label: 'File Storage', group: 3, color: '#38f9d7' },
      { id: '127.0.0.1', label: 'Localhost', group: 1, color: '#00f2fe' },
    ];
    
    const links = [
      { source: '10.0.0.1', target: '10.0.0.5' },
      { source: '10.0.0.1', target: '10.0.0.12' },
      { source: '10.0.0.1', target: '10.0.0.18' },
      { source: '10.0.0.18', target: '10.0.0.40' },
      { source: '10.0.0.12', target: '10.0.0.40' },
    ];

    if (sourceIp) {
      // Add the attacker node if it doesn't exist
      if (!nodes.find(n => n.id === sourceIp)) {
        nodes.push({ id: sourceIp, label: 'External Node', group: 99, color: '#ff527b' });
      }
      
      // If there's a destIp, add a link from source to dest
      if (destIp) {
        if (!nodes.find(n => n.id === destIp)) {
            nodes.push({ id: destIp, label: 'Target Node', group: 99, color: '#fda085' });
        }
        links.push({ source: sourceIp, target: destIp });
      }
    }

    return { nodes, links };
  }, [sourceIp, destIp]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    if (node.id === sourceIp && isAttacking) {
      ctx.fillStyle = 'rgba(255, 82, 123, 0.4)';
    } else if (node.id === destIp && isAttacking) {
      ctx.fillStyle = 'rgba(253, 160, 133, 0.4)';
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || '#00f2fe';
    
    // Highlight if attacking
    if (isAttacking && (node.id === sourceIp || node.id === destIp)) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = node.id === sourceIp ? '#ff527b' : '#fda085';
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0; // reset for text
    ctx.fillText(label, node.x, node.y + 10);
    ctx.font = `${fontSize * 0.7}px Sans-Serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(node.id, node.x, node.y + 18);
  }, [sourceIp, destIp, isAttacking]);

  const linkColor = useCallback((link: any) => {
    if (isAttacking && link.source.id === sourceIp && link.target.id === destIp) {
      return '#ff527b';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }, [isAttacking, sourceIp, destIp]);
  
  const linkWidth = useCallback((link: any) => {
    if (isAttacking && link.source.id === sourceIp && link.target.id === destIp) {
      return 2;
    }
    return 1;
  }, [isAttacking, sourceIp, destIp]);

  const linkDirectionalParticles = useCallback((link: any) => {
    if (isAttacking && link.source.id === sourceIp && link.target.id === destIp) {
      return 4;
    }
    return 0;
  }, [isAttacking, sourceIp, destIp]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '200px', background: '#020306', borderRadius: '4px', overflow: 'hidden' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={drawNode}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleSpeed={0.015}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}

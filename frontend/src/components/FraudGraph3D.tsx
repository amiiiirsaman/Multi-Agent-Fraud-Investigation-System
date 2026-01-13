/**
 * 3D Fraud Graph component using react-force-graph-3d.
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { NetworkData, NetworkNode } from '../types';
import { CHART_COLORS } from '../utils/constants';

interface FraudGraph3DProps {
  data: NetworkData | null;
  onNodeClick?: (node: NetworkNode) => void;
  selectedNode?: NetworkNode | null;
  width?: number;
  height?: number;
}

export function FraudGraph3D({ data, onNodeClick, selectedNode, width = 800, height = 600 }: FraudGraph3DProps) {
  const fgRef = useRef<any>(null);

  // Reset camera when selection is cleared
  useEffect(() => {
    if (!selectedNode && fgRef.current) {
      // Reset to default view
      fgRef.current.cameraPosition(
        { x: 0, y: 0, z: 500 },
        { x: 0, y: 0, z: 0 },
        1000
      );
    }
  }, [selectedNode]);

  const getNodeColor = useCallback((node: NetworkNode) => {
    switch (node.risk) {
      case 'critical': return CHART_COLORS.danger;
      case 'high': return '#ff6b6b';
      case 'medium': return CHART_COLORS.warning;
      case 'low': return CHART_COLORS.success;
      default: return CHART_COLORS.primary;
    }
  }, []);

  const getNodeSize = useCallback((node: NetworkNode) => {
    // Size based on transaction count
    const baseSize = 4;
    const scale = Math.log(node.transactions + 1) * 2;
    return baseSize + scale;
  }, []);

  const getLinkColor = useCallback((link: any) => {
    if (link.fraud_count > 0) {
      return `rgba(239, 68, 68, ${Math.min(link.fraud_count / 5, 1)})`;
    }
    return 'rgba(107, 114, 128, 0.3)';
  }, []);

  const getLinkWidth = useCallback((link: any) => {
    return Math.log(link.count + 1) * 0.5;
  }, []);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    
    return {
      nodes: data.nodes.map(n => ({
        ...n,
        color: getNodeColor(n),
        val: getNodeSize(n),
      })),
      links: data.links.map(l => ({
        ...l,
        color: getLinkColor(l),
        width: getLinkWidth(l),
      })),
    };
  }, [data, getNodeColor, getNodeSize, getLinkColor, getLinkWidth]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as NetworkNode);
    }
    
    // Zoom to node
    if (fgRef.current) {
      const distance = 100;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
        node,
        2000
      );
    }
  }, [onNodeClick]);

  if (!data) {
    return (
      <div className="card" style={{ height }}>
        <div className="cardHeader">
          <h3 className="cardTitle">🌐 Fraud Network Graph</h3>
        </div>
        <div className="cardContent flex itemsCenter" style={{ justifyContent: 'center', height: height - 60 }}>
          <div className="spinner" />
          <span className="textMuted ml-md">Loading network data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="cardHeader">
        <h3 className="cardTitle">🌐 Fraud Network Graph</h3>
        <div className="flex gap-md">
          <span className="textMuted" style={{ fontSize: '0.75rem' }}>
            {data.nodes.length} accounts • {data.links.length} connections
          </span>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          width={width}
          height={height - 60}
          backgroundColor="#0a0e27"
          nodeLabel={(node: any) => `
            <div style="background: #1f2937; padding: 8px 12px; border-radius: 8px; border: 1px solid #374151;">
              <strong>${node.name}</strong><br/>
              Risk: ${node.risk}<br/>
              Transactions: ${node.transactions}<br/>
              Fraud Rate: ${(node.fraud_rate * 100).toFixed(1)}%
            </div>
          `}
          nodeColor="color"
          nodeVal="val"
          nodeOpacity={0.9}
          linkColor="color"
          linkWidth="width"
          linkOpacity={0.6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={(link: any) => link.fraud_count > 0 ? 2 : 0}
          linkDirectionalParticleColor={() => CHART_COLORS.danger}
          onNodeClick={handleNodeClick}
          enableNodeDrag={true}
          enableNavigationControls={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enablePointerInteraction={true}
          controlType="orbit"
          showNavInfo={false}
        />
      </div>
    </div>
  );
}

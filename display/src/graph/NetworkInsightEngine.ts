// Simplified Network Insight Engine - Core functionality
import { GraphDataProvider } from './GraphDataProvider';

export class NetworkInsightEngine {
  private graphDataProvider: GraphDataProvider;
  private nodes: any[] = [];
  private edges: any[] = [];
  
  constructor(graphDataProvider: GraphDataProvider) {
    this.graphDataProvider = graphDataProvider;
    this.updateData();
  }

  updateData() {
    this.nodes = this.graphDataProvider.getFilteredNodes();
    this.edges = this.graphDataProvider.getFilteredEdges();
  }

  // 🔍 Smart Search with semantic understanding
  smartSearch(query: string): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Direct matches
    this.nodes.forEach(node => {
      const score = this.calculateSearchScore(node, lowerQuery);
      if (score > 0.3) {
        results.push({
          type: 'node',
          item: node,
          score,
          reason: this.getSearchReason(node, lowerQuery)
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  // 📊 Basic Network Metrics
  getNetworkMetrics() {
    const totalNodes = this.nodes.length;
    const totalEdges = this.edges.length;
    const avgDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = maxPossibleEdges > 0 ? (totalEdges / maxPossibleEdges) * 100 : 0;

    return {
      totalNodes,
      totalEdges,
      avgDegree: Math.round(avgDegree * 10) / 10,
      density: Math.round(density * 10) / 10
    };
  }

  // 🧠 Basic Network Insights
  generateBasicInsights(): NetworkInsight[] {
    const insights: NetworkInsight[] = [];
    
    // Find super connectors
    const superConnectors = this.findSuperConnectors();
    if (superConnectors.length > 0) {
      insights.push({
        type: 'super_connector',
        title: `${superConnectors.length} super connectors found`,
        description: 'Highly connected individuals who can amplify information across the network',
        nodes: superConnectors.map(n => n.id),
        actionable: true,
        priority: 'high'
      });
    }

    // Find isolated nodes
    const isolatedNodes = this.findIsolatedNodes();
    if (isolatedNodes.length > 0) {
      insights.push({
        type: 'isolated_nodes',
        title: `${isolatedNodes.length} isolated nodes found`,
        description: 'People with few connections who might need better integration',
        nodes: isolatedNodes.map(n => n.id),
        actionable: true,
        priority: 'medium'
      });
    }

    // Geographic insights
    const geoInsights = this.findBasicGeographicPatterns();
    insights.push(...geoInsights);

    return insights;
  }

  // ⭐ Find Super Connectors
  private findSuperConnectors(): any[] {
    const degrees = this.nodes.map(node => ({
      node,
      degree: this.getNodeConnections(node.id).length
    })).sort((a, b) => b.degree - a.degree);

    // Top 5% or minimum degree of 10
    const threshold = Math.max(10, degrees[Math.floor(degrees.length * 0.05)]?.degree || 0);
    return degrees.filter(item => item.degree >= threshold).map(item => item.node).slice(0, 10);
  }

  // 🏝️ Find Isolated Nodes
  private findIsolatedNodes(): any[] {
    return this.nodes.filter(node => {
      const connections = this.getNodeConnections(node.id).length;
      return connections <= 1;
    });
  }

  // �️ Basic Geographic Patterns
  private findBasicGeographicPatterns(): NetworkInsight[] {
    const insights: NetworkInsight[] = [];
    const locationGroups = new Map<string, any[]>();
    
    this.nodes.forEach(node => {
      const location = node.profile?.location?.city || 'Unknown';
      if (!locationGroups.has(location)) {
        locationGroups.set(location, []);
      }
      locationGroups.get(location)!.push(node);
    });

    locationGroups.forEach((nodes, location) => {
      if (nodes.length >= 5 && location !== 'Unknown') {
        insights.push({
          type: 'geographic_cluster',
          title: `${location}: ${nodes.length} people`,
          description: `Geographic cluster that could organize local activities`,
          nodes: nodes.map(n => n.id),
          actionable: true,
          priority: 'medium'
        });
      }
    });

    return insights.slice(0, 5);
  }

  // 🔗 Basic Path Finding
  findShortestPathLength(sourceId: string, targetId: string): number {
    if (sourceId === targetId) return 0;
    
    const visited = new Set<string>();
    const queue: Array<{nodeId: string, distance: number}> = [{nodeId: sourceId, distance: 0}];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.nodeId)) continue;
      visited.add(current.nodeId);
      
      if (current.nodeId === targetId) {
        return current.distance;
      }
      
      const neighbors = this.getNodeConnections(current.nodeId);
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({nodeId: neighborId, distance: current.distance + 1});
        }
      });
    }
    
    return -1; // Not connected
  }

  // 🎯 Basic Influence Analysis
  calculateNodeCentrality(nodeId: string): {degree: number, normalized: number} {
    const connections = this.getNodeConnections(nodeId);
    const degree = connections.length;
    const maxPossible = this.nodes.length - 1;
    const normalized = maxPossible > 0 ? degree / maxPossible : 0;
    
    return { degree, normalized };
  }

  // Helper methods
  private getNodeConnections(nodeId: string): string[] {
    return this.edges
      .filter(edge => edge.sourceID === nodeId || edge.targetID === nodeId)
      .map(edge => edge.sourceID === nodeId ? edge.targetID : edge.sourceID);
  }

  private calculateSearchScore(node: any, query: string): number {
    let score = 0;
    const name = (node.profile?.displayName || node.name || '').toLowerCase();
    const nameID = (node.nameID || '').toLowerCase();
    const location = (node.profile?.location?.city || '').toLowerCase();
    const type = (node.type || '').toLowerCase();

    if (name.includes(query)) score += 1.0;
    if (nameID.includes(query)) score += 0.8;
    if (location.includes(query)) score += 0.6;
    if (type.includes(query)) score += 0.4;

    return score;
  }

  private getSearchReason(node: any, query: string): string {
    const name = (node.profile?.displayName || node.name || '').toLowerCase();
    if (name.includes(query)) return 'Name match';
    
    const location = (node.profile?.location?.city || '').toLowerCase();
    if (location.includes(query)) return 'Location match';
    
    return 'Type/attribute match';
  }
}

// Type definitions
export interface SearchResult {
  type: 'node' | 'insight' | 'pattern';
  item: any;
  score: number;
  reason: string;
}

export interface NetworkInsight {
  type: 'super_connector' | 'isolated_nodes' | 'geographic_cluster' | 'bridge_connector';
  title: string;
  description: string;
  nodes: string[];
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
}
